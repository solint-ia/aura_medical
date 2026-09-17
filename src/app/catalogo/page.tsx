import { Suspense } from "react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderServer } from "@/components/layout/SiteHeaderServer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { getPublishedProducts, getPublishedProtocols } from "@/server/catalog/repository";

export const metadata = {
  title: "Catálogo | Aura Regenera",
  description: "Biotecnologia regenerativa para a prática clínica e cuidados home care avançados.",
};

export default async function CatalogPage() {
  const [products, protocols] = await Promise.all([
    getPublishedProducts(),
    getPublishedProtocols(),
  ]);
  const allItems = [...products, ...protocols];

  return (
    <AccreditationProvider>
      <SiteHeaderServer />
      <main className="mx-auto max-w-[1380px] px-[clamp(16px,4vw,48px)] py-10">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Catálogo" }]} />
        <p className="mt-10 font-mono text-xs uppercase tracking-[.18em] text-accent">Catálogo Aura Regenera</p>
        <h1 className="mb-10 mt-2 font-display text-4xl font-semibold md:text-6xl">
          Tecnologias para a prática clínica e o cuidado home care avançado.
        </h1>
        <Suspense fallback={<p>Carregando filtros…</p>}>
          <CatalogFilters items={allItems} />
        </Suspense>
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
