import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const visibility = new URL(req.url).searchParams.get("visibility"); const skus = await prisma.sku.findMany({ where: visibility === "INTERNAL" ? { OR: [{ product: { visibility: "INTERNAL" } }, { protocol: { visibility: "INTERNAL" } }] } : {}, include: { product: true, protocol: true, image: true }, orderBy: { code: "asc" } }); return NextResponse.json({ skus }); }
