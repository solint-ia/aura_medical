interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendMailerooEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.MAILEROO_API_KEY;

  if (!apiKey) {
    console.warn("MAILEROO_API_KEY não configurada no ambiente (.env.local).");
    return { success: false, error: "Chave Maileroo não configurada." };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("api_key", apiKey);
    formData.append("from", "contato@auraregenera.com");
    formData.append("from_name", "Aura Regenera");
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("html", html);

    const res = await fetch("https://smtp.maileroo.com/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-API-Key": apiKey,
      },
      body: formData.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      console.log("E-mail enviado com sucesso via Maileroo:", data);
      return { success: true, data };
    }

    console.error("Erro ao enviar e-mail via Maileroo API:", data);
    return { success: false, error: data.message || "Erro no envio via Maileroo." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Falha na conexão com a API do Maileroo.";
    console.error("Exceção ao disparar e-mail Maileroo:", err);
    return { success: false, error: errorMsg };
  }
}

interface TemplateParams {
  title: string;
  subtitle: string;
  code: string;
  actionMessage: string;
}

export function renderAuraEmailTemplate({ title, subtitle, code, actionMessage }: TemplateParams) {
  const logoUrl = "https://auraregenera.com/logos/logo-vertical-3.png";

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0B131F;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #E2E8F0;
        }
        .container {
          max-width: 580px;
          margin: 40px auto;
          background-color: #0D1B2A;
          border: 1px solid rgba(197, 157, 63, 0.25);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .header {
          padding: 40px 30px 20px 30px;
          text-align: center;
          background: linear-gradient(180deg, rgba(197, 157, 63, 0.12) 0%, rgba(13, 27, 42, 0) 100%);
        }
        .logo {
          max-height: 120px;
          width: auto;
          margin-bottom: 16px;
        }
        .body-content {
          padding: 20px 35px 40px 35px;
          text-align: center;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 10px 0;
          letter-spacing: -0.5px;
        }
        .subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0 0 30px 0;
          line-height: 1.6;
        }
        .code-box {
          background: rgba(197, 157, 63, 0.12);
          border: 1.5px solid #C59D3F;
          border-radius: 14px;
          padding: 20px 30px;
          margin: 25px 0;
          display: inline-block;
        }
        .code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 36px;
          font-weight: 800;
          color: #C59D3F;
          letter-spacing: 10px;
          margin: 0;
          text-shadow: 0 0 10px rgba(197, 157, 63, 0.3);
        }
        .code-expiration {
          font-size: 12px;
          color: #CBD5E1;
          margin-top: 8px;
          font-family: monospace;
        }
        .action-msg {
          font-size: 13px;
          color: #94A3B8;
          margin-top: 25px;
          line-height: 1.5;
        }
        .footer {
          padding: 25px 30px;
          background-color: #070E17;
          border-top: 1px solid rgba(255,255,255,0.08);
          text-align: center;
          font-size: 11px;
          color: #64748B;
          font-family: monospace;
        }
        .footer a {
          color: #C59D3F;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Aura Regenera" class="logo">
        </div>
        <div class="body-content">
          <h1 class="title">${title}</h1>
          <p class="subtitle">${subtitle}</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
            <div class="code-expiration">⏳ Válido por 10 minutos</div>
          </div>

          <p class="action-msg">${actionMessage}</p>
        </div>
        <div class="footer">
          <p>© 2026 Aura Regenera · Biotecnologia & Medicina Estética de Alta Performance</p>
          <p>Dúvidas? Entre em contato via <a href="mailto:contato@auraregenera.com">contato@auraregenera.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
