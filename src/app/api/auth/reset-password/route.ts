import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

    // Direct SQL Query via dbPool to prevent Prisma engine cache issues
    const sqlRes = await dbPool.query(
      `SELECT id, reset_password_code, reset_password_expires 
       FROM public.user_profiles 
       WHERE LOWER(email) = $1 LIMIT 1`,
      [trimmedEmail]
    );

    if (sqlRes.rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const dbUser = sqlRes.rows[0];
    const savedCode = dbUser.reset_password_code;
    const savedExpires = dbUser.reset_password_expires;

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

    await dbPool.query(
      `UPDATE public.user_profiles 
       SET password_hash = $1, reset_password_code = NULL, reset_password_expires = NULL, updated_at = NOW() 
       WHERE id = $2`,
      [passwordHash, dbUser.id]
    );

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
