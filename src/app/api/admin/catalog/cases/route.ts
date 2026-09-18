import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { caseSchema } from "@/lib/validation/catalog";
import { audit, lineIdFromCaseLinks, validationError } from "@/server/admin/mutation";
import { casePublicationError } from "@/server/admin/publication";

const caseInclude = { line: true, beforeImage: true, afterImage: true, products: { include: { product: true } }, protocols: { include: { protocol: true } } } as const;

export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const url = new URL(req.url); return NextResponse.json({ cases: await prisma.clinicalCase.findMany({ where: { ...(url.searchParams.get("productId") ? { products: { some: { productId: url.searchParams.get("productId")! } } } : {}), ...(url.searchParams.get("protocolId") ? { protocols: { some: { protocolId: url.searchParams.get("protocolId")! } } } : {}) }, include: caseInclude, orderBy: { sortOrder: "asc" } }) }); }

export async function POST(req: Request) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = caseSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const { productIds, protocolIds, status, ...data } = parsed.data; const owner = await lineIdFromCaseLinks(productIds, protocolIds); if ("error" in owner) return NextResponse.json({ error: owner.error }, { status: 400 });
  const publishError = status === "PUBLISHED" ? casePublicationError({ imageRightsConfirmed: data.imageRightsConfirmed, products: productIds, protocols: protocolIds }) : null; if (publishError) return NextResponse.json({ error: publishError }, { status: 400 });
  const clinicalCase = await prisma.clinicalCase.create({ data: { ...data, lineId: owner.lineId, status, products: { create: productIds.map((productId, sortOrder) => ({ productId, sortOrder })) }, protocols: { create: protocolIds.map((protocolId, sortOrder) => ({ protocolId, sortOrder })) } }, include: caseInclude });
  await audit(admin.user.userId, "ClinicalCase", clinicalCase.id, "create", parsed.data); return NextResponse.json({ case: clinicalCase }, { status: 201 });
}
