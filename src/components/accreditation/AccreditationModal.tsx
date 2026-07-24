"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

interface AccreditationModalProps {
  protocolName: string | null;
  onClose: () => void;
}

interface LeadForm {
  name: string;
  clinic: string;
  email: string;
  phone: string;
}

const EMPTY_FORM: LeadForm = { name: "", clinic: "", email: "", phone: "" };

const FIELD_CLASSES =
  "rounded-lg border border-content/18 bg-card dark:bg-canvas px-4 py-[13px] text-[14.5px] text-content placeholder:text-content/45 focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent";

/**
 * Mounted only while the dialog is open, so every request starts from a clean
 * form without an effect resetting state.
 */
export function AccreditationModal({
  protocolName,
  onClose,
}: AccreditationModalProps) {
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Close on Escape and stop the page behind the dialog from scrolling.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const updateField = (field: keyof LeadForm) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // No endpoint yet — the commercial team's intake destination is pending.
    setIsSubmitted(true);
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-200 flex items-center justify-center bg-panel/55 p-5 backdrop-blur-[3px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-canvas dark:bg-card p-9"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full border border-content/15 text-base text-content transition-colors hover:border-content/40"
        >
          ✕
        </button>

        {isSubmitted ? (
          <div className="py-5">
            <h2
              id={titleId}
              className="mb-3 font-display text-[22px] font-bold text-content"
            >
              Recebemos seu interesse.
            </h2>
            <p className="text-[15px] leading-[1.6] text-content/72">
              Nosso time comercial entrará em contato em breve para dar
              sequência ao credenciamento da sua clínica.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2.5 font-mono text-[11px] tracking-[0.08em] text-accent uppercase">
              Credenciamento Aura Medical
            </p>
            <h2
              id={titleId}
              className="mb-2 font-display text-[23px] font-bold text-content"
            >
              Seja uma clínica credenciada pbserum.
            </h2>

            {protocolName ? (
              <p className="mb-[18px] text-[13.5px] text-content/70">
                Protocolo de interesse:{" "}
                <strong className="text-content">{protocolName}</strong>
              </p>
            ) : null}

            <p className="mb-[22px] text-[14.5px] leading-[1.6] text-content/75">
              Preencha seus dados — nosso time comercial entra em contato para
              validar o credenciamento.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Nome completo"
                aria-label="Nome completo"
                value={form.name}
                onChange={(event) => updateField("name")(event.target.value)}
                className={FIELD_CLASSES}
              />
              <input
                type="text"
                required
                autoComplete="organization"
                placeholder="Clínica / consultório"
                aria-label="Clínica ou consultório"
                value={form.clinic}
                onChange={(event) => updateField("clinic")(event.target.value)}
                className={FIELD_CLASSES}
              />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="E-mail profissional"
                aria-label="E-mail profissional"
                value={form.email}
                onChange={(event) => updateField("email")(event.target.value)}
                className={FIELD_CLASSES}
              />
              <input
                type="tel"
                required
                autoComplete="tel"
                placeholder="WhatsApp / telefone"
                aria-label="WhatsApp ou telefone"
                value={form.phone}
                onChange={(event) => updateField("phone")(event.target.value)}
                className={FIELD_CLASSES}
              />
              <button
                type="submit"
                className="mt-1.5 rounded-lg bg-action px-5 py-[15px] text-[15px] font-semibold text-action-fg transition-colors hover:bg-action-hover"
              >
                Solicitar credenciamento
              </button>
            </form>

            <p className="mt-[18px] text-center text-[12.5px] text-content/60">
              Prefere falar direto? WhatsApp e e-mail comercial da Aura Medical
              em breve.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
