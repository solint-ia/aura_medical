import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";
import { calculateCheckoutTotal, verifyCheckoutItems } from "@/lib/checkoutPricing";
import { fetchMercadoPagoPayment } from "@/lib/mercadopago";

/** Tolerância na comparação de valores (centavos de arredondamento). */
const AMOUNT_TOLERANCE = 0.02;

async function findOwnedAddress(userId: string, addressId: string) {
  try {
    return await prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
  } catch (prismaErr) {
    console.warn("Prisma indisponível ao validar endereço do pedido, tentando dbPool:", prismaErr);
    const res = await dbPool.query(
      `SELECT * FROM public.user_addresses WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [addressId, userId]
    );
    return res.rows[0] || null;
  }
}

/**
 * Pedido já gravado com este `order_number`? O polling do checkout pode
 * detectar a aprovação mais de uma vez (duas abas, re-render, retry de rede),
 * então a gravação precisa ser idempotente.
 */
async function findExistingOrder(orderNumber: string) {
  try {
    return await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
  } catch (prismaErr) {
    console.warn("Prisma indisponível ao checar pedido existente, tentando dbPool:", prismaErr);
    try {
      const res = await dbPool.query(
        `SELECT * FROM public.orders WHERE order_number = $1 LIMIT 1`,
        [orderNumber]
      );
      return res.rows[0] || null;
    } catch (sqlErr) {
      console.warn("Aviso ao checar pedido existente no dbPool:", sqlErr);
      return null;
    }
  }
}

export async function POST(req: Request) {
  try {
    const auth = verifyAuthToken(req);
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const {
      addressId,
      shippingMethod,
      shippingCost: requestedShippingCost,
      totalPrice: requestedTotalPrice,
      paymentMethod,
      items,
      orderNumber: customOrderNumber,
      paymentId,
    } = body;

    const verifiedCart = await verifyCheckoutItems(items, { allowInternal: auth.role === "ADMIN" });
    if (!verifiedCart.ok) {
      return NextResponse.json(
        { error: verifiedCart.error },
        { status: verifiedCart.status || 400 }
      );
    }

    const pricingMethod = paymentMethod === "pix" ? "pix" : paymentMethod === "credito" ? "card" : null;
    if (!pricingMethod) {
      return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
    }

    if (!Number.isFinite(Number(requestedTotalPrice))) {
      return NextResponse.json({ error: "Valor do pedido inválido." }, { status: 400 });
    }

    if (typeof addressId !== "string" || !addressId) {
      return NextResponse.json({ error: "Endereço inválido." }, { status: 400 });
    }
    const address = await findOwnedAddress(auth.userId, addressId);
    if (!address) {
      return NextResponse.json({ error: "Endereço não pertence a esta conta." }, { status: 403 });
    }
    const addressUf = address.uf || "";
    const addressSummary = `${address.street}, ${address.number} ${address.complement || ""} - ${address.neighborhood}, ${address.city} (${addressUf}) CEP: ${address.cep}`;

    // ----------------------------------------------------
    // GATE DE PAGAMENTO — o pedido só existe no banco depois que o Mercado
    // Pago confirma que o dinheiro entrou. O status vem da API do MP (com o
    // access token do servidor), nunca do que o navegador afirma.
    // ----------------------------------------------------
    if (!paymentId) {
      return NextResponse.json(
        { error: "Pedido só pode ser registrado após a confirmação do pagamento." },
        { status: 400 }
      );
    }

    const lookup = await fetchMercadoPagoPayment(String(paymentId));

    if (!lookup.ok) {
      return NextResponse.json({ error: lookup.error }, { status: lookup.httpStatus });
    }

    const payment = lookup.payment;

    if (!payment.isMock && payment.authenticatedUserId !== auth.userId) {
      return NextResponse.json({ error: "Pagamento não pertence a esta conta." }, { status: 403 });
    }

    if (payment.status !== "approved") {
      return NextResponse.json(
        {
          error: "Pagamento ainda não aprovado pelo Mercado Pago — pedido não registrado.",
          paymentStatus: payment.status,
          statusDetail: payment.statusDetail,
        },
        { status: 409 }
      );
    }

    // `external_reference` é o número de pedido enviado na criação da cobrança:
    // é ele quem manda, para um paymentId aprovado não ser reaproveitado em
    // outro pedido.
    const orderNumber =
      payment.externalReference || customOrderNumber || `AUR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    if (
      payment.externalReference &&
      customOrderNumber &&
      String(customOrderNumber) !== payment.externalReference
    ) {
      return NextResponse.json(
        { error: "Pagamento não corresponde ao pedido informado." },
        { status: 409 }
      );
    }

    const subtotal = verifiedCart.subtotal;
    const metadataShippingCost = payment.shippingCost;
    const paidShippingCost = typeof payment.amount === "number"
      ? pricingMethod === "pix"
        ? payment.amount / 0.95 - subtotal
        : payment.amount - subtotal
      : Number(requestedShippingCost);
    const shippingCost = Math.round(
      ((metadataShippingCost ?? paidShippingCost) + Number.EPSILON) * 100
    ) / 100;

    if (!Number.isFinite(shippingCost) || shippingCost < 0 || shippingCost > 10_000) {
      return NextResponse.json({ error: "Valor do frete inválido." }, { status: 409 });
    }

    const verifiedShippingMethod =
      payment.shippingMethod ||
      (typeof shippingMethod === "string" && shippingMethod.trim()
        ? shippingMethod.trim()
        : "Frete Melhor Envio");
    const totalPrice = calculateCheckoutTotal(subtotal, pricingMethod, shippingCost);

    if (Math.abs(Number(requestedTotalPrice) - totalPrice) > AMOUNT_TOLERANCE) {
      return NextResponse.json({ error: "Valor do pedido inválido." }, { status: 409 });
    }

    // Valor pago tem que bater com o total do pedido.
    if (typeof payment.amount === "number") {
      if (Math.abs(payment.amount - totalPrice) > AMOUNT_TOLERANCE) {
        return NextResponse.json(
          { error: "Valor do pedido diverge do valor pago no Mercado Pago." },
          { status: 409 }
        );
      }
    }

    const existing = await findExistingOrder(orderNumber);
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        order: existing,
      });
    }

    let createdOrder: unknown;
    try {
      createdOrder = await prisma.$transaction(async (tx) => {
        for (const item of verifiedCart.items.filter((entry) => entry.trackStock)) {
          const changed = await tx.sku.updateMany({
            where: { code: item.skuCode, trackStock: true, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (changed.count !== 1) throw new Error(`Estoque insuficiente para ${item.name}.`);
        }
        return tx.order.create({
        data: {
          orderNumber,
          userId: auth.userId,
          addressId: addressId || null,
          shippingMethod: verifiedShippingMethod,
          shippingCost,
          subtotal,
          totalPrice,
          paymentMethod: paymentMethod || "pix",
          status: "pago",
          trackingCode: "",
          invoiceUrl: "",
          notes: addressSummary || null,
          items: {
            create: verifiedCart.items.map((item) => ({
              productId: item.id,
              productName: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              imagePath: item.imagePath || null,
            })),
          },
        },
        include: {
          items: true,
        },
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao registrar o pedido.";
      return NextResponse.json({ error: message }, { status: message.includes("Estoque insuficiente") ? 409 : 503 });
    }

    return NextResponse.json({
      success: true,
      order: createdOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao criar pedido no banco de dados.";
    console.error("Erro na criação do pedido DB:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
