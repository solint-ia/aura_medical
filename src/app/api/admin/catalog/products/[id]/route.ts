import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { productPatchSchema } from "@/lib/validation/catalog";
import { audit, requireUnchanged, validationError } from "@/server/admin/mutation";
import { productInclude } from "@/server/catalog/mappers";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
  const product = await prisma.product.findUnique({ where: { id: (await params).id }, include: productInclude });
  return product ? NextResponse.json({ product }) : NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
}

export async function PATCH(req: Request, { params }: Context) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
  const parsed = productPatchSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const id = (await params).id; const before = await prisma.product.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  const stale = requireUnchanged(req, before.updatedAt); if (stale) return stale;
  const { sections, images, pending, ...data } = parsed.data;
  const product = await prisma.$transaction(async (tx) => {
    if (data.slug && data.slug !== before.slug && before.status !== "DRAFT") await tx.slugRedirect.upsert({ where: { fromPath: `/produtos/${before.slug}` }, update: { toPath: `/produtos/${data.slug}` }, create: { fromPath: `/produtos/${before.slug}`, toPath: `/produtos/${data.slug}` } });
    if (sections) { await tx.productSection.deleteMany({ where: { productId: id } }); await tx.productSection.createMany({ data: sections.map(({ id: _id, ...section }) => ({ ...section, productId: id })) }); }
    if (images) { await tx.productImage.deleteMany({ where: { productId: id } }); if (images.length) await tx.productImage.createMany({ data: images.map((image) => ({ ...image, caption: image.caption || null, productId: id })) }); }
    if (pending) { await tx.pendingField.deleteMany({ where: { productId: id } }); if (pending.length) await tx.pendingField.createMany({ data: pending.map(({ id: _id, ...field }) => ({ ...field, productId: id })) }); }
    return tx.product.update({ where: { id }, data, include: productInclude });
  });
  await audit(admin.user.userId, "Product", id, "update", { before, after: product }); return NextResponse.json({ product });
}

export async function DELETE(req: Request, { params }: Context) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
  const id = (await params).id;
  const product = await prisma.product.findUnique({ where: { id }, include: { skus: { include: { aliases: true } }, protocolUses: true, caseLinks: { include: { case: { include: { products: true, protocols: true } } } } } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  const sold = await prisma.orderItem.count({ where: { productId: { in: product.skus.flatMap((sku) => [sku.code, ...sku.aliases.map((alias) => alias.alias)]) } } });
  if (sold) return NextResponse.json({ error: "Produto já vendido não pode ser excluído. Arquive-o para preservar o histórico." }, { status: 409 });
  if (product.protocolUses.length) return NextResponse.json({ error: `Produto faz parte de ${product.protocolUses.length} protocolo(s). Remova-o das composições antes de excluir.` }, { status: 409 });
  const orphaned = product.caseLinks.filter(({ case: clinicalCase }) => clinicalCase.products.length === 1 && clinicalCase.protocols.length === 0).length;
  if (orphaned) return NextResponse.json({ error: `${orphaned} caso(s) ficariam sem vínculo. Vincule-os a outro item primeiro.` }, { status: 409 });
  await prisma.$transaction(async (tx) => { await tx.clinicalCaseProduct.deleteMany({ where: { productId: id } }); await tx.skuAlias.deleteMany({ where: { sku: { productId: id } } }); await tx.sku.deleteMany({ where: { productId: id } }); await tx.product.delete({ where: { id } }); });
  await audit(admin.user.userId, "Product", id, "delete", { caseLinks: product.caseLinks.length }); return NextResponse.json({ success: true });
}
