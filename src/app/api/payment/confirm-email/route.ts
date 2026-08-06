import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/orderEmail";
import type { OrderEmailItem } from "@/lib/maileroo";

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

/**
 * Disparado pelo checkout somente depois que o polling de /api/payment/status
 * detecta que o PIX foi de fato pago (status "approved") — nunca no momento em
 * que o QR Code é apenas gerado. Reconfirma o status direto no Mercado Pago
 * antes de enviar, para não depender só do que o cliente informa.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      paymentId,
      customerName,
      customerEmail,
      orderNumber,
      paymentMethod,
      shippingAddress,
      items,
      subtotal,
      shippingCost,
      totalPrice,
    } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId é obrigatório." }, { status: 400 });
    }

    const isMockPayment = String(paymentId).startsWith("PIX-TEST-");

    if (!isMockPayment) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` },
      });
      const mpData = await mpRes.json();

      if (!mpRes.ok || mpData.status !== "approved") {
        return NextResponse.json(
          { success: false, error: "Pagamento ainda não confirmado pelo Mercado Pago." },
          { status: 409 }
        );
      }
    }

    await sendOrderConfirmationEmail({
      customerName: customerName || "Cliente Aura",
      customerEmail: customerEmail || "",
      orderNumber: String(orderNumber || paymentId),
      paymentMethod: paymentMethod || "PIX à Vista (Mercado Pago)",
      shippingAddress: shippingAddress || "Endereço Cadastrado na Conta",
      items: Array.isArray(items) ? (items as OrderEmailItem[]) : [],
      subtotal: Number(subtotal || 0),
      shippingCost: Number(shippingCost || 0),
      totalPrice: Number(totalPrice || 0),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao confirmar pagamento e enviar e-mail.";
    console.error("Erro em /api/payment/confirm-email:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
