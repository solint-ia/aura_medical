"use client";

import { useState } from "react";

import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ACCREDITATION_CTA_LABEL, NAV_LINKS } from "@/data/site";

export function SiteHeader() {
  const [isMenuRequested, setIsMenuRequested] = useState(false);
  const isWideViewport = useMediaQuery("(min-width: 1180px)", true);

  // The panel is a narrow-viewport affordance: once the full nav takes over it
  // is closed, without needing an effect to reset the flag.
  const isMenuOpen = isMenuRequested && !isWideViewport;

  const closeMenu = () => setIsMenuRequested(false);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-6 border-b border-content/8 bg-canvas/92 px-[clamp(20px,4vw,56px)] py-[18px] backdrop-blur-[10px]">
      <a href="#hero" className="flex flex-wrap items-baseline gap-2.5">
        <span className="font-display text-xl font-bold tracking-[-0.01em] text-content">
          Aura Medical
        </span>
        <span className="font-mono text-[10.5px] tracking-[0.06em] text-content/80 uppercase">
          Distribuidor Oficial pbserum
        </span>
      </a>

      <nav
        aria-label="Seções da página"
        className="hidden items-center gap-[22px] wide:flex"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-[14.5px] font-medium whitespace-nowrap text-content transition-colors hover:text-accent"
          >
            {link.label}
          </a>
        ))}
        <AccreditationButton className="rounded-[7px] bg-action px-[22px] py-[11px] text-sm font-semibold whitespace-nowrap text-action-fg transition-colors hover:bg-action-hover">
          {ACCREDITATION_CTA_LABEL}
        </AccreditationButton>
        <ThemeToggle />
      </nav>

      {/* Below the nav breakpoint the toggle stays out on its own, so switching
          theme never costs a trip through the menu. */}
      <div className="flex items-center gap-2 wide:hidden">
        <ThemeToggle className="h-11 w-11" />

        <button
          type="button"
          onClick={() => setIsMenuRequested((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="menu-mobile"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-lg border border-content/15 wide:hidden"
        >
          {isMenuOpen ? (
            <>
              <span className="h-0.5 w-[18px] translate-y-px rotate-45 bg-action" />
              <span className="-mt-0.5 h-0.5 w-[18px] -translate-y-px -rotate-45 bg-action" />
            </>
          ) : (
            <>
              <span className="h-0.5 w-[18px] bg-action" />
              <span className="h-0.5 w-[18px] bg-action" />
              <span className="h-0.5 w-[18px] bg-action" />
            </>
          )}
        </button>
      </div>

      {isMenuOpen ? (
        <div
          id="menu-mobile"
          className="absolute top-full right-0 left-0 flex flex-col gap-[18px] border-b border-content/8 bg-canvas px-[clamp(20px,4vw,56px)] pt-5 pb-7 shadow-[0_12px_24px_rgba(18,40,60,0.1)] wide:hidden"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="text-base font-medium text-content"
            >
              {link.label}
            </a>
          ))}
          <AccreditationButton
            onActivate={closeMenu}
            className="rounded-[7px] bg-action px-[22px] py-3.5 text-[15px] font-semibold text-action-fg"
          >
            {ACCREDITATION_CTA_LABEL}
          </AccreditationButton>
        </div>
      ) : null}
    </header>
  );
}
