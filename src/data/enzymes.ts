export type EnzymeId = "slim" | "smooth" | "drain";

export interface Enzyme {
  id: EnzymeId;
  /** Commercial name, as printed on the box. */
  label: string;
  /** Accent utilities, resolved statically so Tailwind can extract them. */
  dotClass: string;
  barClass: string;
  pillClass: string;
  /** Product name colour on light surfaces — darkened where needed for contrast. */
  headingClass: string;
}

export const ENZYMES: Record<EnzymeId, Enzyme> = {
  slim: {
    id: "slim",
    label: "Slim+",
    dotClass: "bg-gold",
    barClass: "bg-gold",
    pillClass: "bg-gold/15",
    headingClass: "text-gold-deep dark:text-gold",
  },
  smooth: {
    id: "smooth",
    label: "Smooth+",
    dotClass: "bg-bronze",
    barClass: "bg-bronze",
    pillClass: "bg-bronze/15",
    headingClass: "text-bronze",
  },
  drain: {
    id: "drain",
    label: "Drain+",
    dotClass: "bg-mustard",
    barClass: "bg-mustard",
    pillClass: "bg-mustard/15",
    headingClass: "text-mustard",
  },
};

/** Price per lyophilised vial, in BRL. */
export const PRICE_PER_VIAL = 390;

export interface EnzymeDetail {
  slug: string;
  name: string;
  activeIngredient: string;
  origin: string;
  targetSubstrate: string;
  shortDescription: string; // Para o card resumido
  fullDescription: string;  // Para a página individual
  indications: string[];
  presentation: string;
  patented?: boolean;
}

export const enzymesData: EnzymeDetail[] = [
  {
    slug: "slim-plus",
    name: "Slim+",
    activeIngredient: "Lipase PB500",
    origin: "Thermus thermophilus · Bacteriana recombinante",
    targetSubstrate: "Triglicerídeos armazenados no adipócito",
    shortDescription: "Hidrolisa os triglicerídeos sem a necessidade de penetração total na célula, atuando na interface água/lipídio.",
    fullDescription: "A Lipase PB500 atua de forma seletiva na interface água/lipídio da membrana adipocitária. Ao ancorar-se a regiões de carga negativa, ela consegue hidrolisar os triglicerídeos armazenados de forma altamente eficaz, promovendo a redução de medidas sem causar danos celulares desnecessários.",
    indications: ["Gordura Localizada", "Remodelação Corporal"],
    presentation: "10 frascos liofilizados"
  },
  {
    slug: "smooth-plus",
    name: "Smooth+",
    activeIngredient: "Colagenases G&H PB220",
    origin: "S. pyogenes + C. histolyticum",
    targetSubstrate: "Colágeno fibrótico e septos fibrosos",
    shortDescription: "Cliva os pontos de ligação do colágeno desorganizado, liberando estruturas retraídas sem agredir o tecido saudável.",
    fullDescription: "A dupla ação patenteada das colagenases G e H atua especificamente clivando os pontos de ligação expostos no colágeno desorganizado, característico de cicatrizes e septos fibróticos da celulite. Essa ação enzimática inteligente libera as estruturas retraídas, promovendo a reorganização do tecido sem agredir o colágeno saudável ao redor.",
    indications: ["Fibrose", "Cicatrizes", "Celulite"],
    presentation: "10 frascos liofilizados",
    patented: true
  },
  {
    slug: "drain-plus",
    name: "Drain+",
    activeIngredient: "Hialuronidase PB3000",
    origin: "Bacteriana recombinante",
    targetSubstrate: "Polissacarídeos da matriz extracelular",
    shortDescription: "Degrada polissacarídeos responsáveis pela retenção de fluidos, reduzindo edemas e potencializando a difusão de ativos.",
    fullDescription: "A Hialuronidase PB3000 atua degradando os polissacarídeos que causam a retenção de fluidos na matriz extracelular. Isso não apenas melhora a permeabilidade tecidual e reduz o edema (inchaço), como atua como um poderoso agente de difusão, potencializando a penetração e eficácia das outras enzimas quando combinadas em protocolo.",
    indications: ["Drenagem", "Edema", "Difusão de Ativos"],
    presentation: "10 frascos liofilizados"
  }
];

// Informações globais de segurança que aparecerão no rodapé das páginas individuais
export const safetyInformation = {
  adverseEffects: "Pode ocorrer inflamação local e leve mal-estar geral (4 a 72 horas). Anafilaxia é muito rara (0,1%).",
  contraindications: [
    "Gravidez e amamentação",
    "Doença local ativa de pele",
    "Alergia a ácido hialurônico ou enzimas",
    "Alergia severa a picadas de insetos (reação cruzada)"
  ],
  recommendations: [
    "Ingestão adequada de água",
    "Evitar suor excessivo nas primeiras horas",
    "Uso rigoroso de protetor solar FPS 50",
    "Adiar outros procedimentos estéticos locais"
  ]
};

export function getEnzymeBySlug(slug: string): EnzymeDetail | undefined {
  return enzymesData.find((e) => e.slug === slug);
}
