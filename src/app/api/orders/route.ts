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
      totalPrice: requestedTotalPrice,
      paymentMethod,
      items,
      orderNumber: customOrderNumber,
      paymentId,
    } = body;

    const verifiedCart = verifyCheckoutItems(items, auth.role === "ADMIN");
    if (!verifiedCart.ok) {
      return NextResponse.json(
        { error: verifiedCart.error },
        { status: 400 }
      );
    }

    const pricingMethod = paymentMethod === "pix" ? "pix" : paymentMethod === "credito" ? "card" : null;
    if (!pricingMethod) {
      return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
    }

    const shippingCost = 0;
    const subtotal = verifiedCart.subtotal;
    const totalPrice = calculateCheckoutTotal(subtotal, pricingMethod, shippingCost);
    if (Math.abs(Number(requestedTotalPrice) - totalPrice) > AMOUNT_TOLERANCE) {
      return NextResponse.json({ error: "Valor do pedido inválido." }, { status: 409 });
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

    let createdOrder: unknown = null;

    // 1. Primary insertion via Prisma ORM
    try {
      createdOrder = await prisma.order.create({
        data: {
          orderNumber,
          userId: auth.userId,
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
          auth.userId,
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

      const insertedItems: Array<{
        id: string;
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number | string;
        total_price: number | string;
        image_path?: string | null;
      }> = [];
      for (const item of verifiedCart.items) {
        const itemRes = await dbPool.query(
          `INSERT INTO public.order_items
           (order_id, product_id, product_name, quantity, unit_price, total_price, image_path)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            dbOrder.id,
            item.id,
            item.name,
            item.quantity,
            item.unitPrice,
            item.unitPrice * item.quantity,
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
