"use client";

import { useState } from "react";
import Image from "next/image";

import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SectionIntro } from "@/components/ui/SectionIntro";
import {
  CASE_CATEGORIES,
  CLINICAL_CASES,
  type CaseCategoryId,
  type ClinicalCase,
} from "@/data/cases";

const CATEGORY_LABEL: Record<CaseCategoryId, string> = Object.fromEntries(
  CASE_CATEGORIES.map((category) => [category.id, category.label]),
) as Record<CaseCategoryId, string>;

type FilterId = CaseCategoryId;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "flacidez", label: "Flacidez Facial" },
  { id: "gordura", label: "Gordura Localizada" },
  { id: "celulite", label: "Celulite" },
  { id: "cicatrizes", label: "Cicatrizes" },
  { id: "fibrose", label: "Fibrose" },
];

/** "Caso Clínico 01", "Caso Clínico 02"… padded so the index reads as a series. */
function caseNumber(id: number): string {
  return String(id).padStart(2, "0");
}

const STAGES = [
  { key: "before", label: "Antes" },
  { key: "after", label: "Depois" },
] as const;

function CaseStages({ clinicalCase }: { clinicalCase: ClinicalCase }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5">
      {STAGES.map((stage) => {
        const src = clinicalCase.photos?.[stage.key];
        return (
          <figure key={stage.key} className="relative">
            {src ? (
              <div className="relative aspect-3/4 w-full overflow-hidden rounded-[10px] bg-navy-deep">
                <Image
                  src={src}
                  alt={`${stage.label}: ${clinicalCase.doctor}`}
                  fill
                  sizes="(max-width: 640px) 45vw, 340px"
                  className="object-cover"
                />
              </div>
            ) : (
              <PhotoSlot
                alt={`${stage.label}: ${clinicalCase.doctor}`}
                caption={`Foto ${stage.label.toLowerCase()} em breve`}
                sizes="(max-width: 640px) 45vw, 340px"
                className="aspect-3/4 w-full rounded-[10px]"
              />
            )}
            <figcaption className="pointer-events-none absolute top-2.5 left-2.5 rounded-full bg-navy-deep/80 backdrop-blur-xs px-2.5 py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#F6F3EC] uppercase">
              {stage.label}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function casesFor(filter: FilterId): ClinicalCase[] {
  return CLINICAL_CASES.filter((item) => item.category === filter);
}

export function ClinicalCasesSection() {
  const [activeFilter, setActiveFilter] = useState<FilterId>(FILTERS[0].id);
  const initialCases = casesFor(FILTERS[0].id);
  const [openId, setOpenId] = useState<number | null>(
    initialCases[0]?.id ?? null,
  );
  const [visibleCount, setVisibleCount] = useState(3);

  const categoryCases = casesFor(activeFilter);
  const visibleCases = categoryCases.slice(0, visibleCount);

  const selectFilter = (filter: FilterId) => {
    setActiveFilter(filter);
    const filterCases = casesFor(filter);
    setOpenId(filterCases[0]?.id ?? null);
    setVisibleCount(3);
  };

  return (
    <section
      id="casos"
      aria-labelledby="casos-title"
      className="relative overflow-hidden bg-canvas px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-60 -left-45 h-[560px] w-[560px] rounded-full border border-content/6"
      />

      <div className="relative mx-auto max-w-[1280px]">
        <SectionIntro
          titleId="casos-title"
          eyebrow="Casos Clínicos · Rede Internacional"
          title="Resultados documentados por médicos em mais de 10 países."
          lead="Abra cada caso para ver o antes e o depois lado a lado."
          className="mb-9"
        />

        {/* Filter tabs */}
        <div className="mx-auto -mx-[clamp(20px,4vw,56px)] mb-8 max-w-[880px] md:mx-auto">
          <div
            role="tablist"
            aria-label="Filtrar casos clínicos por categoria"
            className="no-scrollbar flex gap-2.5 overflow-x-auto px-[clamp(20px,4vw,56px)] md:px-0"
          >
            {FILTERS.map((filter) => {
              const isActive = filter.id === activeFilter;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectFilter(filter.id)}
                  className={`flex-none rounded-full border px-[18px] py-2.5 font-mono text-[11.5px] tracking-[0.06em] whitespace-nowrap uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                    isActive
                      ? "border-[#C59D3F] bg-[#C59D3F] text-[#0D1B2A]"
                      : "border-content/24 text-content/78 hover:border-content/50 hover:text-content"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto max-w-[880px] divide-y divide-content/12 border-y border-content/12">
          {visibleCases.map((clinicalCase, index) => {
            const displayIndex = index + 1;
            const isOpen = openId === clinicalCase.id;
            const panelId = `caso-panel-${clinicalCase.id}`;
            const buttonId = `caso-button-${clinicalCase.id}`;

            return (
              <div key={clinicalCase.id}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() =>
                      setOpenId((current) =>
                        current === clinicalCase.id ? null : clinicalCase.id,
                      )
                    }
                    className="group flex w-full items-center gap-4 py-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:gap-6"
                  >
                    <span className="font-mono text-[13px] font-medium text-[#C59D3F] tabular-nums">
                      {caseNumber(displayIndex)}
                    </span>

                    <span className="flex-1">
                      <span className="block font-display text-[17px] font-semibold text-content sm:text-[19px]">
                        Caso Clínico {caseNumber(displayIndex)} ·{" "}
                        {CATEGORY_LABEL[clinicalCase.category]}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] tracking-[0.04em] text-content/55 uppercase">
                        {clinicalCase.doctor} · {clinicalCase.meta}
                      </span>
                    </span>

                    <svg
                      aria-hidden="true"
                      className={`h-5 w-5 flex-none text-content/60 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="pb-8"
                >
                  <div className="rounded-[14px] border border-content/12 bg-card p-5 sm:p-7 shadow-xs">
                    <CaseStages clinicalCase={clinicalCase} />
                    {clinicalCase.note ? (
                      <p className="mt-4 text-[13.5px] text-content/75">
                        {clinicalCase.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {categoryCases.length > visibleCount && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 3)}
              className="inline-flex items-center gap-2 rounded-full border border-[#C59D3F]/40 bg-transparent px-8 py-3 font-mono text-xs tracking-widest text-content uppercase transition-all hover:border-[#C59D3F] hover:bg-[#C59D3F]/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <span>Ver mais</span>
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-[#C59D3F]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
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
