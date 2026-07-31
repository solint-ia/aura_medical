import { NextResponse } from "next/server";
import { dbPool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Informe o e-mail e o código de 6 dígitos." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedCode = code.replace(/\D/g, "");

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
        { error: "Código de recuperação incorreto. Verifique seu e-mail." },
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

    return NextResponse.json({
      success: true,
      message: "Código de recuperação válido com sucesso!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao verificar código.";
    console.error("Erro verify-reset-code:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
