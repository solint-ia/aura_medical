import { notFound } from "next/navigation";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { LineScope } from "@/components/catalog/LineScope";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderServer } from "@/components/layout/SiteHeaderServer";
import { BackLink } from "@/components/navigation/BackLink";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { CasosClinicosGallery } from "@/components/sections/CasosClinicosGallery";
import { getCasesByLine, getLineBySlug, getProtocolsByLine } from "@/server/catalog/repository";

export default async function LineCasesPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const line = await getLineBySlug(slug);
  if (!line) notFound();
  const [cases, protocols] = await Promise.all([getCasesByLine(slug), getProtocolsByLine(slug)]);
  const categories = [...new Map(cases.map((item) => [item.categoryId, item.categoryName])).entries()].map(([id, label]) => ({ id, label }));
  const colors = { surface: line.surfaceLight, surfaceDark: line.surfaceDark, accent: line.accentLight, accentDark: line.accentDark, foreground: line.inkLight, foregroundDark: line.inkDark };
  return <AccreditationProvider><SiteHeaderServer /><LineScope colors={colors}><main className="mx-auto max-w-[1280px] px-[clamp(16px,4vw,48px)] py-10"><Breadcrumbs items={[{ label: "Início", href: "/" }, { label: line.name, href: `/linhas/${slug}` }, { label: "Casos clínicos" }]} /><div className="mt-5"><BackLink fallbackHref={`/linhas/${slug}`} /></div><p className="mt-12 font-mono text-xs uppercase tracking-[.18em] text-(--line-accent)">Evidência clínica documentada</p><h1 className="mb-12 mt-3 max-w-3xl font-display text-4xl font-semibold md:text-6xl">Resultados em fotos de antes e depois.</h1><CasosClinicosGallery cases={cases} categories={categories} protocolSlugs={protocols.map((protocol) => protocol.slug)} /></main></LineScope><SiteFooter /></AccreditationProvider>;
}
