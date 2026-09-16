import Link from "next/link";

export interface BreadcrumbItem { label: string; href?: string }

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const itemListElement = items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.label, ...(item.href ? { item: new URL(item.href, process.env.NEXT_PUBLIC_SITE_URL || "https://auraregenera.com").toString() } : {}) }));
  return <><nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-content/55">{items.map((item, index) => <span key={`${item.label}-${index}`} className="flex items-center gap-2">{index ? <span aria-hidden="true">/</span> : null}{item.href ? <Link href={item.href} className="hover:text-content">{item.label}</Link> : <span aria-current="page" className="text-content/80">{item.label}</span>}</span>)}</nav><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement }) }} /></>;
}
