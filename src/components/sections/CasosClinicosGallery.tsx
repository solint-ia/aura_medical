"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Filter, Stethoscope } from "lucide-react";

import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import type { CaseCategory, ClinicalCase } from "@/data/cases";

const ALL_FILTER_ID = "todos";

export function CasosClinicosGallery({ cases, categories, protocolSlugs }: { cases: ClinicalCase[]; categories: CaseCategory[]; protocolSlugs: string[] }) {
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER_ID);

  // Filter cases based on category tab
  const filteredCases: ClinicalCase[] = useMemo(() => {
    if (activeFilter === ALL_FILTER_ID) return cases;
    return cases.filter((item) => item.categoryId === activeFilter);
  }, [activeFilter, cases]);

  return (
    <div className="relative">
      {/* Category Filter Tabs */}
      <div className="mb-10">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2 md:flex-wrap md:justify-start">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === ALL_FILTER_ID}
            onClick={() => setActiveFilter(ALL_FILTER_ID)}
            className={`flex-none rounded-full border px-5 py-2.5 font-mono text-xs tracking-wider whitespace-nowrap uppercase transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
              activeFilter === ALL_FILTER_ID
                ? "border-accent bg-accent text-accent-fg font-bold shadow-lg shadow-[#C59D3F]/20"
                : "border-white/15 bg-white/5 text-on-panel/80 hover:border-accent/60 hover:text-on-panel hover:bg-white/10"
            }`}
          >
            Todos ({cases.length})
          </button>

          {categories.map((category) => {
            const isActive = category.id === activeFilter;
            const count = cases.filter(
              (c) => c.categoryId === category.id,
            ).length;

            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(category.id)}
                className={`flex-none rounded-full border px-5 py-2.5 font-mono text-xs tracking-wider whitespace-nowrap uppercase transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                  isActive
                    ? "border-accent bg-accent text-accent-fg font-bold shadow-lg shadow-[#C59D3F]/20"
                    : "border-white/15 bg-white/5 text-on-panel/80 hover:border-accent/60 hover:text-on-panel hover:bg-white/10"
                }`}
              >
                {category.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Cases Results Counter */}
      <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4 text-xs font-mono text-on-panel/60">
        <span>
          Mostrando <strong className="text-accent">{filteredCases.length}</strong> {filteredCases.length === 1 ? "caso clínico documentado" : "casos clínicos documentados"}
        </span>
        {activeFilter !== ALL_FILTER_ID && (
          <button
            type="button"
            onClick={() => setActiveFilter(ALL_FILTER_ID)}
            className="text-accent hover:underline font-semibold"
          >
            Ver todos ({cases.length})
          </button>
        )}
      </div>

      {/* Cases Grid */}
      {filteredCases.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:gap-10">
          {filteredCases.map((clinicalCase) => {
            const hasProtocol = protocolSlugs.includes(clinicalCase.categoryId);

            return (
              <article
                key={clinicalCase.id}
                className="group rounded-2xl border border-white/12 bg-card p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-accent/60 hover:shadow-[0_20px_50px_rgba(10,22,34,0.5)] relative overflow-hidden"
              >
                {/* Subtle Card Ambient Glow on Hover */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_top_right,rgba(197,157,63,0.08)_0%,transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                {/* Card Top Meta Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="font-mono text-xs font-bold tracking-[0.16em] text-accent uppercase">
                      Resultado Clínico pbserum
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1 font-mono text-[11px] font-semibold text-on-panel/90 uppercase">
                      {clinicalCase.categoryName}
                    </span>
                    <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 font-mono text-[11px] font-bold text-accent">
                      {clinicalCase.sessions} {clinicalCase.sessions === 1 ? "sessão" : "sessões"}
                    </span>
                  </div>
                </div>

                {/* Paired Before & After High-Fidelity Comparison Images */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 relative z-10">
                  {/* Before Image Card */}
                  <figure className="relative overflow-hidden rounded-xl border border-white/10 bg-canvas p-3 transition-colors duration-300 group-hover:border-white/20">
                    <div className="relative h-72 sm:h-80 md:h-96 w-full overflow-hidden flex items-center justify-center">
                      <Image
                        src={clinicalCase.beforeImage}
                        alt={`Antes - ${clinicalCase.categoryName}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.01]"
                      />
                    </div>
                    {/* Floating Before Tag */}
                    <figcaption className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-white/20 bg-panel/95 px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-[0.14em] text-on-panel uppercase shadow-lg backdrop-blur-md z-10">
                      Antes do Tratamento
                    </figcaption>
                  </figure>

                  {/* After Image Card */}
                  <figure className="relative overflow-hidden rounded-xl border border-accent/50 bg-canvas p-3 transition-colors duration-300 group-hover:border-accent">
                    <div className="relative h-72 sm:h-80 md:h-96 w-full overflow-hidden flex items-center justify-center">
                      <Image
                        src={clinicalCase.afterImage}
                        alt={`Depois - ${clinicalCase.categoryName}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.01]"
                      />
                    </div>
                    {/* Floating After Tag */}
                    <figcaption className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-accent px-3.5 py-1.5 font-mono text-[11px] font-extrabold tracking-[0.14em] text-accent-fg uppercase shadow-lg backdrop-blur-md z-10">
                      Resultado Final
                    </figcaption>
                  </figure>
                </div>

                {/* Case Footer: Doctor Info & Protocol Direct Link */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 relative z-10">
                  <div className="flex items-center gap-2 text-xs text-on-panel/80">
                    <Stethoscope className="h-4 w-4 text-accent" />
                    <span className="font-semibold text-white">{clinicalCase.doctor}</span>
                    {clinicalCase.country && (
                      <span className="text-on-panel/60 font-normal">
                        · {clinicalCase.country}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {hasProtocol && (
                      <Link
                        href={`/protocolos/${clinicalCase.categoryId}`}
                        className="group/btn inline-flex items-center gap-2 rounded-lg border border-accent/60 bg-accent/10 px-4 py-2 font-mono text-xs font-semibold text-accent transition-all hover:bg-accent hover:text-accent-fg"
                      >
                        <span>Ver Protocolo Clínico</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    )}
                    <AccreditationButton
                      protocolName={clinicalCase.categoryName}
                      className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 font-mono text-xs font-semibold text-white transition-all hover:bg-white/10"
                    >
                      Dúvidas Técnicas
                    </AccreditationButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-white/10 bg-card/50 p-12 text-center">
          <Filter className="mx-auto h-10 w-10 text-white/30 mb-4" />
          <h3 className="font-display text-xl font-bold text-white mb-2">
            Nenhum caso clínico encontrado
          </h3>
          <p className="text-sm text-white/60 mb-6">
            Não encontramos resultados para os filtros selecionados. Tente buscar por outro termo ou limpar os filtros.
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter(ALL_FILTER_ID)}
            className="rounded-lg bg-accent px-6 py-2.5 font-mono text-xs font-bold text-accent-fg transition-colors hover:bg-accent"
          >
            Ver Todos os Casos
          </button>
        </div>
      )}
    </div>
  );
}
