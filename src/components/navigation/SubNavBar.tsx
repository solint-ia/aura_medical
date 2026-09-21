"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SubNavItem {
  /** ID da seção, sem `#`. */
  id: string;
  label: string;
}

export interface SubNavBarProps {
  items: SubNavItem[];
  /** Nome exibido à esquerda no desktop, normalmente a marca da página. */
  brandLabel?: string;
  className?: string;
}

/** Distância de cada seção até o topo da janela, como o navegador reporta. */
export interface SectionTop {
  id: string;
  top: number;
}

/**
 * Qual pílula acende: a última seção que já cruzou a linha da barra. No fim da
 * página vale a última seção, que costuma ser curta demais para cruzá-la.
 */
export function activeSectionId(sections: SectionTop[], line: number, atBottom = false): string {
  if (!sections.length) return "";
  if (atBottom) return sections[sections.length - 1].id;
  const crossed = sections.filter((section) => section.top <= line + 4);
  return (crossed[crossed.length - 1] ?? sections[0]).id;
}

/** Folga entre o topo da seção e a barra, para o título não encostar nela. */
const ANCHOR_GAP = 16;
/** Alturas presumidas até a primeira medição, alinhadas ao cabeçalho do site. */
const FALLBACK_HEADER = 80;
const FALLBACK_NAV = 46;

/**
 * Navegação interna da página: pílulas fixas logo abaixo do cabeçalho que
 * levam às seções e acendem conforme a rolagem.
 *
 * As alturas do cabeçalho e da própria barra são medidas no navegador, porque
 * o cabeçalho muda de altura entre celular e desktop. A medida vira o `top` da
 * barra e a variável `--anchor-offset`, usada pelas seções para não ficarem
 * escondidas atrás dela ao serem abertas por âncora.
 */
export function SubNavBar({ items, brandLabel, className = "" }: SubNavBarProps) {
  const nav = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  /** Só entram na barra as seções que a página realmente renderizou. */
  const [present, setPresent] = useState<SubNavItem[] | null>(null);
  const [activeId, setActiveId] = useState("");
  const [top, setTop] = useState<number | null>(null);

  const visible = present ?? items;

  const sync = useCallback(() => {
    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? FALLBACK_HEADER;
    const navHeight = nav.current?.getBoundingClientRect().height ?? FALLBACK_NAV;
    const line = headerHeight + navHeight + ANCHOR_GAP;
    document.documentElement.style.setProperty("--anchor-offset", `${Math.round(line)}px`);
    setTop(Math.round(headerHeight));

    const found: SubNavItem[] = [];
    const tops: SectionTop[] = [];
    for (const item of items) {
      const element = document.getElementById(item.id);
      if (!element) continue;
      found.push(item);
      tops.push({ id: item.id, top: element.getBoundingClientRect().top });
    }
    setPresent((previous) =>
      previous && previous.length === found.length && previous.every((entry, index) => entry.id === found[index].id) ? previous : found,
    );

    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    setActiveId(activeSectionId(tops, line, atBottom));
  }, [items]);

  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      // Sem barra na próxima página, o deslocamento das âncoras volta ao padrão.
      document.documentElement.style.removeProperty("--anchor-offset");
    };
  }, [sync]);

  // No celular o trilho rola: a pílula acesa precisa continuar à vista.
  useEffect(() => {
    if (!activeId) return;
    rail.current?.querySelector(`[data-pill="${activeId}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  function goTo(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    window.history.replaceState(window.history.state, "", `#${id}`);
    setActiveId(id);
  }

  // Uma pílula sozinha não é navegação; a barra some para não roubar espaço.
  if (visible.length < 2) return null;

  return (
    <nav
      ref={nav}
      aria-label="Navegação interna da página"
      style={top === null ? undefined : { top }}
      className={`sticky top-20 z-40 w-full border-b border-content/8 bg-canvas/85 backdrop-blur-xl sm:top-25 lg:top-30 ${className}`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-2 sm:px-8">
        {brandLabel ? (
          <span className="hidden shrink-0 font-display text-sm font-semibold tracking-wide text-content/90 sm:inline-block">{brandLabel}</span>
        ) : null}
        <div ref={rail} className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto py-1 sm:w-auto">
          {visible.map((item) => {
            const active = item.id === activeId;
            return (
              <a
                key={item.id}
                data-pill={item.id}
                href={`#${item.id}`}
                onClick={(event) => goTo(event, item.id)}
                aria-current={active ? "true" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${
                  active
                    ? "bg-[var(--line-accent,var(--color-accent))] text-[var(--line-ink,var(--color-accent-fg))] shadow-sm"
                    : "text-content/70 hover:bg-content/5 hover:text-content"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
