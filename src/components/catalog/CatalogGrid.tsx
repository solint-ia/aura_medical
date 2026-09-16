import type { CatalogItem } from "@/data/catalog";
import { CatalogCard } from "./CatalogCard";

// Conjuntos completos por variante: somar classes `xl:grid-cols-*` conflitantes deixa a de maior número vencer.
const columns = {
  catalog: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  featured: "sm:grid-cols-2 lg:grid-cols-3",
};

export function CatalogGrid({ items, variant = "catalog", className = "" }: { items: CatalogItem[]; variant?: keyof typeof columns; className?: string }) {
  return <div className={`grid gap-5 ${columns[variant]} ${className}`}>{items.map((item) => <CatalogCard key={item.slug} item={item} />)}</div>;
}
