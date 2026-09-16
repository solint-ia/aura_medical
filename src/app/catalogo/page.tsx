import { Suspense } from "react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderServer } from "@/components/layout/SiteHeaderServer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { getPublishedProducts } from "@/server/catalog/repository";

export const metadata = { title: "Catálogo | Aura Regenera", description: "Produtos PBSerum e La Cutanée para profissionais." };

export default async function CatalogPage() {
  const products = await getPublishedProducts();
  return <AccreditationProvider><SiteHeaderServer /><main className="mx-auto max-w-[1380px] px-[clamp(16px,4vw,48px)] py-10"><Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Catálogo" }]} /><p className="mt-10 font-mono text-xs uppercase tracking-[.18em] text-accent">Catálogo Aura Regenera</p><h1 className="mb-10 mt-2 font-display text-4xl font-semibold md:text-6xl">Tecnologias para a prática clínica.</h1><Suspense fallback={<p>Carregando filtros…</p>}><CatalogFilters items={products} /></Suspense></main><SiteFooter /></AccreditationProvider>;
}
