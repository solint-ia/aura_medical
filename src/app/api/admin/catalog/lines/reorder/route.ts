import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { audit } from "@/server/admin/mutation";
const schema = z.object({ ids: z.array(z.string().uuid()).min(1) });
export async function POST(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = schema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: "Ordem inválida." }, { status: 400 }); await prisma.$transaction(parsed.data.ids.map((id, sortOrder) => prisma.line.update({ where: { id }, data: { sortOrder } }))); await audit(admin.user.userId, "Line", "order", "reorder", parsed.data); return NextResponse.json({ success: true }); }
