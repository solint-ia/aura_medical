import { enzymesData, PRICE_PER_VIAL } from "./enzymes";
import { PUBLIC_PROTOCOLS, getProtocolBySlug } from "./protocols";
import type { CatalogItem } from "./catalog";

const enzymeImage = (slug: string) => `/frascos/${slug.replace(/-plus$/, "")}.png`;

const enzymeType: Record<string, string> = {
  "slim-plus": "Lipase",
  "smooth-plus": "Colagenase",
  "drain-plus": "Hialuronidase",
};

const products: CatalogItem[] = enzymesData.map((enzyme) => ({
  slug: enzyme.slug,
  kind: "product",
  line: "pbserum",
  name: enzyme.name,
  category: enzymeType[enzyme.slug] ?? "Enzima recombinante",
  collection: "PBSerum Plus",
  summary: enzyme.shortDescription,
  tags: [enzyme.activeIngredient, ...enzyme.indications].slice(0, 3),
  image: enzymeImage(enzyme.slug),
  presentation: "Ampola individual liofilizada",
  offers: [{ id: `enz-${enzyme.slug}`, price: PRICE_PER_VIAL }],
  sections: [
    { title: "Mecanismo de ação", body: enzyme.fullDescription },
    { title: "Indicações", items: enzyme.indications },
    { title: "Tecnologia", items: [enzyme.activeIngredient, enzyme.origin, `Substrato-alvo: ${enzyme.targetSubstrate}`] },
    { title: "Registro ANVISA", items: [enzyme.anvisaProduct, enzyme.anvisaRegistration] },
  ],
}));

const protocols: CatalogItem[] = PUBLIC_PROTOCOLS.map((protocol) => {
  const detail = getProtocolBySlug(protocol.id);
  const composition = protocol.composition.map((part) => `${part.vials}× ${part.enzyme === "slim" ? "Slim+" : part.enzyme === "smooth" ? "Smooth+" : "Drain+"}`);
  return {
    slug: protocol.id,
    kind: "protocol",
    line: "pbserum",
    name: protocol.name,
    category: "Protocolo clínico",
    collection: "PBSerum Plus",
    summary: detail?.introduction ?? `Protocolo PBSerum com ${composition.join(", ")}.`,
    tags: composition.slice(0, 3),
    image: protocol.image ?? detail?.imagePath1 ?? "/images/mosaico.png",
    presentation: `${protocol.composition.reduce((sum, part) => sum + part.vials, 0)} ampolas por região`,
    offers: [{ id: protocol.id, price: protocol.totalPrice }],
    sections: [],
  };
});

export const PBSERUM_CATALOG: CatalogItem[] = [...products, ...protocols];
