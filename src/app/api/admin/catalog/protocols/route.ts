import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { protocolSchema } from "@/lib/validation/catalog";
import { audit, validationError } from "@/server/admin/mutation";
import { protocolInclude } from "@/server/catalog/mappers";
export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; return NextResponse.json({ protocols: await prisma.protocol.findMany({ include: protocolInclude, orderBy: { sortOrder: "asc" } }) }); }
export async function POST(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = protocolSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const { components, ...data } = parsed.data; const protocol = await prisma.protocol.create({ data: { ...data, status: "DRAFT", components: { create: components } }, include: protocolInclude }); await audit(admin.user.userId, "Protocol", protocol.id, "create", parsed.data); return NextResponse.json({ protocol }, { status: 201 }); }
