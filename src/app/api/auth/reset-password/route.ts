import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Informe o e-mail, o código de 6 dígitos e a nova senha." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve possuir no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedCode = code.replace(/\D/g, "");

    let dbUser: any = null;

    try {
      const found = await prisma.userProfile.findFirst({
        where: { email: trimmedEmail },
      });

      if (found) {
        dbUser = found;
      }
    } catch (prismaErr) {
      console.warn("Prisma reset-password fallback dbPool:", prismaErr);

      const sqlRes = await dbPool.query(
        "SELECT * FROM public.user_profiles WHERE LOWER(email) = $1 LIMIT 1",
        [trimmedEmail]
      );

      if (sqlRes.rows.length > 0) {
        dbUser = sqlRes.rows[0];
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const savedCode = dbUser.resetPasswordCode || dbUser.reset_password_code;
    const savedExpires = dbUser.resetPasswordExpires || dbUser.reset_password_expires;

    if (!savedCode || savedCode !== trimmedCode) {
      return NextResponse.json(
        { error: "Código de recuperação incorreto. Verifique e tente novamente." },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = savedExpires ? new Date(savedExpires) : null;

    if (!expiresAt || expiresAt < now) {
      return NextResponse.json(
        { error: "O código de recuperação expirou (validade: 10 minutos). Solicite um novo código." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    try {
      await prisma.userProfile.update({
        where: { id: dbUser.id },
        data: {
          passwordHash,
          resetPasswordCode: null,
          resetPasswordExpires: null,
        } as any,
      });
    } catch (err) {
      await dbPool.query(
        `UPDATE public.user_profiles 
         SET password_hash = $1, reset_password_code = NULL, reset_password_expires = NULL, updated_at = NOW() 
         WHERE id = $2`,
        [passwordHash, dbUser.id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso! Você já pode entrar com sua nova senha.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao redefinir senha.";
    console.error("Erro reset-password:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
