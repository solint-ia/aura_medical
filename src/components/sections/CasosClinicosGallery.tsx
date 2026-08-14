"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Filter, Stethoscope } from "lucide-react";

import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import {
  CASE_CATEGORIES,
  clinicalCasesData,
  type ClinicalCase,
} from "@/data/cases";
import { protocolsData } from "@/data/protocols";

const ALL_FILTER_ID = "todos";

export function CasosClinicosGallery() {
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER_ID);

  // Filter cases based on category tab
  const filteredCases: ClinicalCase[] = useMemo(() => {
    if (activeFilter === ALL_FILTER_ID) return clinicalCasesData;
    return clinicalCasesData.filter((item) => item.categoryId === activeFilter);
  }, [activeFilter]);

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
                ? "border-[#C59D3F] bg-[#C59D3F] text-[#0D1B2A] font-bold shadow-lg shadow-[#C59D3F]/20"
                : "border-white/15 bg-white/5 text-[#F6F3EC]/80 hover:border-[#C59D3F]/60 hover:text-[#F6F3EC] hover:bg-white/10"
            }`}
          >
            Todos ({clinicalCasesData.length})
          </button>

          {CASE_CATEGORIES.map((category) => {
            const isActive = category.id === activeFilter;
            const count = clinicalCasesData.filter(
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
                    ? "border-[#C59D3F] bg-[#C59D3F] text-[#0D1B2A] font-bold shadow-lg shadow-[#C59D3F]/20"
                    : "border-white/15 bg-white/5 text-[#F6F3EC]/80 hover:border-[#C59D3F]/60 hover:text-[#F6F3EC] hover:bg-white/10"
                }`}
              >
                {category.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Cases Results Counter */}
      <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4 text-xs font-mono text-[#F6F3EC]/60">
        <span>
          Mostrando <strong className="text-[#C59D3F]">{filteredCases.length}</strong> {filteredCases.length === 1 ? "caso clínico documentado" : "casos clínicos documentados"}
        </span>
        {activeFilter !== ALL_FILTER_ID && (
          <button
            type="button"
            onClick={() => setActiveFilter(ALL_FILTER_ID)}
            className="text-[#C59D3F] hover:underline font-semibold"
          >
            Ver todos ({clinicalCasesData.length})
          </button>
        )}
      </div>

      {/* Cases Grid */}
      {filteredCases.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:gap-10">
          {filteredCases.map((clinicalCase) => {
            const hasProtocol = protocolsData.some((p) => p.slug === clinicalCase.categoryId && !p.hidden);

            return (
              <article
                key={clinicalCase.id}
                className="group rounded-2xl border border-white/12 bg-[#162A3D] p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-[#C59D3F]/60 hover:shadow-[0_20px_50px_rgba(10,22,34,0.5)] relative overflow-hidden"
              >
                {/* Subtle Card Ambient Glow on Hover */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_top_right,rgba(197,157,63,0.08)_0%,transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                {/* Card Top Meta Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-[#C59D3F] animate-pulse" />
                    <span className="font-mono text-xs font-bold tracking-[0.16em] text-[#C59D3F] uppercase">
                      Resultado Clínico pbserum
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1 font-mono text-[11px] font-semibold text-[#F6F3EC]/90 uppercase">
                      {clinicalCase.categoryName}
                    </span>
                    <span className="rounded-full border border-[#C59D3F]/40 bg-[#C59D3F]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#C59D3F]">
                      {clinicalCase.sessions} {clinicalCase.sessions === 1 ? "sessão" : "sessões"}
                    </span>
                  </div>
                </div>

                {/* Paired Before & After High-Fidelity Comparison Images */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 relative z-10">
                  {/* Before Image Card */}
                  <figure className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A1622] p-3 transition-colors duration-300 group-hover:border-white/20">
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
                    <figcaption className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-white/20 bg-[#0D1B2A]/95 px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-[0.14em] text-[#F6F3EC] uppercase shadow-lg backdrop-blur-md z-10">
                      Antes do Tratamento
                    </figcaption>
                  </figure>

                  {/* After Image Card */}
                  <figure className="relative overflow-hidden rounded-xl border border-[#C59D3F]/50 bg-[#0A1622] p-3 transition-colors duration-300 group-hover:border-[#C59D3F]">
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
                    <figcaption className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-[#C59D3F] px-3.5 py-1.5 font-mono text-[11px] font-extrabold tracking-[0.14em] text-[#0D1B2A] uppercase shadow-lg backdrop-blur-md z-10">
                      Resultado Final
                    </figcaption>
                  </figure>
                </div>

                {/* Case Footer: Doctor Info & Protocol Direct Link */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 relative z-10">
                  <div className="flex items-center gap-2 text-xs text-[#F6F3EC]/80">
                    <Stethoscope className="h-4 w-4 text-[#C59D3F]" />
                    <span className="font-semibold text-white">{clinicalCase.doctor}</span>
                    {clinicalCase.country && (
                      <span className="text-[#F6F3EC]/60 font-normal">
                        · {clinicalCase.country}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {hasProtocol && (
                      <Link
                        href={`/protocolos/${clinicalCase.categoryId}`}
                        className="group/btn inline-flex items-center gap-2 rounded-lg border border-[#C59D3F]/60 bg-[#C59D3F]/10 px-4 py-2 font-mono text-xs font-semibold text-[#C59D3F] transition-all hover:bg-[#C59D3F] hover:text-[#0D1B2A]"
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
        <div className="rounded-2xl border border-white/10 bg-[#162A3D]/50 p-12 text-center">
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
            className="rounded-lg bg-[#C59D3F] px-6 py-2.5 font-mono text-xs font-bold text-[#0D1B2A] transition-colors hover:bg-[#d4ac4c]"
          >
            Ver Todos os Casos
          </button>
        </div>
      )}
    </div>
  );
}
