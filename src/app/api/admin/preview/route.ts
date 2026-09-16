import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getAuthJwtSecret } from "@/lib/auth";
export async function POST(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const { path } = await req.json(); if (typeof path !== "string" || !path.startsWith("/")) return NextResponse.json({ error: "Caminho inválido." }, { status: 400 }); const token = await new SignJWT({ path, purpose: "preview" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("5m").sign(new TextEncoder().encode(getAuthJwtSecret())); return NextResponse.json({ url: `/api/preview?token=${token}` }); }
