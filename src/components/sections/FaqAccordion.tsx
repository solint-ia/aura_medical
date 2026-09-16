"use client";

import { useId, useState } from "react";
import Link from "next/link";

import { FAQ_ITEMS } from "@/data/safety";

interface FaqAccordionProps {
  items?: typeof FAQ_ITEMS;
}

export function FaqAccordion({ items = FAQ_ITEMS }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  const toggle = (index: number) =>
    setOpenIndex((current) => (current === index ? null : index));

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div
            key={item.question}
            className="border-b border-content/10 pb-3 transition-colors"
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 py-2.5 text-left font-display text-[15.5px] font-semibold text-content transition-colors hover:text-accent"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="flex-none font-mono text-xl text-accent"
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
                className="pb-1.5 text-[14.5px] leading-[1.6] text-content/75"
              >
                <p>{item.answer}</p>
                {item.links ? (
                  <ul className="mt-2.5 flex flex-col gap-1.5">
                    {item.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
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
