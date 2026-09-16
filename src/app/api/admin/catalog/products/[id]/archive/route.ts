import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { audit } from "@/server/admin/mutation";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const id = (await params).id; const product = await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } }); await audit(admin.user.userId, "Product", id, "archive", { status: "ARCHIVED" }); return NextResponse.json({ product }); }
