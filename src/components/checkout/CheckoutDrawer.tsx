"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { formatBRL } from "@/lib/format";

/** A single shipping option, shaped to match the Melhor Envio quote response. */
interface ShippingOption {
  id: string;
  /** Service name, e.g. "PAC", "SEDEX". */
  name: string;
  company: string;
  price: number;
  /** Delivery estimate in business days. */
  deliveryTime: number;
}

type ShippingStatus = "idle" | "loading" | "ready" | "error";
type CepStatus = "idle" | "loading" | "done" | "error";
type PaymentMethod = "card" | "pix";

interface AddressForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  uf: string;
  number: string;
  complement: string;
}

const EMPTY_ADDRESS: AddressForm = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  cep: "",
  street: "",
  neighborhood: "",
  city: "",
  uf: "",
  number: "",
  complement: "",
};

interface CardForm {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
  cpf: string;
}

const EMPTY_CARD: CardForm = {
  name: "",
  number: "",
  expiry: "",
  cvv: "",
  cpf: "",
};

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
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
}

/**
 * Mock freight quote returned by "Calcular". Swap for the live Melhor Envio
 * response — the shape already matches, so the UI below needs no changes.
 */
const MOCK_SHIPPING: ShippingOption[] = [
  { id: "pac", name: "PAC", company: "Correios", price: 35, deliveryTime: 5 },
  { id: "sedex", name: "Sedex", company: "Correios", price: 65, deliveryTime: 2 },
];

/** Group card digits into blocks of four: "1234 5678 9012 3456". */
function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

/** Insert the slash as the user types: "1225" -> "12/25". */
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Mask the CPF: "12345678901" -> "123.456.789-01". */
function formatCpf(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Mask phone/WhatsApp: "(11) 99999-9999" or "(11) 9999-9999". */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  return digits.length === 11;
}

function validateCep(cep: string): boolean {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8;
}

function validateCardNumber(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  return digits.length === 16;
}

function validateExpiry(expiry: string): boolean {
  const digits = expiry.replace(/\D/g, "");
  if (digits.length !== 4) return false;
  const month = parseInt(digits.slice(0, 2), 10);
  return month >= 1 && month <= 12;
}

function validateCvv(cvv: string): boolean {
  const digits = cvv.replace(/\D/g, "");
  return digits.length >= 3 && digits.length <= 4;
}

/** PIX settles instantly, so we pass the saving straight to the buyer. */
const PIX_DISCOUNT_RATE = 0.05;
const CLOSE_ANIMATION_MS = 300;
const VALIDATION_DELAY_MS = 1400;

const LABEL_CLASSES =
  "mb-1.5 block font-mono text-[10.5px] font-medium tracking-[0.08em] text-content/55 uppercase";

function getFieldClasses(hasError?: boolean, extraClasses: string = ""): string {
  const base =
    "w-full rounded-lg border bg-card dark:bg-canvas px-3.5 py-3 text-[14.5px] text-content placeholder:text-content/40 transition-colors focus:outline-2 focus:outline-offset-1";
  const status = hasError
    ? "border-red-500/80 focus:border-red-500 focus:outline-red-500/60 dark:border-red-500"
    : "border-content/18 focus:border-[#C59D3F] focus:outline-[#C59D3F]/60";
  return `${base} ${status} ${extraClasses}`.trim();
}

interface CheckoutDrawerProps {
  protocolName: string;
  /** Price of a single kit, in whole reais. */
  unitPrice: number;
  /** Number of enzyme vials in one kit — shown in the order summary. */
  vials: number;
  /** Optional custom button label for the trigger button. */
  buttonLabel?: string;
  /** Optional custom button className for the trigger button. */
  buttonClassName?: string;
}

/**
 * Trigger button plus the slide-over checkout drawer it opens.
 */
export function CheckoutDrawer({
  protocolName,
  unitPrice,
  vials,
  buttonLabel = "Comprar Kit",
  buttonClassName,
}: CheckoutDrawerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const [form, setForm] = useState<AddressForm>(EMPTY_ADDRESS);
  const [card, setCard] = useState<CardForm>(EMPTY_CARD);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");

  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
  const [shippingStatus, setShippingStatus] = useState<ShippingStatus>("idle");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation states
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();

  const cepDigits = form.cep.replace(/\D/g, "");

  const open = () => setIsMounted(true);

  const requestClose = useCallback(() => setIsVisible(false), []);

  // Two-step mount so the panel animates in from the edge instead of snapping.
  useEffect(() => {
    if (!isMounted) return;
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isMounted]);

  // Lock the page scroll and wire Escape while the drawer is on screen.
  useEffect(() => {
    if (!isMounted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMounted, requestClose]);

  // Unmount only after the slide-out finishes, so the exit is animated too.
  useEffect(() => {
    if (isMounted && !isVisible) {
      closeTimer.current = setTimeout(() => {
        setIsMounted(false);
        // Reset for the next open so nothing leaks between sessions.
        setForm(EMPTY_ADDRESS);
        setCard(EMPTY_CARD);
        setQuantity(1);
        setPaymentMethod("pix");
        setCepStatus("idle");
        setShippingStatus("idle");
        setShippingOptions([]);
        setSelectedShippingId(null);
        setIsSubmitting(false);
        setSubmitted(false);
        setErrors({});
      }, CLOSE_ANIMATION_MS);

      return () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
      };
    }
  }, [isMounted, isVisible]);

  // Auto-fill the address from ViaCEP once a full 8-digit CEP is typed.
  useEffect(() => {
    if (cepDigits.length !== 8) return;

    let cancelled = false;

    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data.erro) {
          setCepStatus("error");
          return;
        }
        setForm((current) => ({
          ...current,
          street: data.logradouro ?? current.street,
          neighborhood: data.bairro ?? current.neighborhood,
          city: data.localidade ?? current.city,
          uf: data.uf ?? current.uf,
        }));
        setCepStatus("done");
        setShippingStatus("idle");
        setShippingOptions([]);
        setSelectedShippingId(null);
      })
      .catch(() => {
        if (!cancelled) setCepStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [cepDigits]);

  const updateField = (field: keyof AddressForm) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (submitted) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FormErrors];
        return next;
      });
    }
  };

  const updateCard = (field: keyof CardForm) => (value: string) => {
    setCard((current) => ({ ...current, [field]: value }));
    if (submitted) {
      setErrors((prev) => {
        const next = { ...prev };
        const errorKeyMap: Record<keyof CardForm, keyof FormErrors> = {
          name: "cardName",
          number: "cardNumber",
          expiry: "cardExpiry",
          cvv: "cardCvv",
          cpf: "cardCpf",
        };
        delete next[errorKeyMap[field]];
        return next;
      });
    }
  };

  const handleCepChange = (value: string) => {
    setForm((current) => ({ ...current, cep: value }));
    setCepStatus(value.replace(/\D/g, "").length === 8 ? "loading" : "idle");
    if (submitted) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.cep;
        return next;
      });
    }
  };

  const calculateShipping = () => {
    if (cepDigits.length !== 8) {
      setShippingStatus("error");
      return;
    }
    setShippingOptions(MOCK_SHIPPING);
    setSelectedShippingId(null);
    setShippingStatus("ready");
  };

  const selectedShipping =
    shippingOptions.find((option) => option.id === selectedShippingId) ?? null;

  const subtotal = unitPrice * quantity;
  const shippingCost = selectedShipping?.price ?? 0;
  const pixDiscount =
    paymentMethod === "pix"
      ? Math.round(subtotal * PIX_DISCOUNT_RATE)
      : 0;
  const total = subtotal - pixDiscount + shippingCost;

  const validateAll = (): FormErrors => {
    const errs: FormErrors = {};

    if (!form.name.trim()) {
      errs.name = "Nome completo é obrigatório.";
    }
    if (!form.email.trim()) {
      errs.email = "E-mail é obrigatório.";
    } else if (!validateEmail(form.email)) {
      errs.email = "E-mail inválido. Exemplo: nome@clinica.com.br";
    }
    if (!form.phone.trim()) {
      errs.phone = "Telefone/WhatsApp é obrigatório.";
    } else if (!validatePhone(form.phone)) {
      errs.phone = "Telefone/WhatsApp inválido. Exemplo: (11) 99999-9999";
    }
    if (!form.cpf.trim()) {
      errs.cpf = "CPF é obrigatório.";
    } else if (!validateCpf(form.cpf)) {
      errs.cpf = "CPF inválido. Deve conter 11 dígitos.";
    }

    if (!form.cep.trim()) {
      errs.cep = "CEP é obrigatório.";
    } else if (!validateCep(form.cep)) {
      errs.cep = "CEP inválido. Deve conter 8 dígitos.";
    }
    if (!form.street.trim()) {
      errs.street = "Endereço é obrigatório.";
    }
    if (!form.number.trim()) {
      errs.number = "Número é obrigatório.";
    }
    if (!form.neighborhood.trim()) {
      errs.neighborhood = "Bairro é obrigatório.";
    }
    if (!form.city.trim()) {
      errs.city = "Cidade e UF são obrigatórios.";
    }

    if (paymentMethod === "card") {
      if (!card.name.trim()) {
        errs.cardName = "Nome impresso no cartão é obrigatório.";
      }
      if (!card.number.trim()) {
        errs.cardNumber = "Número do cartão é obrigatório.";
      } else if (!validateCardNumber(card.number)) {
        errs.cardNumber = "Número do cartão inválido (16 dígitos).";
      }
      if (!card.expiry.trim()) {
        errs.cardExpiry = "Validade é obrigatória.";
      } else if (!validateExpiry(card.expiry)) {
        errs.cardExpiry = "Validade inválida (MM/AA).";
      }
      if (!card.cvv.trim()) {
        errs.cardCvv = "CVV é obrigatório.";
      } else if (!validateCvv(card.cvv)) {
        errs.cardCvv = "CVV inválido (3 ou 4 dígitos).";
      }
      if (!card.cpf.trim()) {
        errs.cardCpf = "CPF do titular é obrigatório.";
      } else if (!validateCpf(card.cpf)) {
        errs.cardCpf = "CPF inválido. Deve conter 11 dígitos.";
      }
    }

    return errs;
  };

  const handleCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const errs = validateAll();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      const idMap: Record<string, string> = {
        name: "checkout-name",
        email: "checkout-email",
        phone: "checkout-phone",
        cpf: "checkout-cpf",
        cep: "checkout-cep",
        street: "checkout-street",
        number: "checkout-number",
        neighborhood: "checkout-neighborhood",
        city: "checkout-city",
        cardName: "card-name",
        cardNumber: "card-number",
        cardExpiry: "card-expiry",
        cardCvv: "card-cvv",
        cardCpf: "card-cpf",
      };
      if (idMap[firstKey]) {
        document.getElementById(idMap[firstKey])?.focus();
      }
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), VALIDATION_DELAY_MS);
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={
          buttonClassName ??
          "group inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#C59D3F] px-6 py-4 text-[15px] font-semibold text-[#0D1B2A] shadow-[0_10px_30px_rgba(197,157,63,0.28)] transition-all hover:bg-[#d4ac4c] active:scale-[0.99]"
        }
      >
        <svg
          aria-hidden="true"
          className="h-4.5 w-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-.502 2.062-1.578 2.062-2.828l.75-4.5H5.106"
          />
        </svg>
        <span>{buttonLabel}</span>
      </button>

      {isMounted ? (
        <div
          role="presentation"
          onClick={requestClose}
          className={`fixed inset-0 z-200 bg-[#0B1D2C]/60 backdrop-blur-[2px] transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-canvas text-content shadow-[-24px_0_60px_rgba(4,12,20,0.35)] transition-transform duration-300 ease-out ${
              isVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-content/10 px-6 py-5">
              <div>
                <p className="font-mono text-[10.5px] tracking-[0.12em] text-[#C59D3F] uppercase">
                  Finalizar Pedido
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-display text-xl font-bold text-content"
                >
                  {protocolName}
                </h2>
              </div>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Fechar checkout"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-content/15 text-content transition-colors hover:border-content/40"
              >
                ✕
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleCheckout}
              className="flex flex-1 flex-col overflow-y-auto"
            >
              <div className="flex-1 space-y-8 px-6 py-6">
                {/* Dados pessoais */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-content">
                    <span className="font-mono text-[11px] text-[#C59D3F]">
                      01
                    </span>
                    Seus dados
                  </h3>
                  <div className="space-y-3.5">
                    <div>
                      <label htmlFor="checkout-name" className={LABEL_CLASSES}>
                        Nome completo
                      </label>
                      <input
                        id="checkout-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Nome do responsável"
                        value={form.name}
                        onChange={(event) =>
                          updateField("name")(event.target.value)
                        }
                        className={getFieldClasses(!!errors.name)}
                      />
                      {errors.name && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="checkout-email" className={LABEL_CLASSES}>
                        E-mail
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        autoComplete="email"
                        placeholder="seu.email@clinica.com.br"
                        value={form.email}
                        onChange={(event) =>
                          updateField("email")(event.target.value)
                        }
                        className={getFieldClasses(!!errors.email)}
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="checkout-phone" className={LABEL_CLASSES}>
                        Telefone / WhatsApp
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="(11) 99999-9999"
                        value={form.phone}
                        onChange={(event) => {
                          const formatted = formatPhone(event.target.value);
                          updateField("phone")(formatted);
                        }}
                        className={getFieldClasses(!!errors.phone, "font-mono")}
                      />
                      {errors.phone && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="checkout-cpf" className={LABEL_CLASSES}>
                        CPF
                      </label>
                      <input
                        id="checkout-cpf"
                        type="text"
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        value={form.cpf}
                        onChange={(event) => {
                          const formatted = formatCpf(event.target.value);
                          updateField("cpf")(formatted);
                          if (!card.cpf) {
                            setCard((c) => ({ ...c, cpf: formatted }));
                          }
                        }}
                        className={getFieldClasses(!!errors.cpf, "font-mono")}
                      />
                      {errors.cpf && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                          {errors.cpf}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Endereço de entrega */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-content">
                    <span className="font-mono text-[11px] text-[#C59D3F]">
                      02
                    </span>
                    Endereço de entrega
                  </h3>
                  <div className="space-y-3.5">
                    <div>
                      <label htmlFor="checkout-cep" className={LABEL_CLASSES}>
                        CEP
                      </label>
                      <div className="relative">
                        <input
                          id="checkout-cep"
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          placeholder="00000-000"
                          maxLength={9}
                          value={form.cep}
                          onChange={(event) =>
                            handleCepChange(event.target.value)
                          }
                          className={getFieldClasses(!!errors.cep)}
                        />
                        {cepStatus === "loading" ? (
                          <span className="absolute top-1/2 right-3.5 -translate-y-1/2 font-mono text-[10.5px] text-content/50">
                            Buscando…
                          </span>
                        ) : null}
                      </div>
                      {errors.cep ? (
                        <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                          {errors.cep}
                        </p>
                      ) : cepStatus === "error" ? (
                        <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400">
                          CEP não encontrado. Confira os números digitados.
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-street"
                        className={LABEL_CLASSES}
                      >
                        Endereço
                      </label>
                      <input
                        id="checkout-street"
                        type="text"
                        autoComplete="address-line1"
                        placeholder="Rua, avenida…"
                        value={form.street}
                        onChange={(event) =>
                          updateField("street")(event.target.value)
                        }
                        className={getFieldClasses(!!errors.street)}
                      />
                      {errors.street && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                          {errors.street}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-[1fr_1.4fr] gap-3">
                      <div>
                        <label
                          htmlFor="checkout-number"
                          className={LABEL_CLASSES}
                        >
                          Número
                        </label>
                        <input
                          id="checkout-number"
                          type="text"
                          inputMode="numeric"
                          placeholder="Nº"
                          value={form.number}
                          onChange={(event) =>
                            updateField("number")(event.target.value)
                          }
                          className={getFieldClasses(!!errors.number)}
                        />
                        {errors.number && (
                          <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                            {errors.number}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="checkout-complement"
                          className={LABEL_CLASSES}
                        >
                          Complemento
                        </label>
                        <input
                          id="checkout-complement"
                          type="text"
                          autoComplete="address-line2"
                          placeholder="Sala, andar (opcional)"
                          value={form.complement}
                          onChange={(event) =>
                            updateField("complement")(event.target.value)
                          }
                          className={getFieldClasses(false)}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-neighborhood"
                        className={LABEL_CLASSES}
                      >
                        Bairro
                      </label>
                      <input
                        id="checkout-neighborhood"
                        type="text"
                        placeholder="Bairro"
                        value={form.neighborhood}
                        onChange={(event) =>
                          updateField("neighborhood")(event.target.value)
                        }
                        className={getFieldClasses(!!errors.neighborhood)}
                      />
                      {errors.neighborhood && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                          {errors.neighborhood}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="checkout-city" className={LABEL_CLASSES}>
                        Cidade / UF
                      </label>
                      <input
                        id="checkout-city"
                        type="text"
                        placeholder="Cidade / UF"
                        value={
                          form.city
                            ? `${form.city}${form.uf ? ` / ${form.uf}` : ""}`
                            : ""
                        }
                        onChange={(event) => {
                          const [city, uf] = event.target.value.split("/");
                          setForm((current) => ({
                            ...current,
                            city: city?.trim() ?? "",
                            uf: uf?.trim().toUpperCase() ?? "",
                          }));
                          if (submitted) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.city;
                              return next;
                            });
                          }
                        }}
                        className={getFieldClasses(!!errors.city)}
                      />
                      {errors.city && (
                        <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                          {errors.city}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Frete */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-content">
                    <span className="font-mono text-[11px] text-[#C59D3F]">
                      03
                    </span>
                    Frete
                  </h3>

                  <label htmlFor="checkout-cep-frete" className={LABEL_CLASSES}>
                    Calcular por CEP
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="checkout-cep-frete"
                      type="text"
                      inputMode="numeric"
                      placeholder="00000-000"
                      maxLength={9}
                      value={form.cep}
                      onChange={(event) =>
                        handleCepChange(event.target.value)
                      }
                      className={`${getFieldClasses(!!errors.cep)} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={calculateShipping}
                      className="flex-none rounded-lg bg-[#0D1B2A] px-5 text-sm font-semibold text-[#F6F3EC] transition-colors hover:bg-[#12283C] dark:bg-[#C59D3F] dark:text-[#0D1B2A] dark:hover:bg-[#d4ac4c]"
                    >
                      Calcular
                    </button>
                  </div>

                  {shippingStatus === "error" ? (
                    <p className="mt-2 text-[12px] text-red-600 dark:text-red-400">
                      Informe um CEP válido (8 dígitos) para calcular o frete.
                    </p>
                  ) : null}

                  {shippingOptions.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {shippingOptions.map((option) => (
                        <li key={option.id}>
                          <label
                            className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                              selectedShippingId === option.id
                                ? "border-[#C59D3F] bg-[#C59D3F]/8"
                                : "border-content/15 hover:border-content/30"
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="shipping"
                                value={option.id}
                                checked={selectedShippingId === option.id}
                                onChange={() =>
                                  setSelectedShippingId(option.id)
                                }
                                className="accent-[#C59D3F]"
                              />
                              <span className="text-content">
                                {option.company} {option.name} ·{" "}
                                {option.deliveryTime} dias
                              </span>
                            </span>
                            <span className="font-mono text-content">
                              {formatBRL(option.price)}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>

                {/* Resumo do pedido */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-content">
                    <span className="font-mono text-[11px] text-[#C59D3F]">
                      04
                    </span>
                    Resumo do pedido
                  </h3>

                  <div className="rounded-xl border border-content/10 bg-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[14.5px] font-semibold text-content">
                          Protocolo {protocolName}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-content/55">
                          {vials} frascos · {formatBRL(unitPrice)} por kit
                        </p>
                      </div>
                      <div className="flex items-center rounded-lg border border-content/15">
                        <button
                          type="button"
                          aria-label="Diminuir quantidade"
                          onClick={() =>
                            setQuantity((q) => Math.max(1, q - 1))
                          }
                          className="flex h-8 w-8 items-center justify-center text-lg text-content disabled:opacity-40"
                          disabled={quantity <= 1}
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-mono text-sm font-semibold text-content">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Aumentar quantidade"
                          onClick={() =>
                            setQuantity((q) => Math.min(99, q + 1))
                          }
                          className="flex h-8 w-8 items-center justify-center text-lg text-content"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <hr className="my-3.5 border-content/10" />

                    <dl className="space-y-2 text-[13.5px]">
                      <div className="flex justify-between text-content/70">
                        <dt>Subtotal</dt>
                        <dd className="font-mono">{formatBRL(subtotal)}</dd>
                      </div>
                      <div className="flex justify-between text-content/70">
                        <dt>Frete</dt>
                        <dd className="font-mono">
                          {selectedShipping
                            ? formatBRL(shippingCost)
                            : "A calcular"}
                        </dd>
                      </div>
                      {pixDiscount > 0 ? (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <dt>Desconto PIX (5%)</dt>
                          <dd className="font-mono">
                            −{formatBRL(pixDiscount)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    <hr className="my-3.5 border-content/10" />

                    <div className="flex items-end justify-between">
                      <span className="text-sm font-semibold text-content">
                        Total
                      </span>
                      <span className="font-display text-2xl font-bold text-content">
                        {formatBRL(total)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Pagamento */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-content">
                    <span className="font-mono text-[11px] text-[#C59D3F]">
                      05
                    </span>
                    Forma de pagamento
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { id: "pix", label: "PIX", hint: "5% de desconto" },
                        {
                          id: "card",
                          label: "Cartão de Crédito",
                          hint: "Até 12x",
                        },
                      ] as const
                    ).map((method) => {
                      const isActive = paymentMethod === method.id;
                      return (
                        <label
                          key={method.id}
                          className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 transition-colors ${
                            isActive
                              ? "border-[#C59D3F] bg-[#C59D3F]/8"
                              : "border-content/15 hover:border-content/30"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="payment"
                              value={method.id}
                              checked={isActive}
                              onChange={() => {
                                setPaymentMethod(method.id);
                                if (submitted) setErrors(validateAll());
                              }}
                              className="accent-[#C59D3F]"
                            />
                            <span className="text-[14px] font-semibold text-content">
                              {method.label}
                            </span>
                          </span>
                          <span className="pl-6 font-mono text-[10.5px] tracking-wide text-content/55 uppercase">
                            {method.hint}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {paymentMethod === "card" ? (
                    <div className="mt-4 space-y-3.5 rounded-xl border border-content/10 bg-card p-4">
                      <div>
                        <label
                          htmlFor="card-name"
                          className={LABEL_CLASSES}
                        >
                          Nome impresso no cartão
                        </label>
                        <input
                          id="card-name"
                          type="text"
                          autoComplete="cc-name"
                          placeholder="Como no cartão"
                          value={card.name}
                          onChange={(event) =>
                            updateCard("name")(event.target.value)
                          }
                          className={getFieldClasses(!!errors.cardName)}
                        />
                        {errors.cardName && (
                          <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                            {errors.cardName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="card-number"
                          className={LABEL_CLASSES}
                        >
                          Número do cartão
                        </label>
                        <input
                          id="card-number"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="0000 0000 0000 0000"
                          value={card.number}
                          onChange={(event) =>
                            updateCard("number")(
                              formatCardNumber(event.target.value),
                            )
                          }
                          className={getFieldClasses(!!errors.cardNumber, "font-mono tracking-[0.06em]")}
                        />
                        {errors.cardNumber && (
                          <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                            {errors.cardNumber}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="card-expiry"
                            className={LABEL_CLASSES}
                          >
                            Validade (MM/AA)
                          </label>
                          <input
                            id="card-expiry"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            placeholder="MM/AA"
                            value={card.expiry}
                            onChange={(event) =>
                              updateCard("expiry")(
                                formatExpiry(event.target.value),
                              )
                            }
                            className={getFieldClasses(!!errors.cardExpiry, "font-mono")}
                          />
                          {errors.cardExpiry && (
                            <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                              {errors.cardExpiry}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="card-cvv"
                            className={LABEL_CLASSES}
                          >
                            CVV
                          </label>
                          <input
                            id="card-cvv"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            placeholder="000"
                            maxLength={4}
                            value={card.cvv}
                            onChange={(event) =>
                              updateCard("cvv")(
                                event.target.value.replace(/\D/g, ""),
                              )
                            }
                            className={getFieldClasses(!!errors.cardCvv, "font-mono")}
                          />
                          {errors.cardCvv && (
                            <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                              {errors.cardCvv}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="card-cpf" className={LABEL_CLASSES}>
                          CPF do titular
                        </label>
                        <input
                          id="card-cpf"
                          type="text"
                          inputMode="numeric"
                          placeholder="000.000.000-00"
                          value={card.cpf}
                          onChange={(event) =>
                            updateCard("cpf")(formatCpf(event.target.value))
                          }
                          className={getFieldClasses(!!errors.cardCpf, "font-mono")}
                        />
                        {errors.cardCpf && (
                          <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                            {errors.cardCpf}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-3.5 rounded-xl border border-dashed border-[#C59D3F]/40 bg-[#C59D3F]/5 p-4">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-[13px] font-bold text-[#C59D3F]">
                        PIX
                      </span>
                      <div>
                        <p className="text-[13.5px] font-semibold text-content">
                          O QR Code será gerado na próxima etapa
                        </p>
                        <p className="mt-0.5 text-[12px] text-content/60">
                          Pagamento aprovado na hora, com 5% de desconto já
                          aplicado no total.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Sticky footer CTA */}
              <div className="sticky bottom-0 border-t border-content/10 bg-canvas/95 px-6 py-4 backdrop-blur">
                {submitted && Object.keys(errors).length > 0 ? (
                  <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-center font-mono text-[11.5px] font-medium text-red-600 dark:text-red-400">
                    Preencha os campos em destaque antes de finalizar.
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#0D1B2A] px-6 py-4 text-[15px] font-semibold text-[#F6F3EC] transition-all hover:bg-[#12283C] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80 dark:bg-[#C59D3F] dark:text-[#0D1B2A] dark:hover:bg-[#d4ac4c]"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        aria-hidden="true"
                        className="h-4.5 w-4.5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>Processando…</span>
                    </>
                  ) : (
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>Finalizar compra</span>
                      <span className="font-mono">{formatBRL(total)}</span>
                    </span>
                  )}
                </button>
                <p className="mt-2.5 text-center font-mono text-[10px] tracking-wide text-content/45 uppercase">
                  Pagamento processado com segurança · Mercado Pago
                </p>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
