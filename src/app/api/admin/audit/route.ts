import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const params = new URL(req.url).searchParams; const logs = await prisma.auditLog.findMany({ where: { ...(params.get("entity") ? { entity: params.get("entity")! } : {}), ...(params.get("entityId") ? { entityId: params.get("entityId")! } : {}) }, orderBy: { createdAt: "desc" }, take: 200 }); return NextResponse.json({ logs }); }
