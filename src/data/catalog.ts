import type { ImageFraming } from "@/lib/imageFraming";
import type { LineId } from "./lines";
import { LA_CUTANEE_CATALOG } from "./la-cutanee";
import { PBSERUM_CATALOG } from "./pbserum";

export type CatalogKind = "product" | "protocol";

export interface CatalogOffer {
  id: string;
  label?: string;
  price: number;
  image?: string;
  trackStock?: boolean;
  stock?: number;
}

export interface DetailSection {
  title: string;
  body?: string;
  items?: string[];
}

export interface PendingInfo {
  label: string;
  public: boolean;
}

export interface CatalogImage {
  src: string;
  alt: string;
  caption?: string;
  /** Ajuste manual de enquadramento feito no acervo. */
  framing?: ImageFraming;
}

export interface CatalogClinicalCase {
  id: string;
  title: string;
  description?: string;
  beforeImage: string;
  afterImage: string;
  beforeFraming?: ImageFraming;
  afterFraming?: ImageFraming;
  professional: string;
  country?: string;
  sessions: number;
  related: { name: string; href: string }[];
}

export interface CatalogItem {
  slug: string;
  kind: CatalogKind;
  line: LineId;
  name: string;
  category: string;
  /** Classe do ativo mostrada no card, ex.: "Lipase". */
  activeLabel?: string;
  collection?: string;
  summary: string;
  tags: string[];
  image: string;
  imageFraming?: ImageFraming;
  images?: CatalogImage[];
  presentation: string;
  offers: CatalogOffer[];
  /** Verdadeiro quando o item tem oferta, mas nenhuma com unidade disponível. */
  soldOut?: boolean;
  variantName?: string;
  sections: DetailSection[];
  pending?: PendingInfo[];
  clinicalCases?: CatalogClinicalCase[];
  lineInfo?: {
    id: string;
    name: string;
    descriptor: string;
    colors: {
      surface: string;
      surfaceDark: string;
      accent: string;
      accentDark: string;
      foreground: string;
      foregroundDark: string;
    };
  };
  protocol?: {
    sessions: string;
    frequency: string;
    composition: { quantity: number; product: string; slug?: string; image?: string; role: string }[];
    reconstitution: string[];
    marking?: string;
    expectedResults: string[];
  };
}

export const CATALOG: CatalogItem[] = [...PBSERUM_CATALOG, ...LA_CUTANEE_CATALOG];
export const PUBLIC_CATALOG = CATALOG.filter((item) => item.offers.length > 0);

export function getCatalogItem(slug: string, kind?: CatalogKind): CatalogItem | undefined {
  return CATALOG.find((item) => item.slug === slug && (!kind || item.kind === kind));
}

export function getItemsByLine(line: LineId): CatalogItem[] {
  return PUBLIC_CATALOG.filter((item) => item.line === line);
}

export function getOfferById(id: string): { item: CatalogItem; offer: CatalogOffer } | undefined {
  for (const item of CATALOG) {
    const offer = item.offers.find((candidate) => candidate.id === id);
    if (offer) return { item, offer };
  }
  return undefined;
}

export function getCatalogHref(item: CatalogItem): string {
  return item.kind === "protocol" ? `/protocolos/${item.slug}` : `/produtos/${item.slug}`;
}
