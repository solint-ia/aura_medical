import { FaqAccordion } from "@/components/sections/FaqAccordion";
import type { FaqItem } from "@/data/safety";

export function SafetyFaqSection({ items }: { items: FaqItem[] }) {
  return <section id="faq" aria-labelledby="faq-title" className="scroll-mt-36 bg-raised px-[clamp(16px,4vw,48px)] py-[clamp(56px,8vw,96px)]"><div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono text-xs uppercase tracking-[.18em] text-accent">Perguntas frequentes</p><h2 id="faq-title" className="mt-3 font-display text-4xl font-semibold">Comprar com clareza, do cadastro à entrega.</h2></div><FaqAccordion items={items} /></div></section>;
}
