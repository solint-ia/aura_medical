import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { lineSchema } from "@/lib/validation/catalog";
import { audit, validationError } from "@/server/admin/mutation";

export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; return NextResponse.json({ lines: await prisma.line.findMany({ include: { _count: { select: { products: true, protocols: true } } }, orderBy: { sortOrder: "asc" } }) }); }
export async function POST(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = lineSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const line = await prisma.line.create({ data: parsed.data }); await audit(admin.user.userId, "Line", line.id, "create", parsed.data); return NextResponse.json({ line }, { status: 201 }); }
