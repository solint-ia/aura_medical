import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";

function extractUf(order: any): string {
  if (order.address?.uf) return order.address.uf.toUpperCase();
  if (order.uf) return order.uf.toUpperCase();
  const text = (order.notes || order.addressSummary || "").toUpperCase();
  const match = text.match(/\(([A-Z]{2})\)/);
  if (match && match[1]) return match[1];
  return "SE";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all";
    const ufFilter = (searchParams.get("uf") || "ALL").toUpperCase();
    const query = (searchParams.get("query") || "").toLowerCase().trim();

    let rawOrders: any[] = [];

    try {
      rawOrders = await prisma.order.findMany({
        include: {
          user: true,
          address: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (prismaErr) {
      console.warn("Prisma orders list fallback dbPool:", prismaErr);

      const sqlRes = await dbPool.query(`
        SELECT o.*, 
               u.first_name, u.last_name, u.email as user_email, u.phone as user_phone,
               a.street, a.number as addr_number, a.complement, a.neighborhood, a.city, a.uf, a.cep
        FROM public.orders o
        LEFT JOIN public.user_profiles u ON o.user_id = u.id
        LEFT JOIN public.user_addresses a ON o.address_id = a.id
        ORDER BY o.created_at DESC
      `);

      rawOrders = sqlRes.rows;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const orders = rawOrders
      .filter((o) => {
        const orderDate = o.createdAt ? new Date(o.createdAt) : o.created_at ? new Date(o.created_at) : new Date();

        // Period Filter
        if (period === "today" && orderDate < startOfToday) return false;
        if (period === "week" && orderDate < startOfWeek) return false;
        if (period === "month" && orderDate < startOfMonth) return false;

        // State (UF) Filter
        const uf = extractUf(o);
        if (ufFilter !== "ALL" && uf !== ufFilter) return false;

        // Search Query Filter
        if (query) {
          const customerName = (
            o.user
              ? `${o.user.firstName || ""} ${o.user.lastName || ""}`
              : `${o.first_name || ""} ${o.last_name || ""}`
          ).toLowerCase();
          const customerEmail = (o.user?.email || o.user_email || "").toLowerCase();
          const orderNum = (o.orderNumber || o.order_number || "").toLowerCase();
          if (
            !customerName.includes(query) &&
            !customerEmail.includes(query) &&
            !orderNum.includes(query)
          ) {
            return false;
          }
        }

        return true;
      })
      .map((o) => {
        const items = o.items
          ? o.items.map((i: any) => ({
              id: i.id,
              productId: i.productId,
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
              totalPrice: Number(i.totalPrice),
            }))
          : [];

        const customerName = o.user
          ? `${o.user.firstName} ${o.user.lastName}`
          : o.first_name
            ? `${o.first_name} ${o.last_name}`
            : "Cliente";

        const customerEmail = o.user?.email || o.user_email || "";
        const customerPhone = o.user?.phone || o.user_phone || "";
        const uf = extractUf(o);

        const addressSummary = o.address
          ? `${o.address.street}, ${o.address.number} ${o.address.complement || ""} - ${o.address.neighborhood}, ${o.address.city} (${o.address.uf}) CEP: ${o.address.cep}`
          : o.street
            ? `${o.street}, ${o.addr_number} ${o.complement || ""} - ${o.neighborhood}, ${o.city} (${o.uf}) CEP: ${o.cep}`
            : o.notes || "Endereço cadastrado";

        return {
          id: o.id,
          orderNumber: o.orderNumber || o.order_number,
          customerName,
          customerEmail,
          customerPhone,
          addressSummary,
          uf,
          shippingMethod: o.shippingMethod || o.shipping_method || "Frete Padrão",
          shippingCost: Number(o.shippingCost || o.shipping_cost || 0),
          subtotal: Number(o.subtotal || 0),
          totalPrice: Number(o.totalPrice || o.total_price || 0),
          paymentMethod: o.paymentMethod || o.payment_method || "pix",
          status: o.status || "pendente",
          trackingCode: o.trackingCode || o.tracking_code || "",
          createdAt: o.createdAt || o.created_at,
          items,
        };
      });

    return NextResponse.json({ orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao listar pedidos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, trackingCode } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do pedido é obrigatório." }, { status: 400 });
    }

    try {
      const updated = await prisma.order.update({
        where: { id },
        data: {
          status: status || undefined,
          trackingCode: trackingCode !== undefined ? trackingCode.trim() : undefined,
        },
      });

      return NextResponse.json({ success: true, order: updated });
    } catch (prismaErr) {
      console.warn("Prisma order update fallback dbPool:", prismaErr);

      await dbPool.query(
        `UPDATE public.orders 
         SET status = COALESCE($1, status), 
             tracking_code = COALESCE($2, tracking_code), 
             updated_at = NOW()
         WHERE id = $3`,
        [status || null, trackingCode !== undefined ? trackingCode.trim() : null, id]
      );

      return NextResponse.json({ success: true });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar pedido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do pedido é obrigatório." }, { status: 400 });
    }

    try {
      await prisma.order.delete({
        where: { id },
      });
    } catch (prismaErr) {
      console.warn("Prisma order delete fallback dbPool:", prismaErr);
      await dbPool.query("DELETE FROM public.orders WHERE id = $1", [id]);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao excluir pedido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
