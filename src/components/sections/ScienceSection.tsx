import { CheckCircle2, XCircle } from "lucide-react";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { ENZYME_COMPARISON } from "@/data/products";

export function ScienceSection() {
  return (
    <section
      id="ciencia"
      aria-labelledby="ciencia-title"
      className="relative overflow-hidden bg-panel px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
    >
      {/* Concentric ambient background rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[220px] -right-40 h-[640px] w-[640px] rounded-full border border-on-panel/6"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-25 -right-10 h-[420px] w-[420px] rounded-full border border-on-panel/8"
      />

      <div className="relative mx-auto max-w-[1180px]">
        <SectionIntro
          tone="dark"
          titleId="ciencia-title"
          eyebrow="Bioremodelação Tecidual"
          title="Regeneração funcional começa na matriz extracelular."
          lead="A bioremodelação reorganiza as bases bioquímicas e estruturais do tecido, atuando na matriz extracelular e nas células residentes para reverter os sinais de envelhecimento e alteração tecidual."
          className="mb-14"
        />

        <div className="space-y-8">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-on-panel/12 pb-6">
            <div>
              <p className="font-mono text-xs font-semibold tracking-[0.18em] text-[#C59D3F] uppercase">
                Comparativo Tecnológico
              </p>
              <h3 className="font-display text-2xl font-bold text-on-panel mt-1">
                Tecnologia pbserum vs. Enzimas Tradicionais
              </h3>
            </div>
            <span className="inline-flex items-center rounded-full border border-[#C59D3F]/30 bg-[#C59D3F]/10 px-4 py-1.5 font-mono text-xs font-semibold text-[#C59D3F] uppercase">
              Evidência & Biotecnologia
            </span>
          </div>

          {/* DESKTOP VIEW: 2 Side-by-Side Vertical Comparison Pillar Cards (Hidden on Mobile) */}
          <div className="hidden md:grid md:grid-cols-2 gap-8 items-stretch">
            {/* PILLAR 1: Tecnologia pbserum (Superior Highlighted Column) */}
            <div className="relative flex flex-col rounded-3xl border-2 border-[#C59D3F]/50 bg-[#0D1E2E] p-7 sm:p-8 shadow-2xl overflow-hidden transition-all hover:border-[#C59D3F]">
              {/* Subtle Gold Ambient Glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 -z-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.2)_0%,transparent_70%)] blur-2xl"
              />

              {/* Column Header Badge */}
              <div className="relative z-10 mb-8 border-b border-[#C59D3F]/25 pb-5 flex items-center justify-between">
                <div>
                  <span className="inline-block rounded-full bg-[#C59D3F] px-3 py-1 font-mono text-[11px] font-bold text-[#0D1B2A] uppercase tracking-wider mb-2">
                    Superioridade Biotecnológica
                  </span>
                  <h4 className="font-display text-2xl font-bold text-on-panel flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-[#C59D3F] shrink-0" />
                    <span>Tecnologia pbserum</span>
                  </h4>
                  <p className="font-mono text-xs text-[#C59D3F] mt-1">
                    Enzimas Recombinantes de 2ª Geração
                  </p>
                </div>
              </div>

              {/* Column Attribute Items */}
              <div className="relative z-10 space-y-6 flex-1">
                {ENZYME_COMPARISON.map((row) => (
                  <div
                    key={row.attribute}
                    className="rounded-xl border border-[#C59D3F]/20 bg-[#C59D3F]/8 p-4 transition-colors hover:bg-[#C59D3F]/12"
                  >
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider mb-1.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C59D3F]" />
                      <span>{row.attribute}</span>
                    </div>
                    <p className="text-sm font-semibold text-on-panel leading-relaxed pl-6">
                      {row.recombinant}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* PILLAR 2: Enzimas Tradicionais (Muted Neutral Column) */}
            <div className="relative flex flex-col rounded-3xl border border-on-panel/12 bg-on-panel/3 p-7 sm:p-8 shadow-md opacity-85 transition-opacity hover:opacity-100">
              {/* Column Header Badge */}
              <div className="relative z-10 mb-8 border-b border-on-panel/10 pb-5 flex items-center justify-between">
                <div>
                  <span className="inline-block rounded-full bg-on-panel/10 px-3 py-1 font-mono text-[11px] font-semibold text-on-panel/60 uppercase tracking-wider mb-2">
                    Fórmulas Convencionais
                  </span>
                  <h4 className="font-display text-2xl font-semibold text-on-panel/75 flex items-center gap-2">
                    <XCircle className="h-6 w-6 text-red-400/80 shrink-0" />
                    <span>Enzimas Tradicionais</span>
                  </h4>
                  <p className="font-mono text-xs text-on-panel/40 mt-1">
                    Extração Animal ou Química Clássica
                  </p>
                </div>
              </div>

              {/* Column Attribute Items */}
              <div className="relative z-10 space-y-6 flex-1">
                {ENZYME_COMPARISON.map((row) => (
                  <div
                    key={row.attribute}
                    className="rounded-xl border border-on-panel/8 bg-on-panel/2 p-4"
                  >
                    <div className="flex items-center gap-2 font-mono text-xs font-medium text-on-panel/50 uppercase tracking-wider mb-1.5">
                      <XCircle className="h-4 w-4 shrink-0 text-red-400/70" />
                      <span>{row.attribute}</span>
                    </div>
                    <p className="text-sm font-medium text-on-panel/65 leading-relaxed pl-6">
                      {row.animal}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MOBILE VIEW: Item-by-Item Parallel Comparison (Visible only on Mobile) */}
          <div className="space-y-6 md:hidden">
            {ENZYME_COMPARISON.map((row) => (
              <div
                key={row.attribute}
                className="rounded-2xl border border-on-panel/14 bg-[#0D1E2E] p-5 space-y-4 shadow-lg"
              >
                {/* Attribute Title */}
                <div className="border-b border-on-panel/12 pb-2.5">
                  <span className="font-mono text-[10.5px] font-bold text-[#C59D3F] uppercase tracking-wider block mb-0.5">
                    Atributo Clínico
                  </span>
                  <h4 className="font-display text-lg font-bold text-on-panel">
                    {row.attribute}
                  </h4>
                </div>

                {/* Parallel comparison per attribute */}
                <div className="space-y-3">
                  {/* Superior pbserum side */}
                  <div className="rounded-xl border border-[#C59D3F]/40 bg-[#C59D3F]/12 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#C59D3F] uppercase">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Tecnologia pbserum</span>
                    </div>
                    <p className="text-xs font-semibold text-on-panel leading-relaxed pl-5">
                      {row.recombinant}
                    </p>
                  </div>

                  {/* Traditional side */}
                  <div className="rounded-xl border border-on-panel/10 bg-on-panel/3 p-3.5 space-y-1 text-on-panel/70">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-on-panel/50 uppercase">
                      <XCircle className="h-4 w-4 shrink-0 text-red-400/70" />
                      <span>Enzimas Tradicionais</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-on-panel/65 pl-5">
                      {row.animal}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
