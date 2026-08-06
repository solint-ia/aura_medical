import { NextResponse } from "next/server";
import { sendMailerooEmail, renderContactEmailTemplate } from "@/lib/maileroo";
import { validateEmail, validatePhone } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, message, protocolName } = body;

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "Por favor, preencha nome, e-mail e telefone." },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "E-mail com formato inválido." }, { status: 400 });
    }

    if (!validatePhone(phone)) {
      return NextResponse.json({ error: "Telefone/WhatsApp inválido." }, { status: 400 });
    }

    // Render Luxury HTML Contact Email
    const html = renderContactEmailTemplate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message ? message.trim() : "",
      protocolName: protocolName ? protocolName.trim() : "",
    });

    const subject = `[Fale Conosco] Novo Contato: ${name.trim()}${protocolName ? ` (${protocolName})` : ""}`;

    // 1. Send to Official Inbox: contato@auraregenera.com
    const sendPrimary = sendMailerooEmail({
      to: "contato@auraregenera.com",
      subject,
      html,
    });

    // 2. Send to Admin Preview Inbox: andrefelipeiam@gmail.com
    const sendPreview = sendMailerooEmail({
      to: "andrefelipeiam@gmail.com",
      subject,
      html,
    });

    const [resPrimary, resPreview] = await Promise.all([sendPrimary, sendPreview]);

    return NextResponse.json({
      success: true,
      message: "Sua mensagem foi enviada com sucesso!",
      results: {
        contato: resPrimary,
        preview: resPreview,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erro ao processar formulário de contato.";
    console.error("Erro na rota /api/contact:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
