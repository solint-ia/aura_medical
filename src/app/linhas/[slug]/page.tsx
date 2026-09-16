import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { LineHero } from "@/components/catalog/LineHero";
import { LineScope } from "@/components/catalog/LineScope";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderServer } from "@/components/layout/SiteHeaderServer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { getFaq, getLineBySlug, getProtocolsByLine, getPublishedLines, getPublishedProducts, getSafetyNotes } from "@/server/catalog/repository";

interface PageProps { params: Promise<{ slug: string }> }

export async function generateStaticParams() { try { return (await getPublishedLines()).map((line) => ({ slug: line.slug })); } catch { return []; } }
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const line = await getLineBySlug((await params).slug);
  return line ? { title: `${line.name} | Aura Regenera`, description: line.tagline } : { title: "Linha não encontrada · Aura Regenera" };
}

export default async function LinePage({ params }: PageProps) {
  const line = await getLineBySlug((await params).slug);
  if (!line) notFound();
  const [products, protocols, faqs, safety] = await Promise.all([getPublishedProducts({ lineSlug: line.slug }), getProtocolsByLine(line.slug), getFaq("LINE", line.id), getSafetyNotes(line.id)]);
  const colors = { surface: line.surfaceLight, surfaceDark: line.surfaceDark, accent: line.accentLight, accentDark: line.accentDark, foreground: line.inkLight, foregroundDark: line.inkDark };

  return <AccreditationProvider><SiteHeaderServer /><LineScope colors={colors}><main className="pb-20"><div className="mx-auto max-w-[1280px] px-[clamp(16px,4vw,48px)] pt-6"><Breadcrumbs items={[{ label: "Início", href: "/" }, { label: line.name }]} /></div><LineHero line={line} products={products} />
    <section id="produtos" className="scroll-mt-36 px-[clamp(16px,4vw,48px)] py-16"><div className="mx-auto max-w-[1280px]"><p className="font-mono text-xs uppercase tracking-[.18em] text-(--line-accent)">Produtos</p><h2 className="mb-9 mt-2 font-display text-4xl font-semibold">Explore {line.name}</h2><CatalogGrid items={products} /></div></section>
    {protocols.length ? <section id="protocolos" className="scroll-mt-36 bg-raised px-[clamp(16px,4vw,48px)] py-16"><div className="mx-auto max-w-[1280px]"><p className="font-mono text-xs uppercase tracking-[.18em] text-(--line-accent)">Protocolos clínicos</p><h2 className="mb-8 mt-2 font-display text-4xl font-semibold">Aplicações por indicação</h2><div className="divide-y divide-content/10 border-y border-content/10">{protocols.map((protocol) => <Link key={protocol.slug} href={`/protocolos/${protocol.slug}`} className="group grid gap-2 py-6 md:grid-cols-[1fr_2fr_auto] md:items-center"><h3 className="font-display text-xl font-semibold">{protocol.name}</h3><p className="line-clamp-2 text-sm text-content/65">{protocol.summary}</p><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>)}</div></div></section> : null}
    {line.slug === "la-cutanee" ? <section className="px-[clamp(16px,4vw,48px)] py-16"><div className="mx-auto max-w-[1280px]"><div className="grid gap-8 border-y border-content/10 py-10 md:grid-cols-3">{[["Missão", line.mission], ["Visão", line.vision], ["Valores", line.values]].map(([title, body]) => <article key={title || ""}><h2 className="font-display text-xl font-semibold">{title}</h2><p className="mt-4 leading-relaxed text-content/70">{body}</p></article>)}</div><h2 className="mt-12 font-display text-2xl font-semibold">Diferenciais</h2><ul className="mt-5 grid divide-y divide-content/10 border-y border-content/10 sm:grid-cols-2 sm:gap-x-10">{line.differentials.map((entry) => <li key={entry} className="py-4">{entry}</li>)}</ul><p className="mt-8 text-sm text-content/65">{line.commitments.join(" · ")}</p></div></section> : <section className="px-[clamp(16px,4vw,48px)] py-16"><div className="mx-auto max-w-[1280px] divide-y divide-content/10 border-y border-content/10">{[["Ciência PBSerum", "/enzimas"], ["Casos clínicos", `/linhas/${line.slug}/casos-clinicos`]].map(([label, href]) => <Link key={href} href={href} className="group flex items-center justify-between py-6 font-display text-2xl font-semibold">{label}<ArrowRight className="transition-transform group-hover:translate-x-1" /></Link>)}</div></section>}
    {(safety.length || faqs.length) ? <section className="bg-raised px-[clamp(16px,4vw,48px)] py-16"><div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-2"><div><h2 className="font-display text-3xl font-semibold">Segurança e uso responsável</h2><dl className="mt-6 divide-y divide-content/10">{safety.map((note) => <div key={note.id} className="py-4"><dt className="font-semibold">{note.label}</dt><dd className="mt-2 text-sm leading-relaxed text-content/68">{note.body}</dd></div>)}</dl></div><div><h2 className="font-display text-3xl font-semibold">Dúvidas da linha</h2><div className="mt-6"><FaqAccordion items={faqs.map((faq) => ({ question: faq.question, answer: faq.answer, links: faq.links as never }))} /></div></div></div></section> : null}
  </main></LineScope><SiteFooter /></AccreditationProvider>;
}
