import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { caseSchema } from "@/lib/validation/catalog";
import { audit, validationError } from "@/server/admin/mutation";
export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; return NextResponse.json({ cases: await prisma.clinicalCase.findMany({ include: { line: true, protocol: true, beforeImage: true, afterImage: true }, orderBy: { sortOrder: "asc" } }) }); }
export async function POST(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const parsed = caseSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 }); const clinicalCase = await prisma.clinicalCase.create({ data: { ...parsed.data, status: "DRAFT" } }); await audit(admin.user.userId, "ClinicalCase", clinicalCase.id, "create", parsed.data); return NextResponse.json({ case: clinicalCase }, { status: 201 }); }
