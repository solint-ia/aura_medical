import Image from "next/image";
import Link from "next/link";

import type { CatalogItem } from "@/data/catalog";

interface LineHeroProps {
  line: { slug: string; name: string; descriptor: string; tagline: string; _count: { products: number; protocols: number; cases: number } };
  products: CatalogItem[];
}

export function LineHero({ line, products }: LineHeroProps) {
  const showcase = products.slice(0, 4);
  return <section className="px-[clamp(16px,4vw,48px)] pb-10 pt-5"><div className="mx-auto grid max-w-[1280px] overflow-hidden rounded-[32px] bg-(--line-surface) text-(--line-ink) lg:grid-cols-[1.05fr_.95fr]"><div className="p-8 sm:p-12 lg:p-14"><p className="font-mono text-xs uppercase tracking-[.18em] opacity-65">{line.descriptor}</p><h1 className="mt-5 font-display text-[clamp(3.25rem,8vw,6.5rem)] font-semibold leading-[.9] tracking-[-.045em]">{line.name}</h1><p className="mt-7 max-w-[34ch] text-lg leading-relaxed opacity-75 md:text-xl">{line.tagline}</p><dl className="mt-9 flex divide-x divide-current/20">{[[line._count.products, "produtos"], [line._count.protocols, "protocolos"], [line._count.cases, "casos"]].map(([count, label]) => <div key={label} className="px-5 first:pl-0"><dt className="font-display text-2xl font-semibold">{count}</dt><dd className="font-mono text-[10px] uppercase tracking-wider opacity-60">{label}</dd></div>)}</dl><div className="mt-9 flex flex-wrap gap-3"><Link href="#produtos" className="rounded-full bg-(--line-ink) px-6 py-3 text-sm font-semibold text-(--line-surface)">Ver produtos</Link>{line._count.protocols ? <Link href="#protocolos" className="rounded-full border border-current/25 px-6 py-3 text-sm font-semibold">Protocolos clínicos</Link> : null}</div></div><div className="relative min-h-[420px] overflow-hidden"><div className="absolute inset-x-[8%] bottom-[17%] h-px bg-(--line-accent)" />{showcase.map((product, index) => <div key={product.slug} className="line-product-rise absolute bottom-[18%] w-[27%]" style={{ left: `${6 + index * 23}%`, animationDelay: `${index * 60}ms` }}><div className="relative h-[260px]"><Image src={product.image} alt={product.name} fill sizes="25vw" className="object-contain drop-shadow-[0_18px_18px_rgba(10,22,34,.22)]" /></div><p className="mt-3 truncate text-center font-mono text-[10px] uppercase tracking-wider opacity-60">{product.presentation.match(/\d+\s*(?:ml|g)/i)?.[0] || product.name}</p></div>)}</div></div></section>;
}
