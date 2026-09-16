import type { Prisma } from "@prisma/client";

import type { CatalogItem } from "@/data/catalog";

export const productInclude = {
  line: true,
  category: true,
  images: { include: { asset: true }, orderBy: { sortOrder: "asc" as const } },
  sections: { orderBy: { sortOrder: "asc" as const } },
  pending: true,
  skus: { include: { image: true }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

export const protocolInclude = {
  line: true,
  coverImage: true,
  mappingImage: true,
  components: { include: { product: true }, orderBy: { sortOrder: "asc" as const } },
  skus: { include: { image: true }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProtocolInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type ProtocolRow = Prisma.ProtocolGetPayload<{ include: typeof protocolInclude }>;
type Asset = ProductRow["images"][number]["asset"];

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
  return {
    slug: row.slug,
    kind: "product",
    line: row.line.slug,
    lineInfo: lineInfo(row.line),
    name: row.name,
    category: enzymeTypeBySlug[row.slug] ?? row.eyebrow,
    collection: row.collection || undefined,
    summary: row.summary,
    tags: row.highlights,
    image: mediaUrl(primaryImage) || "",
    presentation: row.presentation,
    variantName: row.variantName || undefined,
    offers: row.skus.filter((sku) => sku.isActive).map((sku) => ({
      id: sku.code,
      label: sku.label || undefined,
      price: Number(sku.price),
      image: mediaUrl(sku.image) || mediaUrl(primaryImage),
      trackStock: sku.trackStock,
      stock: sku.stockQuantity ?? undefined,
    })),
    sections: row.sections.map((section) => ({ title: section.title, body: section.body || undefined, items: section.items })),
    pending: row.pending.map((field) => ({ label: field.label, public: field.isPublic && !field.resolvedAt })),
  };
}

export function mapProtocol(row: ProtocolRow): CatalogItem {
  return {
    slug: row.slug,
    kind: "protocol",
    line: row.line.slug,
    lineInfo: lineInfo(row.line),
    name: row.name,
    category: "Protocolo clínico",
    collection: "PBSerum Plus",
    summary: row.introduction,
    tags: [],
    image: mediaUrl(row.coverImage) || "",
    presentation: `${row.components.reduce((sum, component) => sum + component.quantity, 0)} ampolas por região`,
    offers: row.skus.filter((sku) => sku.isActive).map((sku) => ({
      id: sku.code,
      label: sku.label || undefined,
      price: Number(sku.price),
      image: mediaUrl(sku.image) || mediaUrl(row.coverImage),
      trackStock: sku.trackStock,
      stock: sku.stockQuantity ?? undefined,
    })),
    sections: [],
    protocol: {
      sessions: row.sessions,
      frequency: row.frequency,
      composition: row.components.map((component) => ({ quantity: component.quantity, product: component.product.name, role: component.role })),
      reconstitution: row.reconstitution,
      marking: row.marking,
      expectedResults: row.expectedResults,
      mappingImage: mediaUrl(row.mappingImage),
    },
  };
}
