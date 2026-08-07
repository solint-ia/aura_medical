import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { fetchMercadoPagoPayment } from "@/lib/mercadopago";

/** Tolerância na comparação de valores (centavos de arredondamento). */
const AMOUNT_TOLERANCE = 0.02;

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
    const body = await req.json();
    const {
      userId,
      addressId,
      addressSummary,
      shippingMethod,
      shippingCost,
      subtotal,
      totalPrice,
      paymentMethod,
      items,
      orderNumber: customOrderNumber,
      paymentId,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Nenhum item informado para o pedido." },
        { status: 400 }
      );
    }

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

    // Valor pago tem que bater com o total do pedido.
    if (typeof payment.amount === "number") {
      const requested = Number(totalPrice || 0);
      if (Math.abs(payment.amount - requested) > AMOUNT_TOLERANCE) {
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

    let createdOrder: any = null;

    // 1. Primary insertion via Prisma ORM
    try {
      createdOrder = await prisma.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          addressId: addressId || null,
          shippingMethod: shippingMethod || "Frete Padrão",
          shippingCost: Number(shippingCost || 0),
          subtotal: Number(subtotal || 0),
          totalPrice: Number(totalPrice || 0),
          paymentMethod: paymentMethod || "pix",
          status: "pago",
          trackingCode: "",
          invoiceUrl: "",
          notes: addressSummary || null,
          items: {
            create: items.map((i: any) => ({
              productId: String(i.id || i.productId || "prod-unknown"),
              productName: i.name || i.productName || "Produto Aura",
              quantity: Number(i.quantity || 1),
              unitPrice: Number(i.unitPrice || 0),
              totalPrice: Number((i.unitPrice || 0) * (i.quantity || 1)),
              imagePath: i.imagePath || null,
            })),
          },
        },
        include: {
          items: true,
        },
      });
    } catch (prismaErr) {
      console.warn("Prisma order create fallback dbPool:", prismaErr);

      // Fallback: Direct PostgreSQL Query via pg Driver
      const orderInsRes = await dbPool.query(
        `INSERT INTO public.orders 
         (order_number, user_id, address_id, shipping_method, shipping_cost, subtotal, total_price, payment_method, status, tracking_code, invoice_url, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          orderNumber,
          userId || null,
          addressId || null,
          shippingMethod || "Frete Padrão",
          Number(shippingCost || 0),
          Number(subtotal || 0),
          Number(totalPrice || 0),
          paymentMethod || "pix",
          "pago",
          "",
          "",
          addressSummary || null,
        ]
      );

      const dbOrder = orderInsRes.rows[0];

      const insertedItems: any[] = [];
      for (const item of items) {
        const itemRes = await dbPool.query(
          `INSERT INTO public.order_items
           (order_id, product_id, product_name, quantity, unit_price, total_price, image_path)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            dbOrder.id,
            String(item.id || item.productId || "prod-unknown"),
            item.name || item.productName || "Produto Aura",
            Number(item.quantity || 1),
            Number(item.unitPrice || 0),
            Number((item.unitPrice || 0) * (item.quantity || 1)),
            item.imagePath || null,
          ]
        );
        insertedItems.push(itemRes.rows[0]);
      }

      createdOrder = {
        id: dbOrder.id,
        orderNumber: dbOrder.order_number,
        userId: dbOrder.user_id,
        addressId: dbOrder.address_id,
        addressSummary: dbOrder.notes || addressSummary,
        shippingMethod: dbOrder.shipping_method,
        shippingCost: Number(dbOrder.shipping_cost),
        subtotal: Number(dbOrder.subtotal),
        totalPrice: Number(dbOrder.total_price),
        paymentMethod: dbOrder.payment_method,
        status: dbOrder.status,
        trackingCode: dbOrder.tracking_code,
        invoiceUrl: dbOrder.invoice_url,
        createdAt: dbOrder.created_at,
        items: insertedItems.map((i) => ({
          id: i.id,
          productId: i.product_id,
          productName: i.product_name,
          quantity: i.quantity,
          unitPrice: Number(i.unit_price),
          totalPrice: Number(i.total_price),
          imagePath: i.image_path,
        })),
      };
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
