import { jwtVerify } from "jose";
import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthJwtSecret } from "@/lib/auth";
export async function GET(req: Request) { try { const token = new URL(req.url).searchParams.get("token") || ""; const { payload } = await jwtVerify(token, new TextEncoder().encode(getAuthJwtSecret())); if (payload.purpose !== "preview" || typeof payload.path !== "string" || !payload.path.startsWith("/")) throw new Error(); (await draftMode()).enable(); return NextResponse.redirect(new URL(payload.path, req.url)); } catch { return NextResponse.json({ error: "Prévia inválida ou expirada." }, { status: 401 }); } }
