import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { sendMailerooEmail, renderAuraEmailTemplate } from "@/lib/maileroo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // 1. Generate 6-digit OTP Code
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    let userFound = false;

    try {
      const dbUser = await prisma.userProfile.findFirst({
        where: { email: trimmedEmail },
      });

      if (dbUser) {
        userFound = true;
        await prisma.userProfile.update({
          where: { id: dbUser.id },
          data: {
            verificationCode,
            verificationExpires: expiresAt,
          } as any,
        });
      }
    } catch (prismaErr) {
      console.warn("Prisma send-verification fallback dbPool:", prismaErr);

      const sqlRes = await dbPool.query(
        "SELECT id FROM public.user_profiles WHERE LOWER(email) = $1 LIMIT 1",
        [trimmedEmail]
      );

      if (sqlRes.rows.length > 0) {
        userFound = true;
        await dbPool.query(
          `UPDATE public.user_profiles 
           SET verification_code = $1, verification_expires = $2 
           WHERE id = $3`,
          [verificationCode, expiresAt.toISOString(), sqlRes.rows[0].id]
        );
      }
    }

    if (!userFound) {
      return NextResponse.json({ error: "E-mail não encontrado no sistema." }, { status: 404 });
    }

    // 2. Render Luxury HTML Email
    const html = renderAuraEmailTemplate({
      title: "Confirme seu E-mail de Cadastro",
      subtitle: `Olá! Digite o código de 6 dígitos abaixo na tela de cadastro para confirmar seu e-mail (${trimmedEmail}) e ativar sua conta na Aura Regenera.`,
      code: verificationCode,
      actionMessage: "Se você não solicitou este código, por favor ignore esta mensagem.",
    });

    // 3. Dispatch Email via Maileroo
    const mailResult = await sendMailerooEmail({
      to: trimmedEmail,
      subject: `Código de Verificação Aura: ${verificationCode}`,
      html,
    });

    return NextResponse.json({
      success: true,
      message: "Código de 6 dígitos enviado para seu e-mail com sucesso.",
      mailResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao enviar código de verificação.";
    console.error("Erro no envio de código de verificação:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
