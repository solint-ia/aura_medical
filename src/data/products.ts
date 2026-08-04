import type { EnzymeId } from "./enzymes";

export interface Product {
  id: EnzymeId;
  name: string;
  activeIngredient: string;
  origin: string;
  substrate: string;
  mechanism: string;
  indications: string[];
  packaging: string;
  imageSrc: string;
  imageAlt: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "slim",
    name: "Slim+",
    activeIngredient: "Lipase PB500",
    origin: "Thermus thermophilus · bacteriana recombinante",
    substrate: "Triglicerídeos armazenados no adipócito",
    mechanism:
      "Atua na interface água/lipídio da membrana adipocitária, ancorando-se a regiões de carga negativa para hidrolisar os triglicerídeos armazenados, sem necessidade de penetração total na célula.",
    indications: ["Gordura localizada"],
    packaging: "10 ampolas liofilizadas",
    imageSrc: "/images/products/pbserum-slim-plus.png",
    imageAlt: "Caixa do pbserum Slim+ Professional",
  },
  {
    id: "smooth",
    name: "Smooth+",
    activeIngredient: "Colagenases G&H PB220*",
    origin: "S. pyogenes + C. histolyticum · patenteada",
    substrate: "Colágeno fibrótico e septos fibrosos",
    mechanism:
      "A dupla ação das colagenases G e H cliva os pontos de ligação expostos no colágeno desorganizado de cicatrizes e septos fibróticos, liberando estruturas retraídas sem agredir o colágeno saudável ao redor.",
    indications: ["Fibrose", "Cicatrizes"],
    packaging: "10 ampolas liofilizadas",
    imageSrc: "/images/products/pbserum-smooth-plus.png",
    imageAlt: "Caixa do pbserum Smooth+ Professional",
  },
  {
    id: "drain",
    name: "Drain+",
    activeIngredient: "Hialuronidase PB3000",
    origin: "Bacteriana recombinante",
    substrate: "Polissacarídeos da matriz extracelular",
    mechanism:
      "Degrada os polissacarídeos responsáveis pela retenção de fluidos na matriz extracelular, melhorando a permeabilidade tecidual e reduzindo edema; potencializa a difusão das demais enzimas quando combinada em protocolo.",
    indications: ["Drenagem · Edema"],
    packaging: "10 ampolas liofilizadas",
    imageSrc: "/images/products/pbserum-drain-plus.png",
    imageAlt: "Caixa do pbserum Drain+ Professional",
  },
];

/** Intrinsic size of every product render, used to avoid layout shift. */
export const PRODUCT_IMAGE_SIZE = { width: 2000, height: 1149 } as const;

export interface EnzymeComparisonRow {
  attribute: string;
  recombinant: string;
  animal: string;
}

export const ENZYME_COMPARISON: EnzymeComparisonRow[] = [
  {
    attribute: "Pureza & Estabilidade",
    recombinant:
      "Alta pureza biotecnológica. Fórmula estéril e liofilizada para máxima preservação dos ativos.",
    animal:
      "Maior risco de degradação do ativo, geralmente em soluções líquidas instáveis.",
  },
  {
    attribute: "Ação & Seletividade",
    recombinant:
      "Ação inteligente e seletiva. Direcionada exclusivamente aos substratos específicos do tecido (gordura, colágeno, fluidos).",
    animal:
      "Ação generalizada ou inespecífica, comparável às moléculas químicas clássicas.",
  },
  {
    attribute: "Origem & Ética",
    recombinant:
      "Origem bacteriana recombinante. 100% livre de crueldade (sem testes em animais).",
    animal:
      "Frequentemente derivadas de origem animal, com processos de extração mais complexos.",
  },
  {
    attribute: "Eficácia Clínica",
    recombinant:
      "Resultados visíveis e prolongados em curto prazo, atuando desde a primeira aplicação.",
    animal:
      "Resposta clínica variável, frequentemente exigindo múltiplas sessões para resultados iniciais.",
  },
];
