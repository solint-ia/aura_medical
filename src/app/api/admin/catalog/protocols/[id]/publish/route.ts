import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { audit } from "@/server/admin/mutation";
import { protocolPublicationError } from "@/server/admin/publication";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const id = (await params).id; const protocol = await prisma.protocol.findUnique({ where: { id }, include: { line: true, components: true, skus: true } }); if (!protocol) return NextResponse.json({ error: "Protocolo não encontrado." }, { status: 404 }); const error = protocolPublicationError(protocol); if (error) return NextResponse.json({ error }, { status: 400 }); const updated = await prisma.protocol.update({ where: { id }, data: { status: "PUBLISHED" } }); await audit(admin.user.userId, "Protocol", id, "publish", { status: "PUBLISHED" }); return NextResponse.json({ protocol: updated }); }
