import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation/catalog";
import { audit, validationError } from "@/server/admin/mutation";
import { productInclude } from "@/server/catalog/mappers";

export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const query = new URL(req.url).searchParams; const products = await prisma.product.findMany({ where: { ...(query.get("line") ? { line: { slug: query.get("line")! } } : {}), ...(query.get("status") ? { status: query.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}), ...(query.get("category") ? { category: { slug: query.get("category")! } } : {}), ...(query.get("q") ? { OR: [{ name: { contains: query.get("q")!, mode: "insensitive" } }, { slug: { contains: query.get("q")!, mode: "insensitive" } }] } : {}) }, include: productInclude, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }); return NextResponse.json({ products }); }
export async function POST(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = productSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const product = await prisma.product.create({ data: { ...parsed.data, status: "DRAFT" } }); await audit(admin.user.userId, "Product", product.id, "create", parsed.data); return NextResponse.json({ product }, { status: 201 }); }
