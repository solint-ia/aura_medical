"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CaseCard } from "@/components/sections/CaseCard";
import { ScrollHint } from "@/components/ui/ScrollHint";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { useScrollHint } from "@/hooks/useScrollHint";
import {
  CASE_CATEGORIES,
  CLINICAL_CASES,
  type CaseCategoryId,
} from "@/data/cases";

/** Wait for the swipe to settle before syncing the dots to the scroll position. */
const SCROLL_SETTLE_MS = 120;

export function ClinicalCasesSection() {
  const [activeCategory, setActiveCategory] =
    useState<CaseCategoryId>("flacidez");
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { railRef: filterRailRef, hasMore: filtersHaveMore } =
    useScrollHint<HTMLDivElement>();

  const visibleCases = useMemo(
    () => CLINICAL_CASES.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  const scrollToCase = (index: number, behavior: ScrollBehavior = "smooth") => {
    const clamped = Math.max(0, Math.min(index, visibleCases.length - 1));
    setActiveIndex(clamped);
    carouselRef.current?.scrollTo({
      left: clamped * carouselRef.current.clientWidth,
      behavior,
    });
  };

  const selectCategory = (category: CaseCategoryId) => {
    setActiveCategory(category);
    setActiveIndex(0);
    carouselRef.current?.scrollTo({ left: 0, behavior: "auto" });
  };

  // Manual swipes move the scroll position without going through scrollToCase,
  // so read it back to keep the arrows and dots truthful.
  const handleScroll = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const width = carousel.clientWidth || 1;
      setActiveIndex(Math.round(carousel.scrollLeft / width));
    }, SCROLL_SETTLE_MS);
  };

  const hasMultipleCases = visibleCases.length > 1;
  const isFirst = activeIndex <= 0;
  const isLast = activeIndex >= visibleCases.length - 1;

  return (
    <section
      id="casos"
      aria-labelledby="casos-title"
      className="relative overflow-hidden bg-panel px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-60 -left-45 h-[560px] w-[560px] rounded-full border border-on-panel/6"
      />

      <div className="relative mx-auto max-w-[1280px]">
        <SectionIntro
          tone="dark"
          titleId="casos-title"
          eyebrow="Casos Clínicos · Rede Internacional"
          title="Resultados documentados por médicos em mais de 10 países."
          lead="Uma amostra da rede de clínicas credenciadas pbserum. Os espaços abaixo estão prontos para receber as fotos de antes/depois de cada caso."
          className="mb-11"
        />

        {/* A rail on touch: the filters run off the edge of the screen and are
            swiped. From `md` there is room for the original wrapped block.
            The negative margin matches the section padding, so the rail bleeds
            to the screen edge while the first pill stays aligned with the
            headline above it. */}
        <div className="relative -mx-[clamp(20px,4vw,56px)] mb-7 md:mx-0 md:mb-9">
          <div
            ref={filterRailRef}
            role="tablist"
            aria-label="Categorias de casos clínicos"
            className="no-scrollbar -my-2 flex gap-3 overflow-x-auto px-[clamp(20px,4vw,56px)] py-2 md:my-0 md:flex-wrap md:overflow-x-visible md:px-0 md:py-0"
          >
            {CASE_CATEGORIES.map((category) => {
              const isActive = category.id === activeCategory;
              const count = CLINICAL_CASES.filter(
                (item) => item.category === category.id,
              ).length;

              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="casos-carousel"
                  onClick={() => selectCategory(category.id)}
                  className={`flex-none rounded-full border px-[18px] py-2.5 font-mono text-[11.5px] tracking-[0.06em] whitespace-nowrap uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                    isActive
                      ? "border-gold bg-gold text-navy"
                      : "border-on-panel/24 text-on-panel/78 hover:border-on-panel/50 hover:text-on-panel"
                  }`}
                >
                  {category.label} · {count}
                </button>
              );
            })}
          </div>
          <ScrollHint visible={filtersHaveMore} />
        </div>

        <div className="relative mx-auto max-w-[880px]">
          <div
            id="casos-carousel"
            ref={carouselRef}
            onScroll={handleScroll}
            role="tabpanel"
            className="no-scrollbar flex snap-x snap-mandatory flex-row overflow-x-auto"
          >
            {visibleCases.map((clinicalCase) => (
              <div
                key={clinicalCase.id}
                className="w-full flex-none snap-center"
              >
                <CaseCard clinicalCase={clinicalCase} />
              </div>
            ))}
          </div>

          {hasMultipleCases ? (
            <>
              <button
                type="button"
                aria-label="Caso anterior"
                disabled={isFirst}
                onClick={() => scrollToCase(activeIndex - 1)}
                className="absolute top-1/2 left-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-on-panel/30 bg-panel/65 text-lg text-on-panel disabled:pointer-events-none disabled:opacity-35"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Próximo caso"
                disabled={isLast}
                onClick={() => scrollToCase(activeIndex + 1)}
                className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-on-panel/30 bg-panel/65 text-lg text-on-panel disabled:pointer-events-none disabled:opacity-35"
              >
                ›
              </button>

              <div className="mt-5 flex justify-center gap-2">
                {visibleCases.map((clinicalCase, index) => (
                  <button
                    key={clinicalCase.id}
                    type="button"
                    aria-label={`Ir ao caso ${index + 1} de ${visibleCases.length}`}
                    aria-current={index === activeIndex}
                    onClick={() => scrollToCase(index)}
                    className={`h-2 rounded-full transition-all duration-250 ${
                      index === activeIndex
                        ? "w-[22px] bg-on-panel"
                        : "w-2 bg-on-panel/35"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
