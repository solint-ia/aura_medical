import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { LineHero } from "@/components/catalog/LineHero";
import { LineScope } from "@/components/catalog/LineScope";
import { ProtocolShowcase } from "@/components/catalog/ProtocolShowcase";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderServer } from "@/components/layout/SiteHeaderServer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { SubNavBar, type SubNavItem } from "@/components/navigation/SubNavBar";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { getFaq, getLineBySlug, getProtocolsByLine, getPublishedLines, getPublishedProducts, getSafetyNotes } from "@/server/catalog/repository";

interface PageProps { params: Promise<{ slug: string }> }

export async function generateStaticParams() { try { return (await getPublishedLines()).map((line) => ({ slug: line.slug })); } catch { return []; } }
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const line = await getLineBySlug((await params).slug);
  return line ? { title: `${line.name} | Aura Regenera`, description: line.tagline } : { title: "Linha não encontrada · Aura Regenera" };
}

/** Seções da página da marca, na ordem em que aparecem. */
function subNavItems(line: { slug: string }, hasProtocols: boolean, hasSafety: boolean): SubNavItem[] {
  const laCutanee = line.slug === "la-cutanee";
  return [
    { id: "visao-geral", label: "Visão geral" },
    { id: "produtos", label: laCutanee ? "Catálogo" : "Produtos" },
    ...(hasProtocols ? [{ id: "protocolos", label: "Protocolos" }] : []),
    ...(laCutanee
      ? [{ id: "filosofia", label: "Manifesto" }, { id: "diferenciais", label: "Diferenciais" }]
      : [{ id: "ciencia", label: "Ciência" }]),
    ...(hasSafety ? [{ id: "seguranca", label: "Segurança & FAQ" }] : []),
  ];
}

export default async function LinePage({ params }: PageProps) {
  const line = await getLineBySlug((await params).slug);
  if (!line) notFound();
  const [products, protocols, faqs, safety] = await Promise.all([getPublishedProducts({ lineSlug: line.slug }), getProtocolsByLine(line.slug), getFaq("LINE", line.id), getSafetyNotes(line.id)]);
  const colors = { surface: line.surfaceLight, surfaceDark: line.surfaceDark, accent: line.accentLight, accentDark: line.accentDark, foreground: line.inkLight, foregroundDark: line.inkDark };

  return <AccreditationProvider><SiteHeaderServer /><LineScope colors={colors}><SubNavBar items={subNavItems(line, protocols.length > 0, safety.length > 0 || faqs.length > 0)} brandLabel={line.name} /><main className="pb-20"><div className="mx-auto max-w-[1440px] px-[clamp(16px,3vw,40px)] pt-6"><Breadcrumbs items={[{ label: "Início", href: "/" }, { label: line.name }]} /></div><div id="visao-geral" className="anchor-section"><LineHero line={line} products={products} /></div>
    <section id="produtos" className="anchor-section px-[clamp(16px,4vw,48px)] py-16"><div className="mx-auto max-w-[1280px]"><p className="font-mono text-xs uppercase tracking-[.18em] text-(--line-accent)">Produtos</p><h2 className="mb-9 mt-2 font-display text-4xl font-semibold">Explore {line.name}</h2><CatalogGrid items={products} /></div></section>
    {protocols.length ? <ProtocolShowcase items={protocols} lineName={line.name} /> : null}
    {line.slug === "la-cutanee" ? <section id="filosofia" className="anchor-section px-[clamp(16px,4vw,48px)] py-16"><div className="mx-auto max-w-[1280px]"><div className="grid gap-8 border-y border-content/10 py-10 md:grid-cols-3">{[["Missão", line.mission], ["Visão", line.vision], ["Valores", line.values]].map(([title, body]) => <article key={title || ""}><h2 className="font-display text-xl font-semibold">{title}</h2><p className="mt-4 leading-relaxed text-content/70">{body}</p></article>)}</div><h2 id="diferenciais" className="anchor-section mt-12 font-display text-2xl font-semibold">Diferenciais</h2><ul className="mt-5 grid divide-y divide-content/10 border-y border-content/10 sm:grid-cols-2 sm:gap-x-10">{line.differentials.map((entry) => <li key={entry} className="py-4">{entry}</li>)}</ul><p className="mt-8 text-sm text-content/65">{line.commitments.join(" · ")}</p></div></section> : <section id="ciencia" className="anchor-section px-[clamp(16px,4vw,48px)] py-16"><div className="mx-auto max-w-[1280px] border-y border-content/10"><Link href="/enzimas" className="group flex items-center justify-between py-6 font-display text-2xl font-semibold">Ciência Pbserum<ArrowRight className="transition-transform group-hover:translate-x-1" /></Link></div></section>}
    {(safety.length || faqs.length) ? <section id="seguranca" className="anchor-section bg-raised px-[clamp(16px,4vw,48px)] py-16"><div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-2"><div><h2 className="font-display text-3xl font-semibold">Segurança e uso responsável</h2><dl className="mt-6 divide-y divide-content/10">{safety.map((note) => <div key={note.id} className="py-4"><dt className="font-semibold">{note.label}</dt><dd className="mt-2 text-sm leading-relaxed text-content/68">{note.body}</dd></div>)}</dl></div><div><h2 className="font-display text-3xl font-semibold">Dúvidas da linha</h2><div className="mt-6"><FaqAccordion items={faqs.map((faq) => ({ question: faq.question, answer: faq.answer, links: faq.links as never }))} /></div></div></div></section> : null}
  </main></LineScope><SiteFooter /></AccreditationProvider>;
}
