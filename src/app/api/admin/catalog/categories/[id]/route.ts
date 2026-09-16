import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { categoryPatchSchema } from "@/lib/validation/catalog";
import { audit, validationError } from "@/server/admin/mutation";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, { params }: Context) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const category = await prisma.category.findUnique({ where: { id: (await params).id } }); return category ? NextResponse.json({ category }) : NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 }); }
export async function PATCH(req: Request, { params }: Context) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = categoryPatchSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const id = (await params).id; const category = await prisma.category.update({ where: { id }, data: parsed.data }); await audit(admin.user.userId, "Category", id, "update", parsed.data); return NextResponse.json({ category }); }
export async function DELETE(req: Request, { params }: Context) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const id = (await params).id; if (await prisma.product.count({ where: { categoryId: id } })) return NextResponse.json({ error: "Categoria em uso." }, { status: 409 }); await prisma.category.delete({ where: { id } }); await audit(admin.user.userId, "Category", id, "delete", {}); return NextResponse.json({ success: true }); }
