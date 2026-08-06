import { sendMailerooEmail, renderOrderSuccessEmailTemplate, type OrderEmailItem } from "@/lib/maileroo";

const STORE_COPY_EMAIL = "contato@auraregenera.com";

export interface OrderConfirmationEmailParams {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  paymentMethod: string;
  shippingAddress: string;
  items: OrderEmailItem[];
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
}

/**
 * Só deve ser chamado quando o pagamento já está confirmado (cartão aprovado
 * pelo Mercado Pago, ou PIX com status "approved"). Nunca no momento em que
 * a cobrança é apenas criada/pendente.
 */
export async function sendOrderConfirmationEmail(params: OrderConfirmationEmailParams): Promise<void> {
  if (!params.customerEmail) return;

  try {
    const emailHtml = renderOrderSuccessEmailTemplate({
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      paymentMethod: params.paymentMethod,
      shippingAddress: params.shippingAddress,
      items: params.items,
      subtotal: params.subtotal,
      shippingCost: params.shippingCost,
      totalPrice: params.totalPrice,
    });

    await sendMailerooEmail({
      to: params.customerEmail,
      subject: `✨ Compra Confirmada! Seu Pedido #${params.orderNumber} - Aura Regenera`,
      html: emailHtml,
    });

    // Cópia interna para a Aura Medical acompanhar toda venda confirmada (PIX e cartão).
    if (params.customerEmail.toLowerCase() !== STORE_COPY_EMAIL) {
      await sendMailerooEmail({
        to: STORE_COPY_EMAIL,
        subject: `📋 [Cópia] Pedido #${params.orderNumber} confirmado - ${params.customerName}`,
        html: emailHtml,
      });
    }
  } catch (mailErr) {
    console.error("Erro ao enviar e-mail de confirmação de pedido:", mailErr);
  }
}
