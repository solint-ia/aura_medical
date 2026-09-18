"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  isDebitCard,
  validateCardExpiry,
  validateCardNumber,
  validateCpf,
} from "@/lib/validators";

type Step = 1 | 2; // Step 1: Endereço & Frete | Step 2: Pagamento & Revisão
type PaymentMethod = "card" | "pix" | null;
/** Crédito ou débito, conforme o Mercado Pago identifica o cartão digitado. */
type CardKind = "credit" | "debit" | null;

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
  11: 1.1793,
  12: 1.1957,
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

interface OrderEmailPayload {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  paymentMethod: string;
  shippingAddress: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
}

/**
 * Tudo o que é preciso para gravar o pedido DEPOIS que o Mercado Pago aprovar
 * o pagamento. Capturado antes do `clearCart()`, porque nesse momento o
 * carrinho já estará vazio.
 */
interface PendingOrderSnapshot {
  address: UserAddress;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  totalPrice: number;
  paymentMethod: string;
  items: { id: string; name: string; quantity: number; unitPrice: number; imagePath?: string }[];
  orderNumber: string;
  email: OrderEmailPayload | null;
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

interface MercadoPagoCardToken {
  id: string;
  payment_method_id?: string;
  payment_method?: { id?: string };
  issuer?: { id?: string | number };
  first_six_digits?: string;
  last_four_digits?: string;
}

const MERCADO_PAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";

async function waitForMercadoPagoDeviceId(timeoutMs = 3000): Promise<string> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const globalId = (window as unknown as { MP_DEVICE_SESSION_ID?: string })
      .MP_DEVICE_SESSION_ID;
    const inputId = (document.getElementById("deviceId") as HTMLInputElement | null)?.value;
    const deviceId = globalId || inputId || "";
    if (deviceId) return deviceId;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
  return "";
}

async function tokenizeCardWithMercadoPago(card: CardForm): Promise<MercadoPagoCardToken> {
  if (!MERCADO_PAGO_PUBLIC_KEY) {
    throw new Error("Chave pública do Mercado Pago não configurada.");
  }

  const [expirationMonth, shortYear] = card.expiry.split("/");
  const expirationYear = shortYear.length === 2 ? `20${shortYear}` : shortYear;
  const response = await fetch(
    `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(MERCADO_PAGO_PUBLIC_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_number: card.number.replace(/\D/g, ""),
        expiration_month: Number(expirationMonth),
        expiration_year: Number(expirationYear),
        security_code: card.cvv.replace(/\D/g, ""),
        cardholder: {
          name: card.name.toUpperCase().trim(),
          identification: {
            type: "CPF",
            number: card.cpf.replace(/\D/g, ""),
          },
        },
      }),
    }
  );
  const data = await response.json();
  if (!response.ok || !data.id) {
    throw new Error(data.message || "O Mercado Pago não aceitou os dados do cartão.");
  }
  return data as MercadoPagoCardToken;
}

/**
 * Pergunta ao Mercado Pago, pelos primeiros dígitos, se o cartão é de crédito
 * ou de débito. O débito é sempre à vista, então a resposta define se o campo
 * de parcelamento aparece.
 */
async function fetchCardKind(bin: string): Promise<CardKind> {
  if (!MERCADO_PAGO_PUBLIC_KEY) return null;
  const response = await fetch(
    `https://api.mercadopago.com/v1/payment_methods/search?public_key=${encodeURIComponent(MERCADO_PAGO_PUBLIC_KEY)}&bin=${bin}`
  );
  if (!response.ok) return null;
  const data = await response.json();
  const type = data?.results?.[0]?.payment_type_id;
  if (type === "debit_card") return "debit";
  if (type === "credit_card") return "credit";
  return null;
}

function CheckoutContent() {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated } = useCart();
  const { user, authToken, addresses, selectedAddress, setSelectedAddress, createOrder } = useAuth();

  const [step, setStep] = useState<Step>(1);

  const [card, setCard] = useState<CardForm>({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
    cpf: "",
    installments: 1,
  });

  const [cardLookup, setCardLookup] = useState<{ bin: string; kind: CardKind } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const cardBin = card.number.replace(/\D/g, "").slice(0, 8);

  // Só vale a resposta do BIN que está digitado agora; o anterior é descartado
  // pela própria comparação, sem precisar limpar o estado a cada tecla.
  const cardKind = cardLookup?.bin === cardBin ? cardLookup.kind : null;

  useEffect(() => {
    if (cardBin.length < 6) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void fetchCardKind(cardBin)
        .then((kind) => {
          if (!active) return;
          setCardLookup({ bin: cardBin, kind });
          if (kind === "debit") setCard((current) => ({ ...current, installments: 1 }));
        })
        .catch(() => undefined);
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [cardBin]);

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");

  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  /** `status_detail` da recusa do Mercado Pago, para orientar o usuário por caso. */
  const [paymentErrorDetail, setPaymentErrorDetail] = useState("");
  const [threeDsInfo, setThreeDsInfo] = useState<{
    externalResourceUrl: string;
    creq: string;
  } | null>(null);
  const threeDsFormRef = useRef<HTMLFormElement | null>(null);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    qrCode: string;
    qrCodeBase64?: string;
  } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  /** Id do pagamento no Mercado Pago que está sendo acompanhado em tempo real. */
  const [trackedPaymentId, setTrackedPaymentId] = useState<string | null>(null);
  /** Vira `true` só quando o Mercado Pago retorna `approved`. */
  const [paymentApproved, setPaymentApproved] = useState(false);
  /** Falha ao gravar o pedido DEPOIS do pagamento aprovado (dinheiro entrou). */
  const [orderRegistrationError, setOrderRegistrationError] = useState("");
  const [registeringOrder, setRegisteringOrder] = useState(false);

  /**
   * Snapshot do pedido enquanto o pagamento não é confirmado. Fica em ref
   * porque o polling precisa lê-lo sem re-assinar o intervalo a cada render.
   */
  const pendingOrderRef = useRef<PendingOrderSnapshot | null>(null);
  /** Trava de idempotência: o pedido só é gravado uma vez por pagamento. */
  const registrationDoneRef = useRef(false);
  /** Tentativas automáticas de gravação após o pagamento aprovado. */
  const registrationRetriesRef = useRef(0);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState("");
  const [submittedOrderSummary, setSubmittedOrderSummary] = useState<{
    total: number;
    itemsCount: number;
    shippingCost: number;
    shippingName: string;
  }>({ total: 0, itemsCount: 0, shippingCost: 0, shippingName: "Frete Padrão" });

  /**
   * Único caminho que grava a compra no banco. Roda só depois que o Mercado
   * Pago confirmou o pagamento (`approved`) — nem o QR gerado nem o cartão em
   * análise chegam aqui. A rota /api/orders reconfere o status no Mercado Pago
   * antes de inserir, então o registro não depende só desta checagem no cliente.
   */
  const registerConfirmedOrder = useCallback(
    async (paymentId: string) => {
      const snapshot = pendingOrderRef.current;
      if (!snapshot || registrationDoneRef.current) return;

      registrationDoneRef.current = true;
      setRegisteringOrder(true);
      setOrderRegistrationError("");

      try {
        const created = await createOrder({
          address: snapshot.address,
          shippingMethod: snapshot.shippingMethod,
          shippingCost: snapshot.shippingCost,
          subtotal: snapshot.subtotal,
          totalPrice: snapshot.totalPrice,
          paymentMethod: snapshot.paymentMethod,
          items: snapshot.items,
          orderNumber: snapshot.orderNumber,
          paymentId,
        });

        setSubmittedOrderNumber(created?.orderNumber || snapshot.orderNumber);
      } catch (err) {
        // Pagamento aprovado mas pedido não gravado: libera nova tentativa e
        // avisa o cliente na tela — o dinheiro dele já entrou.
        registrationDoneRef.current = false;
        console.error("Erro ao registrar pedido confirmado:", err);
        setOrderRegistrationError(
          err instanceof Error ? err.message : "Erro ao registrar o pedido confirmado."
        );
      } finally {
        setRegisteringOrder(false);
      }
    },
    [createOrder]
  );

  /**
   * Confirmação do pagamento: libera a tela de sucesso, envia o e-mail de
   * compra e grava o pedido. `emailAlreadySent` cobre o cartão aprovado no ato,
   * cujo e-mail já sai de dentro de /api/payment/process.
   */
  const handlePaymentApproved = useCallback(
    async (paymentId: string, emailAlreadySent = false) => {
      setPaymentApproved(true);
      setThreeDsInfo(null);
      clearCart();

      const snapshot = pendingOrderRef.current;
      if (snapshot?.email && !emailAlreadySent) {
        fetch("/api/payment/confirm-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ paymentId, ...snapshot.email }),
        }).catch((mailErr) => console.warn("Aviso ao confirmar e-mail do pagamento:", mailErr));
      }

      await registerConfirmedOrder(paymentId);
    },
    [authToken, clearCart, registerConfirmedOrder]
  );

  useEffect(() => {
    if (!isSubmitted || !threeDsInfo || !threeDsFormRef.current) return;
    threeDsFormRef.current.submit();
  }, [isSubmitted, threeDsInfo]);

  // Checagem em tempo real do pagamento (PIX aguardando transferência e cartão
  // em análise) via /api/payment/status.
  useEffect(() => {
    if (!isSubmitted || !trackedPaymentId || paymentApproved) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?paymentId=${trackedPaymentId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        const data = await res.json();
        if (data.success && data.status === "approved") {
          clearInterval(interval);
          handlePaymentApproved(trackedPaymentId);
        } else if (
          data.success &&
          (data.status === "rejected" ||
            data.status === "cancelled" ||
            data.status === "refunded")
        ) {
          clearInterval(interval);
          setTrackedPaymentId(null);
          setThreeDsInfo(null);
          setIsSubmitted(false);
          setPaymentErrorDetail(data.statusDetail || "");
          setPaymentError(
            data.statusDetail === "cc_rejected_high_risk"
              ? "O pagamento não pôde ser aprovado pela análise de segurança do Mercado Pago. Aguarde antes de repetir ou utilize outro cartão ou Pix."
              : "O cartão não aprovou o pagamento. Revise os dados ou utilize outro meio de pagamento."
          );
        }
      } catch (err) {
        console.warn("Aviso ao checar status do pagamento:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isSubmitted, trackedPaymentId, paymentApproved, handlePaymentApproved, authToken]);

  // Pagamento aprovado mas gravação do pedido falhou: tenta de novo sozinho
  // algumas vezes antes de depender do botão manual. /api/orders é idempotente.
  useEffect(() => {
    if (!paymentApproved || !orderRegistrationError || !trackedPaymentId || registeringOrder) return;
    if (registrationRetriesRef.current >= 3) return;

    const timer = setTimeout(() => {
      registrationRetriesRef.current += 1;
      registerConfirmedOrder(trackedPaymentId);
    }, 5000);

    return () => clearTimeout(timer);
  }, [
    paymentApproved,
    orderRegistrationError,
    trackedPaymentId,
    registeringOrder,
    registerConfirmedOrder,
  ]);

  // Cotação real em produção. O servidor recupera o CEP pelo addressId e
  // resolve os produtos pelo catálogo; preço, dimensões e destino enviados pelo
  // navegador nunca são usados como fonte de verdade.
  const fetchShippingRates = useCallback(async (
    cleanCep: string,
    addressId: string,
    currentItems: typeof items
  ) => {
    if (cleanCep.length !== 8 || !authToken || currentItems.length === 0) return;

    setShippingLoading(true);
    setShippingError("");
    setShippingOptions([]);
    setSelectedShippingOption(null);

    try {
      const res = await fetch("/api/frete/calcular", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          addressId,
          items: currentItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.options) || data.options.length === 0) {
        throw new Error(data.error || "Nenhuma opção de entrega foi encontrada.");
      }

      setShippingOptions(data.options);
      setSelectedShippingOption(data.options[0]);
    } catch (error) {
      console.error("Erro ao calcular frete dinâmico:", error);
      setShippingError(
        error instanceof Error ? error.message : "Não foi possível calcular o frete."
      );
    } finally {
      setShippingLoading(false);
    }
  }, [authToken]);

  // Calculate freight when selectedAddress changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (selectedAddress?.cep) {
        const cleanCep = selectedAddress.cep.replace(/\D/g, "");
        void fetchShippingRates(cleanCep, selectedAddress.id, items);
      } else {
        setShippingOptions([]);
        setSelectedShippingOption(null);
        setShippingError("");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedAddress, items, fetchShippingRates]);

  const shippingCost = selectedShippingOption?.price ?? 0;

  const orderTotalBeforeDiscount = subtotal + shippingCost;
  /** Incentivo para pagamento à vista: 5% de desconto no valor total pago via Pix (desativado/comentado a pedido). */
  // const PIX_DISCOUNT_RATE = 0.05;
  // const pixDiscountAmount = Math.round(orderTotalBeforeDiscount * PIX_DISCOUNT_RATE * 100) / 100;
  // const totalPrice =
  //   Math.round(
  //     (paymentMethod === "pix" ? orderTotalBeforeDiscount - pixDiscountAmount : orderTotalBeforeDiscount) * 100
  //   ) / 100;
  const pixDiscountAmount = 0;
  const totalPrice = Math.round(orderTotalBeforeDiscount * 100) / 100;

  // Step 1 Validation: Must have a selected address
  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) {
      alert("Selecione um endereço cadastrado para entrega antes de prosseguir.");
      return;
    }
    if (shippingLoading || !selectedShippingOption) {
      alert(shippingError || "Aguarde o cálculo e selecione uma opção de frete.");
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
      if (!authToken) {
        setProcessingPayment(false);
        setPaymentError("Sua sessão expirou. Entre novamente antes de finalizar a compra.");
        return;
      }

      const orderNumber = `AUR-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
      const idempotencyKey = crypto.randomUUID();
      const deviceId = await waitForMercadoPagoDeviceId(paymentMethod === "card" ? 3000 : 500);

      if (paymentMethod === "card" && !deviceId) {
        setProcessingPayment(false);
        setPaymentError(
          "A validação de segurança do Mercado Pago não carregou. Atualize a página e tente novamente."
        );
        return;
      }

      let tokenizedCardData:
        | {
            token: string;
            paymentMethodId: string;
            issuerId?: string;
            bin: string;
            lastFour: string;
            holderName: string;
            cpf: string;
            installments: number;
          }
        | undefined;

      if (paymentMethod === "card") {
        const token = await tokenizeCardWithMercadoPago(card);
        const cleanNumber = card.number.replace(/\D/g, "");
        tokenizedCardData = {
          token: token.id,
          paymentMethodId:
            token.payment_method_id || token.payment_method?.id || detectCardBrand(cleanNumber),
          issuerId: token.issuer?.id ? String(token.issuer.id) : undefined,
          bin: token.first_six_digits || cleanNumber.slice(0, 6),
          lastFour: token.last_four_digits || cleanNumber.slice(-4),
          holderName: card.name,
          cpf: card.cpf,
          installments: isDebitCard(token.payment_method_id || token.payment_method?.id || "") ? 1 : card.installments,
        };
      }

      // 1. Call Mercado Pago Process Payment API FIRST
      const payRes = await fetch("/api/payment/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          paymentMethod,
          amount: totalPrice,
          orderNumber,
          idempotencyKey,
          deviceId,
          addressId: selectedAddress.id,
          shippingOptionId: selectedShippingOption?.id,
          items: items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
          })),
          cardData: tokenizedCardData,
        }),
      });

      const payData = await payRes.json();
      setProcessingPayment(false);

      if (!payData.success) {
        setPaymentErrorDetail(payData.statusDetail || "");
        setPaymentError(payData.error || "Recusado pelo Mercado Pago. Verifique os dados.");
        return; // Payment failed or rejected! Do NOT create order, items remain in cart!
      }

      // 2. Cobrança criada. O pedido NÃO vai para o banco agora: PIX nasce
      //    "pending" (QR apenas gerado) e cartão pode voltar "in_process".
      //    Guardamos o snapshot e só gravamos quando o Mercado Pago aprovar.
      const paymentId = String(payData.paymentId);
      const confirmedShippingOption: ShippingOption =
        payData.shippingOption || selectedShippingOption;
      const confirmedShippingCost = Number(confirmedShippingOption.price);
      const confirmedTotal = Number(payData.amount);
      const shippingName = confirmedShippingOption.name;
      const cepDigits = selectedAddress.cep.replace(/\D/g, "");

      pendingOrderRef.current = {
        address: selectedAddress,
        shippingMethod: shippingName,
        shippingCost: confirmedShippingCost,
        subtotal,
        totalPrice: confirmedTotal,
        paymentMethod: paymentMethod === "pix" ? "pix" : cardKind === "debit" ? "debito" : "credito",
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          imagePath: i.imagePath,
        })),
        orderNumber,
        email: {
          customerName: `${user?.firstName || "Cliente"} ${user?.lastName || "Aura"}`.trim(),
          customerEmail: user?.email || "",
          orderNumber,
          paymentMethod:
            paymentMethod === "pix"
              ? "PIX à Vista (Mercado Pago)"
              : cardKind === "debit"
                ? "Cartão de Débito (Mercado Pago)"
                : "Cartão de Crédito (Mercado Pago)",
          shippingAddress: `${selectedAddress.street}, ${selectedAddress.number} ${selectedAddress.complement ? `- ${selectedAddress.complement}` : ""} - ${selectedAddress.neighborhood}, ${selectedAddress.city}/${selectedAddress.uf} (CEP ${cepDigits})`.trim(),
          items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
          subtotal,
          shippingCost: confirmedShippingCost,
          totalPrice: confirmedTotal,
        },
      };
      registrationDoneRef.current = false;

      setSubmittedOrderNumber(orderNumber);
      setSubmittedOrderSummary({
        total: confirmedTotal,
        itemsCount: items.reduce((s, i) => s + i.quantity, 0),
        shippingCost: confirmedShippingCost,
        shippingName,
      });

      if (paymentMethod === "pix" && payData.qrCode) {
        setPixData({
          paymentId,
          qrCode: payData.qrCode,
          qrCodeBase64: payData.qrCodeBase64,
        });
      }

      if (
        paymentMethod === "card" &&
        payData.status === "pending" &&
        payData.statusDetail === "pending_challenge" &&
        payData.threeDsInfo?.external_resource_url &&
        payData.threeDsInfo?.creq
      ) {
        setThreeDsInfo({
          externalResourceUrl: payData.threeDsInfo.external_resource_url,
          creq: payData.threeDsInfo.creq,
        });
      }

      setIsSubmitted(true);

      // 3. Cartão já aprovado no ato: confirma na hora (o e-mail já saiu de
      //    /api/payment/process). Nos demais casos (PIX pendente, cartão em
      //    análise) quem confirma é o polling em tempo real.
      setTrackedPaymentId(paymentId);
      if (payData.status === "approved") {
        await handlePaymentApproved(paymentId, paymentMethod === "card");
      }
    } catch (err) {
      setProcessingPayment(false);
      setPaymentError(
        err instanceof Error
          ? err.message
          : "Erro de comunicação ao processar pagamento com o Mercado Pago."
      );
    }
  };

  // Recusa pela análise de risco: nova tentativa com o MESMO cartão tende a
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
      : "border-content/18 bg-canvas dark:bg-card text-content focus:border-accent"
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
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
            className="rounded-xl bg-accent px-8 py-3.5 font-bold text-xs text-accent-fg transition-all hover:bg-accent shadow-md active:scale-[0.99]"
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
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-accent">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold text-content mb-3">
          Seu carrinho está vazio
        </h1>
        <p className="text-base text-content/75 mb-8 max-w-md mx-auto">
          Adicione ao menos um protocolo de bioregenerativos recombinantes ao seu carrinho antes de acessar o checkout.
        </p>
        <Link
          href="/carrinho"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3.5 text-base font-semibold text-accent-fg transition-colors hover:bg-accent"
        >
          Ir para o Carrinho
        </Link>
      </div>
    );
  }

  // PAYMENT TRACKING / ORDER CONFIRMED STATE
  if (isSubmitted) {
    /** Cobrança criada mas ainda não paga: nada foi gravado no banco. */
    const isAwaitingPayment = !paymentApproved;
    const isPixPending = paymentMethod === "pix" && isAwaitingPayment;
    const isCardUnderReview = paymentMethod === "card" && isAwaitingPayment;

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
        <div
          className={`mx-auto mt-6 mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
            isAwaitingPayment
              ? "bg-accent/15 text-accent"
              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isAwaitingPayment ? <QrCode className="h-10 w-10" /> : <Check className="h-10 w-10" />}
        </div>
        <h1 className="font-display text-3xl font-bold text-content mb-1">
          {isAwaitingPayment
            ? paymentMethod === "pix"
              ? "Aguardando o Pagamento via PIX"
              : "Aguardando a Confirmação do Cartão"
            : "🎉 Pagamento Confirmado com Sucesso!"}
        </h1>
        <p className="font-mono text-sm font-bold text-accent mb-4">
          Código do Pedido: {submittedOrderNumber}
        </p>
        <p className="text-base text-content/75 mb-6">
          {isAwaitingPayment ? (
            <>
              <strong className="text-content">{user.firstName}</strong>, seus{" "}
              <strong className="text-accent">{submittedOrderSummary.itemsCount} kit(s)</strong> ficam reservados até
              a confirmação do pagamento. O pedido é registrado assim que o Mercado Pago aprovar a transação.
            </>
          ) : (
            <>
              Obrigado, <strong className="text-content">{user.firstName} {user.lastName}</strong>. Seu pedido de{" "}
              <strong className="text-accent">{submittedOrderSummary.itemsCount} kit(s)</strong> foi registrado em nosso sistema.
            </>
          )}
        </p>

        {/* CARTÃO EM ANÁLISE — pagamento criado, ainda não aprovado */}
        {isCardUnderReview && (
          <div className="w-full rounded-2xl border-2 border-accent bg-card p-6 mb-8 text-center space-y-3 shadow-xl">
            <span className="inline-block rounded-full bg-accent/15 px-3.5 py-1 font-mono text-xs font-bold text-accent">
              {threeDsInfo ? "🔐 Confirme sua identidade com o banco" : "⏳ Pagamento em análise pelo Mercado Pago"}
            </span>
            {threeDsInfo ? (
              <>
                <p className="text-xs text-content/80 font-mono">
                  Conclua abaixo a autenticação de <strong>{formatBRL(submittedOrderSummary.total)}</strong>. Depois da
                  confirmação, o resultado será atualizado automaticamente.
                </p>
                <iframe
                  name="mercado-pago-3ds-challenge"
                  title="Autenticação segura do cartão"
                  className="h-[440px] w-full rounded-xl border border-content/15 bg-white sm:h-[600px]"
                />
                <form
                  ref={threeDsFormRef}
                  method="post"
                  action={threeDsInfo.externalResourceUrl}
                  target="mercado-pago-3ds-challenge"
                  className="hidden"
                >
                  <input type="hidden" name="creq" value={threeDsInfo.creq} />
                </form>
              </>
            ) : (
              <p className="text-xs text-content/80 font-mono">
                O Mercado Pago está processando a cobrança de{" "}
                <strong>{formatBRL(submittedOrderSummary.total)}</strong>. Não feche esta página: estamos checando o
                resultado em tempo real.
              </p>
            )}
            <div className="flex items-center justify-center gap-2 font-mono text-xs text-accent pt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
              </span>
              Aguardando confirmação do pagamento em tempo real...
            </div>
          </div>
        )}

        {/* CARD APPROVED BANNER */}
        {paymentMethod === "card" && paymentApproved && (
          <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-6 text-center text-xs font-mono text-emerald-700 dark:text-emerald-300 space-y-1">
            <p>✓ Pagamento via {cardKind === "debit" ? "Cartão de Débito" : "Cartão de Crédito"} aprovado e confirmado pelo Mercado Pago.</p>
            <p className="text-[11px] text-content/75">📩 Enviamos os detalhes resumidos da compra para o seu e-mail (<strong>{user.email}</strong>).</p>
          </div>
        )}

        {/* PEDIDO NÃO GRAVADO APÓS PAGAMENTO APROVADO */}
        {paymentApproved && orderRegistrationError && (
          <div className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 mb-6 text-center text-xs font-mono text-amber-700 dark:text-amber-300 space-y-2">
            <p>
              ⚠️ Seu pagamento foi aprovado, mas houve uma falha ao registrar o pedido em nosso sistema. Nenhum valor
              adicional será cobrado.
            </p>
            <button
              type="button"
              disabled={registeringOrder}
              onClick={() => {
                if (trackedPaymentId) registerConfirmedOrder(trackedPaymentId);
              }}
              className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold text-accent-fg transition-colors hover:bg-accent disabled:opacity-60"
            >
              {registeringOrder ? "Registrando..." : "Tentar registrar novamente"}
            </button>
          </div>
        )}

        {/* PIX CONFIRMED SUCCESS BANNER */}
        {paymentMethod === "pix" && paymentApproved && (
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
          <div className="w-full rounded-2xl border-2 border-accent bg-card p-6 mb-8 text-center space-y-4 shadow-xl">
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
                  className="shrink-0 rounded-xl bg-accent px-4 py-2.5 font-mono text-xs font-bold text-accent-fg transition-all hover:bg-accent shadow-sm active:scale-[0.98]"
                >
                  {pixCopied ? "✓ Copiado!" : "📋 Copiar PIX"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 font-mono text-xs text-accent pt-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
              </span>
              Aguardando confirmação do pagamento em tempo real...
            </div>
          </div>
        )}

        {selectedAddress && (
          <div className="w-full rounded-xl border border-content/12 bg-card p-6 text-left mb-8 space-y-2 font-mono text-sm text-content/80">
            <p>📍 <strong className="text-content">Entrega:</strong> {selectedAddress.street}, {selectedAddress.number} {selectedAddress.complement} - {selectedAddress.city}</p>
            <p>🚚 <strong className="text-content">Frete:</strong> {submittedOrderSummary.shippingName} ({submittedOrderSummary.shippingCost === 0 ? "GRÁTIS / R$ 0,00" : formatBRL(submittedOrderSummary.shippingCost)})</p>
            <p>💳 <strong className="text-content">Pagamento:</strong> {paymentMethod === "pix" ? "PIX à vista (Mercado Pago)" : cardKind === "debit" ? "Cartão de Débito (Mercado Pago)" : "Cartão de Crédito (Mercado Pago)"}</p>
            <p>💰 <strong className="text-content">Valor Total:</strong> {formatBRL(submittedOrderSummary.total)}</p>
          </div>
        )}

        <p className="text-sm text-content/60 mb-8">
          {isAwaitingPayment
            ? "Assim que o pagamento for identificado, o pedido entra no sistema e nosso time comercial entra em contato para confirmar a entrega."
            : `Nosso time comercial entrará em contato via WhatsApp (${formatPhone(user.phone)}) para confirmação de entrega e emissão de nota fiscal.`}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* O pedido só existe em "Minha Conta" depois do pagamento aprovado. */}
          {paymentApproved && (
            <Link
              href="/minha-conta"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-3.5 font-semibold text-accent-fg transition-colors hover:bg-accent shadow-md"
            >
              Ver Pedido na Minha Conta →
            </Link>
          )}
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
          className={`flex items-center gap-2 font-bold transition-colors ${step === 1 ? "text-accent" : "text-content/60 hover:text-content"
            }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step === 1 ? "bg-accent text-accent-fg" : "bg-accent/20 text-accent"
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
          className={`flex items-center gap-2 font-bold transition-colors ${step === 2 ? "text-accent" : "text-content/40"
            }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step === 2 ? "bg-accent text-accent-fg" : "bg-content/10 text-content/50"
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
              <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-accent" />
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
              <h3 className="font-mono text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Selecione o Endereço de Entrega *
              </h3>
              <Link
                href="/minha-conta"
                className="font-mono text-xs text-accent hover:underline font-bold"
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
                          ? "border-accent bg-accent/10 text-content shadow-sm ring-1 ring-[#C59D3F]"
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
                      <span className="font-mono text-[11px] font-bold text-accent pt-2">
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
              <h3 className="font-mono text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Envio
              </h3>

              {shippingLoading ? (
                <div className="py-4 text-center font-mono text-xs text-accent animate-pulse">
                  Calculando frete em tempo real para o CEP {formatCep(selectedAddress.cep)}...
                </div>
              ) : shippingError ? (
                <div className="space-y-3 rounded-lg border border-red-500/25 bg-red-500/5 p-4 text-xs text-red-600 dark:text-red-400">
                  <p>{shippingError}</p>
                  <button
                    type="button"
                    onClick={() => fetchShippingRates(
                      selectedAddress.cep.replace(/\D/g, ""),
                      selectedAddress.id,
                      items
                    )}
                    className="font-mono font-bold underline underline-offset-4"
                  >
                    Tentar calcular novamente
                  </button>
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
                            ? "border-accent bg-accent/10 text-content shadow-sm"
                            : "border-content/15 bg-canvas hover:border-content/30"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card font-mono text-xs font-bold text-accent border border-content/10">
                            🚚
                          </div>
                          <div>
                            <p className="font-bold text-xs text-content">{opt.name}</p>
                            <p className="font-mono text-[11px] text-content/65">
                              Entrega em até {opt.deliveryTime} dias úteis
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-sm font-bold text-accent">
                          {formatBRL(opt.price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-content/10 bg-canvas text-xs font-mono text-content/70">
                  Nenhuma opção de frete disponível para este endereço.
                </div>
              )}
            </div>
          )}

          {/* TOTAL SUMMARY & CONTINUE BUTTON */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="font-mono text-xs text-content/60 uppercase">Subtotal + Frete:</span>
              <p className="font-display text-2xl font-bold text-accent">
                {formatBRL(orderTotalBeforeDiscount)}
              </p>
              <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> No PIX por {formatBRL(orderTotalBeforeDiscount - pixDiscountAmount)} (Economize {formatBRL(pixDiscountAmount)})
              </p>
            </div>

            <button
              type="submit"
              disabled={!selectedAddress || shippingLoading || !selectedShippingOption}
              className="rounded-xl bg-accent px-8 py-3.5 font-bold text-xs text-accent-fg transition-all hover:bg-accent shadow-md active:scale-[0.99] disabled:opacity-50"
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
              className="font-mono text-xs text-accent underline font-bold"
            >
              ← Alterar Endereço / Frete
            </button>
          </div>

          {/* SUMMARY REVIEW CARD */}
          {selectedAddress && (
            <div className="rounded-2xl border border-content/12 bg-card p-5 font-mono text-xs space-y-2">
              <p>📍 <strong className="text-content">Endereço Selecionado:</strong> {selectedAddress.street}, {selectedAddress.number} {selectedAddress.complement && `(${selectedAddress.complement})`} - {selectedAddress.city}</p>
              <p>🚚 <strong className="text-content">Frete Escolhido:</strong> {selectedShippingOption ? selectedShippingOption.name : "Frete Padrão"} ({formatBRL(shippingCost)})</p>
              <p>🧾 <strong className="text-content">Subtotal + Frete:</strong> {formatBRL(orderTotalBeforeDiscount)}</p>
              {/* Desconto PIX desativado a pedido (comentado para reaproveitamento futuro)
              {paymentMethod === "pix" && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold py-0.5">
                  <span>🏷️ Desconto PIX (5% OFF):</span>
                  <span className="font-bold">-{formatBRL(pixDiscountAmount)}</span>
                </div>
              )} */}
              <div className="pt-2 border-t border-content/10 flex items-center justify-between text-sm">
                <span className="text-content font-bold">💰 Valor Total do Pedido:</span>
                <span className="text-accent font-bold text-base">{formatBRL(totalPrice)}</span>
              </div>
            </div>
          )}

          {/* PAYMENT METHOD SELECTOR */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-4">
            <h3 className="font-mono text-xs font-bold text-accent uppercase tracking-wider">
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
                className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${
                  paymentMethod === "pix"
                    ? "border-emerald-500 bg-emerald-500/10 text-content shadow-sm ring-1 ring-emerald-500/30"
                    : "border-content/15 bg-canvas hover:border-emerald-500/40"
                }`}
              >
                {/* <div className="absolute -top-3 right-4 rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white shadow-xs">
                  5% OFF
                </div> */}

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <QrCode className="h-6 w-6" />
                </div>
                <div className="pt-0.5">
                  <h4 className="font-bold text-base text-content">PIX à Vista</h4>
                  <p className="mt-1 text-xs text-content/70">
                    Aprovação imediata pelo Mercado Pago.
                  </p>
                  <p className="mt-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Total: {formatBRL(orderTotalBeforeDiscount)}
                  </p>
                </div>
              </div>

              {/* Credit Card Option */}
              <div
                onClick={() => {
                  setPaymentMethod("card");
                  setErrors((prev) => ({ ...prev, paymentMethod: "" }));
                }}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${
                  paymentMethod === "card"
                    ? "border-accent bg-accent/10 text-content shadow-sm ring-1 ring-[#C59D3F]"
                    : "border-content/15 bg-canvas hover:border-content/30"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="pt-0.5">
                  <h4 className="font-bold text-base text-content">Cartão de Crédito ou Débito</h4>
                  <p className="mt-1 text-xs text-content/70">
                    Crédito em até 12x ou débito à vista, pelo Mercado Pago.
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
                <h4 className="font-mono text-xs font-bold text-accent uppercase tracking-wider">
                  Dados do Cartão
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
                      {cardKind === "debit" ? "Forma de Cobrança" : "Opções de Parcelamento *"}
                    </label>
                    {cardKind === "debit" ? (
                      <p className="rounded-xl border border-content/12 bg-raised px-4 py-3 text-sm text-content/75">
                        Cartão de débito: cobrança única de {formatBRL(totalPrice)}.
                      </p>
                    ) : (
                    <select
                      value={card.installments}
                      onChange={(e) => setCard({ ...card, installments: Number(e.target.value) })}
                      className={inputClass(false)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                        <option key={num} value={num}>
                          {formatInstallmentText(num, totalPrice)}
                        </option>
                      ))}
                    </select>
                    )}
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
                Não tente novamente de imediato com o mesmo cartão: a análise de risco pode
                se repetir. Aguarde ou informe os dados de <strong className="text-content">outro cartão</strong>{" "}
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
            className="w-full rounded-xl bg-accent py-4 text-base font-bold text-accent-fg transition-all hover:bg-accent shadow-lg active:scale-[0.99] disabled:opacity-50"
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
