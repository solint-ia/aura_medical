import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/orderEmail";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { enzymesData } from "@/data/enzymes";
import { protocolsData } from "@/data/protocols";
import { verifyAuthToken } from "@/lib/auth";
import { calculateCheckoutTotal, verifyCheckoutItems } from "@/lib/checkoutPricing";
import {
  cardFingerprint,
  checkAndRecordPaymentAttempt,
  markHighRiskAttempt,
  paymentAttemptKey,
} from "@/lib/paymentAttemptGuard";
import { validateCpf } from "@/lib/validators";

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const MERCADO_PAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";

// Dynamically fetch card issuer ID from Mercado Pago API based on BIN
async function fetchIssuerId(brand: string, bin: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.mercadopago.com/v1/payment_methods/card_issuers?public_key=${MERCADO_PAGO_PUBLIC_KEY}&payment_method_id=${brand}&bin=${bin}`
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].id) {
      return String(data[0].id);
    }
  } catch (err) {
    console.warn("Aviso ao buscar issuer_id no Mercado Pago:", err);
  }
  return undefined;
}

// ----------------------------------------------------
// ENRIQUECIMENTO DO additional_info (análise de risco do Mercado Pago)
// Todos os campos abaixo são opcionais: quando o dado não existe, o campo
// simplesmente não é enviado — nada de valor fictício.
// ----------------------------------------------------

// Categoria do catálogo oficial do Mercado Pago. Kits de protocolo e ampolas
// individuais são todos dispositivos médico-estéticos.
const MP_ITEM_CATEGORY_ID = "health";

/** Limite do campo `description` de cada item na API do Mercado Pago. */
const MP_DESCRIPTION_MAX_LENGTH = 256;

function truncateForMp(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= MP_DESCRIPTION_MAX_LENGTH
    ? clean
    : `${clean.slice(0, MP_DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`;
}

/**
 * Reaproveita a descrição já escrita para as páginas de catálogo: introdução do
 * protocolo (`protocolsData`) ou descrição curta da enzima (`enzymesData`).
 * Itens de protocolo usam o próprio slug como id no carrinho; ampolas individuais
 * usam `enz-<enzima>` (ver `BuyEnzymeVialButton`).
 */
function findItemDescription(itemId: string): string | undefined {
  const protocol = protocolsData.find((p) => p.slug === itemId);
  if (protocol?.introduction) return truncateForMp(protocol.introduction);

  const enzymeId = itemId.replace(/^enz-/, "");
  const enzyme = enzymesData.find(
    (e) => e.slug === enzymeId || e.slug === `${enzymeId}-plus`
  );
  if (enzyme?.shortDescription) return truncateForMp(enzyme.shortDescription);

  return undefined;
}

/** O Mercado Pago exige URL absoluta em `picture_url`; o carrinho guarda caminho relativo. */
function toAbsoluteImageUrl(imagePath: unknown, origin: string): string | undefined {
  if (typeof imagePath !== "string" || imagePath.trim() === "") return undefined;
  const path = imagePath.trim();
  if (/^https?:\/\//i.test(path)) return path;
  if (!origin) return undefined;
  return `${origin.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

/** Origem pública da requisição, usada apenas para montar `picture_url`. */
function resolveRequestOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return "";

  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

interface CheckoutCustomer {
  id: string;
  cpfCnpj: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: Date | string | null;
  address: {
    id: string;
    cep: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    uf: string;
  };
}

/** Busca comprador e endereço no banco para não confiar em PII enviada pelo navegador. */
async function fetchCheckoutCustomer(
  userId: string,
  addressId: string
): Promise<CheckoutCustomer | null> {
  try {
    const found = await prisma.userProfile.findUnique({
      where: { id: userId },
      include: {
        addresses: { where: { id: addressId }, take: 1 },
      },
    });
    const address = found?.addresses[0];
    if (!found || !address) return null;
    return { ...found, address };
  } catch (prismaErr) {
    console.warn("Prisma indisponível ao buscar dados do checkout, tentando dbPool:", prismaErr);

    try {
      const sqlRes = await dbPool.query(
        `SELECT u.id, u.cpf_cnpj, u.first_name, u.last_name, u.email, u.phone,
                u.created_at, a.id AS address_id, a.cep, a.street, a.number,
                a.complement, a.neighborhood, a.city, a.uf
           FROM public.user_profiles u
           JOIN public.user_addresses a ON a.user_id = u.id
          WHERE u.id = $1 AND a.id = $2
          LIMIT 1`,
        [userId, addressId]
      );
      const row = sqlRes.rows[0];
      if (!row) return null;
      return {
        id: row.id,
        cpfCnpj: row.cpf_cnpj,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        createdAt: row.created_at,
        address: {
          id: row.address_id,
          cep: row.cep,
          street: row.street,
          number: row.number,
          complement: row.complement,
          neighborhood: row.neighborhood,
          city: row.city,
          uf: row.uf,
        },
      };
    } catch (sqlErr) {
      console.warn("Aviso ao buscar dados do checkout no dbPool:", sqlErr);
      return null;
    }
  }
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  try {
    const auth = verifyAuthToken(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada. Entre novamente antes de pagar." },
        { status: 401 }
      );
    }

    if (!MERCADO_PAGO_ACCESS_TOKEN || !MERCADO_PAGO_PUBLIC_KEY) {
      return NextResponse.json(
        { error: "Credenciais do Mercado Pago não configuradas no servidor." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      paymentMethod,
      amount: requestedAmount,
      orderNumber,
      addressId,
      items,
      cardData,
      deviceId,
      idempotencyKey,
    } = body;

    if (paymentMethod !== "card" && paymentMethod !== "pix") {
      return NextResponse.json(
        { error: "Forma de pagamento inválida." },
        { status: 400 }
      );
    }

    if (
      typeof idempotencyKey !== "string" ||
      !/^[a-zA-Z0-9-]{16,128}$/.test(idempotencyKey)
    ) {
      return NextResponse.json({ error: "Identificador da tentativa inválido." }, { status: 400 });
    }

    if (typeof orderNumber !== "string" || !/^[A-Z0-9-]{8,20}$/.test(orderNumber)) {
      return NextResponse.json({ error: "Número do pedido inválido." }, { status: 400 });
    }

    if (typeof addressId !== "string" || !addressId) {
      return NextResponse.json({ error: "Selecione um endereço válido." }, { status: 400 });
    }

    const customer = await fetchCheckoutCustomer(auth.userId, addressId);
    if (!customer) {
      return NextResponse.json(
        { error: "Comprador ou endereço não encontrado para esta conta." },
        { status: 403 }
      );
    }

    const verifiedCart = verifyCheckoutItems(items, auth.role === "ADMIN");
    if (!verifiedCart.ok) {
      return NextResponse.json({ error: verifiedCart.error }, { status: 400 });
    }

    // Frete está desativado no checkout atual; preço e desconto são sempre
    // recalculados no servidor, sem confiar nos números enviados pelo browser.
    const subtotal = verifiedCart.subtotal;
    const shippingCost = 0;
    const amount = calculateCheckoutTotal(subtotal, paymentMethod, shippingCost);
    if (
      !Number.isFinite(Number(requestedAmount)) ||
      Math.abs(Number(requestedAmount) - amount) > 0.02
    ) {
      return NextResponse.json(
        { error: "O valor do carrinho mudou. Atualize a página antes de pagar." },
        { status: 409 }
      );
    }

    const address = customer.address;
    const cleanCpf = customer.cpfCnpj.replace(/\D/g, "");
    const cleanPhone = customer.phone.replace(/\D/g, "");
    const customerFullName = `${customer.firstName} ${customer.lastName}`.trim();
    const itemListNames = verifiedCart.items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(", ");

    const stateStr = address.uf.trim().toUpperCase();
    const cityStr = address.city.trim();
    const streetStr = address.street.trim();
    const numberNum = parseInt(address.number, 10) || 1;
    const cepClean = address.cep.replace(/\D/g, "");

    const formattedAddress = `${streetStr}, ${address.number} ${address.complement ? `- ${address.complement}` : ""} - ${address.neighborhood}, ${cityStr}/${stateStr} (CEP ${cepClean})`.trim();
    const detailedDescription = `Aura Regenera - Pedido #${orderNumber} | ${itemListNames}`;

    const mpMetadata = {
      order_number: orderNumber,
      authenticated_user_id: customer.id,
      items_summary: itemListNames,
    };

    // Dados extras do additional_info (categoria, descrição, foto e data de
    // cadastro). Só entram no payload quando existem de fato.
    const requestOrigin = resolveRequestOrigin(req);
    const payerRegistrationDate = customer.createdAt
      ? new Date(customer.createdAt).toISOString()
      : undefined;

    const mpAdditionalInfo = {
      items: verifiedCart.items.map((i) => {
            const description = findItemDescription(String(i.id));
            const pictureUrl = toAbsoluteImageUrl(i.imagePath, requestOrigin);

            return {
              id: String(i.id),
              title: String(i.name),
              quantity: Number(i.quantity),
              unit_price: Number(i.unitPrice),
              category_id: MP_ITEM_CATEGORY_ID,
              ...(description ? { description } : {}),
              ...(pictureUrl ? { picture_url: pictureUrl } : {}),
            };
          }),
      payer: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone: {
          area_code: cleanPhone.slice(0, 2),
          number: cleanPhone.slice(2),
        },
        // NÃO adicionar `identification` aqui: a API responde
        // HTTP 400 "The name of the following parameters is wrong :
        // [additional_info.payer.identification]" (verificado em 06/08/2026).
        // O CPF/CNPJ do comprador já vai no `payer.identification` do nível
        // raiz do payload.
        ...(payerRegistrationDate ? { registration_date: payerRegistrationDate } : {}),
      },
      shipments: {
        receiver_address: {
          zip_code: cepClean,
          street_name: streetStr,
          street_number: numberNum,
          floor: address.complement || "",
          city_name: cityStr,
          state_name: stateStr,
        },
      },
    };

    // Só é chamado para pagamentos JÁ confirmados: cartão aprovado (abaixo) ou,
    // no caso do PIX, pelo endpoint /api/payment/confirm-email quando o polling
    // do checkout detecta status "approved". Nunca no momento em que a cobrança
    // é apenas criada/pendente.
    const triggerOrderEmail = async () => {
      await sendOrderConfirmationEmail({
        customerName: customerFullName,
        customerEmail: customer.email,
        orderNumber,
        paymentMethod: paymentMethod === "pix" ? "PIX à Vista (Mercado Pago)" : "Cartão de Crédito (Mercado Pago)",
        shippingAddress: formattedAddress,
        items: verifiedCart.items,
        subtotal,
        shippingCost,
        totalPrice: amount,
      });
    };

    // ----------------------------------------------------
    // 1. PROCESS PIX PAYMENT VIA MERCADO PAGO
    // ----------------------------------------------------
    if (paymentMethod === "pix") {
      const attemptKey = paymentAttemptKey(auth.userId, getClientIp(req));
      const attempt = checkAndRecordPaymentAttempt(attemptKey);
      if (!attempt.allowed) {
        return NextResponse.json(
          { error: attempt.error },
          { status: 429, headers: { "Retry-After": String(attempt.retryAfterSeconds) } }
        );
      }

      const pixPayload = {
        transaction_amount: amount,
        description: detailedDescription,
        statement_descriptor: "AURA REGENERA",
        external_reference: orderNumber,
        payment_method_id: "pix",
        payer: {
          email: customer.email,
          first_name: customer.firstName,
          last_name: customer.lastName,
          identification: {
            type: cleanCpf.length > 11 ? "CNPJ" : "CPF",
            number: cleanCpf,
          },
        },
        additional_info: mpAdditionalInfo,
        metadata: mpMetadata,
      };

      try {
        const pixHeaders: Record<string, string> = {
          "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        };
        if (typeof deviceId === "string" && deviceId.trim()) {
          pixHeaders["X-Meli-Session-Id"] = deviceId.trim();
        }

        const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: pixHeaders,
          body: JSON.stringify(pixPayload),
        });

        const mpData = await mpRes.json();

        if (mpRes.ok && mpData.point_of_interaction?.transaction_data) {
          const transData = mpData.point_of_interaction.transaction_data;
          // NÃO enviar e-mail aqui: o QR foi apenas gerado, o pagamento ainda
          // está "pending". A confirmação chega via polling do checkout em
          // /api/payment/status, que aciona /api/payment/confirm-email quando
          // o status vira "approved".

          return NextResponse.json({
            success: true,
            paymentId: mpData.id,
            status: mpData.status,
            statusDetail: mpData.status_detail,
            qrCode: transData.qr_code,
            qrCodeBase64: transData.qr_code_base64,
            ticketUrl: transData.ticket_url,
          });
        }

        console.warn("Mercado Pago PIX API Warning/Error:", mpData);
        let pixError = mpData.message || "O Mercado Pago não conseguiu gerar o PIX.";
        if (typeof pixError === "string" && pixError.toLowerCase().includes("collector user without key")) {
          pixError = "A chave Pix da loja ainda não está configurada no Mercado Pago. Por favor, utilize Cartão de Crédito ou tente novamente em instantes.";
        }

        return NextResponse.json(
          { error: pixError },
          { status: mpRes.status >= 400 ? mpRes.status : 502 }
        );
      } catch (pixErr) {
        console.error("Erro na requisição PIX Mercado Pago:", pixErr);
        return NextResponse.json({ error: "Erro de comunicação ao gerar PIX." }, { status: 500 });
      }
    }

    // ----------------------------------------------------
    // 2. PROCESS CARD PAYMENT VIA MERCADO PAGO
    // ----------------------------------------------------
    if (paymentMethod === "card") {
      if (
        !cardData ||
        !cardData.token ||
        !cardData.paymentMethodId ||
        !cardData.bin ||
        !cardData.lastFour ||
        !cardData.holderName ||
        !cardData.cpf
      ) {
        return NextResponse.json(
          { error: "Informe todos os dados do cartão de crédito." },
          { status: 400 }
        );
      }

      const cardCpf = cardData.cpf.replace(/\D/g, "");
      const installments = Number(cardData.installments || 1);
      if (
        !validateCpf(cardCpf) ||
        !/^\d{6,8}$/.test(String(cardData.bin)) ||
        !/^\d{4}$/.test(String(cardData.lastFour)) ||
        !/^[a-z0-9_-]{2,30}$/i.test(String(cardData.paymentMethodId)) ||
        !Number.isInteger(installments) ||
        installments < 1 ||
        installments > 10
      ) {
        return NextResponse.json({ error: "Dados do cartão inválidos." }, { status: 400 });
      }

      if (typeof deviceId !== "string" || deviceId.trim().length < 8) {
        return NextResponse.json(
          { error: "A validação de segurança não foi carregada. Atualize a página e tente novamente." },
          { status: 409 }
        );
      }

      const attemptKey = paymentAttemptKey(
        auth.userId,
        getClientIp(req),
        cardFingerprint(`${cardData.bin}:${cardData.lastFour}`)
      );
      const attempt = checkAndRecordPaymentAttempt(attemptKey);
      if (!attempt.allowed) {
        return NextResponse.json(
          { error: attempt.error },
          { status: 429, headers: { "Retry-After": String(attempt.retryAfterSeconds) } }
        );
      }

      // O token é gerado diretamente no navegador pela API do Mercado Pago;
      // número, validade e CVV nunca trafegam pelo backend da loja.
      const paymentMethodId = String(cardData.paymentMethodId);
      const issuerId = cardData.issuerId
        ? String(cardData.issuerId)
        : await fetchIssuerId(paymentMethodId, String(cardData.bin).slice(0, 6));

      const holderParts = cardData.holderName ? cardData.holderName.trim().split(" ") : [];
      const holderFirstName = holderParts[0];
      const holderLastName = holderParts.slice(1).join(" ") || holderParts[0];

      // Process payment with card token
      const cardPaymentPayload: Record<string, unknown> = {
        transaction_amount: Number(amount),
        token: String(cardData.token),
        description: detailedDescription,
        statement_descriptor: "AURA REGENERA",
        external_reference: orderNumber,
        installments,
        payment_method_id: paymentMethodId,
        payer: {
          email: customer.email,
          first_name: holderFirstName,
          last_name: holderLastName,
          entity_type: "individual",
          identification: {
            type: cardCpf.length > 11 ? "CNPJ" : "CPF",
            number: cardCpf,
          },
        },
        capture: true,
        binary_mode: false,
        three_d_secure_mode: "optional",
        additional_info: mpAdditionalInfo,
        metadata: mpMetadata,
      };

      if (issuerId) {
        cardPaymentPayload.issuer_id = issuerId;
      }

      const mpHeaders: Record<string, string> = {
        "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
        "X-Meli-Session-Id": deviceId.trim(),
      };

      const payRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: mpHeaders,
        body: JSON.stringify(cardPaymentPayload),
      });

      const payData = await payRes.json();

      if (
        payRes.ok &&
        (payData.status === "approved" ||
          payData.status === "in_process" ||
          payData.status === "pending")
      ) {
        // E-mail só para aprovação imediata. Em "in_process" o dinheiro ainda
        // não entrou: o checkout acompanha por /api/payment/status e o e-mail
        // sai por /api/payment/confirm-email quando (e se) virar "approved".
        if (payData.status === "approved") {
          await triggerOrderEmail();
        }
        return NextResponse.json({
          success: true,
          paymentId: payData.id,
          status: payData.status,
          statusDetail: payData.status_detail,
          installments: payData.installments,
          brand: paymentMethodId,
          threeDsInfo: payData.three_ds_info,
        });
      }

      console.warn("Mercado Pago Card Payment Response:", payData);

      let userMessage = payData.message || "Pagamento com cartão recusado.";
      if (payData.status_detail === "cc_rejected_bad_filled_other") {
        userMessage = "Dados do cartão incorretos. Verifique o número, validade e CVV.";
      } else if (payData.status_detail === "cc_rejected_insufficient_amount") {
        userMessage = "Saldo/Limite insuficiente no cartão.";
      } else if (payData.status_detail === "cc_rejected_bad_filled_security_code") {
        userMessage = "Código de segurança (CVV) incorreto.";
      } else if (payData.status_detail === "cc_rejected_high_risk") {
        markHighRiskAttempt(attemptKey);
        // Recusa pelo antifraude: repetir com o mesmo cartão tende a ser recusado
        // de novo, então a mensagem orienta outro cartão ou Pix (a UI do checkout
        // reconhece este status_detail e mostra o atalho para o Pix).
        userMessage =
          "O pagamento não pôde ser aprovado pela análise de segurança do Mercado Pago. Aguarde antes de repetir ou utilize outro cartão ou Pix.";
      } else if (payData.message === "Invalid payment_method_id" || payData.cause?.some((c: { code?: string }) => c.code === "205")) {
        userMessage = "Bandeira do cartão não reconhecida pelo Mercado Pago. Verifique os dados digitados.";
      }

      return NextResponse.json(
        { error: userMessage, statusDetail: payData.status_detail || payData.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Forma de pagamento não suportada." }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erro ao processar pagamento no Mercado Pago.";
    console.error("Exceção na rota /api/payment/process:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
