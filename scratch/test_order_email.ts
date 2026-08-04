process.env.MAILEROO_API_KEY = "2b7f29c0f3c8242e5f16294d04021b1f7fce34cac4b3db233db51e7a3dd834f3";

import { sendMailerooEmail, renderOrderSuccessEmailTemplate } from "../src/lib/maileroo";

async function main() {
  console.log("Iniciando teste de disparo de e-mail de compra...");
  
  const customerEmail = "andrefelipeiam@gmail.com";
  const storeEmail = "contato@auraregenera.com";
  const orderNumberStr = "AUR-2026-TESTE-CARTAO";

  const emailHtml = renderOrderSuccessEmailTemplate({
    customerName: "André Felipe",
    orderNumber: orderNumberStr,
    paymentMethod: "Cartão de Crédito (Mercado Pago)",
    shippingAddress: "Rua Teste, 123 - Centro, Aracaju/SE (CEP 49000-000)",
    items: [
      { name: "Protocolo de Teste Cartão", quantity: 1, unitPrice: 5.00 }
    ],
    subtotal: 5.00,
    shippingCost: 0,
    totalPrice: 5.00,
  });

  console.log(`1. Enviando e-mail de confirmação para o cliente: ${customerEmail}...`);
  const resClient = await sendMailerooEmail({
    to: customerEmail,
    subject: `✨ [TESTE] Compra Confirmada! Seu Pedido #${orderNumberStr} - Aura Regenera`,
    html: emailHtml,
  });
  console.log("Resultado Cliente:", resClient);

  console.log(`2. Enviando cópia do pedido para o e-mail da loja: ${storeEmail}...`);
  const resStore = await sendMailerooEmail({
    to: storeEmail,
    subject: `📋 [Cópia] Pedido #${orderNumberStr} confirmado - André Felipe`,
    html: emailHtml,
  });
  console.log("Resultado Loja:", resStore);
}

main().catch(console.error);
