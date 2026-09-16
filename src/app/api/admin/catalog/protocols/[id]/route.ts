import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { protocolPatchSchema } from "@/lib/validation/catalog";
import { audit, validationError } from "@/server/admin/mutation";
import { protocolInclude } from "@/server/catalog/mappers";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, { params }: Context) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const protocol = await prisma.protocol.findUnique({ where: { id: (await params).id }, include: protocolInclude }); return protocol ? NextResponse.json({ protocol }) : NextResponse.json({ error: "Protocolo não encontrado." }, { status: 404 }); }
export async function PATCH(req: Request, { params }: Context) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = protocolPatchSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const id = (await params).id; const { components, ...data } = parsed.data; const protocol = await prisma.$transaction(async (tx) => { if (components) { await tx.protocolComponent.deleteMany({ where: { protocolId: id } }); } return tx.protocol.update({ where: { id }, data: { ...data, ...(components ? { components: { create: components } } : {}) }, include: protocolInclude }); }); await audit(admin.user.userId, "Protocol", id, "update", parsed.data); return NextResponse.json({ protocol }); }
