import { NextResponse } from "next/server";

const MERCADO_PAGO_ACCESS_TOKEN =
  process.env.MERCADO_PAGO_ACCESS_TOKEN ||
  "APP_USR-3712643348963661-070715-0c6e3f9b0c2c3b39a6e71881110b75ff-200222084";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId é obrigatório." }, { status: 400 });
    }

    if (paymentId.startsWith("PIX-TEST-") || paymentId.startsWith("CARD-APPROVED-")) {
      return NextResponse.json({
        success: true,
        status: "approved",
        statusDetail: "accredited",
        isMock: true,
      });
    }

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      return NextResponse.json({
        success: true,
        status: data.status,
        statusDetail: data.status_detail,
        amount: data.transaction_amount,
        paymentMethod: data.payment_method_id,
      });
    }

    return NextResponse.json(
      { error: data.message || "Erro ao consultar status do pagamento." },
      { status: res.status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao consultar status.";
    console.error("Erro em /api/payment/status:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
