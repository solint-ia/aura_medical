import { FramedImage } from "@/components/ui/FramedImage";
import Link from "next/link";
import type { CatalogClinicalCase } from "@/data/catalog";

export function ClinicalCasesSection({ cases }: { cases: CatalogClinicalCase[] }) {
  if (!cases.length) return null;
  return <section id="casos-clinicos" className="anchor-section mt-14 border-t border-content/10 pt-12" aria-labelledby="clinical-cases-title">
    <p className="font-mono text-xs uppercase tracking-[.15em] text-(--line-accent)">Resultados documentados</p>
    <h2 id="clinical-cases-title" className="mt-2 font-display text-3xl font-semibold">Antes e depois</h2>
    <div className="mt-8 space-y-8">{cases.map((clinicalCase) => <article key={clinicalCase.id} className="rounded-[24px] border border-content/10 bg-card p-5 md:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-xl font-semibold">{clinicalCase.title}</h3>{clinicalCase.description ? <p className="mt-2 max-w-[70ch] text-sm text-content/68">{clinicalCase.description}</p> : null}</div><span className="rounded-full bg-raised px-3 py-1 font-mono text-xs">{clinicalCase.sessions} {clinicalCase.sessions === 1 ? "sessão" : "sessões"}</span></div>
      <div className="grid gap-4 sm:grid-cols-2">{([["Antes", clinicalCase.beforeImage, clinicalCase.beforeFraming], ["Depois", clinicalCase.afterImage, clinicalCase.afterFraming]] as const).map(([label, src, framing]) => <figure key={label} className="overflow-hidden rounded-[18px] border border-content/10 bg-canvas"><div className="relative aspect-[4/3]"><FramedImage src={src} alt={`${label} — ${clinicalCase.title}`} framing={framing} fill sizes="(max-width: 640px) 92vw, 42vw" className="object-contain" /></div><figcaption className="border-t border-content/10 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider">{label}</figcaption></figure>)}</div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-content/10 pt-4 text-sm"><p><strong>{clinicalCase.professional}</strong>{clinicalCase.country ? ` · ${clinicalCase.country}` : ""}</p>{clinicalCase.related.length ? <div className="flex flex-wrap items-center gap-3">{clinicalCase.related.map((entry) => <Link key={entry.href} href={entry.href} className="font-semibold text-(--line-accent)">Ver também em {entry.name}</Link>)}</div> : null}</div>
    </article>)}</div>
  </section>;
}
