import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { audit } from "@/server/admin/mutation";
import { productPublicationError } from "@/server/admin/publication";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
  const id = (await params).id; const product = await prisma.product.findUnique({ where: { id }, include: { line: true, skus: true, images: true } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  const error = productPublicationError(product); if (error) return NextResponse.json({ error }, { status: 400 });
  const updated = await prisma.product.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  await audit(admin.user.userId, "Product", id, "publish", { status: "PUBLISHED" }); return NextResponse.json({ product: updated });
}
