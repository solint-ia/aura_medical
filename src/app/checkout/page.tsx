"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { UserAddress, useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";
import { formatCep, formatCpfOrCnpj, formatPhone } from "@/lib/validators";

type Step = 1 | 2; // Step 1: Endereço & Frete | Step 2: Pagamento & Revisão
type PaymentMethod = "card" | "pix" | null;

interface CardForm {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
  cpf: string;
}

interface FormErrors {
  paymentMethod?: string;
  cardName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardCpf?: string;
}

interface ShippingOption {
  id: number | string;
  name: string;
  price: number;
  deliveryTime: number;
  company: string;
  logo?: string;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
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
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState("");
  const [submittedOrderSummary, setSubmittedOrderSummary] = useState<{
    total: number;
    itemsCount: number;
  }>({ total: 0, itemsCount: 0 });

  // Dynamic Shipping Calculation via /api/frete/calcular
  const fetchShippingRates = useCallback(async (cleanCep: string, currentItems: typeof items) => {
    if (cleanCep.length !== 8) return;
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
  }, []);

  // Calculate freight when selectedAddress changes
  useEffect(() => {
    if (selectedAddress?.cep) {
      const cleanCep = selectedAddress.cep.replace(/\D/g, "");
      fetchShippingRates(cleanCep, items);
    }
  }, [selectedAddress, items, fetchShippingRates]);

  // Shipping Fee & Total Calculation
  const shippingCost = items.length === 0
    ? 0
    : selectedShippingOption
      ? selectedShippingOption.price
      : 25;

  const totalPrice = subtotal + shippingCost;

  // Step 1 Validation: Must have a selected address
  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) {
      alert("Selecione um endereço cadastrado para entrega antes de prosseguir.");
      return;
    }
    setStep(2);
  };

  // Finalize Order
  const handleFinalizeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!paymentMethod) {
      newErrors.paymentMethod = "Selecione uma forma de pagamento.";
    }

    if (paymentMethod === "card") {
      if (!card.name.trim()) newErrors.cardName = "Nome impresso no cartão é obrigatório.";
      if (card.number.replace(/\s/g, "").length < 16)
        newErrors.cardNumber = "Número do cartão inválido.";
      if (card.expiry.length < 5) newErrors.cardExpiry = "Validade inválida (MM/AA).";
      if (card.cvv.length < 3) newErrors.cardCvv = "CVV inválido (3 ou 4 dígitos).";
      if (!card.cpf.trim()) newErrors.cardCpf = "CPF do titular é obrigatório.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedAddress) {
      alert("Selecione um endereço para a entrega.");
      return;
    }

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
    });

    setSubmittedOrderNumber(created.orderNumber);
    setSubmittedOrderSummary({
      total: totalPrice,
      itemsCount: items.reduce((s, i) => s + i.quantity, 0),
    });
    setIsSubmitted(true);
    clearCart();
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

    return (
      <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-4 py-8 text-center">

        <div className="mx-auto mt-6 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#C59D3F]/20 text-[#C59D3F]">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold text-content mb-1">
          Pedido Confirmado com Sucesso!
        </h1>
        <p className="font-mono text-sm font-bold text-[#C59D3F] mb-4">
          Código do Pedido: {submittedOrderNumber}
        </p>
        <p className="text-base text-content/75 mb-6">
          Obrigado, <strong className="text-content">{user.firstName} {user.lastName}</strong>. Seu pedido de{" "}
          <strong className="text-[#C59D3F]">{submittedOrderSummary.itemsCount} kit(s)</strong> foi registrado em nosso sistema.
        </p>
        {selectedAddress && (
          <div className="rounded-xl border border-content/12 bg-card p-6 text-left mb-8 space-y-2 font-mono text-sm text-content/80">
            <p>📍 <strong className="text-content">Entrega:</strong> {selectedAddress.street}, {selectedAddress.number} {selectedAddress.complement} - {selectedAddress.city}</p>
            <p>🚚 <strong className="text-content">Frete:</strong> {shippingName} ({formatBRL(shippingCost)})</p>
            <p>💳 <strong className="text-content">Pagamento:</strong> {paymentMethod === "pix" ? "PIX à vista" : "Cartão de Crédito"}</p>
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
                Opções de Envio (Melhor Envio)
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
          <div className="rounded-2xl border border-content/12 bg-card p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-content/60 uppercase">Subtotal + Frete:</span>
              <p className="font-display text-2xl font-bold text-[#C59D3F]">
                {formatBRL(totalPrice)}
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

          {/* SUMMARY REVIEW CARD */}
          {selectedAddress && (
            <div className="rounded-2xl border border-content/12 bg-card p-5 font-mono text-xs space-y-2">
              <p>📍 <strong className="text-content">Endereço Selecionado:</strong> {selectedAddress.street}, {selectedAddress.number} {selectedAddress.complement && `(${selectedAddress.complement})`} - {selectedAddress.city}</p>
              <p>🚚 <strong className="text-content">Frete Escolhido:</strong> {selectedShippingOption ? selectedShippingOption.name : "Frete Padrão"} ({formatBRL(shippingCost)})</p>
              <p>💰 <strong className="text-content">Valor Total do Pedido:</strong> <span className="text-[#C59D3F] font-bold text-sm">{formatBRL(totalPrice)}</span></p>
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
                className={`flex cursor-pointer items-start gap-4.5 rounded-xl border p-5 transition-all ${paymentMethod === "pix"
                    ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content shadow-sm ring-1 ring-[#C59D3F]"
                    : "border-content/15 bg-canvas hover:border-content/30"
                  }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-content">PIX à Vista</h4>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Aprovação Instantânea
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-content/70">
                    QR Code dinâmico do Mercado Pago gerado imediatamente após confirmar.
                  </p>
                </div>
              </div>

              {/* Credit Card Option */}
              <div
                onClick={() => {
                  setPaymentMethod("card");
                  setErrors((prev) => ({ ...prev, paymentMethod: "" }));
                }}
                className={`flex cursor-pointer items-start gap-4.5 rounded-xl border p-5 transition-all ${paymentMethod === "card"
                    ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content shadow-sm ring-1 ring-[#C59D3F]"
                    : "border-content/15 bg-canvas hover:border-content/30"
                  }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C59D3F]/15 text-[#C59D3F]">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-content">Cartão de Crédito</h4>
                  <p className="mt-1 text-xs text-content/70">
                    Parcele em até 12x sem juros com segurança garantida.
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
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                      className={inputClass(!!errors.cardNumber)}
                    />
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
                      onChange={(e) => setCard({ ...card, cpf: formatCpfOrCnpj(e.target.value) })}
                      className={inputClass(!!errors.cardCpf)}
                    />
                    {errors.cardCpf && <p className="mt-1 text-xs text-red-500">{errors.cardCpf}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#C59D3F] py-4 text-base font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-lg active:scale-[0.99]"
          >
            Confirmar & Finalizar Pedido ({formatBRL(totalPrice)}) →
          </button>
        </form>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main className="bg-canvas">
        <CheckoutContent />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
