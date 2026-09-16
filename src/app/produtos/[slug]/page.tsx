import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { permanentRedirect } from "next/navigation";
import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { CatalogDetail } from "@/components/catalog/CatalogDetail";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderServer } from "@/components/layout/SiteHeaderServer";
import { getProductBySlug, getPublishedProducts, getSlugRedirect } from "@/server/catalog/repository";

interface PageProps { params: Promise<{ slug: string }> }

export const dynamicParams = true;
export async function generateStaticParams() { try { return (await getPublishedProducts()).map((item) => ({ slug: item.slug })); } catch { return []; } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const item = await getProductBySlug((await params).slug);
  return item ? { title: `${item.name} | Aura Regenera`, description: item.summary } : { title: "Produto não encontrado · Aura Regenera" };
}

export default async function ProductPage({ params }: PageProps) {
  const slug = (await params).slug;
  const item = await getProductBySlug(slug);
  if (!item) { const redirect = await getSlugRedirect(`/produtos/${slug}`); if (redirect) permanentRedirect(redirect.toPath); notFound(); }
  const related = (await getPublishedProducts({ lineSlug: item.line })).filter((candidate) => candidate.slug !== item.slug).slice(0, 3);
  return <AccreditationProvider><SiteHeaderServer /><CatalogDetail item={item} related={related} /><SiteFooter /></AccreditationProvider>;
}
