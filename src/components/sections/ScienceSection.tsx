import { SectionIntro } from "@/components/ui/SectionIntro";
import { ENZYME_COMPARISON } from "@/data/products";

export function ScienceSection() {
  return (
    <section
      id="ciencia"
      aria-labelledby="ciencia-title"
      className="relative overflow-hidden bg-panel px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
    >
      {/* Concentric rings echo the sphere printed on the packaging. */}
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
          lead="A bioremodelação reorganiza as bases bioquímicas e estruturais do tecido — atuando na matriz extracelular, no compartimento intersticial e nas células residentes (fibroblastos, adipócitos, pericitos e células endoteliais) para reverter o microambiente profibrótico e pró-inflamatório do envelhecimento tecidual."
          className="mb-14"
        />

        <div className="rounded-xl border border-on-panel/12 bg-on-panel/3 p-[clamp(24px,3vw,40px)]">
          <p className="mb-6 font-mono text-[11px] tracking-[0.1em] text-on-panel/60 uppercase">
            Por que enzimas recombinantes
          </p>

          {/* Column captions. On mobile they head the two value columns that
              sit under each criterion; from `md` they head the three-column
              rows. */}
          <div className="grid grid-cols-2 gap-x-4 border-b border-on-panel/14 pb-4 md:grid-cols-[1fr_auto_1fr]">
            <p className="font-display text-[15px] font-semibold text-accent-panel">
              Recombinante · pbserum
            </p>
            <p className="text-right font-display text-[15px] font-semibold text-on-panel/60 md:col-start-3">
              Origem Animal
            </p>
          </div>

          <dl>
            {ENZYME_COMPARISON.map((row) => (
              <div
                key={row.attribute}
                className="grid grid-cols-2 items-center gap-x-4 border-b border-on-panel/10 py-4 last:border-b-0 md:grid-cols-[1fr_auto_1fr]"
              >
                <dt className="col-span-2 mb-2 text-center font-mono text-xs tracking-[0.08em] text-on-panel/60 uppercase md:col-span-1 md:col-start-2 md:row-start-1 md:mb-0 md:px-3 md:text-[10px] md:whitespace-nowrap">
                  {row.attribute}
                </dt>
                <dd className="text-[14px] font-semibold text-on-panel sm:text-[15px] md:col-start-1 md:row-start-1">
                  <span className="sr-only">Recombinante pbserum: </span>
                  {row.recombinant}
                </dd>
                <dd className="text-right text-[14px] font-medium text-on-panel/60 sm:text-[15px] md:col-start-3 md:row-start-1">
                  <span className="sr-only">Origem animal: </span>
                  {row.animal}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
