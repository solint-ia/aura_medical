import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "aura-jwt-secret-key-2026-secure";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
        userEmail = decoded.email;
      } catch {
        // invalid token
      }
    }

    const body = await req.json();
    const { currentPassword, newPassword, email } = body;

    const targetEmail = userEmail || email;

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Sessão não identificada. Faça login novamente." },
        { status: 401 }
      );
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Informe a senha atual e a nova senha." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve possuir no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const trimmedEmail = targetEmail.toLowerCase().trim();

    let dbUser: any = null;

    try {
      const found = await prisma.userProfile.findFirst({
        where: { email: trimmedEmail },
      });
      if (found) dbUser = found;
    } catch (prismaErr) {
      console.warn("Prisma change-password fallback dbPool:", prismaErr);
      const sqlRes = await dbPool.query(
        "SELECT * FROM public.user_profiles WHERE LOWER(email) = $1 LIMIT 1",
        [trimmedEmail]
      );
      if (sqlRes.rows.length > 0) dbUser = sqlRes.rows[0];
    }

    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const currentHash = dbUser.passwordHash || dbUser.password_hash;

    if (currentHash) {
      const valid = await bcrypt.compare(currentPassword, currentHash);
      if (!valid) {
        return NextResponse.json(
          { error: "A senha atual informada está incorreta." },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    try {
      await prisma.userProfile.update({
        where: { id: dbUser.id },
        data: {
          passwordHash: newPasswordHash,
        } as any,
      });
    } catch (err) {
      await dbPool.query(
        "UPDATE public.user_profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        [newPasswordHash, dbUser.id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao alterar senha.";
    console.error("Erro change-password:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
