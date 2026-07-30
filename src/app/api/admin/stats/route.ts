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
    const ufFilter = (searchParams.get("uf") || "ALL").toUpperCase();

    let totalRevenue = 0;
    let totalOrdersCount = 0;
    let totalUsersCount = 0;
    let ordersTodayCount = 0;
    let ordersWeekCount = 0;
    let ordersMonthCount = 0;

    const statusCounts: Record<string, number> = {
      pendente: 0,
      pago: 0,
      em_separacao: 0,
      em_transporte: 0,
      entregue: 0,
      cancelado: 0,
    };

    let rawOrders: any[] = [];

    try {
      totalUsersCount = await prisma.userProfile.count();
      rawOrders = await prisma.order.findMany({
        include: {
          address: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (prismaErr) {
      console.warn("Prisma stats fallback dbPool:", prismaErr);

      const uRes = await dbPool.query("SELECT COUNT(*) FROM public.user_profiles");
      totalUsersCount = parseInt(uRes.rows[0]?.count || "0");

      const oRes = await dbPool.query(`
        SELECT o.*, a.uf 
        FROM public.orders o
        LEFT JOIN public.user_addresses a ON o.address_id = a.id
        ORDER BY o.created_at DESC
      `);
      rawOrders = oRes.rows;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    rawOrders.forEach((o) => {
      const state = extractUf(o);
      const numPrice = Number(o.totalPrice || o.total_price || 0);
      const orderDate = o.createdAt ? new Date(o.createdAt) : o.created_at ? new Date(o.created_at) : new Date();

      // Check UF Filter
      if (ufFilter !== "ALL" && state !== ufFilter) {
        return;
      }

      totalOrdersCount += 1;
      totalRevenue += numPrice;

      const st = o.status || "pendente";
      if (statusCounts[st] !== undefined) {
        statusCounts[st] += 1;
      } else {
        statusCounts[st] = 1;
      }

      if (orderDate >= startOfToday) ordersTodayCount += 1;
      if (orderDate >= startOfWeek) ordersWeekCount += 1;
      if (orderDate >= startOfMonth) ordersMonthCount += 1;
    });

    return NextResponse.json({
      totalRevenue,
      totalOrdersCount,
      totalUsersCount,
      ordersTodayCount,
      ordersWeekCount,
      ordersMonthCount,
      statusCounts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao carregar estatísticas.";
    console.error("Erro stats admin:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
