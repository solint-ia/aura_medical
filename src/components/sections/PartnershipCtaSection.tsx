import { AccreditationButton } from "@/components/accreditation/AccreditationButton";

export function PartnershipCtaSection() {
  return (
    <section
      id="atendimento-tecnologia"
      aria-label="Experimente a eficácia dos nossos produtos da Aura Regenera"
      className="relative overflow-hidden bg-[#F7F5F0] dark:bg-canvas px-[clamp(20px,4vw,56px)] pt-12 md:pt-16 pb-12 md:pb-14 text-content border-t border-content/10"
    >
      {/* Background ambient accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.12)_0%,transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#C59D3F] uppercase md:text-sm">
          Tecnologia Enzimática de Alta Performance
        </span>

        <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-content leading-[1.12]">
          Experimente a eficácia dos nossos produtos da Aura Regenera.
        </h2>

        <p className="mt-4 text-base sm:text-lg text-content/80 max-w-2xl mx-auto leading-relaxed">
          Resultados comprovados e tecnologia enzimática avançada para a bioremodelação e regeneração tecidual.
        </p>

        <div className="mt-7 flex items-center justify-center gap-4 flex-wrap">
          <AccreditationButton className="group inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#C59D3F] px-8 py-4 text-base font-semibold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-lg hover:shadow-xl active:scale-[0.99]">
            <span>Fale Conosco</span>
            <svg
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l7.5-7.5M21 12H3" />
            </svg>
          </AccreditationButton>
        </div>
      </div>
    </section>
  );
}
