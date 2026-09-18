import type { Prisma } from "@prisma/client";

import type { CatalogItem } from "@/data/catalog";
import { effectiveStock, isSoldOut, kitsFromComponents } from "./availability";
import { protocolVialsLabel } from "@/lib/protocolVials";

export const productInclude = {
  line: true,
  category: true,
  images: { include: { asset: true }, orderBy: { sortOrder: "asc" as const } },
  sections: { orderBy: { sortOrder: "asc" as const } },
  pending: true,
  skus: { include: { image: true, aliases: true }, orderBy: { sortOrder: "asc" as const } },
  caseLinks: { orderBy: { sortOrder: "asc" as const }, include: { case: { include: { beforeImage: true, afterImage: true, products: { include: { product: { select: { name: true, slug: true } } } }, protocols: { include: { protocol: { select: { name: true, slug: true } } } } } } } },
} satisfies Prisma.ProductInclude;

export const protocolInclude = {
  line: true,
  coverImage: true,
  images: { include: { asset: true }, orderBy: { sortOrder: "asc" as const } },
  components: { include: { product: { include: { images: { include: { asset: true }, orderBy: { sortOrder: "asc" as const }, take: 1 }, skus: { select: { isActive: true, trackStock: true, stockQuantity: true } } } } }, orderBy: { sortOrder: "asc" as const } },
  skus: { include: { image: true, aliases: true }, orderBy: { sortOrder: "asc" as const } },
  caseLinks: { orderBy: { sortOrder: "asc" as const }, include: { case: { include: { beforeImage: true, afterImage: true, products: { include: { product: { select: { name: true, slug: true } } } }, protocols: { include: { protocol: { select: { name: true, slug: true } } } } } } } },
} satisfies Prisma.ProtocolInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type ProtocolRow = Prisma.ProtocolGetPayload<{ include: typeof protocolInclude }>;
type Asset = { provider: "LOCAL" | "SUPABASE"; path: string; bucket: string | null; alt?: string };

export function mediaUrl(asset: Asset | null | undefined): string | undefined {
  if (!asset) return undefined;
  if (asset.provider === "LOCAL") return asset.path;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl || !asset.bucket) return undefined;
  const encodedPath = asset.path.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(asset.bucket)}/${encodedPath}`;
}

function lineInfo(line: ProductRow["line"] | ProtocolRow["line"]) {
  return {
    id: line.slug,
    name: line.name,
    descriptor: line.descriptor,
    colors: {
      surface: line.surfaceLight,
      surfaceDark: line.surfaceDark,
      accent: line.accentLight,
      accentDark: line.accentDark,
      foreground: line.inkLight,
      foregroundDark: line.inkDark,
    },
  };
}

const enzymeTypeBySlug: Record<string, string> = {
  "slim-plus": "Lipase",
  "smooth-plus": "Colagenase",
  "drain-plus": "Hialuronidase",
};

export function mapProduct(row: ProductRow): CatalogItem {
  const primaryImage = row.images[0]?.asset;
  const offers = row.skus.filter((sku) => sku.isActive).map((sku) => ({
    id: sku.code,
    label: sku.label || undefined,
    price: Number(sku.price),
    image: mediaUrl(sku.image) || mediaUrl(primaryImage),
    ...effectiveStock(sku),
  }));
  return {
    slug: row.slug,
    kind: "product",
    line: row.line.slug,
    lineInfo: lineInfo(row.line),
    name: row.name,
    category: row.category?.name ?? (row.line.slug === "pbserum" ? "Profissional" : "Doméstico"),
    activeLabel: enzymeTypeBySlug[row.slug],
    collection: row.collection || undefined,
    summary: row.summary,
    tags: row.highlights,
    image: mediaUrl(primaryImage) || "",
    images: row.images.map((image) => ({ src: mediaUrl(image.asset) || "", alt: image.asset.alt, caption: image.caption || undefined })),
    presentation: row.presentation,
    variantName: row.variantName || undefined,
    offers,
    soldOut: isSoldOut(offers),
    sections: row.sections.map((section) => ({ title: section.title, body: section.body || undefined, items: section.items })),
    pending: row.pending.map((field) => ({ label: field.label, public: field.isPublic && !field.resolvedAt })),
    clinicalCases: row.caseLinks.filter((link) => link.case.status === "PUBLISHED" && link.case.imageRightsConfirmed).map(({ case: clinicalCase }) => mapClinicalCase(clinicalCase, `/produtos/${row.slug}`)),
  };
}

export function mapProtocol(row: ProtocolRow): CatalogItem {
  const gallery = row.images.length ? row.images : row.coverImage ? [{ asset: row.coverImage, caption: null }] : [];
  const kits = kitsFromComponents(row.components);
  const offers = row.skus.filter((sku) => sku.isActive).map((sku) => ({
    id: sku.code,
    label: sku.label || undefined,
    price: Number(sku.price),
    image: mediaUrl(sku.image) || mediaUrl(row.coverImage),
    ...effectiveStock(sku, kits),
  }));
  return {
    slug: row.slug,
    kind: "protocol",
    line: row.line.slug,
    lineInfo: lineInfo(row.line),
    name: row.name,
    category: "Profissional",
    collection: "Pbserum Plus",
    summary: row.introduction,
    tags: ["Protocolo Clínico"],
    image: mediaUrl(row.coverImage) || "",
    images: gallery.map((image) => ({ src: mediaUrl(image.asset) || "", alt: image.asset.alt, caption: image.caption || undefined })),
    presentation: protocolVialsLabel(row.slug, row.components.reduce((sum, component) => sum + component.quantity, 0)),
    offers,
    soldOut: isSoldOut(offers),
    sections: [],
    clinicalCases: row.caseLinks.filter((link) => link.case.status === "PUBLISHED" && link.case.imageRightsConfirmed).map(({ case: clinicalCase }) => mapClinicalCase(clinicalCase, `/protocolos/${row.slug}`)),
    protocol: {
      sessions: row.sessions,
      frequency: row.frequency,
      composition: row.components.map((component) => ({ quantity: component.quantity, product: component.product.name, slug: component.product.slug, image: mediaUrl(component.product.images[0]?.asset), role: component.role })),
      reconstitution: row.reconstitution,
      expectedResults: row.expectedResults,
    },
  };
}

type CaseWithLinks = ProductRow["caseLinks"][number]["case"];

function mapClinicalCase(clinicalCase: CaseWithLinks, currentHref: string) {
  const related = [
    ...clinicalCase.products.map(({ product }) => ({ name: product.name, href: `/produtos/${product.slug}` })),
    ...clinicalCase.protocols.map(({ protocol }) => ({ name: protocol.name, href: `/protocolos/${protocol.slug}` })),
  ].filter((entry) => entry.href !== currentHref);
  return {
    id: clinicalCase.slug,
    title: clinicalCase.title,
    description: clinicalCase.description || undefined,
    beforeImage: mediaUrl(clinicalCase.beforeImage) || "",
    afterImage: mediaUrl(clinicalCase.afterImage) || "",
    professional: clinicalCase.professional,
    country: clinicalCase.country || undefined,
    sessions: clinicalCase.sessions,
    related,
  };
}
