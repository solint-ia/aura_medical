"use client";

import { useState } from "react";

import { ClinicalCaseCard } from "@/components/sections/ClinicalCaseCard";
import { SectionIntro } from "@/components/ui/SectionIntro";
import {
  CASE_CATEGORIES,
  clinicalCasesData,
  type ClinicalCase,
} from "@/data/cases";

const ALL_FILTER_ID = "todos";

export function ClinicalCasesSection() {
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER_ID);
  const [visibleCount, setVisibleCount] = useState<number>(3);

  // Filter cases based on selected category tab
  const filteredCases: ClinicalCase[] =
    activeFilter === ALL_FILTER_ID
      ? clinicalCasesData
      : clinicalCasesData.filter((item) => item.categoryId === activeFilter);

  const visibleCases = filteredCases.slice(0, visibleCount);

  const selectFilter = (filterId: string) => {
    setActiveFilter(filterId);
    setVisibleCount(3);
  };

  return (
    <section
      id="casos"
      aria-labelledby="casos-title"
      className="relative overflow-hidden bg-[#0D1B2A] px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)] text-[#F6F3EC]"
    >
      {/* Background ambient ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-60 -left-45 h-[560px] w-[560px] rounded-full border border-white/8"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.14)_0%,transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-[1280px]">
        <SectionIntro
          titleId="casos-title"
          eyebrow="Casos Clínicos · Evidência Real"
          title="Resultados comprovados em fotos de antes e depois."
          lead="Explore os resultados reais obtidos com o uso de bioregenerativos recombinantes pbserum Plus em diferentes indicações estéticas e dermatológicas."
          tone="dark"
          className="mb-9"
        />

        {/* Category Filter Tabs */}
        <div className="mx-auto -mx-[clamp(20px,4vw,56px)] mb-10 max-w-[1000px] md:mx-auto">
          <div
            role="tablist"
            aria-label="Filtrar casos clínicos por categoria"
            className="no-scrollbar flex gap-2.5 overflow-x-auto px-[clamp(20px,4vw,56px)] md:px-0 md:flex-wrap md:justify-center"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === ALL_FILTER_ID}
              onClick={() => selectFilter(ALL_FILTER_ID)}
              className={`flex-none rounded-full border px-[18px] py-2.5 font-mono text-[11.5px] tracking-[0.06em] whitespace-nowrap uppercase transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                activeFilter === ALL_FILTER_ID
                  ? "border-[#C59D3F] bg-[#C59D3F] text-[#0D1B2A] font-bold shadow-md"
                  : "border-white/18 text-[#F6F3EC]/75 hover:border-[#C59D3F]/50 hover:text-[#F6F3EC] hover:bg-white/5"
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
                  onClick={() => selectFilter(category.id)}
                  className={`flex-none rounded-full border px-[18px] py-2.5 font-mono text-[11.5px] tracking-[0.06em] whitespace-nowrap uppercase transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                    isActive
                      ? "border-[#C59D3F] bg-[#C59D3F] text-[#0D1B2A] font-bold shadow-md"
                      : "border-white/18 text-[#F6F3EC]/75 hover:border-[#C59D3F]/50 hover:text-[#F6F3EC] hover:bg-white/5"
                  }`}
                >
                  {category.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Clinical Cases Grid */}
        <div className="mx-auto max-w-[1040px] grid grid-cols-1 gap-8">
          {visibleCases.map((clinicalCase) => (
            <ClinicalCaseCard
              key={clinicalCase.id}
              clinicalCase={clinicalCase}
            />
          ))}
        </div>

        {/* Load More Button */}
        {filteredCases.length > visibleCount && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 3)}
              className="inline-flex items-center gap-2.5 rounded-full border border-[#C59D3F]/50 bg-transparent px-8 py-3.5 font-mono text-xs tracking-widest text-[#F6F3EC] uppercase transition-all hover:border-[#C59D3F] hover:bg-[#C59D3F] hover:text-[#0D1B2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold shadow-md"
            >
              <span>Ver mais casos</span>
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-[#C59D3F] group-hover:text-[#0D1B2A] transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
