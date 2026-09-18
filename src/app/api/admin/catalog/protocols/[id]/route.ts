import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { protocolPatchSchema } from "@/lib/validation/catalog";
import { audit, requireUnchanged, validationError } from "@/server/admin/mutation";
import { protocolInclude } from "@/server/catalog/mappers";
type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const protocol = await prisma.protocol.findUnique({ where: { id: (await params).id }, include: protocolInclude }); return protocol ? NextResponse.json({ protocol }) : NextResponse.json({ error: "Protocolo não encontrado." }, { status: 404 }); }

export async function PATCH(req: Request, { params }: Context) {
  try {
    const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
    const parsed = protocolPatchSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
    const id = (await params).id; const before = await prisma.protocol.findUnique({ where: { id } }); if (!before) return NextResponse.json({ error: "Protocolo não encontrado." }, { status: 404 });
    const stale = requireUnchanged(req, before.updatedAt); if (stale) return stale;
    const { components, images, ...data } = parsed.data;
    const protocol = await prisma.$transaction(async (tx) => {
      if (data.slug && data.slug !== before.slug && before.status !== "DRAFT") await tx.slugRedirect.upsert({ where: { fromPath: `/protocolos/${before.slug}` }, update: { toPath: `/protocolos/${data.slug}` }, create: { fromPath: `/protocolos/${before.slug}`, toPath: `/protocolos/${data.slug}` } });
      if (components) { await tx.protocolComponent.deleteMany({ where: { protocolId: id } }); if (components.length) await tx.protocolComponent.createMany({ data: components.map((component) => ({ ...component, protocolId: id })) }); }
      if (images) { await tx.protocolImage.deleteMany({ where: { protocolId: id } }); if (images.length) await tx.protocolImage.createMany({ data: images.map((image) => ({ ...image, caption: image.caption || null, protocolId: id })) }); }
      return tx.protocol.update({ where: { id }, data, include: protocolInclude });
    });
    await audit(admin.user.userId, "Protocol", id, "update", { before, after: protocol }); return NextResponse.json({ protocol });
  } catch (error) {
    console.error("Falha ao salvar protocolo:", error);
    return NextResponse.json({ error: "Não foi possível salvar o protocolo. Tente novamente." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Context) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const id = (await params).id;
  const protocol = await prisma.protocol.findUnique({ where: { id }, include: { skus: { include: { aliases: true } }, caseLinks: { include: { case: { include: { products: true, protocols: true } } } } } });
  if (!protocol) return NextResponse.json({ error: "Protocolo não encontrado." }, { status: 404 });
  const sold = await prisma.orderItem.count({ where: { productId: { in: protocol.skus.flatMap((sku) => [sku.code, ...sku.aliases.map((alias) => alias.alias)]) } } });
  if (sold) return NextResponse.json({ error: "Protocolo já vendido não pode ser excluído. Arquive-o." }, { status: 409 });
  const orphaned = protocol.caseLinks.filter(({ case: clinicalCase }) => clinicalCase.protocols.length === 1 && clinicalCase.products.length === 0).length;
  if (orphaned) return NextResponse.json({ error: `${orphaned} caso(s) ficariam sem vínculo. Vincule-os a outro item primeiro.` }, { status: 409 });
  await prisma.$transaction(async (tx) => { await tx.clinicalCaseProtocol.deleteMany({ where: { protocolId: id } }); await tx.skuAlias.deleteMany({ where: { sku: { protocolId: id } } }); await tx.sku.deleteMany({ where: { protocolId: id } }); await tx.protocol.delete({ where: { id } }); });
  await audit(admin.user.userId, "Protocol", id, "delete", { caseLinks: protocol.caseLinks.length }); return NextResponse.json({ success: true });
}
