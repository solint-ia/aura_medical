import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";

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
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Nenhum item informado para o pedido." },
        { status: 400 }
      );
    }

    const orderNumber = `AUR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingCode = `ME-${Math.floor(100000000 + Math.random() * 900000000)}BR`;

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
          trackingCode,
          invoiceUrl: "#nfe-preview",
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
          trackingCode,
          "#nfe-preview",
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
