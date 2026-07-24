import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { ENZYMES } from "@/data/enzymes";
import { INDICATIONS, SESSION_INTERVAL_NOTE } from "@/data/indications";

export function IndicationsSection() {
  return (
    <section
      id="indicacoes"
      aria-labelledby="indicacoes-title"
      className="relative bg-canvas px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
    >
      <div className="mx-auto max-w-[1280px]">
        <SectionIntro
          titleId="indicacoes-title"
          eyebrow="Indicações · Protocolos Enzimáticos"
          title="Seis indicações. Um protocolo enzimático específico para cada uma."
          lead="Da adiposidade localizada à fibrose pós-cirúrgica — identifique a indicação e as enzimas envolvidas em cada protocolo."
          className="mb-12"
        />

        <ul className="grid auto-rows-[300px] grid-cols-1 gap-5 wide:auto-rows-[360px] wide:grid-cols-4">
          {INDICATIONS.map((indication) => (
            <li
              key={indication.id}
              tabIndex={0}
              className={`indication-card relative overflow-hidden rounded-[14px] bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                indication.featured ? "wide:col-span-2" : ""
              }`}
            >
              <div className="indication-media absolute inset-0">
                <PhotoSlot
                  caption={indication.photoPlaceholder}
                  alt=""
                  sizes="(max-width: 1180px) 100vw, 620px"
                  className="h-full w-full"
                />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-panel/95 from-0% via-panel/50 via-42% to-panel/4 to-72%"
              />

              <ul className="pointer-events-none absolute top-4 left-4 flex flex-wrap gap-1.5">
                {indication.enzymes.map((enzymeId) => {
                  const enzyme = ENZYMES[enzymeId];

                  return (
                    <li
                      key={enzymeId}
                      className="flex items-center gap-[5px] rounded-full border border-on-panel/30 bg-panel/55 py-1 pr-2.5 pl-2 font-mono text-[10px] tracking-[0.04em] text-on-panel uppercase"
                    >
                      <span
                        aria-hidden="true"
                        className={`inline-block h-1.5 w-1.5 rounded-full ${enzyme.dotClass}`}
                      />
                      {enzyme.label}
                    </li>
                  );
                })}
              </ul>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
                <h3
                  className={`font-display font-bold tracking-[-0.01em] text-on-panel ${
                    indication.featured ? "text-xl wide:text-[27px]" : "text-xl"
                  }`}
                >
                  {indication.title}
                </h3>
                <p className="indication-desc mt-1.5 text-[13.5px] leading-[1.5] text-on-panel/86">
                  {indication.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 border-t border-content/10 pt-4 text-[13px] leading-[1.6] text-content/75">
          {SESSION_INTERVAL_NOTE}
        </p>
      </div>
    </section>
  );
}
