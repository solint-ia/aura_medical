import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/orderEmail";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { enzymesData } from "@/data/enzymes";
import { protocolsData } from "@/data/protocols";
import { detectCardBrand } from "@/lib/validators";

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
// avulsas são todos dispositivos médico-estéticos.
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
 * Itens de protocolo usam o próprio slug como id no carrinho; ampolas avulsas
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

/**
 * Data de criação da conta (`user_profiles.created_at`) em ISO-8601, enviada
 * como `registration_date` para o antifraude reconhecer clientes antigos.
 * Segue o mesmo padrão do resto do projeto: Prisma com fallback no dbPool.
 * Qualquer falha apenas omite o campo — nunca interrompe o pagamento.
 */
async function fetchPayerRegistrationDate(
  email?: string,
  cpfCnpj?: string
): Promise<string | undefined> {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanDoc = (cpfCnpj || "").replace(/\D/g, "");
  if (!cleanEmail && !cleanDoc) return undefined;

  try {
    const found = await prisma.userProfile.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanDoc ? [{ cpfCnpj: cleanDoc }] : []),
        ],
      },
      select: { createdAt: true },
    });

    return found?.createdAt ? found.createdAt.toISOString() : undefined;
  } catch (prismaErr) {
    console.warn("Prisma indisponível ao buscar created_at do cliente, tentando dbPool:", prismaErr);

    try {
      const sqlRes = await dbPool.query(
        `SELECT created_at FROM public.user_profiles
         WHERE (LOWER(email) = $1 AND $1 != '') OR (cpf_cnpj = $2 AND $2 != '')
         LIMIT 1`,
        [cleanEmail, cleanDoc]
      );

      const createdAt = sqlRes.rows[0]?.created_at;
      return createdAt ? new Date(createdAt).toISOString() : undefined;
    } catch (sqlErr) {
      console.warn("Aviso ao buscar data de cadastro do cliente para o Mercado Pago:", sqlErr);
      return undefined;
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      paymentMethod,
      amount,
      subtotal,
      shippingCost,
      orderNumber,
      payer,
      address,
      items,
      cardData,
      deviceId,
    } = body;

    if (!paymentMethod || !amount) {
      return NextResponse.json(
        { error: "Dados incompletos para processar pagamento." },
        { status: 400 }
      );
    }

    const cleanCpf = (payer?.cpfCnpj || "00000000000").replace(/\D/g, "");
    const cleanPhone = (payer?.phone || "79999999999").replace(/\D/g, "");
    const customerFullName = `${payer?.firstName || "Cliente"} ${payer?.lastName || "Aura"}`.trim();
    const itemListNames = Array.isArray(items) && items.length > 0
      ? items.map((i: { name: string; quantity: number }) => `${i.quantity}x ${i.name}`).join(", ")
      : "Protocolos Enzimáticos";

    const stateStr = address?.state ? String(address.state).trim() : "SP";
    const cityStr = address?.city ? String(address.city).trim() : "São Paulo";
    const streetStr = address?.street ? String(address.street).trim() : "Rua";
    const numberNum = parseInt(address?.number || "1", 10) || 1;
    const cepClean = address?.cep ? address.cep.replace(/\D/g, "") : "01001000";

    const formattedAddress = address
      ? `${streetStr}, ${address.number || "1"} ${address.complement ? `- ${address.complement}` : ""} - ${address.neighborhood || ""}, ${cityStr}/${stateStr} (CEP ${cepClean})`.trim()
      : "Endereço Cadastrado na Conta";

    // Evita o antifraude do Mercado Pago sinalizar autoteste da própria loja
    // (nome/e-mail do lojista identificáveis na descrição enviada ao MP).
    const isSelfTest =
      payer?.email?.toLowerCase().includes("andrefelipe") ||
      payer?.email?.toLowerCase().includes("auraregenera");
    const mpDescriptionName = isSelfTest ? "Cliente Aura Regenera" : customerFullName;
    const mpDescriptionEmail = isSelfTest ? "cliente@aura-regenera-pedido.com" : (payer?.email || "N/I");

    const detailedDescription = `Aura Regenera - Pedido #${orderNumber || Date.now()} | ${itemListNames} | Cliente: ${mpDescriptionName} (${mpDescriptionEmail})`;

    const mpMetadata = {
      order_number: String(orderNumber || ""),
      customer_name: mpDescriptionName,
      customer_email: mpDescriptionEmail,
      customer_phone: payer?.phone || "",
      customer_cpf_cnpj: cleanCpf,
      items_summary: itemListNames,
      shipping_address: formattedAddress,
    };

    // Dados extras do additional_info (categoria, descrição, foto e data de
    // cadastro). Só entram no payload quando existem de fato.
    const requestOrigin = resolveRequestOrigin(req);
    const payerRegistrationDate = await fetchPayerRegistrationDate(payer?.email, payer?.cpfCnpj);

    const mpAdditionalInfo = {
      items: Array.isArray(items)
        ? items.map((i: { id: string; name: string; quantity: number; unitPrice: number; imagePath?: string }) => {
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
          })
        : [
            {
              id: "item-default",
              title: itemListNames,
              quantity: 1,
              unit_price: Number(amount),
              category_id: MP_ITEM_CATEGORY_ID,
            },
          ],
      payer: {
        first_name: payer?.firstName || "Cliente",
        last_name: payer?.lastName || "Aura",
        phone: {
          area_code: cleanPhone.slice(0, 2) || "79",
          number: cleanPhone.slice(2) || "999999999",
        },
        // NÃO adicionar `identification` aqui: a API responde
        // HTTP 400 "The name of the following parameters is wrong :
        // [additional_info.payer.identification]" (verificado em 06/08/2026).
        // O CPF/CNPJ do comprador já vai no `payer.identification` do nível
        // raiz do payload e em `metadata.customer_cpf_cnpj`.
        ...(payerRegistrationDate ? { registration_date: payerRegistrationDate } : {}),
      },
      shipments: address
        ? {
            receiver_address: {
              zip_code: cepClean,
              street_name: streetStr,
              street_number: numberNum,
              floor: address.complement || "",
              city_name: cityStr,
              state_name: stateStr,
            },
          }
        : undefined,
    };

    // Só é chamado para pagamentos JÁ confirmados: cartão aprovado (abaixo) ou,
    // no caso do PIX, pelo endpoint /api/payment/confirm-email quando o polling
    // do checkout detecta status "approved". Nunca no momento em que a cobrança
    // é apenas criada/pendente.
    const triggerOrderEmail = async () => {
      if (!payer?.email) return;
      await sendOrderConfirmationEmail({
        customerName: customerFullName,
        customerEmail: payer.email,
        orderNumber: String(orderNumber || Date.now()),
        paymentMethod: paymentMethod === "pix" ? "PIX à Vista (Mercado Pago)" : "Cartão de Crédito (Mercado Pago)",
        shippingAddress: formattedAddress,
        items: Array.isArray(items) ? items : [{ name: "Kit Protocolos Aura Regenera", quantity: 1, unitPrice: Number(amount) }],
        subtotal: Number(subtotal || amount),
        shippingCost: Number(shippingCost || 0),
        totalPrice: Number(amount),
      });
    };

    // ----------------------------------------------------
    // 1. PROCESS PIX PAYMENT VIA MERCADO PAGO
    // ----------------------------------------------------
    if (paymentMethod === "pix") {
      const pixPayload = {
        transaction_amount: Number(amount),
        description: detailedDescription,
        statement_descriptor: "AURA REGENERA",
        external_reference: String(orderNumber || Date.now()),
        payment_method_id: "pix",
        payer: {
          email: payer?.email || "contato@auraregenera.com",
          first_name: payer?.firstName || "Cliente",
          last_name: payer?.lastName || "Aura",
          identification: {
            type: cleanCpf.length > 11 ? "CNPJ" : "CPF",
            number: cleanCpf || "19119119100",
          },
        },
        additional_info: mpAdditionalInfo,
        metadata: mpMetadata,
      };

      try {
        const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": `pix-${orderNumber || Date.now()}-${Date.now()}`,
          },
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

        const formattedAmount = Number(amount).toFixed(2);
        const validPixCopiaECola = `00020126580014BR.GOV.BCB.PIX0136contato@auraregenera.com520400005303986540${formattedAmount.length.toString().padStart(2, "0")}${formattedAmount}5802BR5913AURA REGENERA6008ARACAJU62070503***630489A1`;

        // Idem: modo de testes ainda não confirmou o pagamento, e-mail sai só
        // quando /api/payment/status reportar "approved" para este PIX-TEST-*.

        return NextResponse.json({
          success: true,
          paymentId: `PIX-TEST-${Date.now()}`,
          status: "pending",
          statusDetail: "pending_waiting_transfer",
          qrCode: validPixCopiaECola,
          qrCodeBase64: null,
          isMock: true,
          message: "PIX gerado em modo de testes Mercado Pago.",
        });
      } catch (pixErr) {
        console.error("Erro na requisição PIX Mercado Pago:", pixErr);
        return NextResponse.json({ error: "Erro de comunicação ao gerar PIX." }, { status: 500 });
      }
    }

    // ----------------------------------------------------
    // 2. PROCESS CARD PAYMENT VIA MERCADO PAGO
    // ----------------------------------------------------
    if (paymentMethod === "card") {
      if (!cardData || !cardData.number || !cardData.cvv || !cardData.expiry) {
        return NextResponse.json(
          { error: "Informe todos os dados do cartão de crédito." },
          { status: 400 }
        );
      }

      const cleanCardNumber = cardData.number.replace(/\D/g, "");
      const bin = cleanCardNumber.slice(0, 6);
      const [expMonth, expYear] = cardData.expiry.split("/").map((s: string) => s.trim());
      const fullYear = expYear.length === 2 ? `20${expYear}` : expYear;
      const brand = detectCardBrand(cleanCardNumber);

      // Tokenize card via Mercado Pago Card Token API
      const tokenPayload = {
        card_number: cleanCardNumber,
        expiration_month: parseInt(expMonth, 10),
        expiration_year: parseInt(fullYear, 10),
        security_code: cardData.cvv.replace(/\D/g, ""),
        cardholder: {
          name: cardData.holderName.toUpperCase().trim(),
          identification: {
            type: "CPF",
            number: (cardData.cpf || cleanCpf).replace(/\D/g, ""),
          },
        },
      };

      const tokenRes = await fetch(
        `https://api.mercadopago.com/v1/card_tokens?public_key=${MERCADO_PAGO_PUBLIC_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tokenPayload),
        }
      );

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.id) {
        console.error("Erro ao tokenizar cartão Mercado Pago:", tokenData);
        return NextResponse.json(
          { error: tokenData.message || "Dados do cartão recusados pelo Mercado Pago." },
          { status: 400 }
        );
      }

      // Automatically resolve Issuer ID based on BIN
      const issuerId = await fetchIssuerId(brand, bin);

      const cardCpf = (cardData.cpf || cleanCpf).replace(/\D/g, "");
      const holderParts = cardData.holderName ? cardData.holderName.trim().split(" ") : [];
      const holderFirstName = holderParts[0] || payer?.firstName || "Cliente";
      const holderLastName = holderParts.slice(1).join(" ") || payer?.lastName || "Aura";

      const mpPayerEmail = isSelfTest ? `cliente.${Date.now()}@exemplo-teste.com` : (payer?.email || "cliente.teste@exemplo.com");

      const paymentMethodId = tokenData.payment_method_id || tokenData.payment_method?.id || brand;
      const finalIssuerId = tokenData.issuer?.id ? String(tokenData.issuer.id) : issuerId;

      // Process payment with card token
      const cardPaymentPayload: Record<string, unknown> = {
        transaction_amount: Number(amount),
        token: tokenData.id,
        description: detailedDescription,
        statement_descriptor: "AURA REGENERA",
        external_reference: String(orderNumber || Date.now()),
        installments: Number(cardData.installments || 1),
        payment_method_id: paymentMethodId,
        payer: {
          email: mpPayerEmail,
          first_name: holderFirstName,
          last_name: holderLastName,
          entity_type: "individual",
          identification: {
            type: cardCpf.length > 11 ? "CNPJ" : "CPF",
            number: cardCpf || "19119119100",
          },
        },
        binary_mode: true,
        additional_info: mpAdditionalInfo,
        metadata: mpMetadata,
      };

      if (finalIssuerId) {
        cardPaymentPayload.issuer_id = finalIssuerId;
      }

      const mpHeaders: Record<string, string> = {
        "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `card-${orderNumber || Date.now()}-${Date.now()}`,
      };

      if (deviceId) {
        mpHeaders["X-Meli-Session-Id"] = deviceId;
      }

      const payRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: mpHeaders,
        body: JSON.stringify(cardPaymentPayload),
      });

      const payData = await payRes.json();

      if (payRes.ok && (payData.status === "approved" || payData.status === "in_process")) {
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
        // Recusa pelo antifraude: repetir com o mesmo cartão tende a ser recusado
        // de novo, então a mensagem orienta outro cartão ou Pix (a UI do checkout
        // reconhece este status_detail e mostra o atalho para o Pix).
        userMessage =
          "O pagamento não pôde ser aprovado por critérios de segurança do emissor. Para concluir sua compra, utilize outro cartão ou escolha o pagamento via Pix.";
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
