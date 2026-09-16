import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation/catalog";
import { audit, validationError } from "@/server/admin/mutation";
export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; return NextResponse.json({ categories: await prisma.category.findMany({ include: { line: true, _count: { select: { products: true } } }, orderBy: { sortOrder: "asc" } }) }); }
export async function POST(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = categorySchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const category = await prisma.category.create({ data: parsed.data }); await audit(admin.user.userId, "Category", category.id, "create", parsed.data); return NextResponse.json({ category }, { status: 201 }); }
