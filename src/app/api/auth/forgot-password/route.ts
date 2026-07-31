import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { sendMailerooEmail, renderAuraEmailTemplate } from "@/lib/maileroo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Informe o e-mail cadastrado." }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // 1. Generate 6-digit Reset OTP Code
    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 2. Direct SQL Query via dbPool for guaranteed database update
    const sqlRes = await dbPool.query(
      "SELECT id FROM public.user_profiles WHERE LOWER(email) = $1 LIMIT 1",
      [trimmedEmail]
    );

    if (sqlRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta cadastrada com este e-mail." },
        { status: 404 }
      );
    }

    const userId = sqlRes.rows[0].id;
    await dbPool.query(
      `UPDATE public.user_profiles 
       SET reset_password_code = $1, reset_password_expires = $2 
       WHERE id = $3`,
      [resetCode, expiresAt.toISOString(), userId]
    );

    // 3. Render Luxury HTML Email
    const html = renderAuraEmailTemplate({
      title: "Redefinição de Senha Aura Regenera",
      subtitle: `Solicitação de redefinição de senha para a conta (${trimmedEmail}). Digite o código de 6 dígitos abaixo no site para cadastrar uma nova senha.`,
      code: resetCode,
      actionMessage: "Se você não solicitou a alteração de senha, altere seus dados de acesso imediatamente por segurança.",
    });

    // 4. Dispatch Email via Maileroo
    const mailResult = await sendMailerooEmail({
      to: trimmedEmail,
      subject: `Código de Redefinição de Senha Aura: ${resetCode}`,
      html,
    });

    return NextResponse.json({
      success: true,
      message: "Código de recuperação enviado para seu e-mail com sucesso.",
      mailResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao solicitar redefinição de senha.";
    console.error("Erro forgot-password:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
