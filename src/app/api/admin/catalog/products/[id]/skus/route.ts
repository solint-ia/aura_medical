import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { skuSchema } from "@/lib/validation/catalog";
import { audit, validationError } from "@/server/admin/mutation";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = skuSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const { aliases, ...data } = parsed.data; const sku = await prisma.sku.create({ data: { ...data, productId: (await params).id, aliases: { create: aliases.map((alias) => ({ alias })) } }, include: { aliases: true } }); await audit(admin.user.userId, "Sku", sku.id, "create", parsed.data); return NextResponse.json({ sku }, { status: 201 }); }
