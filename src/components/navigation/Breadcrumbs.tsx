import { BreadcrumbTrail } from "./BreadcrumbTrail";

export interface BreadcrumbItem { label: string; href?: string }

/**
 * `items` descreve a hierarquia do site, terminando na página atual: é o que
 * vale para o Google e para quem chega direto por link. O caminho visível vem
 * da navegação real da aba (ver `BreadcrumbTrail`).
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const itemListElement = items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.label, ...(item.href ? { item: new URL(item.href, process.env.NEXT_PUBLIC_SITE_URL || "https://auraregenera.com").toString() } : {}) }));
  return <><BreadcrumbTrail fallback={items} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement }) }} /></>;
}
