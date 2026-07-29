import { PRICE_PER_VIAL, type EnzymeId } from "./enzymes";

export interface ProtocolComponent {
  enzyme: EnzymeId;
  vials: number;
}

export interface Protocol {
  id: string;
  name: string;
  image?: string;
  composition: ProtocolComponent[];
  sessions: string;
  /** Kit price in BRL, already agreed with the commercial team. */
  totalPrice: number;
}

export const PROTOCOLS: Protocol[] = [
  {
    id: "queixo-duplo",
    name: "Queixo Duplo",
    image: "/images/fotos-protocolos/queixoduplo-2.png",
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
    image: "/images/fotos-protocolos/perfilamento-2.png",
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
    image: "/images/fotos-protocolos/gorduralocalizada-2.png",
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
    image: "/images/fotos-protocolos/celulite-2.png",
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
    image: "/images/fotos-protocolos/cicatrizes-2.png",
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
    image: "/images/fotos-protocolos/fibrose-2.png",
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

export interface ProtocolCompositionDetail {
  name: string;
  description: string;
}

export interface ProtocolDetail {
  slug: string;
  title: string;
  imagePath1: string; // Foto do topo
  imagePath2: string; // Foto entre Aplicação e Marcação
  introduction: string;
  note?: string;
  composition: ProtocolCompositionDetail[];
  sessions: string;
  frequency: string;
  reconstitution: string[];
  application: string[];
  marking: string;
  expectedResults: string[];
}

export const protocolsData: ProtocolDetail[] = [
  {
    slug: "queixo-duplo",
    title: "Queixo Duplo",
    imagePath1: "/images/fotos-protocolos/queixoduplo-1.png",
    imagePath2: "/images/fotos-protocolos/queixoduplo-2.png",
    introduction: "Protocolo indicado para remodelação da gordura submentoniana, promovendo melhora do contorno mandibular por meio da associação das enzimas recombinantes Slim+, Smooth+ e Drain+.",
    composition: [
      { name: "1 Smooth+ (Colagenases)", description: "Remodelação do colágeno" },
      { name: "1 Drain+ (Hialuronidase)", description: "Drenagem e difusão" },
      { name: "2 Slim+ (Lipase)", description: "Redução da gordura localizada" }
    ],
    sessions: "2-4",
    frequency: "A cada 2 semanas",
    reconstitution: ["Adicione 5 ml de solução salina a cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Administre 1 ml por ponto.", "Volume final: 6 ml."],
    marking: "Distribuição dos pontos: A malha terá uma distância de aproximadamente 1-1,5 cm entre as linhas. Aplique no centro de cada quadrado.",
    expectedResults: [
      "Redução da gordura submentoniana",
      "Definição da mandíbula",
      "Melhora do perfil facial",
      "Remodelação dos tecidos"
    ]
  },
  {
    slug: "perfilamento-facial",
    title: "Perfilamento Facial",
    imagePath1: "/images/fotos-protocolos/perfilamento-1.png",
    imagePath2: "/images/fotos-protocolos/perfilamento-2.png",
    introduction: "O protocolo de Perfilamento Facial foi desenvolvido para promover a remodelação dos tecidos da face, melhorando a definição do contorno mandibular e proporcionando um perfil facial mais harmônico por meio da ação sinérgica das enzimas recombinantes Slim+, Smooth+ e Drain+.",
    composition: [
      { name: "1 Smooth+ (Colagenases)", description: "Remodelação das fibras de colágeno e melhora da firmeza dos tecidos." },
      { name: "1 Drain+ (Hialuronidase)", description: "Favorece a drenagem dos líquidos intersticiais e otimiza a difusão dos ativos." },
      { name: "2 Slim+ (Lipase)", description: "Atua na redução da gordura localizada, auxiliando na definição do contorno facial." }
    ],
    sessions: "2-4",
    frequency: "A cada 2 semanas",
    reconstitution: ["Adicione 3 ml de solução salina estéril em cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Aplicar 0,5 ml por ponto.", "Volume final do protocolo: 12 ml."],
    marking: "A marcação deve seguir uma malha com espaçamento aproximado de 1 a 1,5 cm entre os pontos de aplicação. A aplicação deve ser realizada no centro de cada quadrado da malha, respeitando a anatomia da região mandibular para uma distribuição homogênea do coquetel enzimático.",
    expectedResults: [
      "Maior definição do contorno mandibular",
      "Remodelação do perfil facial",
      "Redução da gordura localizada na região tratada",
      "Melhora da firmeza dos tecidos",
      "Contorno facial mais harmônico",
      "Resultados progressivos ao longo das sessões"
    ]
  },
  {
    slug: "gordura-localizada",
    title: "Gordura Localizada",
    imagePath1: "/images/fotos-protocolos/gorduralocalizada-1.png",
    imagePath2: "/images/fotos-protocolos/gorduralocalizada-2.png",
    introduction: "O protocolo de Adiposidade Localizada foi desenvolvido para promover a remodelação dos tecidos e auxiliar na redução de depósitos de gordura localizada por meio da ação combinada das enzimas recombinantes Slim+, Smooth+ e Drain+. O tratamento oferece uma abordagem minimamente invasiva para melhorar o contorno corporal de forma progressiva.",
    composition: [
      { name: "1 Smooth+ (Colagenases)", description: "Promove a remodelação das fibras de colágeno, favorecendo uma melhor organização dos tecidos." },
      { name: "1 Drain+ (Hialuronidase)", description: "Auxilia na drenagem dos líquidos intersticiais e melhora a difusão do coquetel enzimático." },
      { name: "2 Slim+ (Lipase)", description: "Atua seletivamente sobre o tecido adiposo, auxiliando na redução da gordura localizada e na remodelação do contorno corporal." }
    ],
    sessions: "2-8",
    frequency: "A cada 2 semanas",
    reconstitution: ["Adicione 3 ml de solução salina estéril em cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Aplicar 1 ml por ponto.", "O volume total deverá ser distribuído uniformemente conforme a área tratada."],
    marking: "A área deve ser marcada formando uma malha com espaçamento aproximado de 1 a 1,5 cm entre os pontos de aplicação. A aplicação deve ser realizada no centro de cada quadrado da malha, garantindo uma distribuição homogênea do coquetel enzimático em toda a região tratada.",
    expectedResults: [
      "Redução da gordura localizada",
      "Remodelação do contorno corporal",
      "Melhora da uniformidade dos tecidos",
      "Contorno corporal mais definido",
      "Resultados progressivos ao longo das sessões",
      "Procedimento minimamente invasivo"
    ]
  },
  {
    slug: "celulite",
    title: "Celulite",
    imagePath1: "/images/fotos-protocolos/celulite-1.png",
    imagePath2: "/images/fotos-protocolos/celulite-2.png",
    introduction: "O protocolo para Celulite foi desenvolvido para promover a remodelação dos tecidos acometidos, atuando sobre os septos fibróticos, a gordura localizada e a drenagem do tecido. A combinação das enzimas recombinantes proporciona melhora progressiva da textura da pele e do contorno corporal de forma minimamente invasiva.",
    note: "Tratamento para ambas as pernas",
    composition: [
      { name: "4 Smooth+ (Colagenases)", description: "Promove a remodelação das fibras de colágeno e dos septos fibróticos, contribuindo para uma pele mais uniforme." },
      { name: "2 Drain+ (Hialuronidase)", description: "Favorece a drenagem dos líquidos intersticiais e melhora a difusão do coquetel enzimático." },
      { name: "4 Slim+ (Lipase)", description: "Auxilia na redução da gordura localizada, melhorando o relevo da pele e o contorno corporal." }
    ],
    sessions: "2-4",
    frequency: "A cada 2 semanas",
    reconstitution: ["Adicione 3 ml de solução salina estéril em cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Aplicar 1 ml por ponto.", "O protocolo foi desenvolvido para tratamento de ambas as pernas."],
    marking: "A região tratada deve ser marcada em forma de malha, mantendo espaçamento aproximado de 1 a 1,5 cm entre os pontos de aplicação. O coquetel enzimático deve ser aplicado no centro de cada quadrado da malha para proporcionar distribuição uniforme em toda a área tratada.",
    expectedResults: [
      "Melhora da aparência da celulite",
      "Remodelação dos septos fibróticos",
      "Redução das irregularidades da pele",
      "Contorno corporal mais uniforme",
      "Pele com aspecto mais liso",
      "Resultados progressivos ao longo das sessões"
    ]
  },
  {
    slug: "cicatrizes",
    title: "Cicatrizes",
    imagePath1: "/images/fotos-protocolos/cicatrizes-1.png",
    imagePath2: "/images/fotos-protocolos/cicatrizes-2.png",
    introduction: "O protocolo para Cicatrizes foi desenvolvido para promover a remodelação dos tecidos cicatriciais por meio da ação das enzimas recombinantes Smooth+ and Drain+. O tratamento auxilia na reorganização das fibras de colágeno, contribuindo para uma aparência mais uniforme da pele e melhor integração da cicatriz aos tecidos adjacentes.",
    composition: [
      { name: "3 Smooth+ (Colagenases)", description: "Atuam na remodelação das fibras de colágeno da cicatriz, favorecendo uma reorganização mais uniforme do tecido." },
      { name: "1 Drain+ (Hialuronidase)", description: "Melhora a difusão do coquetel enzimático e auxilia na remodelação do microambiente tecidual." }
    ],
    sessions: "4",
    frequency: "A cada 2 a 3 semanas",
    reconstitution: ["Adicione 1,5 ml de solução salina estéril em cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Aplicar diretamente sobre a cicatriz.", "Em cicatrizes atróficas, recomenda-se também a aplicação do coquetel simples 1-1-1 no tecido ao redor da cicatriz, conforme protocolo do fabricante."],
    marking: "A marcação varia conforme o formato, extensão e características da cicatriz. O planejamento da aplicação deve ser individualizado para garantir uma distribuição adequada do coquetel enzimático em toda a área tratada.",
    expectedResults: [
      "Remodelação do tecido cicatricial",
      "Melhora da textura da pele",
      "Aspecto mais uniforme da cicatriz",
      "Melhor integração da cicatriz aos tecidos adjacentes",
      "Resultados progressivos ao longo das sessões"
    ]
  },
  {
    slug: "fibrose-pos-cirurgica",
    title: "Fibrose Pós-Cirúrgica",
    imagePath1: "/images/fotos-protocolos/fibrose-1.png",
    imagePath2: "/images/fotos-protocolos/fibrose-2.png",
    introduction: "O protocolo para Fibrose foi desenvolvido para auxiliar na remodelação de tecidos fibróticos, aderências e nódulos pós-cirúrgicos por meio da ação combinada das enzimas recombinantes Smooth+, Drain+ e Slim+. O tratamento favorece a reorganização do tecido, contribuindo para uma recuperação mais uniforme e para a melhora da mobilidade e do aspecto da região tratada.",
    composition: [
      { name: "3 Smooth+ (Colagenases)", description: "Atuam na remodelação das fibras de colágeno, auxiliando na reorganização dos tecidos fibróticos e na redução das aderências." },
      { name: "1 Drain+ (Hialuronidase)", description: "Favorece a drenagem dos líquidos intersticiais e melhora a difusão do coquetel enzimático na área tratada." },
      { name: "1 Slim+ (Lipase)", description: "Auxilia na remodelação de áreas com acúmulo de tecido adiposo associado à fibrose, complementando a ação do protocolo." }
    ],
    sessions: "6",
    frequency: "A cada 2 a 3 semanas",
    reconstitution: ["Adicione 1,5 ml de solução salina estéril em cada frasco.", "Adicione 1 ml de lidocaína simples a 2%."],
    application: ["Aplicação intralesional.", "Realizar aplicações em múltiplos ângulos para melhor distribuição do coquetel enzimático.", "Volume final aproximado: 7,5 a 25 ml, conforme a extensão da área tratada."],
    marking: "Antes da aplicação, devem ser identificados e marcados os nódulos fibróticos, aderências ou áreas de fibrose. O planejamento da aplicação deve ser individualizado conforme a localização e a extensão da fibrose, permitindo uma distribuição homogênea do tratamento.",
    expectedResults: [
      "Remodelação do tecido fibrótico",
      "Redução de aderências e nódulos",
      "Melhora da qualidade dos tecidos",
      "Aspecto mais uniforme da região tratada",
      "Recuperação progressiva da mobilidade tecidual",
      "Resultados progressivos ao longo das sessões"
    ]
  }
];

export function getProtocolBySlug(slug: string): ProtocolDetail | undefined {
  return protocolsData.find((p) => p.slug === slug);
}

export function getProtocolPricing(
  slug: string,
): { totalPrice: number; vials: number } | undefined {
  const priced = PROTOCOLS.find((p) => p.id === slug);
  if (!priced) return undefined;
  return { totalPrice: priced.totalPrice, vials: countVials(priced) };
}

export { PRICE_PER_VIAL };
