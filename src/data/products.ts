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
      "Atua na interface água/lipídio da membrana adipocitária, ancorando-se a regiões de carga negativa para hidrolisar os triglicerídeos armazenados — sem necessidade de penetração total na célula.",
    indications: ["Gordura localizada"],
    packaging: "10 frascos liofilizados",
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
    packaging: "10 frascos liofilizados",
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
      "Degrada os polissacarídeos responsáveis pela retenção de fluidos na matriz extracelular, melhorando a permeabilidade tecidual e reduzindo edema — potencializa a difusão das demais enzimas quando combinada em protocolo.",
    indications: ["Drenagem · Edema"],
    packaging: "10 frascos liofilizados",
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
    attribute: "Estrutura",
    recombinant: "Estrutura mais simples",
    animal: "Mais complexa",
  },
  {
    attribute: "Glicosilação",
    recombinant: "Não-glicosilada",
    animal: "Glicosilada",
  },
  { attribute: "Tamanho molecular", recombinant: "Menor", animal: "Maior" },
  { attribute: "Imunogenicidade", recombinant: "Menor", animal: "Maior" },
  {
    attribute: "Segurança",
    recombinant: "Maior controle clínico",
    animal: "Menor previsibilidade",
  },
];
