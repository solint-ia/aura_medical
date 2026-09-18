import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { casePatchSchema } from "@/lib/validation/catalog";
import { audit, lineIdFromCaseLinks, requireUnchanged, validationError } from "@/server/admin/mutation";
import { casePublicationError } from "@/server/admin/publication";
type Context = { params: Promise<{ id: string }> };
const caseInclude = { line: true, beforeImage: true, afterImage: true, products: { include: { product: true } }, protocols: { include: { protocol: true } } } as const;

export async function GET(req: Request, { params }: Context) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const clinicalCase = await prisma.clinicalCase.findUnique({ where: { id: (await params).id }, include: caseInclude }); return clinicalCase ? NextResponse.json({ case: clinicalCase }) : NextResponse.json({ error: "Caso não encontrado." }, { status: 404 }); }

export async function PATCH(req: Request, { params }: Context) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = casePatchSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const id = (await params).id; const before = await prisma.clinicalCase.findUnique({ where: { id }, include: { products: true, protocols: true } }); if (!before) return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
  const stale = requireUnchanged(req, before.updatedAt); if (stale) return stale;
  const { productIds, protocolIds, status, ...data } = parsed.data; const nextProducts = productIds ?? before.products.map((link) => link.productId); const nextProtocols = protocolIds ?? before.protocols.map((link) => link.protocolId);
  const owner = await lineIdFromCaseLinks(nextProducts, nextProtocols); if ("error" in owner) return NextResponse.json({ error: owner.error }, { status: 400 }); const nextStatus = status ?? before.status;
  const publishError = nextStatus === "PUBLISHED" ? casePublicationError({ imageRightsConfirmed: data.imageRightsConfirmed ?? before.imageRightsConfirmed, products: nextProducts, protocols: nextProtocols }) : null; if (publishError) return NextResponse.json({ error: publishError }, { status: 400 });
  const clinicalCase = await prisma.$transaction(async (tx) => { if (productIds) { await tx.clinicalCaseProduct.deleteMany({ where: { caseId: id } }); await tx.clinicalCaseProduct.createMany({ data: productIds.map((productId, sortOrder) => ({ caseId: id, productId, sortOrder })) }); } if (protocolIds) { await tx.clinicalCaseProtocol.deleteMany({ where: { caseId: id } }); await tx.clinicalCaseProtocol.createMany({ data: protocolIds.map((protocolId, sortOrder) => ({ caseId: id, protocolId, sortOrder })) }); } return tx.clinicalCase.update({ where: { id }, data: { ...data, status: nextStatus, lineId: owner.lineId }, include: caseInclude }); });
  await audit(admin.user.userId, "ClinicalCase", id, status === "PUBLISHED" ? "publish" : "update", { before, after: clinicalCase }); return NextResponse.json({ case: clinicalCase });
}

export async function DELETE(req: Request, { params }: Context) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const id = (await params).id; await prisma.clinicalCase.delete({ where: { id } }); await audit(admin.user.userId, "ClinicalCase", id, "delete", {}); return NextResponse.json({ success: true }); }
