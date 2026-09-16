import Link from "next/link";
import type { CatalogItem } from "@/data/catalog";
import { CatalogGrid } from "./CatalogGrid";

export function FeaturedProducts({ items }: { items: CatalogItem[] }) {
  return <section className="px-[clamp(16px,4vw,48px)] py-16 md:py-24"><div className="mx-auto max-w-[1280px]"><p className="font-mono text-xs uppercase tracking-[.18em] text-accent">Destaques do catálogo</p><h2 className="mb-10 mt-2 max-w-3xl font-display text-4xl font-semibold md:text-5xl">Tecnologias que se encontram na prática clínica.</h2><CatalogGrid items={items} variant="featured" /><Link href="/catalogo" className="group mt-8 inline-flex items-center gap-2 font-semibold">Ver mais produtos no catálogo <span className="transition-transform group-hover:translate-x-1">→</span></Link></div></section>;
}
