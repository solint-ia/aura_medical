import { formatBRL } from "./format";

/**
 * Logo dos e-mails. Precisa ser URL absoluta, no domínio canônico (www) — o
 * apex responde 308 e nem todo cliente de e-mail segue redirect em <img>.
 * O arquivo precisa estar commitado em `public/logos/` e publicado em produção.
 */
export const EMAIL_LOGO_URL = "https://www.auraregenera.com/logos/logo-aura-horizontal.png";

/**
 * <img> do logo pronto para e-mail: dimensões em atributos HTML (Outlook ignora
 * classes CSS e `max-height`) e estilo inline (Gmail remove <style> em alguns
 * contextos, como a visualização mobile e o "mensagem cortada").
 */
function emailLogoImg(width = 200) {
  const height = Math.round((width * 248) / 860);
  return `<img src="${EMAIL_LOGO_URL}" alt="Aura Regenera" width="${width}" height="${height}" border="0" style="display: block; margin: 0 auto 16px auto; width: ${width}px; height: ${height}px; max-width: 100%; border: 0; outline: none; text-decoration: none;">`;
}

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
    formData.append("from", "Aura Regenera <nao-responda@auraregenera.com>");
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
      console.log(`E-mail enviado com sucesso via Maileroo para ${to}:`, data);
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
          ${emailLogoImg(210)}
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
          <p>Dúvidas? Entre em contato via <a href="mailto:contato@auraregenera.com">contato@auraregenera.com</a> ou <a href="https://wa.me/5579996809911" target="_blank" style="color: #25D366; text-decoration: none; font-weight: bold;">WhatsApp (79) 9 96809911</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

interface ContactTemplateParams {
  name: string;
  email: string;
  phone: string;
  message?: string;
  protocolName?: string;
}

export function renderContactEmailTemplate({ name, email, phone, message, protocolName }: ContactTemplateParams) {
  const cleanPhone = phone.replace(/\D/g, "");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Novo Contato - Fale Conosco</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0B131F;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #E2E8F0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #0D1B2A;
          border: 1px solid rgba(197, 157, 63, 0.3);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .header {
          padding: 40px 30px 20px 30px;
          text-align: center;
          background: linear-gradient(180deg, rgba(197, 157, 63, 0.15) 0%, rgba(13, 27, 42, 0) 100%);
        }
        .badge {
          display: inline-block;
          background-color: rgba(197, 157, 63, 0.15);
          color: #C59D3F;
          border: 1px solid rgba(197, 157, 63, 0.4);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 6px 14px;
          border-radius: 20px;
          margin-bottom: 12px;
        }
        .body-content {
          padding: 20px 35px 40px 35px;
        }
        .title {
          font-size: 22px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 8px 0;
          text-align: center;
        }
        .subtitle {
          font-size: 13.5px;
          color: #94A3B8;
          margin: 0 0 25px 0;
          text-align: center;
          line-height: 1.5;
        }
        .info-card {
          background-color: #112236;
          border-left: 4px solid #C59D3F;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 24px;
        }
        .info-row {
          margin-bottom: 14px;
          font-size: 14px;
          line-height: 1.5;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .label {
          color: #94A3B8;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 3px;
          font-weight: 600;
        }
        .value {
          color: #FFFFFF;
          font-weight: 600;
        }
        .value a {
          color: #C59D3F;
          text-decoration: none;
        }
        .message-box {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 18px 22px;
          margin-bottom: 30px;
        }
        .message-title {
          font-size: 12px;
          color: #C59D3F;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .message-text {
          font-size: 14px;
          color: #E2E8F0;
          line-height: 1.6;
          white-space: pre-wrap;
          margin: 0;
        }
        .actions {
          text-align: center;
          margin-top: 25px;
        }
        .btn-mail {
          background-color: #C59D3F;
          color: #0D1B2A !important;
          padding: 13px 24px;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13.5px;
          display: inline-block;
          margin-right: 10px;
          margin-bottom: 10px;
          box-shadow: 0 4px 12px rgba(197, 157, 63, 0.3);
        }
        .btn-wa {
          background-color: #25D366;
          color: #FFFFFF !important;
          padding: 13px 24px;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13.5px;
          display: inline-block;
          margin-bottom: 10px;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
        }
        .footer {
          padding: 22px 30px;
          background-color: #070E17;
          border-top: 1px solid rgba(255,255,255,0.08);
          text-align: center;
          font-size: 11px;
          color: #64748B;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${emailLogoImg(200)}
          <span class="badge">Atendimento &amp; Suporte</span>
        </div>
        <div class="body-content">
          <h1 class="title">Novo Contato - Fale Conosco</h1>
          <p class="subtitle">Um cliente enviou uma mensagem através do formulário de contato do site Aura Regenera.</p>

          <div class="info-card">
            <div class="info-row">
              <span class="label">👤 Nome Completo</span>
              <span class="value">${name}</span>
            </div>
            <div class="info-row">
              <span class="label">✉️ E-mail</span>
              <span class="value"><a href="mailto:${email}">${email}</a></span>
            </div>
            <div class="info-row">
              <span class="label">📱 WhatsApp / Telefone</span>
              <span class="value"><a href="https://wa.me/55${cleanPhone}">${phone}</a></span>
            </div>
            ${protocolName
      ? `
            <div class="info-row">
              <span class="label">🧬 Protocolo de Interesse</span>
              <span class="value" style="color: #C59D3F;">${protocolName}</span>
            </div>
            `
      : ""
    }
          </div>

          <div class="message-box">
            <div class="message-title">💬 Como podemos ajudar? (Mensagem)</div>
            <p class="message-text">${message ? message.trim() : "Nenhuma mensagem adicional preenchida."}</p>
          </div>

          <div class="actions">
            <a href="mailto:${email}" class="btn-mail">✉️ Responder por E-mail</a>
            ${cleanPhone
      ? `<a href="https://wa.me/55${cleanPhone}" class="btn-wa">💬 Chamar no WhatsApp</a>`
      : ""
    }
          </div>
        </div>
        <div class="footer">
          <p>© 2026 Aura Regenera · Formato Oficial de Atendimento ao Cliente</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  imagePath?: string;
}

export interface OrderSuccessTemplateParams {
  customerName: string;
  orderNumber: string;
  paymentMethod: string;
  shippingAddress: string;
  items: OrderEmailItem[];
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
}

export function renderOrderSuccessEmailTemplate({
  customerName,
  orderNumber,
  paymentMethod,
  shippingAddress,
  items,
  subtotal,
  shippingCost,
  totalPrice,
}: OrderSuccessTemplateParams) {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 14px; font-weight: 600; color: #FFFFFF;">
        ${item.name}
      </td>
      <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 14px; color: #C59D3F; font-family: monospace; text-align: center;">
        ${item.quantity}x
      </td>
      <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: monospace; text-align: right;">
        ${formatBRL(item.unitPrice * item.quantity)}
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido #${orderNumber} Confirmado - Aura Regenera</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0B131F;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #E2E8F0;
        }
        .container {
          max-width: 620px;
          margin: 30px auto;
          background-color: #0D1B2A;
          border: 1px solid rgba(197, 157, 63, 0.3);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .header {
          padding: 35px 30px 20px 30px;
          text-align: center;
          background: linear-gradient(180deg, rgba(197, 157, 63, 0.15) 0%, rgba(13, 27, 42, 0) 100%);
        }
        .badge {
          display: inline-block;
          background-color: rgba(16, 185, 129, 0.15);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.4);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 6px 16px;
          border-radius: 20px;
          margin-bottom: 12px;
        }
        .body-content {
          padding: 20px 35px 40px 35px;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 8px 0;
          text-align: center;
        }
        .order-code {
          font-family: monospace;
          font-size: 14px;
          font-weight: 700;
          color: #C59D3F;
          text-align: center;
          margin-bottom: 20px;
        }
        .positive-message {
          background-color: rgba(197, 157, 63, 0.08);
          border: 1px dashed rgba(197, 157, 63, 0.35);
          border-radius: 14px;
          padding: 18px 22px;
          font-size: 14px;
          color: #E2E8F0;
          line-height: 1.6;
          text-align: center;
          margin-bottom: 28px;
        }
        .info-card {
          background-color: #112236;
          border-left: 4px solid #C59D3F;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 25px;
        }
        .info-row {
          margin-bottom: 12px;
          font-size: 13.5px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .label {
          color: #94A3B8;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 2px;
          font-weight: 600;
        }
        .value {
          color: #FFFFFF;
          font-weight: 600;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          background-color: rgba(255,255,255,0.02);
          border-radius: 12px;
          overflow: hidden;
        }
        .items-table th {
          background-color: rgba(197, 157, 63, 0.12);
          color: #C59D3F;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px;
          text-align: left;
        }
        .summary-box {
          background-color: #070E17;
          border-radius: 12px;
          padding: 18px 24px;
          margin-bottom: 30px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          margin-bottom: 8px;
          color: #94A3B8;
        }
        .summary-row.total {
          font-size: 16px;
          font-weight: 700;
          color: #FFFFFF;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 10px;
          margin-top: 10px;
          margin-bottom: 0;
        }
        .actions {
          text-align: center;
          margin-top: 30px;
        }
        .btn-account {
          background-color: #C59D3F;
          color: #0D1B2A !important;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(197, 157, 63, 0.35);
        }
        .footer {
          padding: 22px 30px;
          background-color: #070E17;
          border-top: 1px solid rgba(255,255,255,0.08);
          text-align: center;
          font-size: 11px;
          color: #64748B;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${emailLogoImg(200)}
          <span class="badge">✓ Compra Confirmada</span>
        </div>
        <div class="body-content">
          <h1 class="title">Pedido Confirmado!</h1>

          <div class="positive-message">
            ✨ <strong>Parabéns por escolher a excelência em biotecnologia estética!</strong><br>
            Seu pedido foi registrado com sucesso e nossa equipe já está preparando o envio dos seus bioregenerativos recombinantes.
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="label">👤 Cliente</span>
              <span class="value">${customerName}</span>
            </div>
            <div class="info-row">
              <span class="label">💳 Forma de Pagamento</span>
              <span class="value" style="color: #C59D3F;">${paymentMethod}</span>
            </div>
            <div class="info-row">
              <span class="label">📍 Endereço de Entrega</span>
              <span class="value">${shippingAddress}</span>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th style="text-align: center;">Qtd</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span style="font-family: monospace;">${formatBRL(subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Frete:</span>
              <span style="font-family: monospace;">${shippingCost === 0 ? "GRÁTIS" : formatBRL(shippingCost)}</span>
            </div>
            <div class="summary-row total">
              <span>Total Pago:</span>
              <span style="font-family: monospace; color: #C59D3F;">${formatBRL(totalPrice)}</span>
            </div>
          </div>

          <div class="actions">
            <a href="https://auraregenera.com/minha-conta" class="btn-account">📦 Acompanhar Pedido na Minha Conta →</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 Aura Regenera · Biotecnologia & Medicina Estética de Alta Performance</p>
          <p>Dúvidas? Fale conosco via <a href="mailto:contato@auraregenera.com" style="color: #C59D3F; text-decoration: none;">contato@auraregenera.com</a> ou <a href="https://wa.me/5579996809911" target="_blank" style="color: #25D366; text-decoration: none; font-weight: bold;">WhatsApp (79) 9 96809911</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface ShippingUpdateTemplateParams {
  customerName: string;
  orderNumber: string;
  trackingCode: string;
  status: string;
  shippingAddress: string;
}

const SHIPPING_STATUS_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  pendente: { label: "Pedido Pendente", emoji: "⏳", color: "#F59E0B" },
  pago: { label: "Pagamento Confirmado", emoji: "✓", color: "#10B981" },
  em_separacao: { label: "Em Separação", emoji: "🏬", color: "#F59E0B" },
  em_transporte: { label: "Em Transporte", emoji: "🚚", color: "#3B82F6" },
  entregue: { label: "Entregue", emoji: "📦", color: "#10B981" },
  cancelado: { label: "Cancelado", emoji: "❌", color: "#EF4444" },
};

export function renderShippingUpdateEmailTemplate({
  customerName,
  orderNumber,
  trackingCode,
  status,
  shippingAddress,
}: ShippingUpdateTemplateParams) {
  const statusInfo = SHIPPING_STATUS_INFO[status] || SHIPPING_STATUS_INFO.em_transporte;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido #${orderNumber} - Atualização de Transporte</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0B131F;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #E2E8F0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background-color: #0D1B2A;
          border: 1px solid rgba(197, 157, 63, 0.3);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .header {
          padding: 35px 30px 20px 30px;
          text-align: center;
          background: linear-gradient(180deg, rgba(197, 157, 63, 0.15) 0%, rgba(13, 27, 42, 0) 100%);
        }
        .badge {
          display: inline-block;
          background-color: ${statusInfo.color}22;
          color: ${statusInfo.color};
          border: 1px solid ${statusInfo.color}66;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 6px 16px;
          border-radius: 20px;
          margin-bottom: 12px;
        }
        .body-content {
          padding: 20px 35px 40px 35px;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 8px 0;
          text-align: center;
        }
        .subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0 0 28px 0;
          text-align: center;
          line-height: 1.6;
        }
        .code-box {
          background: rgba(197, 157, 63, 0.12);
          border: 1.5px solid #C59D3F;
          border-radius: 14px;
          padding: 18px 24px;
          margin: 0 0 28px 0;
          text-align: center;
        }
        .code-label {
          margin: 0 0 6px 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94A3B8;
        }
        .code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 26px;
          font-weight: 800;
          color: #C59D3F;
          letter-spacing: 4px;
          margin: 0;
          text-shadow: 0 0 10px rgba(197, 157, 63, 0.3);
        }
        .info-card {
          background-color: #112236;
          border-left: 4px solid #C59D3F;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 25px;
        }
        .info-row {
          margin-bottom: 12px;
          font-size: 13.5px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .label {
          color: #94A3B8;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 2px;
          font-weight: 600;
        }
        .value {
          color: #FFFFFF;
          font-weight: 600;
        }
        .actions {
          text-align: center;
          margin-top: 10px;
        }
        .btn-account {
          background-color: #C59D3F;
          color: #0D1B2A !important;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(197, 157, 63, 0.35);
        }
        .footer {
          padding: 22px 30px;
          background-color: #070E17;
          border-top: 1px solid rgba(255,255,255,0.08);
          text-align: center;
          font-size: 11px;
          color: #64748B;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${emailLogoImg(200)}
          <span class="badge">${statusInfo.emoji} ${statusInfo.label}</span>
        </div>
        <div class="body-content">
          <h1 class="title">Seu Pedido Está a Caminho!</h1>
          <p class="subtitle">
            Atualizamos o status de transporte do seu pedido <strong style="color: #C59D3F;">#${orderNumber}</strong>.
            Use o código abaixo para acompanhar a entrega junto à transportadora.
          </p>

          <div class="code-box">
            <p class="code-label">Código de Rastreio</p>
            <p class="code">${trackingCode}</p>
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="label">👤 Cliente</span>
              <span class="value">${customerName}</span>
            </div>
            <div class="info-row">
              <span class="label">📍 Endereço de Entrega</span>
              <span class="value">${shippingAddress}</span>
            </div>
          </div>

          <div class="actions">
            <a href="https://auraregenera.com/minha-conta" class="btn-account">📦 Acompanhar Pedido na Minha Conta →</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 Aura Regenera · Biotecnologia & Medicina Estética de Alta Performance</p>
          <p>Dúvidas? Fale conosco via <a href="mailto:contato@auraregenera.com" style="color: #C59D3F; text-decoration: none;">contato@auraregenera.com</a> ou <a href="https://wa.me/5579996809911" target="_blank" style="color: #25D366; text-decoration: none; font-weight: bold;">WhatsApp (79) 9 96809911</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
