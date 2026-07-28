"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CreditCard, Lock, QrCode, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";

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
  cardName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardCpf?: string;
  paymentMethod?: string;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function CheckoutContent() {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated } = useCart();

  // Checkout Steps: 1 = Contact Info, 2 = Shipping & Payment
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
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

  // Payment method starts UNSELECTED (null)
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

  // Step 1 Validation
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

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    const cepDigits = address.cep.replace(/\D/g, "");
    if (!address.cep.trim()) newErrors.cep = "CEP é obrigatório.";
    else if (cepDigits.length !== 8) newErrors.cep = "CEP deve ter 8 dígitos.";

    if (!address.street.trim()) newErrors.street = "Endereço é obrigatório.";
    if (!address.number.trim()) newErrors.number = "Número é obrigatório.";
    if (!address.neighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório.";
    if (!address.city.trim()) newErrors.city = "Cidade e UF são obrigatórias.";

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

  const handleFinalizeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
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
    `w-full rounded-lg border px-3.5 py-3 text-sm transition-colors outline-none ${
      hasError
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
          Nosso time comercial entrará em contato via WhatsApp ({contact.phone}) para confirmação de entrega e emissão de nota fiscal médica.
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
    <div className="mx-auto max-w-7xl px-[clamp(20px,4vw,56px)] py-10">
      {/* Back button */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push("/carrinho")}
          className="inline-flex items-center gap-2 font-mono text-xs text-content/60 hover:text-accent uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Carrinho
        </button>
      </div>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Multi-Step Form */}
        <div className="order-2 lg:order-1 lg:col-span-7">
          {/* Step Indicator */}
          <div className="mb-8 flex items-center gap-4 border-b border-content/12 pb-5 font-mono text-xs tracking-wider uppercase">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 font-semibold transition-colors ${
                step === 1 ? "text-[#C59D3F]" : "text-content/60 hover:text-content"
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${step === 1 ? "bg-[#C59D3F] text-[#0D1B2A]" : "bg-content/15 text-content"}`}>
                1
              </span>
              Seus Dados
            </button>
            <span className="text-content/30">/</span>
            <span
              className={`flex items-center gap-2 font-semibold ${
                step === 2 ? "text-[#C59D3F]" : "text-content/40"
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${step === 2 ? "bg-[#C59D3F] text-[#0D1B2A]" : "bg-content/10 text-content/50"}`}>
                2
              </span>
              Entrega e Pagamento
            </span>
          </div>

          {/* STEP 1: Contato */}
          {step === 1 ? (
            <form onSubmit={handleContinueToStep2} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-content mb-1">
                  1. Dados de Contato
                </h2>
                <p className="text-sm text-content/70">
                  Informe seus dados para contato e confirmação do pedido.
                </p>
              </div>

              <div className="space-y-4">
                <div>
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

              <button
                type="submit"
                className="w-full rounded-lg bg-[#C59D3F] py-4 text-base font-semibold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
              >
                Continuar para Entrega e Pagamento →
              </button>
            </form>
          ) : (
            /* STEP 2: Endereço & Forma de Pagamento */
            <form onSubmit={handleFinalizeOrder} className="space-y-8">
              {/* Address section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl font-bold text-content">
                    2. Endereço de Entrega
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="font-mono text-xs text-[#C59D3F] hover:underline"
                  >
                    Editar contato ({contact.name})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                      CEP * {cepLoading && "(buscando...)"}
                    </label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={address.cep}
                      onChange={handleCepChange}
                      className={inputClass(!!errors.cep)}
                    />
                    {errors.cep && <p className="mt-1 text-xs text-red-500">{errors.cep}</p>}
                    {cepError && <p className="mt-1 text-xs text-red-500">{cepError}</p>}
                  </div>

                  <div>
                    <label className="block mb-1.5 font-mono text-xs text-content/75 uppercase tracking-wider">
                      Endereço *
                    </label>
                    <input
                      type="text"
                      placeholder="Rua / Avenida"
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
                      placeholder="123"
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
                      placeholder="Sala 402, Bloco B"
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
                      placeholder="Centro"
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

              {/* Shipping Options */}
              <div>
                <h3 className="font-mono text-xs text-content/75 uppercase tracking-wider mb-3">
                  Opção de Frete
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                      shippingMethod === "sedex"
                        ? "border-[#C59D3F] bg-[#C59D3F]/10"
                        : "border-content/15 bg-card hover:border-content/30"
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
                        <p className="font-bold text-sm text-content">SEDEX Express</p>
                        <p className="text-xs text-content/60">1 a 2 dias úteis</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold text-content">
                      {formatBRL(45)}
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                      shippingMethod === "pac"
                        ? "border-[#C59D3F] bg-[#C59D3F]/10"
                        : "border-content/15 bg-card hover:border-content/30"
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
                        <p className="font-bold text-sm text-content">PAC Padrão</p>
                        <p className="text-xs text-content/60">3 a 5 dias úteis</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold text-content">
                      {formatBRL(25)}
                    </span>
                  </label>
                </div>
              </div>

              {/* PAYMENT METHOD SECTION */}
              <div>
                <h3 className="font-display text-xl font-bold text-content mb-2">
                  Forma de Pagamento
                </h3>
                <p className="text-xs text-content/60 mb-4">
                  Escolha como deseja realizar o pagamento do seu pedido.
                </p>

                {errors.paymentMethod && (
                  <p className="mb-4 text-xs font-semibold text-red-500">{errors.paymentMethod}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* PIX Option */}
                  <div
                    onClick={() => {
                      setPaymentMethod("pix");
                      setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "pix"
                        ? "border-[#C59D3F] bg-[#C59D3F]/10 shadow-sm"
                        : "border-content/15 bg-card hover:border-content/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "pix"}
                      onChange={() => {
                        setPaymentMethod("pix");
                        setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                      }}
                      className="accent-[#C59D3F]"
                    />
                    <QrCode className="h-5 w-5 text-[#C59D3F]" />
                    <div>
                      <p className="font-bold text-sm text-content">PIX à Vista</p>
                      <p className="text-xs text-content/60">Aprovação imediata</p>
                    </div>
                  </div>

                  {/* Credit Card Option */}
                  <div
                    onClick={() => {
                      setPaymentMethod("card");
                      setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "border-[#C59D3F] bg-[#C59D3F]/10 shadow-sm"
                        : "border-content/15 bg-card hover:border-content/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() => {
                        setPaymentMethod("card");
                        setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                      }}
                      className="accent-[#C59D3F]"
                    />
                    <CreditCard className="h-5 w-5 text-[#C59D3F]" />
                    <div>
                      <p className="font-bold text-sm text-content">Cartão de Crédito</p>
                      <p className="text-xs text-content/60">Em até 6x sem juros</p>
                    </div>
                  </div>
                </div>

                {/* Conditional Payment UI */}
                {paymentMethod === "pix" ? (
                  <div className="rounded-xl border border-[#C59D3F]/30 bg-card p-6 text-center space-y-3">
                    <p className="font-bold text-sm text-content">
                      Pagamento via PIX Selecionado
                    </p>
                    <p className="text-xs text-content/75 max-w-md mx-auto">
                      Ao finalizar a compra, a chave PIX e o QR Code serão exibidos para pagamento. Seu pedido é processado imediatamente após a confirmação.
                    </p>
                  </div>
                ) : paymentMethod === "card" ? (
                  <div className="rounded-xl border border-content/12 bg-card p-6 space-y-4">
                    <p className="font-mono text-xs text-content/75 uppercase tracking-wider mb-2">
                      Dados do Cartão de Crédito
                    </p>

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
                  </div>
                ) : null}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full rounded-lg bg-[#C59D3F] py-4 text-base font-semibold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-lg active:scale-[0.99]"
              >
                Finalizar Compra ({formatBRL(totalPrice)})
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Order Summary Sidebar (Mirroring Cart State) */}
        <div className="order-1 lg:order-2 lg:col-span-5">
          <div className="sticky top-28 rounded-2xl border border-content/12 bg-card p-6 shadow-md">
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

            {/* Pricing Itemized */}
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
                <span>Total</span>
                <span className="font-mono text-[#C59D3F]">{formatBRL(totalPrice)}</span>
              </div>
            </div>

            {/* Clinical D2C Security & Trust Badges */}
            <div className="space-y-2.5 rounded-xl bg-canvas p-4 text-[11.5px] text-content/70 font-mono">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C59D3F] shrink-0" />
                <span>Biotecnologia de Alta Performance</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#C59D3F] shrink-0" />
                <span>Entrega Rápida e Segura</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#C59D3F] shrink-0" />
                <span>Pagamento 100% seguro e criptografado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
