"use client";

import { useId, useState } from "react";
import Link from "next/link";

import { FAQ_ITEMS } from "@/data/safety";

interface FaqAccordionProps {
  tone?: "light" | "dark";
}

export function FaqAccordion({ tone = "dark" }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  const toggle = (index: number) =>
    setOpenIndex((current) => (current === index ? null : index));

  const isDark = tone === "dark";

  return (
    <div className="flex flex-col gap-2.5">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div
            key={item.question}
            className={`border-b pb-3 transition-colors ${
              isDark ? "border-white/10" : "border-content/10"
            }`}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className={`flex w-full items-center justify-between gap-4 py-2.5 text-left font-display text-[15.5px] font-semibold transition-colors ${
                  isDark
                    ? "text-[#F6F3EC] hover:text-[#C59D3F]"
                    : "text-content hover:text-accent"
                }`}
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="flex-none text-xl font-mono text-[#C59D3F]"
                >
                  {isOpen ? "–" : "+"}
                </span>
              </button>
            </h3>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`pb-1.5 text-[14.5px] leading-[1.6] ${
                  isDark ? "text-[#F6F3EC]/80" : "text-content/75"
                }`}
              >
                <p>{item.answer}</p>
                {item.links ? (
                  <ul className="mt-2.5 flex flex-col gap-1.5">
                    {item.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-[#C59D3F] underline underline-offset-4 decoration-[#C59D3F]/40 transition-colors hover:decoration-[#C59D3F]"
                        >
                          {link.label}
                          <span aria-hidden="true">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
