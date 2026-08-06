"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  MapPin,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
} from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CardBrandBadge } from "@/components/ui/CardBrandBadge";
import { UserAddress, useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";
import {
  detectCardBrand,
  detectCardBrandOrNull,
  formatCardNumber,
  formatCep,
  formatCpf,
  formatCpfOrCnpj,
  formatPhone,
  validateCardExpiry,
  validateCardNumber,
  validateCpf,
} from "@/lib/validators";

type Step = 1 | 2; // Step 1: Endereço & Frete | Step 2: Pagamento & Revisão
type PaymentMethod = "card" | "pix" | null;

interface CardForm {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
  cpf: string;
  installments: number;
}

interface FormErrors {
  paymentMethod?: string;
  cardName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardCpf?: string;
}

const MP_INSTALLMENT_FACTORS: Record<number, number> = {
  1: 1.0,
  2: 1.0459,
  3: 1.0597,
  4: 1.0737,
  5: 1.0880,
  6: 1.1025,
  7: 1.1173,
  8: 1.1323,
  9: 1.1476,
  10: 1.1632,
};

function formatInstallmentText(num: number, totalPrice: number): string {
  if (num === 1) {
    return `1x de ${formatBRL(totalPrice)} à vista (sem juros)`;
  }
  const factor = MP_INSTALLMENT_FACTORS[num] || (1.0 + num * 0.015);
  const totalWithInterest = totalPrice * factor;
  const installmentValue = totalWithInterest / num;
  return `${num}x de ${formatBRL(installmentValue)} (Total: ${formatBRL(totalWithInterest)})`;
}

interface ShippingOption {
  id: number | string;
  name: string;
  price: number;
  deliveryTime: number;
  company: string;
  logo?: string;
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function CheckoutContent() {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated } = useCart();
  const { user, addresses, selectedAddress, setSelectedAddress, createOrder } = useAuth();

  const [step, setStep] = useState<Step>(1);

  const [card, setCard] = useState<CardForm>({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
    cpf: "",
    installments: 1,
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  /** `status_detail` da recusa do Mercado Pago, para orientar o usuário por caso. */
  const [paymentErrorDetail, setPaymentErrorDetail] = useState("");
  const [pixData, setPixData] = useState<{
    paymentId: string;
    qrCode: string;
    qrCodeBase64?: string;
  } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  /**
   * Snapshot dos dados do pedido PIX, capturado ANTES do `clearCart()`, para
   * poder notificar o cliente por e-mail só quando o pagamento for confirmado
   * (o carrinho já estará vazio nesse momento).
   */
  const [pixEmailPayload, setPixEmailPayload] = useState<{
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    paymentMethod: string;
    shippingAddress: string;
    items: { name: string; quantity: number; unitPrice: number }[];
    subtotal: number;
    shippingCost: number;
    totalPrice: number;
  } | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState("");
  const [submittedOrderSummary, setSubmittedOrderSummary] = useState<{
    total: number;
    itemsCount: number;
    shippingCost: number;
    shippingName: string;
  }>({ total: 0, itemsCount: 0, shippingCost: 0, shippingName: "Frete Padrão" });

  // Real-time PIX Payment Status Polling via /api/payment/status
  useEffect(() => {
    if (!isSubmitted || paymentMethod !== "pix" || !pixData?.paymentId || pixPaid) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?paymentId=${pixData.paymentId}`);
        const data = await res.json();
        if (data.success && data.status === "approved") {
          setPixPaid(true);
          clearInterval(interval);

          // Pagamento confirmado agora: só aqui o cliente deve ser notificado
          // por e-mail. O carrinho já foi limpo, por isso usamos o snapshot
          // capturado em handleFinalizeOrder antes do clearCart().
          if (pixEmailPayload) {
            fetch("/api/payment/confirm-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId: pixData.paymentId, ...pixEmailPayload }),
            }).catch((mailErr) => console.warn("Aviso ao confirmar e-mail de pagamento PIX:", mailErr));
          }
        }
      } catch (err) {
        console.warn("Aviso ao checar status do PIX:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isSubmitted, paymentMethod, pixData, pixPaid, pixEmailPayload]);

  // Dynamic Shipping Calculation via /api/frete/calcular
  // TEMPORARIAMENTE DESATIVADO: Melhor Envio ainda em modo sandbox (sem credenciais
  // de produção). Frete grátis para todos os protocolos enquanto isso. O código real
  // de cálculo fica comentado abaixo pronto para reativar.
  const fetchShippingRates = useCallback(async (cleanCep: string, currentItems: typeof items) => {
    if (cleanCep.length !== 8) return;

    const freeShipping: ShippingOption = {
      id: "frete-gratis",
      name: "Frete Grátis",
      price: 0,
      deliveryTime: 7,
      company: "Aura Regenera",
      logo: "",
    };
    setShippingOptions([freeShipping]);
    setSelectedShippingOption(freeShipping);

    /* ---- Cálculo real via Melhor Envio (reativar quando houver credenciais de produção) ----
    setShippingLoading(true);

    try {
      const res = await fetch("/api/frete/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationCep: cleanCep,
          items: currentItems.map((i) => ({ id: i.id, quantity: i.quantity, price: i.unitPrice })),
        }),
      });

      const data = await res.json();
      if (data.options && Array.isArray(data.options) && data.options.length > 0) {
        setShippingOptions(data.options);
        setSelectedShippingOption(data.options[0]);
      }
    } catch (err) {
      console.error("Erro ao calcular frete dinâmico:", err);
    } finally {
      setShippingLoading(false);
    }
    */
  }, []);

  // Calculate freight when selectedAddress changes
  useEffect(() => {
    if (selectedAddress?.cep) {
      const cleanCep = selectedAddress.cep.replace(/\D/g, "");
      fetchShippingRates(cleanCep, items);
    }
  }, [selectedAddress, items, fetchShippingRates]);

  // Shipping Fee & Total Calculation
  // TEMPORARIAMENTE: frete grátis para todos os protocolos (Melhor Envio desativado, ver acima).
  // Lógica original de precificação preservada em comentário para reativação futura.
  const shippingCost = 0;
  /*
  const hasTestProtocol = items.some((i) => i.id === "teste-pix" || i.id === "teste-cartao");
  const shippingCost = items.length === 0
    ? 0
    : hasTestProtocol
      ? (selectedShippingOption ? selectedShippingOption.price : 0)
      : selectedShippingOption
        ? selectedShippingOption.price
        : 25;
  */

  const orderTotalBeforeDiscount = subtotal + shippingCost;
  /** Incentivo para pagamento à vista: 5% de desconto no valor total pago via Pix. */
  const PIX_DISCOUNT_RATE = 0.05;
  const pixDiscountAmount = orderTotalBeforeDiscount * PIX_DISCOUNT_RATE;
  const totalPrice =
    paymentMethod === "pix" ? orderTotalBeforeDiscount - pixDiscountAmount : orderTotalBeforeDiscount;

  // Step 1 Validation: Must have a selected address
  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) {
      alert("Selecione um endereço cadastrado para entrega antes de prosseguir.");
      return;
    }
    setStep(2);
  };

  // Finalize Order via Mercado Pago
  const handleFinalizeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");
    setPaymentErrorDetail("");
    const newErrors: FormErrors = {};

    if (!paymentMethod) {
      newErrors.paymentMethod = "Selecione uma forma de pagamento.";
    }

    if (paymentMethod === "card") {
      if (!card.name.trim()) newErrors.cardName = "Nome impresso no cartão é obrigatório.";

      if (!validateCardNumber(card.number)) {
        newErrors.cardNumber = "Número do cartão inválido. Verifique os dígitos.";
      }

      if (!validateCardExpiry(card.expiry)) {
        newErrors.cardExpiry = "Validade inválida ou cartão vencido (MM/AA).";
      }

      const cardBrand = detectCardBrand(card.number);
      const expectedCvvLength = cardBrand === "amex" ? 4 : 3;
      if (card.cvv.replace(/\D/g, "").length !== expectedCvvLength) {
        newErrors.cardCvv = `CVV inválido (deve ter ${expectedCvvLength} dígitos).`;
      }

      const cardCpfDigits = card.cpf.replace(/\D/g, "");
      if (!cardCpfDigits) {
        newErrors.cardCpf = "CPF do titular é obrigatório.";
      } else if (!validateCpf(cardCpfDigits)) {
        newErrors.cardCpf = "CPF do titular inválido. Verifique os dígitos.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedAddress) {
      alert("Selecione um endereço para a entrega.");
      return;
    }

    setProcessingPayment(true);

    try {
      const orderNumber = `AUR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const deviceId =
        (window as unknown as { MP_DEVICE_SESSION_ID?: string }).MP_DEVICE_SESSION_ID ||
        (document.getElementById("deviceId") as HTMLInputElement)?.value ||
        "";

      // 1. Call Mercado Pago Process Payment API FIRST
      const payRes = await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          amount: totalPrice,
          subtotal,
          shippingCost,
          description: `Aura Regenera - Pedido #${orderNumber}`,
          orderNumber,
          deviceId,
          payer: {
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            cpfCnpj: user?.cpfCnpj,
            phone: user?.phone,
          },
          address: selectedAddress,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            imagePath: i.imagePath,
          })),
          cardData: paymentMethod === "card" ? {
            number: card.number,
            holderName: card.name,
            expiry: card.expiry,
            cvv: card.cvv,
            cpf: card.cpf,
            installments: card.installments,
          } : undefined,
        }),
      });

      const payData = await payRes.json();
      setProcessingPayment(false);

      if (!payData.success) {
        setPaymentErrorDetail(payData.statusDetail || "");
        setPaymentError(payData.error || "Recusado pelo Mercado Pago. Verifique os dados.");
        return; // Payment failed or rejected! Do NOT create order, items remain in cart!
      }

      // 2. Payment succeeded! NOW create the order in DB & user's order history
      const created = await createOrder({
        address: selectedAddress,
        shippingMethod: selectedShippingOption ? selectedShippingOption.name : "Frete Padrão",
        shippingCost,
        subtotal,
        totalPrice,
        paymentMethod: paymentMethod === "pix" ? "pix" : "credito",
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          imagePath: i.imagePath,
        })),
        orderNumber,
      });

      const finalOrderNumber = created?.orderNumber || orderNumber;
      const shippingName = selectedShippingOption
        ? selectedShippingOption.name
        : "Frete Padrão";

      setSubmittedOrderNumber(finalOrderNumber);
      setSubmittedOrderSummary({
        total: totalPrice,
        itemsCount: items.reduce((s, i) => s + i.quantity, 0),
        shippingCost,
        shippingName,
      });

      if (paymentMethod === "pix" && payData.qrCode) {
        setPixData({
          paymentId: String(payData.paymentId),
          qrCode: payData.qrCode,
          qrCodeBase64: payData.qrCodeBase64,
        });

        // Snapshot para o e-mail de confirmação, disparado só quando o
        // polling acima detectar o pagamento aprovado (carrinho já estará vazio).
        const cepDigits = selectedAddress.cep.replace(/\D/g, "");
        setPixEmailPayload({
          customerName: `${user?.firstName || "Cliente"} ${user?.lastName || "Aura"}`.trim(),
          customerEmail: user?.email || "",
          orderNumber: finalOrderNumber,
          paymentMethod: "PIX à Vista (Mercado Pago)",
          shippingAddress: `${selectedAddress.street}, ${selectedAddress.number} ${selectedAddress.complement ? `- ${selectedAddress.complement}` : ""} - ${selectedAddress.neighborhood}, ${selectedAddress.city}/${selectedAddress.uf} (CEP ${cepDigits})`.trim(),
          items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
          subtotal,
          shippingCost,
          totalPrice,
        });
      }

      setIsSubmitted(true);
      clearCart();
    } catch {
      setProcessingPayment(false);
      setPaymentError("Erro de comunicação ao processar pagamento com o Mercado Pago.");
    }
  };

  // Recusa por antifraude do emissor: nova tentativa com o MESMO cartão tende a
  // ser recusada igual, então a UI orienta trocar de cartão ou pagar via Pix.
  const isHighRiskRejection = paymentErrorDetail === "cc_rejected_high_risk";

  const handleSwitchToPix = () => {
    setPaymentMethod("pix");
    setErrors((prev) => ({ ...prev, paymentMethod: "" }));
    setPaymentError("");
    setPaymentErrorDetail("");
  };

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border px-3.5 py-3 text-sm transition-colors outline-none ${hasError
      ? "border-red-500 bg-red-500/5 text-red-900 dark:text-red-200 focus:border-red-600"
      : "border-content/18 bg-canvas dark:bg-card text-content focus:border-[#C59D3F]"
    }`;

  if (!isHydrated) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-4xl flex-col items-center justify-center px-4 text-center font-mono text-sm text-content/60">
        Carregando informações do checkout...
      </div>
    );
  }

  // 1. RULE: USER MUST BE LOGGED IN TO COMPLIANT WITH CHECKOUT
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#C59D3F]/15 text-[#C59D3F]">
          <User className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-content mb-2">
          Login Necessário para Finalizar a Compra
        </h1>
        <p className="text-sm text-content/75 mb-6 max-w-md mx-auto">
          Para garantir a entrega correta e emitir sua nota fiscal, entre na sua conta ou crie um cadastro rápido antes de acessar o checkout.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/entrar"
            className="rounded-xl bg-[#C59D3F] px-8 py-3.5 font-bold text-xs text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
          >
            Entrar na Conta ou Criar Cadastro →
          </Link>
        </div>
      </div>
    );
  }

  // REDIRECT IF CART IS EMPTY (AND NOT YET SUBMITTED)
  if (items.length === 0 && !isSubmitted) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#C59D3F]/15 text-[#C59D3F]">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold text-content mb-3">
          Seu carrinho está vazio
        </h1>
        <p className="text-base text-content/75 mb-8 max-w-md mx-auto">
          Adicione ao menos um protocolo enzimático ao seu carrinho antes de acessar o checkout.
        </p>
        <Link
          href="/carrinho"
          className="inline-flex items-center gap-2 rounded-lg bg-[#C59D3F] px-8 py-3.5 text-base font-semibold text-[#0D1B2A] transition-colors hover:bg-[#d4ac4c]"
        >
          Ir para o Carrinho
        </Link>
      </div>
    );
  }

  // ORDER CONFIRMED STATE
  if (isSubmitted) {
    const shippingName = selectedShippingOption
      ? selectedShippingOption.name
      : "Frete Padrão";

    const isPixPending = paymentMethod === "pix" && !pixPaid;

    return (
      <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-4 py-8 text-center">
        <Image
          src="/logos/AR-LIGHT.png"
          alt="Aura Regenera"
          width={220}
          height={64}
          className="block dark:hidden h-12 w-auto object-contain"
        />
        <Image
          src="/logos/AR-DARK.png"
          alt="Aura Regenera"
          width={220}
          height={64}
          className="hidden dark:block h-12 w-auto object-contain"
        />
        <div className="mx-auto mt-6 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#C59D3F]/20 text-[#C59D3F]">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold text-content mb-1">
          {paymentMethod === "pix"
            ? pixPaid
              ? "🎉 Pagamento PIX Confirmado com Sucesso!"
              : "Pedido Registrado — Pagamento via PIX"
            : "🎉 Pedido Confirmado com Sucesso!"}
        </h1>
        <p className="font-mono text-sm font-bold text-[#C59D3F] mb-4">
          Código do Pedido: {submittedOrderNumber}
        </p>
        <p className="text-base text-content/75 mb-6">
          Obrigado, <strong className="text-content">{user.firstName} {user.lastName}</strong>. Seu pedido de{" "}
          <strong className="text-[#C59D3F]">{submittedOrderSummary.itemsCount} kit(s)</strong> foi registrado em nosso sistema.
        </p>

        {/* CARD APPROVED BANNER */}
        {paymentMethod === "card" && (
          <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-6 text-center text-xs font-mono text-emerald-700 dark:text-emerald-300 space-y-1">
            <p>✓ Pagamento via Cartão de Crédito aprovado e confirmado pelo Mercado Pago.</p>
            <p className="text-[11px] text-content/75">📩 Enviamos os detalhes resumidos da compra para o seu e-mail (<strong>{user.email}</strong>).</p>
          </div>
        )}

        {/* PIX CONFIRMED SUCCESS BANNER */}
        {paymentMethod === "pix" && pixPaid && (
          <div className="w-full rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 p-6 mb-8 text-center space-y-3 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xl shadow-md">
              ✓
            </div>
            <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-300">
              Pagamento PIX Identificado com Sucesso!
            </h3>
            <p className="text-xs text-content/80 font-mono">
              O seu pagamento via PIX no valor de <strong>{formatBRL(submittedOrderSummary.total)}</strong> foi confirmado pelo Mercado Pago. Seu pedido foi encaminhado para a equipe comercial!
            </p>
            <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-semibold pt-1">
              📩 Enviamos os detalhes resumidos da compra para o seu e-mail (<strong>{user.email}</strong>).
            </p>
          </div>
        )}

        {/* PIX QR CODE & COPIA E COLA SECTION (PENDING STATE) */}
        {isPixPending && pixData && (
          <div className="w-full rounded-2xl border-2 border-[#C59D3F] bg-card p-6 mb-8 text-center space-y-4 shadow-xl">
            <span className="inline-block rounded-full bg-emerald-500/15 px-3.5 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ⚡ QR Code PIX Mercado Pago Gerado com Sucesso
            </span>
            <p className="text-xs text-content/80 font-mono">
              Escaneie o QR Code abaixo com o aplicativo do seu banco para concluir o pagamento de <strong>{formatBRL(submittedOrderSummary.total)}</strong>:
            </p>

            {pixData.qrCodeBase64 ? (
              <div className="mx-auto flex justify-center py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code PIX Mercado Pago"
                  className="h-48 w-48 rounded-xl border border-content/20 bg-white p-2 shadow-md"
                />
              </div>
            ) : (
              <div className="mx-auto flex justify-center py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixData.qrCode)}`}
                  alt="QR Code PIX Escaneável"
                  className="h-48 w-48 rounded-xl border border-content/20 bg-white p-2 shadow-md"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block font-mono text-xs font-bold uppercase text-content/70">
                Código PIX Copia e Cola:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.qrCode}
                  className="w-full rounded-xl border border-content/20 bg-canvas px-3.5 py-2.5 font-mono text-xs text-content select-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pixData.qrCode);
                    setPixCopied(true);
                    setTimeout(() => setPixCopied(false), 3000);
                  }}
                  className="shrink-0 rounded-xl bg-[#C59D3F] px-4 py-2.5 font-mono text-xs font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-sm active:scale-[0.98]"
                >
                  {pixCopied ? "✓ Copiado!" : "📋 Copiar PIX"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 font-mono text-xs text-[#C59D3F] pt-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C59D3F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C59D3F]"></span>
              </span>
              Aguardando confirmação do pagamento em tempo real...
            </div>
          </div>
        )}

        {selectedAddress && (
          <div className="w-full rounded-xl border border-content/12 bg-card p-6 text-left mb-8 space-y-2 font-mono text-sm text-content/80">
            <p>📍 <strong className="text-content">Entrega:</strong> {selectedAddress.street}, {selectedAddress.number} {selectedAddress.complement} - {selectedAddress.city}</p>
            <p>🚚 <strong className="text-content">Frete:</strong> {submittedOrderSummary.shippingName} ({submittedOrderSummary.shippingCost === 0 ? "GRÁTIS / R$ 0,00" : formatBRL(submittedOrderSummary.shippingCost)})</p>
            <p>💳 <strong className="text-content">Pagamento:</strong> {paymentMethod === "pix" ? "PIX à vista (Mercado Pago)" : "Cartão de Crédito (Mercado Pago)"}</p>
            <p>💰 <strong className="text-content">Valor Total:</strong> {formatBRL(submittedOrderSummary.total)}</p>
          </div>
        )}

        <p className="text-sm text-content/60 mb-8">
          Nosso time comercial entrará em contato via WhatsApp ({formatPhone(user.phone)}) para confirmação de entrega e emissão de nota fiscal.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/minha-conta"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C59D3F] px-8 py-3.5 font-semibold text-[#0D1B2A] transition-colors hover:bg-[#d4ac4c] shadow-md"
          >
            Ver Pedido na Minha Conta →
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-content/20 bg-canvas px-6 py-3.5 font-semibold text-content hover:bg-content/5"
          >
            Voltar à Página Principal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-[clamp(20px,4vw,56px)] py-10">
      {/* Top Actions Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
        <button
          type="button"
          onClick={() => router.push("/carrinho")}
          className="inline-flex items-center gap-2 font-mono text-xs font-medium text-content/60 hover:text-accent uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Carrinho</span>
        </button>

        <span className="rounded-full border border-content/15 bg-card px-3.5 py-1 font-mono text-xs text-content/75 shadow-xs">
          {items.reduce((s, i) => s + i.quantity, 0)} item(ns) no carrinho
        </span>
      </div>

      {/* Stepper Header (Passo 1: Endereço & Frete | Passo 2: Pagamento & Revisão) */}
      <div className="mb-8 flex items-center justify-between border-b border-content/12 pb-4 font-mono text-xs uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 font-bold transition-colors ${step === 1 ? "text-[#C59D3F]" : "text-content/60 hover:text-content"
            }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step === 1 ? "bg-[#C59D3F] text-[#0D1B2A]" : "bg-[#C59D3F]/20 text-[#C59D3F]"
              }`}
          >
            1
          </span>
          <span>1. Endereço de Entrega & Frete</span>
        </button>

        <span className="text-content/30">➔</span>

        <button
          type="button"
          onClick={() => {
            if (selectedAddress) setStep(2);
          }}
          className={`flex items-center gap-2 font-bold transition-colors ${step === 2 ? "text-[#C59D3F]" : "text-content/40"
            }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step === 2 ? "bg-[#C59D3F] text-[#0D1B2A]" : "bg-content/10 text-content/50"
              }`}
          >
            2
          </span>
          <span>2. Pagamento & Confirmação</span>
        </button>
      </div>

      {/* STEP 1: DADOS READONLY + SELEÇÃO DE ENDEREÇO + FRETE */}
      {step === 1 && (
        <form onSubmit={handleContinueToPayment} className="space-y-8 max-w-3xl mx-auto">
          {/* READONLY CUSTOMER IDENTITY CARD */}
          <div className="rounded-2xl border border-content/12 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-content/10 pb-2.5">
              <span className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#C59D3F]" />
                Dados do Cliente (Cadastrado)
              </span>
              <span className="font-mono text-[11px] text-content/50">Somente Leitura</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 font-mono text-xs text-content/80">
              <div>
                <span className="text-content/50">Cliente:</span>{" "}
                <strong className="text-content">{user.firstName} {user.lastName}</strong>
              </div>
              <div>
                <span className="text-content/50">CPF / CNPJ:</span>{" "}
                <strong className="text-content">{formatCpfOrCnpj(user.cpfCnpj)}</strong>
              </div>
              <div>
                <span className="text-content/50">E-mail:</span>{" "}
                <strong className="text-content">{user.email}</strong>
              </div>
              <div>
                <span className="text-content/50">Telefone / WhatsApp:</span>{" "}
                <strong className="text-content">{formatPhone(user.phone)}</strong>
              </div>
            </div>
          </div>

          {/* SELEÇÃO DE ENDEREÇO DE ENTREGA (APENAS ENDEREÇOS CADASTRADOS NA CONTA) */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-content/10 pb-3">
              <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Selecione o Endereço de Entrega *
              </h3>
              <Link
                href="/minha-conta"
                className="font-mono text-xs text-[#C59D3F] hover:underline font-bold"
              >
                Gerenciar Endereços na Minha Conta ➔
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-mono text-amber-700 dark:text-amber-300">
                ⚠️ Você ainda não possui nenhum endereço cadastrado. Acesse a <strong>Minha Conta</strong> para cadastrar seu endereço de entrega antes de finalizar.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr)}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all ${isSelected
                          ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content shadow-sm ring-1 ring-[#C59D3F]"
                          : "border-content/15 bg-canvas hover:border-content/30"
                        }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-content">
                          {addr.street}, {addr.number} {addr.complement && `(${addr.complement})`}
                        </p>
                        <p className="text-xs text-content/70 font-mono mt-0.5">
                          {addr.neighborhood} · {addr.city}
                        </p>
                        <p className="text-xs text-content/60 font-mono">
                          CEP: {formatCep(addr.cep)}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-[#C59D3F] pt-2">
                        {isSelected ? "✓ Endereço Selecionado" : "Clique para selecionar"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DYNAMIC FREIGHT CALCULATED WITH SELECTED ADDRESS */}
          {selectedAddress && (
            <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-4">
              <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Envio
              </h3>

              {shippingLoading ? (
                <div className="py-4 text-center font-mono text-xs text-[#C59D3F] animate-pulse">
                  Calculando frete em tempo real para o CEP {formatCep(selectedAddress.cep)}...
                </div>
              ) : shippingOptions.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {shippingOptions.map((opt) => {
                    const isSelected = selectedShippingOption?.id === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedShippingOption(opt)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${isSelected
                            ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content shadow-sm"
                            : "border-content/15 bg-canvas hover:border-content/30"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card font-mono text-xs font-bold text-[#C59D3F] border border-content/10">
                            🚚
                          </div>
                          <div>
                            <p className="font-bold text-xs text-content">{opt.name}</p>
                            <p className="font-mono text-[11px] text-content/65">
                              Entrega em até {opt.deliveryTime} dias úteis
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-sm font-bold text-[#C59D3F]">
                          {formatBRL(opt.price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-content/10 bg-canvas text-xs font-mono text-content/70">
                  Frete Padrão R$ 25,00 (Prazo estimado de 3 a 7 dias úteis).
                </div>
              )}
            </div>
          )}

          {/* TOTAL SUMMARY & CONTINUE BUTTON */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="font-mono text-xs text-content/60 uppercase">Subtotal + Frete:</span>
              <p className="font-display text-2xl font-bold text-[#C59D3F]">
                {formatBRL(orderTotalBeforeDiscount)}
              </p>
              <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> No PIX por {formatBRL(orderTotalBeforeDiscount - pixDiscountAmount)} (Economize {formatBRL(pixDiscountAmount)})
              </p>
            </div>

            <button
              type="submit"
              disabled={!selectedAddress}
              className="rounded-xl bg-[#C59D3F] px-8 py-3.5 font-bold text-xs text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              Continuar para Pagamento →
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: PAGAMENTO & CONFIRMAÇÃO */}
      {step === 2 && (
        <form onSubmit={handleFinalizeOrder} className="space-y-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-content/12 pb-3">
            <h2 className="font-display text-2xl font-bold text-content">
              2. Forma de Pagamento & Confirmação
            </h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-mono text-xs text-[#C59D3F] underline font-bold"
            >
              ← Alterar Endereço / Frete
            </button>
          </div>

          {/* PROMINENT PIX DISCOUNT BANNER */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-emerald-500/15 to-[#C59D3F]/15 p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold shadow-md animate-pulse">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 font-mono text-[11px] font-extrabold uppercase text-white shadow-xs">
                      ⚡ Desconto Exclusivo 5% OFF
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Economize {formatBRL(pixDiscountAmount)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-content/90 font-medium">
                    Pagando via <strong className="text-emerald-600 dark:text-emerald-400 font-bold">PIX</strong>, seu pedido cai de{" "}
                    <span className="line-through text-content/60 font-mono">{formatBRL(orderTotalBeforeDiscount)}</span> para{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-extrabold">{formatBRL(orderTotalBeforeDiscount - pixDiscountAmount)}</strong> à vista.
                  </p>
                </div>
              </div>

              {paymentMethod !== "pix" && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("pix");
                    setErrors((prev) => ({ ...prev, paymentMethod: "" }));
                  }}
                  className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2.5 font-mono text-xs font-bold text-white transition-all hover:bg-emerald-600 shadow-md active:scale-[0.98] flex items-center gap-1.5"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Ativar 5% OFF no PIX</span>
                </button>
              )}
            </div>
          </div>

          {/* SUMMARY REVIEW CARD */}
          {selectedAddress && (
            <div className="rounded-2xl border border-content/12 bg-card p-5 font-mono text-xs space-y-2.5">
              <p>📍 <strong className="text-content">Endereço Selecionado:</strong> {selectedAddress.street}, {selectedAddress.number} {selectedAddress.complement && `(${selectedAddress.complement})`} - {selectedAddress.city}</p>
              <p>🚚 <strong className="text-content">Frete Escolhido:</strong> {selectedShippingOption ? selectedShippingOption.name : "Frete Padrão"} ({formatBRL(shippingCost)})</p>
              {paymentMethod === "pix" ? (
                <>
                  <p>🧾 <strong className="text-content">Subtotal + Frete:</strong> <span className="line-through text-content/60">{formatBRL(orderTotalBeforeDiscount)}</span></p>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5 text-emerald-800 dark:text-emerald-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-500" /> Desconto Especial PIX (5% OFF):
                    </span>
                    <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">-{formatBRL(pixDiscountAmount)}</span>
                  </div>
                  <p className="pt-1">💰 <strong className="text-content">Valor Total do Pedido:</strong> <span className="text-[#C59D3F] font-bold text-base">{formatBRL(totalPrice)}</span></p>
                </>
              ) : (
                <>
                  <p>💰 <strong className="text-content">Valor Total do Pedido:</strong> <span className="text-[#C59D3F] font-bold text-sm">{formatBRL(totalPrice)}</span></p>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 p-2.5 text-amber-700 dark:text-amber-300 font-mono text-xs">
                    <span>💡 No <strong>PIX</strong> o valor total fica por <strong>{formatBRL(orderTotalBeforeDiscount - pixDiscountAmount)}</strong> (Economia de <strong>{formatBRL(pixDiscountAmount)}</strong>)!</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("pix");
                        setErrors((prev) => ({ ...prev, paymentMethod: "" }));
                      }}
                      className="font-bold text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-500"
                    >
                      Mudar para PIX (5% OFF) ➔
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PAYMENT METHOD SELECTOR */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider">
              Selecione como Deseja Pagar *
            </h3>

            {errors.paymentMethod && (
              <p className="text-xs font-mono text-red-500 font-semibold">⚠️ {errors.paymentMethod}</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* PIX Option */}
              <div
                onClick={() => {
                  setPaymentMethod("pix");
                  setErrors((prev) => ({ ...prev, paymentMethod: "" }));
                }}
                className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${paymentMethod === "pix"
                    ? "border-emerald-500 bg-emerald-500/10 text-content shadow-lg ring-2 ring-emerald-500/30"
                    : "border-emerald-500/40 bg-card hover:border-emerald-500 hover:bg-emerald-500/5 shadow-sm"
                  }`}
              >
                <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-0.5 font-mono text-[10px] font-extrabold uppercase text-white shadow-sm flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> RECOMENDADO · 5% OFF
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                  <QrCode className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <h4 className="font-bold text-base text-content">PIX à Vista</h4>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Instantâneo
                    </span>
                  </div>
                  <p className="text-xs text-content/75">
                    QR Code dinâmico com aprovação imediata pelo Mercado Pago.
                  </p>
                  <div className="mt-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5 font-mono text-xs text-emerald-800 dark:text-emerald-300">
                    💰 Total no PIX: <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(orderTotalBeforeDiscount - pixDiscountAmount)}</strong>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
                      ✓ Economia de {formatBRL(pixDiscountAmount)} (5% OFF)
                    </p>
                  </div>
                </div>
              </div>

              {/* Credit Card Option */}
              <div
                onClick={() => {
                  setPaymentMethod("card");
                  setErrors((prev) => ({ ...prev, paymentMethod: "" }));
                }}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all ${paymentMethod === "card"
                    ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content shadow-sm ring-1 ring-[#C59D3F]"
                    : "border-content/15 bg-canvas hover:border-content/30"
                  }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C59D3F]/15 text-[#C59D3F]">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="pt-1">
                  <h4 className="font-bold text-base text-content">Cartão de Crédito</h4>
                  <p className="mt-1 text-xs text-content/70">
                    Parcele em até 10x pelo Mercado Pago.
                  </p>
                  <p className="mt-2 text-xs font-mono text-content/60">
                    Total: {formatBRL(orderTotalBeforeDiscount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Credit Card Form Fields */}
            {paymentMethod === "card" && (
              <div className="mt-6 rounded-xl border border-content/12 bg-canvas p-5 space-y-4">
                <h4 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider">
                  Dados do Cartão de Crédito
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                      Nome Impresso no Cartão *
                    </label>
                    <input
                      type="text"
                      placeholder="MARIA SILVA"
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
                      className={inputClass(!!errors.cardName)}
                    />
                    {errors.cardName && <p className="mt-1 text-xs text-red-500">{errors.cardName}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                      Número do Cartão *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0000 0000 0000 0000"
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                        className={`${inputClass(!!errors.cardNumber)} pr-14`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CardBrandBadge brand={detectCardBrandOrNull(card.number)} />
                      </div>
                    </div>
                    {errors.cardNumber && <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>}
                  </div>

                  <div>
                    <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                      Validade (MM/AA) *
                    </label>
                    <input
                      type="text"
                      placeholder="12/28"
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                      className={inputClass(!!errors.cardExpiry)}
                    />
                    {errors.cardExpiry && <p className="mt-1 text-xs text-red-500">{errors.cardExpiry}</p>}
                  </div>

                  <div>
                    <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                      Código CVV *
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") })}
                      className={inputClass(!!errors.cardCvv)}
                    />
                    {errors.cardCvv && <p className="mt-1 text-xs text-red-500">{errors.cardCvv}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                      CPF do Titular do Cartão *
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={card.cpf}
                      onChange={(e) => setCard({ ...card, cpf: formatCpf(e.target.value) })}
                      className={inputClass(!!errors.cardCpf)}
                    />
                    {errors.cardCpf && <p className="mt-1 text-xs text-red-500">{errors.cardCpf}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                      Opções de Parcelamento *
                    </label>
                    <select
                      value={card.installments}
                      onChange={(e) => setCard({ ...card, installments: Number(e.target.value) })}
                      className={inputClass(false)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {formatInstallmentText(num, totalPrice)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {paymentError && !isHighRiskRejection && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 font-mono text-xs text-red-600 dark:text-red-400 font-semibold">
              ⚠️ {paymentError}
            </div>
          )}

          {/* Recusa por antifraude (cc_rejected_high_risk): sem convite a repetir o mesmo cartão. */}
          {paymentError && isHighRiskRejection && (
            <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Pagamento recusado por critérios de segurança
              </p>
              <p className="text-xs leading-relaxed text-content/85">{paymentError}</p>
              <p className="text-xs leading-relaxed text-content/70">
                Não é necessário tentar de novo com o mesmo cartão: a análise de risco do emissor
                se repetiria. Informe os dados de <strong className="text-content">outro cartão</strong>{" "}
                ou finalize por <strong className="text-content">Pix</strong>, com aprovação
                instantânea. Nenhum valor foi cobrado e seu carrinho continua salvo.
              </p>
              {paymentMethod !== "pix" && (
                <button
                  type="button"
                  onClick={handleSwitchToPix}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-mono text-xs font-bold text-white transition-colors hover:bg-emerald-700 active:scale-[0.99]"
                >
                  <QrCode className="h-4 w-4" />
                  Pagar com Pix
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={processingPayment}
            className="w-full rounded-xl bg-[#C59D3F] py-4 text-base font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-lg active:scale-[0.99] disabled:opacity-50"
          >
            {processingPayment
              ? "Processando Pagamento com Mercado Pago..."
              : `Confirmar & Finalizar Pedido (${formatBRL(totalPrice)}) →`}
          </button>
        </form>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AccreditationProvider>
      <Script
        src="https://www.mercadopago.com/v2/security.js"
        strategy="afterInteractive"
        {...({ view: "checkout" } as Record<string, string>)}
      />
      <input type="hidden" id="deviceId" />
      <SiteHeader />
      <main className="bg-canvas">
        <CheckoutContent />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
