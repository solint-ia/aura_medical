import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { audit, validationError } from "@/server/admin/mutation";
const schema = z.object({ key: z.string().min(2).max(100), lineId: z.string().uuid().nullish(), eyebrow: z.string().max(120).nullish(), title: z.string().nullish(), body: z.string().nullish(), items: z.array(z.unknown()).default([]), ctaLabel: z.string().max(60).nullish(), ctaHref: z.string().max(300).nullish(), isPublished: z.boolean().default(false) });
export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; return NextResponse.json({ items: await prisma.contentBlock.findMany({ orderBy: { key: "asc" } }) }); }
export async function POST(req: Request) { return save(req); } export async function PATCH(req: Request) { return save(req); }
async function save(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = schema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const data = { ...parsed.data, items: parsed.data.items as Prisma.InputJsonValue }; const item = await prisma.contentBlock.upsert({ where: { key: parsed.data.key }, update: data as Prisma.ContentBlockUncheckedUpdateInput, create: data as Prisma.ContentBlockUncheckedCreateInput }); await audit(admin.user.userId, "ContentBlock", item.id, "update", parsed.data); return NextResponse.json({ item }); }
export async function DELETE(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const key = new URL(req.url).searchParams.get("key"); if (!key) return NextResponse.json({ error: "Chave obrigatória." }, { status: 400 }); const item = await prisma.contentBlock.delete({ where: { key } }); await audit(admin.user.userId, "ContentBlock", item.id, "delete", {}); return NextResponse.json({ success: true }); }
