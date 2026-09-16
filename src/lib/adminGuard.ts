import { NextResponse } from "next/server";

import { verifyAuthToken, type AuthTokenPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AdminGuardResult =
  | { ok: true; user: AuthTokenPayload & { role: "ADMIN" } }
  | { ok: false; response: NextResponse };

export async function requireAdmin(req: Request): Promise<AdminGuardResult> {
  const token = verifyAuthToken(req);
  if (!token?.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Autenticação necessária." }, { status: 401 }),
    };
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: token.userId },
    select: { role: true },
  });

  if (profile?.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 }),
    };
  }

  return { ok: true, user: { ...token, role: "ADMIN" } };
}
