"use client";

import { useState } from "react";

import { ImageLightboxModal } from "@/components/ui/ImageLightboxModal";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { ENZYMES } from "@/data/enzymes";
import { INDICATIONS, SESSION_INTERVAL_NOTE } from "@/data/indications";

export function IndicationsSection() {
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    src?: string | null;
    title?: string;
    subtitle?: string;
  }>({ isOpen: false });

  return (
    <>
      <section
        id="indicacoes"
        aria-labelledby="indicacoes-title"
        className="relative bg-panel px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
      >
        <div className="mx-auto max-w-[1280px]">
          <SectionIntro
            tone="dark"
            titleId="indicacoes-title"
            eyebrow="Indicações · Protocolos Enzimáticos"
            title="Seis indicações. Um protocolo enzimático específico para cada uma."
            lead="Da adiposidade localizada à fibrose pós-cirúrgica, identifique a indicação e as enzimas envolvidas em cada protocolo. Clique em qualquer card para visualizar o registro em tela cheia."
            className="mb-12"
          />

          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[340px]">
            {INDICATIONS.map((indication) => {
              const enzymeNames = indication.enzymes
                .map((e) => ENZYMES[e].label)
                .join(", ");

              return (
                <li
                  key={indication.id}
                  tabIndex={0}
                  onClick={() =>
                    setLightbox({
                      isOpen: true,
                      src: null, // Photo slot fallback or supplied photo
                      title: `Indicação: ${indication.title}`,
                      subtitle: `Protocolo pbserum Plus · Enzimas: ${enzymeNames}`,
                    })
                  }
                  className="indication-card group relative cursor-pointer overflow-hidden rounded-2xl border border-on-panel/12 bg-panel transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C59D3F]/40 hover:shadow-[0_20px_40px_rgba(4,12,20,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <div className="indication-media absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                    <PhotoSlot
                      caption={indication.photoPlaceholder}
                      alt={indication.title}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                      className="h-full w-full"
                    />
                  </div>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/60 to-panel/10 opacity-90 transition-opacity duration-300 group-hover:opacity-95"
                  />

                  {/* Hover zoom affordance */}
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 rounded-full bg-[#0D1B2A]/90 px-3.5 py-1.5 font-mono text-[11px] text-[#F6F3EC] shadow-md backdrop-blur-xs">
                      🔍 Ver em Tela Cheia
                    </span>
                  </div>

                  <ul className="pointer-events-none absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
                    {indication.enzymes.map((enzymeId) => {
                      const enzyme = ENZYMES[enzymeId];

                      return (
                        <li
                          key={enzymeId}
                          className="flex items-center gap-1.5 rounded-full border border-on-panel/25 bg-panel/75 px-3 py-1 font-mono text-[10px] font-medium tracking-[0.05em] text-on-panel uppercase backdrop-blur-md"
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

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-6">
                    <h3 className="font-display text-xl font-bold tracking-[-0.01em] text-on-panel transition-colors group-hover:text-[#C59D3F]">
                      {indication.title}
                    </h3>
                    <p className="indication-desc mt-2 text-[13.5px] leading-relaxed text-on-panel/80">
                      {indication.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-8 border-t border-on-panel/12 pt-4 font-mono text-xs leading-relaxed text-on-panel/75">
            {SESSION_INTERVAL_NOTE}
          </p>
        </div>
      </section>

      <ImageLightboxModal
        isOpen={lightbox.isOpen}
        src={lightbox.src}
        title={lightbox.title}
        subtitle={lightbox.subtitle}
        onClose={() => setLightbox({ isOpen: false })}
      />
    </>
  );
}
