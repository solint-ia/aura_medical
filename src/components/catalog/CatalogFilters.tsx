"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { CatalogItem } from "@/data/catalog";
import { CatalogCard } from "./CatalogCard";

const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function CatalogFilters({ items }: { items: CatalogItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const line = searchParams.get("linha") || "";
  const category = searchParams.get("categoria") || "";
  const lines = useMemo(() => [...new Map(items.map((item) => [item.line, item.lineInfo?.name || item.line])).entries()], [items]);
  const categories = useMemo(() => [...new Map(items.filter((item) => !line || item.line === line).map((item) => [slugify(item.category), item.category])).entries()], [items, line]);
  const filtered = items.filter((item) => (!line || item.line === line) && (!category || slugify(item.category) === category));

  function update(key: "linha" | "categoria", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key === "linha") params.delete("categoria");
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  return (
    <div>
      <div className="mb-8 grid gap-4 rounded-[24px] border border-content/10 bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-semibold">Linha<select value={line} onChange={(event) => update("linha", event.target.value)} className="min-h-11 rounded-xl border border-content/15 bg-canvas px-3 font-normal"><option value="">Todas as linhas ({items.length})</option>{lines.map(([slug, name]) => <option key={slug} value={slug}>{name} ({items.filter((item) => item.line === slug).length})</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Categoria<select value={category} onChange={(event) => update("categoria", event.target.value)} className="min-h-11 rounded-xl border border-content/15 bg-canvas px-3 font-normal"><option value="">Todas as categorias</option>{categories.map(([slug, name]) => <option key={slug} value={slug}>{name} ({items.filter((item) => (!line || item.line === line) && slugify(item.category) === slug).length})</option>)}</select></label>
        <button type="button" onClick={() => router.replace(pathname, { scroll: false })} disabled={!line && !category} className="min-h-11 rounded-full border border-content/20 px-5 text-sm font-semibold disabled:opacity-40">Limpar filtros</button>
      </div>
      <p aria-live="polite" className="mb-5 font-mono text-xs uppercase tracking-wider text-content/55">{filtered.length} {filtered.length === 1 ? "produto" : "produtos"}</p>
      {filtered.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((item) => <CatalogCard key={item.slug} item={item} />)}</div> : <div className="rounded-[24px] border border-dashed border-content/20 p-10 text-center"><p>Nenhum produto encontrado.</p><button type="button" onClick={() => router.replace(pathname)} className="mt-4 font-semibold text-accent">Limpar filtros</button></div>}
    </div>
  );
}
