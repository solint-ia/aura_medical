"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Edit2,
  Lock,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";

type Step = 1 | 2 | 3;
type PaymentMethod = "card" | "pix" | null;

interface ContactForm {
  name: string;
  email: string;
  phone: string;
}

interface AddressForm {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
}

interface CardForm {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
  cpf: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  paymentMethod?: string;
  cardName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardCpf?: string;
}

// Format Helpers
function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function CheckoutContent() {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated } = useCart();

  const [step, setStep] = useState<Step>(1);

  const [contact, setContact] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
  });

  const [address, setAddress] = useState<AddressForm>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    uf: "",
  });

  const [card, setCard] = useState<CardForm>({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
    cpf: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [shippingMethod, setShippingMethod] = useState<"pac" | "sedex">("sedex");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrderSummary, setSubmittedOrderSummary] = useState<{
    total: number;
    itemsCount: number;
  }>({ total: 0, itemsCount: 0 });

  // Shipping Fee & Total
  const shippingCost = items.length === 0 ? 0 : shippingMethod === "sedex" ? 45 : 25;
  const totalPrice = subtotal + shippingCost;

  // Auto-fill address via ViaCEP API
  const fetchAddressByCep = useCallback(async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    setCepError("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepError("CEP não encontrado.");
      } else {
        setAddress((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade ? `${data.localidade} - ${data.uf}` : prev.city,
          uf: data.uf || prev.uf,
        }));
        setErrors((prev) => ({
          ...prev,
          cep: undefined,
          street: undefined,
          neighborhood: undefined,
          city: undefined,
        }));
      }
    } catch {
      setCepError("Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  }, []);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setAddress((prev) => ({ ...prev, cep: formatted }));
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      fetchAddressByCep(digits);
    }
  };

  // Step 1 Validation (Contact + Address)
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!contact.name.trim()) newErrors.name = "Nome completo é obrigatório.";

    if (!contact.email.trim()) {
      newErrors.email = "E-mail é obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      newErrors.email = "E-mail com formato inválido.";
    }

    const phoneDigits = contact.phone.replace(/\D/g, "");
    if (!contact.phone.trim()) {
      newErrors.phone = "Telefone/WhatsApp é obrigatório.";
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      newErrors.phone = "Telefone deve ter entre 10 e 11 dígitos com DDD.";
    }

    const cepDigits = address.cep.replace(/\D/g, "");
    if (!address.cep.trim()) newErrors.cep = "CEP é obrigatório.";
    else if (cepDigits.length !== 8) newErrors.cep = "CEP deve ter 8 dígitos.";

    if (!address.street.trim()) newErrors.street = "Endereço é obrigatório.";
    if (!address.number.trim()) newErrors.number = "Número é obrigatório.";
    if (!address.neighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório.";
    if (!address.city.trim()) newErrors.city = "Cidade e UF são obrigatórias.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step 2 Validation (Payment Method)
  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!paymentMethod) {
      newErrors.paymentMethod = "Selecione uma forma de pagamento (PIX ou Cartão).";
    } else if (paymentMethod === "card") {
      if (!card.name.trim()) newErrors.cardName = "Nome no cartão é obrigatório.";

      const cardDigits = card.number.replace(/\D/g, "");
      if (!card.number.trim()) newErrors.cardNumber = "Número do cartão é obrigatório.";
      else if (cardDigits.length !== 16) newErrors.cardNumber = "Cartão deve ter 16 dígitos.";

      if (!card.expiry.trim()) newErrors.cardExpiry = "Validade (MM/AA) é obrigatória.";

      const cvvDigits = card.cvv.replace(/\D/g, "");
      if (!card.cvv.trim()) newErrors.cardCvv = "CVV é obrigatório.";
      else if (cvvDigits.length < 3) newErrors.cardCvv = "CVV inválido.";

      const cpfDigits = card.cpf.replace(/\D/g, "");
      if (!card.cpf.trim()) newErrors.cardCpf = "CPF do titular é obrigatório.";
      else if (cpfDigits.length !== 11) newErrors.cardCpf = "CPF inválido.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step 3 Final Submission
  const handleFinalizeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1() && validateStep2()) {
      setSubmittedOrderSummary({
        total: totalPrice,
        itemsCount: items.reduce((s, i) => s + i.quantity, 0),
      });
      setIsSubmitted(true);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border px-3.5 py-3 text-sm transition-colors outline-none ${hasError
      ? "border-red-500 bg-red-500/5 text-red-900 dark:text-red-200 focus:border-red-600"
      : "border-content/18 bg-canvas dark:bg-card text-content focus:border-[#C59D3F]"
    }`;

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono text-sm text-content/60">
        Carregando informações do checkout...
      </div>
    );
  }

  // REDIRECT IF CART IS EMPTY (AND NOT YET SUBMITTED)
  if (items.length === 0 && !isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
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
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Image
          src="/logos/logo-vertical-2.png"
          alt="Aura Regenera"
          width={260}
          height={260}
          className="h-32 sm:h-36 md:h-40 w-auto object-contain mx-auto mb-4 drop-shadow-md"
        />
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#C59D3F]/20 text-[#C59D3F]">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold text-content mb-3">
          Pedido Confirmado com Sucesso!
        </h1>
        <p className="text-base text-content/75 mb-6">
          Obrigado, <strong className="text-content">{contact.name}</strong>. Seu pedido de{" "}
          <strong className="text-[#C59D3F]">{submittedOrderSummary.itemsCount} kit(s)</strong> foi registrado em nosso sistema.
        </p>
        <div className="rounded-xl border border-content/12 bg-card p-6 text-left mb-8 space-y-2 font-mono text-sm text-content/80">
          <p>📍 <strong className="text-content">Entrega:</strong> {address.street}, {address.number} {address.complement} - {address.city}</p>
          <p>🚚 <strong className="text-content">Frete:</strong> {shippingMethod.toUpperCase()} ({formatBRL(shippingCost)})</p>
          <p>💳 <strong className="text-content">Pagamento:</strong> {paymentMethod === "pix" ? "PIX à vista" : "Cartão de Crédito"}</p>
          <p>💰 <strong className="text-content">Valor Total:</strong> {formatBRL(submittedOrderSummary.total)}</p>
        </div>
        <p className="text-sm text-content/60 mb-8">
          Nosso time comercial entrará em contato via WhatsApp ({contact.phone}) para confirmação de entrega e emissão de nota fiscal.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-[#C59D3F] px-8 py-3.5 font-semibold text-[#0D1B2A] transition-colors hover:bg-[#d4ac4c]"
        >
          Voltar à Página Principal
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-[clamp(20px,4vw,56px)] py-10">
      {/* Top Actions Bar (Back Link & Cart Counter) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
        <button
          type="button"
          onClick={() => router.push("/carrinho")}
          className="inline-flex items-center gap-2 font-mono text-xs font-medium text-content/60 hover:text-accent uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Carrinho</span>
        </button>

        {/* Compact Cart Item Count Badge */}
        <span className="rounded-full border border-content/15 bg-card px-3.5 py-1 font-mono text-xs text-content/75 shadow-xs">
          {items.reduce((s, i) => s + i.quantity, 0)} item(ns) no carrinho
        </span>
      </div>

      {/* Mobile Stepper Header & Progress Indicator (Visible only on Mobile) */}
      <div className="mb-8 space-y-3 rounded-2xl border border-content/12 bg-card p-4.5 shadow-xs md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C59D3F] font-mono text-[11px] font-bold text-[#0D1B2A]">
              {step}
            </span>
            <span className="font-mono text-xs font-bold text-content uppercase tracking-wider">
              Passo {step} de 3:{" "}
              {step === 1
                ? "Dados & Entrega"
                : step === 2
                  ? "Pagamento"
                  : "Revisão do Pedido"}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-[#C59D3F]">
            {step === 1 ? "33%" : step === 2 ? "66%" : "100%"}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-content/10">
          <div
            className="h-full bg-[#C59D3F] transition-all duration-300 ease-out"
            style={{ width: step === 1 ? "33.33%" : step === 2 ? "66.66%" : "100%" }}
          />
        </div>

        {/* Quick Number Switcher Buttons for Mobile */}
        <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1 font-semibold ${step === 1 ? "text-[#C59D3F]" : "text-content/60"
              }`}
          >
            <span>1. Dados</span>
          </button>

          <span className="text-content/20">|</span>

          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
            className={`flex items-center gap-1 font-semibold ${step === 2 ? "text-[#C59D3F]" : step > 2 ? "text-content/60" : "text-content/30"
              }`}
          >
            <span>2. Pagamento</span>
          </button>

          <span className="text-content/20">|</span>

          <button
            type="button"
            onClick={() => {
              if (validateStep1() && validateStep2()) setStep(3);
            }}
            className={`flex items-center gap-1 font-semibold ${step === 3 ? "text-[#C59D3F]" : "text-content/30"
              }`}
          >
            <span>3. Revisão</span>
          </button>
        </div>
      </div>

      {/* Desktop 3-Step Tracker (Hidden on Mobile) */}
      <div className="mb-10 hidden items-center justify-between border-b border-content/12 pb-5 font-mono text-xs tracking-wider uppercase md:flex">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 font-semibold transition-colors ${step === 1 ? "text-[#C59D3F]" : "text-content/70 hover:text-content"
            }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step === 1
                ? "bg-[#C59D3F] text-[#0D1B2A]"
                : "bg-[#C59D3F]/20 text-[#C59D3F]"
              }`}
          >
            1
          </span>
          <span>1. Dados & Entrega</span>
        </button>

        <span className="text-content/25">/</span>

        <button
          type="button"
          onClick={() => {
            if (validateStep1()) setStep(2);
          }}
          className={`flex items-center gap-2 font-semibold transition-colors ${step === 2
              ? "text-[#C59D3F]"
              : step > 2
                ? "text-content/70 hover:text-content"
                : "text-content/40"
            }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step === 2
                ? "bg-[#C59D3F] text-[#0D1B2A]"
                : step > 2
                  ? "bg-[#C59D3F]/20 text-[#C59D3F]"
                  : "bg-content/10 text-content/50"
              }`}
          >
            2
          </span>
          <span>2. Pagamento</span>
        </button>

        <span className="text-content/25">/</span>

        <button
          type="button"
          onClick={() => {
            if (validateStep1() && validateStep2()) setStep(3);
          }}
          className={`flex items-center gap-2 font-semibold transition-colors ${step === 3 ? "text-[#C59D3F]" : "text-content/40"
            }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step === 3
                ? "bg-[#C59D3F] text-[#0D1B2A]"
                : "bg-content/10 text-content/50"
              }`}
          >
            3
          </span>
          <span>3. Revisão do Pedido</span>
        </button>
      </div>

      {/* STEP 1: Identification & Shipping Address */}
      {step === 1 && (
        <form onSubmit={handleContinueToStep2} className="space-y-8 max-w-3xl mx-auto">
          <div>
            <h2 className="font-display text-2xl font-bold text-content mb-1">
              1. Dados Pessoais & Endereço de Entrega
            </h2>
            <p className="text-sm text-content/70">
              Informe seus dados de contato e o endereço para entrega dos produtos.
            </p>
          </div>

          {/* Contact Details Section */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider">
              Informações de Contato
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Maria Silva"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className={inputClass(!!errors.name)}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                  E-mail *
                </label>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com.br"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className={inputClass(!!errors.email)}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: formatPhone(e.target.value) })}
                  className={inputClass(!!errors.phone)}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider">
              Endereço de Entrega
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                  CEP *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="00000-000"
                    maxLength={9}
                    value={address.cep}
                    onChange={handleCepChange}
                    className={inputClass(!!errors.cep || !!cepError)}
                  />
                  {cepLoading && (
                    <span className="absolute right-3 top-3.5 font-mono text-xs text-[#C59D3F]">
                      Buscando...
                    </span>
                  )}
                </div>
                {errors.cep && <p className="mt-1 text-xs text-red-500">{errors.cep}</p>}
                {cepError && <p className="mt-1 text-xs text-red-500">{cepError}</p>}
              </div>

              <div>
                <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                  Logradouro / Rua *
                </label>
                <input
                  type="text"
                  placeholder="Av. Paulista"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className={inputClass(!!errors.street)}
                />
                {errors.street && <p className="mt-1 text-xs text-red-500">{errors.street}</p>}
              </div>

              <div>
                <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                  Número *
                </label>
                <input
                  type="text"
                  placeholder="1000"
                  value={address.number}
                  onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  className={inputClass(!!errors.number)}
                />
                {errors.number && <p className="mt-1 text-xs text-red-500">{errors.number}</p>}
              </div>

              <div>
                <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                  Complemento
                </label>
                <input
                  type="text"
                  placeholder="Apto 42"
                  value={address.complement}
                  onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                  className={inputClass()}
                />
              </div>

              <div>
                <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                  Bairro *
                </label>
                <input
                  type="text"
                  placeholder="Bela Vista"
                  value={address.neighborhood}
                  onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  className={inputClass(!!errors.neighborhood)}
                />
                {errors.neighborhood && <p className="mt-1 text-xs text-red-500">{errors.neighborhood}</p>}
              </div>

              <div>
                <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                  Cidade / UF *
                </label>
                <input
                  type="text"
                  placeholder="São Paulo - SP"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className={inputClass(!!errors.city)}
                />
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
              </div>
            </div>
          </div>

          {/* Shipping Choice */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider">
              Opção de Envio
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${shippingMethod === "sedex"
                    ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content"
                    : "border-content/15 bg-canvas hover:border-content/30"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === "sedex"}
                    onChange={() => setShippingMethod("sedex")}
                    className="accent-[#C59D3F]"
                  />
                  <div>
                    <div className="font-bold text-sm">SEDEX Expresso</div>
                    <div className="text-xs text-content/65">Entrega em 1 a 3 dias úteis</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-[#C59D3F]">R$ 45,00</span>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${shippingMethod === "pac"
                    ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content"
                    : "border-content/15 bg-canvas hover:border-content/30"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === "pac"}
                    onChange={() => setShippingMethod("pac")}
                    className="accent-[#C59D3F]"
                  />
                  <div>
                    <div className="font-bold text-sm">PAC Econômico</div>
                    <div className="text-xs text-content/65">Entrega em 5 a 8 dias úteis</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-[#C59D3F]">R$ 25,00</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#C59D3F] py-4 text-base font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-lg active:scale-[0.99]"
          >
            Continuar para Pagamento →
          </button>
        </form>
      )}

      {/* STEP 2: Payment Method */}
      {step === 2 && (
        <form onSubmit={handleContinueToStep3} className="space-y-8 max-w-3xl mx-auto">
          <div>
            <h2 className="font-display text-2xl font-bold text-content mb-1">
              2. Forma de Pagamento
            </h2>
            <p className="text-sm text-content/70">
              Escolha como deseja realizar o pagamento do seu pedido.
            </p>
          </div>

          {/* Quick summary of Step 1 */}
          <div className="rounded-xl border border-content/12 bg-canvas p-4 text-xs font-mono flex items-center justify-between">
            <div>
              <span className="text-content/60">Entrega para: </span>
              <strong className="text-content">{contact.name}</strong> ({address.street}, {address.number} - {address.city})
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[#C59D3F] underline font-bold ml-3 shrink-0"
            >
              Editar
            </button>
          </div>

          {/* Payment Selection Cards */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-6">
            {errors.paymentMethod && (
              <p className="rounded-lg bg-red-500/10 p-3 text-xs font-semibold text-red-500">
                {errors.paymentMethod}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("pix");
                  setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                }}
                className={`flex flex-col items-center justify-center rounded-xl border p-5 transition-all text-center ${paymentMethod === "pix"
                    ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content shadow-sm"
                    : "border-content/15 bg-canvas hover:border-content/30 text-content/80"
                  }`}
              >
                <QrCode className="h-8 w-8 text-[#C59D3F] mb-2" />
                <span className="font-bold text-sm">PIX à Vista</span>
                <span className="text-xs text-[#C59D3F] font-mono mt-1 font-semibold">
                  Aprovação Imediata
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("card");
                  setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                }}
                className={`flex flex-col items-center justify-center rounded-xl border p-5 transition-all text-center ${paymentMethod === "card"
                    ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content shadow-sm"
                    : "border-content/15 bg-canvas hover:border-content/30 text-content/80"
                  }`}
              >
                <CreditCard className="h-8 w-8 text-[#C59D3F] mb-2" />
                <span className="font-bold text-sm">Cartão de Crédito</span>
                <span className="text-xs text-content/60 font-mono mt-1">
                  Até 12x sem juros
                </span>
              </button>
            </div>

            {/* Credit Card Form Fields */}
            {paymentMethod === "card" && (
              <div className="space-y-4 pt-4 border-t border-content/10">
                <div>
                  <label className="block mb-1 font-mono text-[11px] text-content/65 uppercase">
                    Nome impresso no cartão *
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

                <div>
                  <label className="block mb-1 font-mono text-[11px] text-content/65 uppercase">
                    Número do cartão *
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-mono text-[11px] text-content/65 uppercase">
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
                    <label className="block mb-1 font-mono text-[11px] text-content/65 uppercase">
                      CVV *
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
                </div>

                <div>
                  <label className="block mb-1 font-mono text-[11px] text-content/65 uppercase">
                    CPF do Titular *
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

                <div className="mt-4 rounded-xl border border-content/10 bg-canvas p-3.5 text-xs text-content/75 leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#C59D3F] shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-content font-bold">Não Armazenamento de Dados:</strong> Os dados do seu cartão de crédito (número, validade e CVV) são transmitidos diretamente para a credenciadora. A Aura Regenera não armazena nem tem acesso aos dados completos do seu cartão.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 rounded-xl border border-content/20 bg-transparent py-4 text-sm font-semibold text-content hover:bg-content/5"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              className="w-2/3 rounded-xl bg-[#C59D3F] py-4 text-base font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-lg active:scale-[0.99]"
            >
              Revisar Pedido →
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Review & Confirm (Order Summary & Final Submit Button ONLY rendered here) */}
      {step === 3 && (
        <form onSubmit={handleFinalizeOrder} className="space-y-8 max-w-3xl mx-auto">
          <div>
            <h2 className="font-display text-2xl font-bold text-content mb-1">
              3. Revisão & Confirmação do Pedido
            </h2>
            <p className="text-sm text-content/70">
              Confirme os dados de entrega, pagamento e os itens do seu pedido antes de finalizar.
            </p>
          </div>

          {/* Masked Reassurance Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Contact & Address Reassurance Card */}
            <div className="rounded-2xl border border-content/12 bg-card p-5 space-y-2">
              <div className="flex items-center justify-between border-b border-content/10 pb-2">
                <span className="font-mono text-xs font-bold text-[#C59D3F] uppercase">
                  Dados & Entrega
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#C59D3F] hover:underline"
                >
                  <Edit2 className="h-3 w-3" />
                  Editar
                </button>
              </div>
              <p className="text-sm font-bold text-content">{contact.name}</p>
              <p className="text-xs text-content/75 font-mono">{contact.email} · {contact.phone}</p>
              <p className="text-xs text-content/75 font-mono pt-1">
                📍 {address.street}, {address.number} {address.complement && `(${address.complement})`} - {address.neighborhood}, {address.city}
              </p>
              <p className="text-xs text-[#C59D3F] font-mono font-semibold pt-1">
                🚚 Frete {shippingMethod.toUpperCase()} ({formatBRL(shippingCost)})
              </p>
            </div>

            {/* Payment Method Reassurance Card */}
            <div className="rounded-2xl border border-content/12 bg-card p-5 space-y-2">
              <div className="flex items-center justify-between border-b border-content/10 pb-2">
                <span className="font-mono text-xs font-bold text-[#C59D3F] uppercase">
                  Forma de Pagamento
                </span>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#C59D3F] hover:underline"
                >
                  <Edit2 className="h-3 w-3" />
                  Editar
                </button>
              </div>
              {paymentMethod === "pix" ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-content flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-[#C59D3F]" />
                    PIX à Vista
                  </p>
                  <p className="text-xs text-content/70 font-mono">
                    QR Code e Chave Copia e Cola gerados imediatamente na confirmação.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-content flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-[#C59D3F]" />
                    Cartão de Crédito
                  </p>
                  <p className="text-xs text-content/75 font-mono">
                    •••• •••• •••• {card.number.replace(/\s/g, "").slice(-4) || "****"}
                  </p>
                  <p className="text-xs text-content/65 font-mono">
                    Titular: {card.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resumo do Pedido Card (Only in Step 3) */}
          <div className="rounded-2xl border border-content/12 bg-card p-6 shadow-md">
            <h3 className="font-display text-lg font-bold text-content mb-4 border-b border-content/10 pb-3">
              Resumo do Pedido
            </h3>

            {/* List of Cart Items */}
            <div className="mb-5 space-y-3 divide-y divide-content/10">
              {items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-content">
                      Protocolo {item.name}
                    </span>
                    <span className="font-mono font-semibold text-content">
                      {formatBRL(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-content/60 font-mono mt-0.5">
                    <span>Qtd: {item.quantity} × {formatBRL(item.unitPrice)}</span>
                    <span>{item.vials * item.quantity} frascos total</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Itemized Totals */}
            <div className="space-y-2.5 text-xs text-content/75 mb-6 border-t border-content/10 pt-4">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} kits)</span>
                <span className="font-mono">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete ({shippingMethod.toUpperCase()})</span>
                <span className="font-mono">{formatBRL(shippingCost)}</span>
              </div>
              <div className="flex justify-between border-t border-content/10 pt-3 text-base font-bold text-content">
                <span>Total Final</span>
                <span className="font-mono text-[#C59D3F]">{formatBRL(totalPrice)}</span>
              </div>
            </div>

            {/* Trust Badges & Terms Reassurance Block */}
            <div className="space-y-3 rounded-xl border border-content/10 bg-canvas p-4 text-xs text-content/75 mb-6">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#C59D3F] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-content font-bold">Não Armazenamento de Cartão:</strong> Os dados do seu cartão de crédito (número, validade e CVV) são transmitidos diretamente para a credenciadora. A Aura Regenera não armazena nem tem acesso aos dados completos do seu cartão.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-[#C59D3F] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-content font-bold">Responsabilidade Profissional:</strong> O comprador assume integral responsabilidade pela correta reconstituição, técnica de manipulação e aplicação clínica dos protocolos adquiridos.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-[#C59D3F] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-content font-bold">Privacidade & LGPD:</strong> Os dados pessoais coletados (Nome, CPF/CNPJ, Endereço, E-mail e Telefone) são utilizados estritamente para faturamento, emissão de Nota Fiscal Eletrônica (NF-e), logística de transporte e suporte técnico pós-venda.
                </p>
              </div>
            </div>

            {/* ISOLATED FINAL SUBMIT BUTTON (ONLY IN STEP 3) */}
            <button
              type="submit"
              className="w-full rounded-xl bg-[#C59D3F] py-4 text-lg font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-xl active:scale-[0.99] flex items-center justify-center gap-2.5"
            >
              <Lock className="h-5 w-5" />
              <span>Finalizar Compra ({formatBRL(totalPrice)})</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main className="bg-canvas min-h-screen">
        <CheckoutContent />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
