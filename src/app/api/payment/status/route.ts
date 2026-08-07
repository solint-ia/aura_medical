import { NextResponse } from "next/server";
import { fetchMercadoPagoPayment } from "@/lib/mercadopago";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId é obrigatório." }, { status: 400 });
    }

    const lookup = await fetchMercadoPagoPayment(paymentId);

    if (!lookup.ok) {
      return NextResponse.json({ error: lookup.error }, { status: lookup.httpStatus });
    }

    return NextResponse.json({
      success: true,
      status: lookup.payment.status,
      statusDetail: lookup.payment.statusDetail,
      amount: lookup.payment.amount,
      paymentMethod: lookup.payment.paymentMethod,
      externalReference: lookup.payment.externalReference,
      ...(lookup.payment.isMock ? { isMock: true } : {}),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao consultar status.";
    console.error("Erro em /api/payment/status:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
