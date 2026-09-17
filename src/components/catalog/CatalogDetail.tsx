import Image from "next/image";
import Link from "next/link";

import type { CatalogItem, DetailSection } from "@/data/catalog";
import { BackLink } from "@/components/navigation/BackLink";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Tag } from "@/components/ui/Tag";
import { CatalogCard } from "./CatalogCard";
import { LineScope } from "./LineScope";
import { PurchasePanel } from "./PurchasePanel";

export function CatalogDetail({ item, related = [] }: { item: CatalogItem; related?: CatalogItem[] }) {
  const line = item.lineInfo || { id: item.line, name: item.line, descriptor: "", colors: { surface: "#EEF1F5", surfaceDark: "#112233", accent: "#B4872D", accentDark: "#D8B657", foreground: "#12283C", foregroundDark: "#F7F5F0" } };
  const protocol = item.protocol;

  return <LineScope colors={line.colors}>
    <main className="pb-20 pt-5 text-content md:pt-8">
      <div className="mx-auto max-w-[1280px] px-[clamp(16px,4vw,48px)]">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: line.name, href: `/linhas/${line.id}` }, ...(item.kind === "protocol" ? [{ label: "Protocolos", href: `/linhas/${line.id}#protocolos` }] : []), { label: item.name }]} />
        <div className="mt-5"><BackLink fallbackHref={item.kind === "protocol" ? `/linhas/${line.id}#protocolos` : `/linhas/${line.id}`} /></div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className={`relative min-h-[420px] overflow-hidden rounded-[32px] md:min-h-[600px] ${item.kind === "protocol" ? "bg-card" : "product-halo"}`}>
            <div className={item.kind === "protocol" ? "absolute inset-0" : "absolute inset-[12%]"}><Image src={item.image} alt={item.name} fill priority sizes="(max-width: 1024px) 92vw, 46vw" className={item.kind === "protocol" ? "object-cover" : "object-contain drop-shadow-[0_18px_20px_rgba(10,22,34,.2)]"} /></div>
          </section>

          <section className="rounded-[32px] border border-content/10 bg-card p-6 shadow-[0_18px_55px_rgba(18,40,60,0.08)] md:p-10">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--line-accent)">{line.name} · {item.category}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-[1.08] text-content sm:text-4xl xl:text-5xl">{item.name}</h1>
            <p className="mt-5 text-base leading-relaxed text-content/72 md:text-lg">{item.summary}</p>
            {item.tags.length ? <div className="mt-5 flex flex-wrap gap-2">{item.tags.slice(0, 2).map((tag) => <Tag key={tag}>{tag}</Tag>)}</div> : null}
            <dl className="mt-7 divide-y divide-content/10 border-y border-content/10 text-sm"><div className="grid grid-cols-[8rem_1fr] gap-4 py-3"><dt className="font-mono text-xs uppercase tracking-wider text-content/55">Apresentação</dt><dd className="font-semibold">{item.presentation}</dd></div>{protocol ? <div className="grid grid-cols-[8rem_1fr] gap-4 py-3"><dt className="font-mono text-xs uppercase tracking-wider text-content/55">Sessões</dt><dd className="font-semibold">{protocol.sessions} · {protocol.frequency}</dd></div> : null}</dl>
            <PurchasePanel item={item} />
          </section>
        </div>

        <div className="mt-12">
          {protocol ? <ProtocolSections item={item} /> : <EditorialSections sections={item.sections} />}
        </div>
      </div>

      {related.length ? <section className="mt-16 bg-raised px-[clamp(16px,4vw,48px)] py-14"><div className="mx-auto max-w-[1280px]"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[.15em] text-(--line-accent)">Continue explorando</p><h2 className="mt-2 font-display text-3xl font-semibold">Mais da {line.name}</h2></div><Link href={`/linhas/${line.id}`} className="text-sm font-semibold">Ver linha completa</Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((entry) => <CatalogCard key={entry.slug} item={entry} />)}</div></div></section> : null}
    </main>
  </LineScope>;
}

function EditorialSections({ sections }: { sections: DetailSection[] }) {
  return <>{sections.map((section) => <section key={section.title} className="grid border-t border-content/10 py-10 md:py-14 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12"><h2 className="font-display text-xl font-semibold lg:sticky lg:top-32 lg:self-start">{section.title}</h2><div className="mt-5 max-w-[62ch] text-[17px] leading-[1.7] text-content/75 lg:mt-0">{section.body ? <p>{section.body}</p> : null}{section.items?.length ? <ul className="mt-3 divide-y divide-content/10">{section.items.map((entry) => <li key={entry} className="py-3">{entry}</li>)}</ul> : null}</div></section>)}</>;
}

function ProtocolSections({ item }: { item: CatalogItem }) {
  const protocol = item.protocol!;
  return <><section className="grid border-t border-content/10 py-10 md:py-14 lg:grid-cols-[15rem_1fr] lg:gap-12"><h2 className="font-display text-xl font-semibold">Composição</h2><div className="mt-5 overflow-x-auto lg:mt-0"><table className="w-full border-collapse text-left text-sm"><thead className="font-mono text-xs uppercase tracking-wider text-content/55"><tr><th className="border-b border-content/15 py-3">Ampolas</th><th className="border-b border-content/15 py-3">Produto</th><th className="border-b border-content/15 py-3">Função</th></tr></thead><tbody>{protocol.composition.map((entry) => <tr key={`${entry.product}-${entry.role}`}><td className="border-b border-content/10 py-4">{entry.quantity}</td><td className="border-b border-content/10 py-4 font-semibold">{entry.product}</td><td className="border-b border-content/10 py-4">{entry.role}</td></tr>)}</tbody></table></div></section><EditorialSections sections={[{ title: "Reconstituição", items: protocol.reconstitution }, { title: "Marcação", body: protocol.marking }, { title: "Resultados esperados", items: protocol.expectedResults }]} />{protocol.mappingImage ? <div className="relative min-h-[360px] overflow-hidden rounded-[24px] border border-content/10 bg-card"><Image src={protocol.mappingImage} alt={`Mapeamento do protocolo ${item.name}`} fill sizes="(max-width: 768px) 92vw, 85vw" className="object-cover" /></div> : null}</>;
}
