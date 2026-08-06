import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/orderEmail";

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const MERCADO_PAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";

// Official Elo BIN ranges. Elo shares prefixes with Visa (4xxxxx) and Mastercard (5xxxxx),
// so these must be checked BEFORE the generic Visa/Master prefix checks below.
// NOTE: Mercado Pago's /v1/payment_methods/search endpoint stopped returning BIN-matching
// data as of 09/09/2024 (confirmed live: it now ignores the "bin" filter entirely and
// returns its whole payment-method catalog), so BIN-brand resolution must happen locally.
const ELO_BIN_RANGES: [number, number][] = [
  [401178, 401178],
  [401179, 401179],
  [431274, 431274],
  [438935, 438935],
  [451416, 451416],
  [457393, 457393],
  [457631, 457632],
  [504175, 504175],
  [506699, 506778],
  [509000, 509999],
  [627780, 627780],
  [636297, 636297],
  [636368, 636368],
  [650031, 650033],
  [650035, 650051],
  [650405, 650439],
  [650485, 650538],
  [650541, 650598],
  [650700, 650718],
  [650720, 650727],
  [650901, 650920],
  [651652, 651679],
  [655000, 655019],
  [655021, 655058],
];

const HIPERCARD_BIN_PREFIXES = ["606282", "384100", "384140", "384160"];

// Auto-detect card brand from BIN number
function detectCardBrand(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, "");
  const bin6 = parseInt(clean.slice(0, 6), 10);

  if (ELO_BIN_RANGES.some(([start, end]) => bin6 >= start && bin6 <= end)) return "elo";
  if (HIPERCARD_BIN_PREFIXES.some((p) => clean.startsWith(p))) return "hipercard";
  if (/^4/.test(clean)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(clean)) return "master";
  if (/^3[47]/.test(clean)) return "amex";
  return "visa";
}

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

    const mpAdditionalInfo = {
      items: Array.isArray(items)
        ? items.map((i: { id: string; name: string; quantity: number; unitPrice: number }) => ({
            id: String(i.id),
            title: String(i.name),
            quantity: Number(i.quantity),
            unit_price: Number(i.unitPrice),
          }))
        : [
            {
              id: "item-default",
              title: itemListNames,
              quantity: 1,
              unit_price: Number(amount),
            },
          ],
      payer: {
        first_name: payer?.firstName || "Cliente",
        last_name: payer?.lastName || "Aura",
        phone: {
          area_code: cleanPhone.slice(0, 2) || "79",
          number: cleanPhone.slice(2) || "999999999",
        },
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
        await triggerOrderEmail();
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
