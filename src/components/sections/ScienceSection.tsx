import { Check, X } from "lucide-react";
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

      <div className="relative mx-auto max-w-[1120px]">
        <SectionIntro
          tone="dark"
          titleId="ciencia-title"
          eyebrow="Ciência · Bioremodelação"
          title="Regeneração funcional começa na matriz extracelular."
          lead="A bioremodelação reorganiza as bases bioquímicas e estruturais do tecido, atuando na matriz extracelular e nas células residentes para reverter os sinais de envelhecimento e alteração tecidual."
          className="mb-14"
        />

        <div className="rounded-2xl border border-on-panel/14 bg-on-panel/3 p-[clamp(20px,3.5vw,40px)] shadow-2xl backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <p className="font-mono text-xs font-semibold tracking-[0.15em] text-[#C59D3F] uppercase">
              Comparativo Tecnológico
            </p>
            <span className="font-mono text-[11px] text-on-panel/50 uppercase">
              Evidência & Biotecnologia
            </span>
          </div>

          {/* Table Headers */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b border-on-panel/14 pb-5 items-center">
            <div className="hidden md:block md:col-span-3">
              <span className="font-mono text-xs font-medium text-on-panel/60 uppercase">
                Atributo Clínico
              </span>
            </div>

            {/* Highlighted Superior Column */}
            <div className="md:col-span-5 rounded-xl border border-[#C59D3F]/40 bg-[#C59D3F]/12 p-3.5 flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C59D3F] text-[#0D1B2A] shrink-0">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="block font-display text-base font-bold text-on-panel">
                  Tecnologia pbserum
                </span>
                <span className="block font-mono text-[10.5px] text-[#C59D3F] uppercase">
                  Enzimas Recombinantes de Alta Performance
                </span>
              </div>
            </div>

            {/* Muted Standard Column */}
            <div className="md:col-span-4 p-3.5 flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-on-panel/10 text-on-panel/40 shrink-0">
                <X className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
              <div>
                <span className="block font-display text-base font-medium text-on-panel/60">
                  Enzimas Tradicionais
                </span>
                <span className="block font-mono text-[10.5px] text-on-panel/40 uppercase">
                  Fórmulas Convencionais
                </span>
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-on-panel/10">
            {ENZYME_COMPARISON.map((row) => (
              <div
                key={row.attribute}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5 md:py-6 items-start"
              >
                {/* Category Name */}
                <div className="md:col-span-3">
                  <h3 className="font-display text-base font-semibold text-[#C59D3F] md:text-on-panel">
                    {row.attribute}
                  </h3>
                </div>

                {/* Tecnologia pbserum (Superior - Highlighted) */}
                <div className="md:col-span-5 rounded-xl border border-[#C59D3F]/25 bg-[#C59D3F]/8 p-4 text-on-panel">
                  <span className="block md:hidden font-mono text-[10px] tracking-wider text-[#C59D3F] uppercase mb-1">
                    Tecnologia pbserum
                  </span>
                  <p className="text-[14.5px] sm:text-[15px] leading-relaxed font-semibold text-on-panel">
                    {row.recombinant}
                  </p>
                </div>

                {/* Enzimas Tradicionais (Muted) */}
                <div className="md:col-span-4 p-4 text-on-panel/60">
                  <span className="block md:hidden font-mono text-[10px] tracking-wider text-on-panel/40 uppercase mb-1">
                    Enzimas Tradicionais
                  </span>
                  <p className="text-[14px] leading-relaxed font-medium text-on-panel/60">
                    {row.animal}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
