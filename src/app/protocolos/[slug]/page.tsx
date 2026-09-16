import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { permanentRedirect } from "next/navigation";
import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { CatalogDetail } from "@/components/catalog/CatalogDetail";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderServer } from "@/components/layout/SiteHeaderServer";
import { getProtocolBySlug, getProtocolsByLine, getPublishedProducts, getSlugRedirect } from "@/server/catalog/repository";

interface PageProps { params: Promise<{ slug: string }> }

export const dynamicParams = true;
export async function generateStaticParams() { try { return (await getProtocolsByLine("pbserum")).map((item) => ({ slug: item.slug })); } catch { return []; } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const item = await getProtocolBySlug((await params).slug);
  return item ? { title: `${item.name} · PBSerum | Aura Regenera`, description: item.summary } : { title: "Protocolo não encontrado · Aura Regenera" };
}

export default async function ProtocolPage({ params }: PageProps) {
  const slug = (await params).slug;
  const item = await getProtocolBySlug(slug);
  if (!item) { const redirect = await getSlugRedirect(`/protocolos/${slug}`); if (redirect) permanentRedirect(redirect.toPath); notFound(); }
  const related = (await getPublishedProducts({ lineSlug: item.line })).slice(0, 3);
  return <AccreditationProvider><SiteHeaderServer /><CatalogDetail item={item} related={related} /><SiteFooter /></AccreditationProvider>;
}
