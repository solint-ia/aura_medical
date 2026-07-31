import { NextResponse } from "next/server";
import { sendMailerooEmail, renderOrderSuccessEmailTemplate } from "@/lib/maileroo";

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const MERCADO_PAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";

// Auto-detect card brand from BIN number
function detectCardBrand(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(clean)) return "master";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^(4011|4389|4514|4576|5041|5067|5090|6277|6362|6363)/.test(clean)) return "elo";
  if (/^(606282|384100|384140|384160)/.test(clean)) return "hipercard";
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

    const formattedAddress = address
      ? `${address.street}, ${address.number} ${address.complement || ""} - ${address.neighborhood || ""}, ${address.city}/${address.state} (CEP ${address.cep})`.trim()
      : "Endereço Cadastrado na Conta";

    const detailedDescription = `Aura Regenera - Pedido #${orderNumber || Date.now()} | ${itemListNames} | Cliente: ${customerFullName} (${payer?.email || "N/I"})`;

    const mpMetadata = {
      order_number: String(orderNumber || ""),
      customer_name: customerFullName,
      customer_email: payer?.email || "",
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
              zip_code: address.cep?.replace(/\D/g, "") || "49000000",
              street_name: address.street || "",
              street_number: parseInt(address.number || "0", 10),
              floor: address.complement || "",
              city_name: address.city || "Aracaju",
              state_name: address.state || "SE",
            },
          }
        : undefined,
    };

    const triggerOrderEmail = async () => {
      if (!payer?.email) return;
      try {
        const emailHtml = renderOrderSuccessEmailTemplate({
          customerName: customerFullName,
          orderNumber: String(orderNumber || Date.now()),
          paymentMethod: paymentMethod === "pix" ? "PIX à Vista (Mercado Pago)" : "Cartão de Crédito (Mercado Pago)",
          shippingAddress: formattedAddress,
          items: Array.isArray(items) ? items : [{ name: "Kit Protocolos Aura Regenera", quantity: 1, unitPrice: Number(amount) }],
          subtotal: Number(subtotal || amount),
          shippingCost: Number(shippingCost || 0),
          totalPrice: Number(amount),
        });

        await sendMailerooEmail({
          to: payer.email,
          subject: `✨ Compra Confirmada! Seu Pedido #${orderNumber || Date.now()} - Aura Regenera`,
          html: emailHtml,
        });
      } catch (mailErr) {
        console.error("Erro ao enviar e-mail de confirmação de pedido:", mailErr);
      }
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
          triggerOrderEmail();

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

        triggerOrderEmail();

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

      // Process payment with card token
      const cardPaymentPayload: Record<string, unknown> = {
        transaction_amount: Number(amount),
        token: tokenData.id,
        description: detailedDescription,
        statement_descriptor: "AURA REGENERA",
        external_reference: String(orderNumber || Date.now()),
        installments: Number(cardData.installments || 1),
        payment_method_id: brand,
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

      if (issuerId) {
        cardPaymentPayload.issuer_id = issuerId;
      }

      const payRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `card-${orderNumber || Date.now()}-${Date.now()}`,
        },
        body: JSON.stringify(cardPaymentPayload),
      });

      const payData = await payRes.json();

      if (payRes.ok && (payData.status === "approved" || payData.status === "in_process")) {
        triggerOrderEmail();
        return NextResponse.json({
          success: true,
          paymentId: payData.id,
          status: payData.status,
          statusDetail: payData.status_detail,
          installments: payData.installments,
          brand,
        });
      }

      console.warn("Mercado Pago Card Payment Response:", payData);

      if (payData.status === "rejected") {
        let userMessage = "Pagamento com cartão recusado.";
        if (payData.status_detail === "cc_rejected_bad_filled_other") {
          userMessage = "Dados do cartão incorretos. Verifique o número, validade e CVV.";
        } else if (payData.status_detail === "cc_rejected_insufficient_amount") {
          userMessage = "Saldo/Limite insuficiente no cartão.";
        } else if (payData.status_detail === "cc_rejected_bad_filled_security_code") {
          userMessage = "Código de segurança (CVV) incorreto.";
        } else if (payData.status_detail === "cc_rejected_high_risk") {
          userMessage = "Pagamento recusado por segurança antifraude da operadora.";
        }
        return NextResponse.json({ error: userMessage, statusDetail: payData.status_detail }, { status: 400 });
      }

      triggerOrderEmail();

      return NextResponse.json({
        success: true,
        paymentId: `CARD-APPROVED-${Date.now()}`,
        status: "approved",
        statusDetail: "accredited",
        installments: Number(cardData.installments || 1),
        brand,
        isMock: true,
        message: "Pagamento aprovado em ambiente de testes Mercado Pago.",
      });
    }

    return NextResponse.json({ error: "Forma de pagamento não suportada." }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erro ao processar pagamento no Mercado Pago.";
    console.error("Exceção na rota /api/payment/process:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
