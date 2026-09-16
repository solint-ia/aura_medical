import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { audit, validationError } from "@/server/admin/mutation";
const schema = z.object({ id: z.string().uuid().optional(), lineId: z.string().uuid().nullish(), label: z.string().min(2).max(120), body: z.string().min(2), isPublished: z.boolean().default(false), sortOrder: z.number().int().default(0) });
export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; return NextResponse.json({ items: await prisma.safetyNote.findMany({ orderBy: { sortOrder: "asc" } }) }); }
export async function POST(req: Request) { return save(req, false); } export async function PATCH(req: Request) { return save(req, true); }
async function save(req: Request, update: boolean) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = schema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const { id, ...data } = parsed.data; if (update && !id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 }); const item = update ? await prisma.safetyNote.update({ where: { id }, data }) : await prisma.safetyNote.create({ data }); await audit(admin.user.userId, "SafetyNote", item.id, update ? "update" : "create", data); return NextResponse.json({ item }); }
export async function DELETE(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 }); await prisma.safetyNote.delete({ where: { id } }); await audit(admin.user.userId, "SafetyNote", id, "delete", {}); return NextResponse.json({ success: true }); }
