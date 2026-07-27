import { PRICE_PER_VIAL, type EnzymeId } from "./enzymes";

export interface ProtocolComponent {
  enzyme: EnzymeId;
  vials: number;
}

export interface Protocol {
  id: string;
  name: string;
  composition: ProtocolComponent[];
  sessions: string;
  /** Kit price in BRL, already agreed with the commercial team. */
  totalPrice: number;
}

export const PROTOCOLS: Protocol[] = [
  {
    id: "queixo-duplo",
    name: "Queixo Duplo",
    composition: [
      { enzyme: "slim", vials: 2 },
      { enzyme: "smooth", vials: 1 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "2 a 4 sessões · a cada 2 semanas",
    totalPrice: 1560,
  },
  {
    id: "perfilamento-facial",
    name: "Perfilamento Facial",
    composition: [
      { enzyme: "slim", vials: 2 },
      { enzyme: "smooth", vials: 1 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "2 a 4 sessões · a cada 2 semanas",
    totalPrice: 1560,
  },
  {
    id: "gordura-localizada",
    name: "Gordura Localizada",
    composition: [
      { enzyme: "slim", vials: 2 },
      { enzyme: "smooth", vials: 1 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "2 a 8 sessões · a cada 2 semanas",
    totalPrice: 1560,
  },
  {
    id: "celulite",
    name: "Celulite",
    composition: [
      { enzyme: "slim", vials: 4 },
      { enzyme: "smooth", vials: 4 },
      { enzyme: "drain", vials: 2 },
    ],
    sessions: "2 a 4 sessões · a cada 2 semanas · ambas as pernas",
    totalPrice: 3900,
  },
  {
    id: "cicatrizes",
    name: "Cicatrizes",
    composition: [
      { enzyme: "smooth", vials: 3 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "4 sessões · a cada 2 semanas",
    totalPrice: 1560,
  },
  {
    id: "fibrose-pos-cirurgica",
    name: "Fibrose Pós-Cirúrgica",
    composition: [
      { enzyme: "slim", vials: 1 },
      { enzyme: "smooth", vials: 3 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "6 sessões · a cada 2 semanas",
    totalPrice: 1950,
  },
];

export function countVials(protocol: Protocol): number {
  return protocol.composition.reduce((total, item) => total + item.vials, 0);
}

export interface ProtocolDetail {
  slug: string;
  title: string;
  imagePath: string;
  note?: string;
  composition: string[];
  sessions: string;
  frequency: string;
  reconstitution: string[];
  application: string[];
  marking: string;
}

export const protocolsData: ProtocolDetail[] = [
  {
    slug: "queixo-duplo",
    title: "Queixo Duplo",
    imagePath: "/images/queixo-duplo.png",
    composition: ["1 Smooth+ (Colagenases)", "1 Drain+ (Hialuronidase)", "2 Slim+ (Lipase)"],
    sessions: "2-4",
    frequency: "A cada 2 semanas",
    reconstitution: ["Adicione 5 ml de solução salina a cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Administre 1 ml por ponto.", "Volume final: 6 ml."],
    marking: "Distribuição dos pontos: A malha terá uma distância de aproximadamente 1-1,5 cm entre as linhas. Aplique no centro de cada quadrado."
  },
  {
    slug: "perfilamento-facial",
    title: "Perfilamento Facial",
    imagePath: "/images/perfilamento-facial.png",
    composition: ["1 Smooth+ (Colagenases)", "1 Drain+ (Hialuronidase)", "2 Slim+ (Lipase)"],
    sessions: "2-4",
    frequency: "A cada 2 semanas",
    reconstitution: ["Adicione 3 ml de solução salina a cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Administre 0,5 ml por ponto.", "Volume final: 12 ml."],
    marking: "Distribuição dos pontos: A malha terá uma distância de aproximadamente 1 a 1,5 cm entre as linhas. Aplique no centro de cada quadrado."
  },
  {
    slug: "gordura-localizada",
    title: "Gordura Localizada",
    imagePath: "/images/gordura-localizada.png",
    composition: ["1 Smooth+ (Colagenases)", "1 Drain+ (Hialuronidase)", "2 Slim+ (Lipase)"],
    sessions: "2-8",
    frequency: "A cada 2 semanas",
    reconstitution: ["Adicione 3 ml de solução salina a cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Administre 1 ml por ponto."],
    marking: "Distribuição dos pontos: A malha terá uma distância de aproximadamente 1-1,5 cm entre as linhas. Aplique no centro de cada quadrado."
  },
  {
    slug: "celulite",
    title: "Celulite",
    imagePath: "/images/celulite.png",
    note: "Tratamento para ambas as pernas",
    composition: ["4 Frascos Smooth+ (Colagenases)", "2 Frascos Drain+ (Hialuronidase)", "4 Frascos Slim+ (Lipase)"],
    sessions: "2-4",
    frequency: "A cada 2 semanas",
    reconstitution: ["Adicione 3 ml de solução salina a cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Administre 1 ml por ponto."],
    marking: "Distribuição dos pontos: A malha terá uma distância de aproximadamente 1 a 1,5 cm entre as linhas. Aplique no centro de cada quadrado."
  },
  {
    slug: "cicatrizes",
    title: "Cicatrizes",
    imagePath: "/images/cicatrizes.png",
    composition: ["3 Frascos Smooth+ (Colagenases)", "1 Frasco Drain+ (Hialuronidase)"],
    sessions: "4",
    frequency: "A cada 2 a 3 semanas",
    reconstitution: ["Adicione 1,5 ml de solução salina a cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Aplique na cicatriz.", "Para cicatrizes atróficas, aplique o coquetel simples 1-1-1 no tecido ao redor."],
    marking: "Depende do formato e do tamanho da cicatriz."
  },
  {
    slug: "fibrose-pos-cirurgica",
    title: "Fibrose Pós-Cirúrgica",
    imagePath: "/images/fibrose-pos-cirurgica.png",
    composition: ["3 Frascos Smooth+ (Colagenases)", "1 Frasco Drain+ (Hialuronidase)", "1 Frasco Slim+ (Lipase)"],
    sessions: "6",
    frequency: "A cada 2 a 3 semanas",
    reconstitution: ["Adicione 1,5 ml de solução salina a cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Aplicação intralesional em vários ângulos.", "Volume final: 7,5-25 ml*"],
    marking: "Identificar e marcar nódulos fibróticos, ou aderências."
  }
];

export function getProtocolBySlug(slug: string): ProtocolDetail | undefined {
  return protocolsData.find((p) => p.slug === slug);
}

/**
 * Commercial pricing lives on the configurator entries (`PROTOCOLS`), keyed by
 * the same slug as the detail pages. This bridges the two so the checkout on a
 * detail page can show the real kit price and vial count.
 */
export function getProtocolPricing(
  slug: string,
): { totalPrice: number; vials: number } | undefined {
  const priced = PROTOCOLS.find((p) => p.id === slug);
  if (!priced) return undefined;
  return { totalPrice: priced.totalPrice, vials: countVials(priced) };
}

export { PRICE_PER_VIAL };

