import type { CatalogItem, DetailSection, PendingInfo } from "./catalog";

const pendingResolved: PendingInfo[] = [
  { label: "Advertências e contraindicações", public: true },
  { label: "Lista INCI completa", public: true },
  { label: "Regularização ou processo ANVISA", public: true },
  { label: "Prazo de validade", public: true },
  { label: "SKU, GTIN, estoque, peso e dimensões", public: false },
  { label: "Fabricante, CNPJ e origem", public: false },
];

const pendingDefault: PendingInfo[] = [
  { label: "Modo de uso e frequência", public: true },
  ...pendingResolved,
];

const item = (value: Omit<CatalogItem, "kind" | "line" | "pending"> & { sections: DetailSection[]; pending?: PendingInfo[] }): CatalogItem => ({
  ...value,
  kind: "product",
  line: "la-cutanee",
  pending: value.pending ?? pendingResolved,
});

export const LA_CUTANEE_CATALOG: CatalogItem[] = [
  item({
    slug: "exosso-dermal-serum-booster",
    name: "Exosso.Dermal Sérum Booster",
    category: "Sérum facial regenerativo e anti-idade",
    collection: "La Cutanée.MED",
    summary: "Sérum com exossomos em nanovesículas com 11 peptídeos de fatores de crescimento, Ácido Hialurônico, Niacinamida e Glutationa.",
    tags: ["🧬 Exosome Therapy", "11 peptídeos", "15 ml"],
    image: "/images/products/la-cutanee/exosso-dermal-serum-booster-15ml.png",
    presentation: "Frasco conta-gotas de 15 ml",
    offers: [{ id: "exosso-dermal-serum-booster", price: 404.85 }],
    sections: [
      {
        title: "Descrição",
        body: "Sérum com exossomos em nanovesículas contendo 11 peptídeos derivados de fatores de crescimento associados a Ácido Hialurônico, Niacinamida e Glutationa. Possui ação regenerativa, anti-aging, rejuvenescedora, clareadora e antioxidante.",
      },
      {
        title: "Indicação",
        items: [
          "Potencializa a redução de rugas e linhas de expressão",
          "Clareamento e uniformidade do tom da pele",
          "Rejuvenescimento cutâneo progressivo",
          "Hidratação profunda e duradoura",
          "Aumento da firmeza e elasticidade",
          "Recuperação da luminosidade natural",
        ],
      },
      {
        title: "Principais Benefícios",
        items: [
          "Rejuvenescimento facial intensivo",
          "Ação clareadora e uniformizadora",
          "Estímulo potente de colágeno e elastina",
          "Redução visível de rugas, cicatrizes e estrias",
          "Melhora da firmeza e hidratação estrutural",
          "Fortalecimento da barreira cutânea",
        ],
      },
      {
        title: "Componentes Ativos",
        items: [
          "11 Fatores de crescimento (peptídeos biomiméticos em nanovesículas)",
          "Niacinamida",
          "Ácido Hialurônico",
          "Glutationa",
        ],
      },
      {
        title: "Modo de Usar",
        body: "Aplicar de 3 a 4 gotas, 1 a 2 vezes ao dia sobre a pele limpa e seca, massageando até completa absorção no rosto e/ou pescoço.",
      },
    ],
  }),
  item({
    slug: "ghk-cu-serum-booster-peptide",
    name: "GHK-Cu Sérum Booster Peptide",
    category: "Sérum facial reparador e anti-idade",
    collection: "La Cutanée.MED",
    summary: "Sérum com peptídeo de cobre GHK-Cu e complexo de peptídeos biomiméticos focado no estímulo de colágeno e elastina.",
    tags: ["🧬 GHK-Cu", "Colágeno & Elastina", "30 ml"],
    image: "/images/products/la-cutanee/ghk-cu-serum-booster-30ml.png",
    presentation: "Frasco conta-gotas de 30 ml",
    offers: [{ id: "ghk-cu-serum-booster-peptide", price: 404.85 }],
    sections: [
      {
        title: "Descrição",
        body: "Sérum de textura leve e rápida absorção focado na estimulação de colágeno e elastina, proporcionando suporte biomolecular contra os sinais visíveis do envelhecimento e promovendo reparação cutânea.",
      },
      {
        title: "Principais Benefícios",
        items: [
          "Estímulo direto à síntese de colágeno e elastina",
          "Melhora perceptível da firmeza e elasticidade",
          "Ação antioxidante e rejuvenescedora",
          "Suporte à reparação e renovação tecidual",
          "Cuidado avançado dos sinais visíveis do envelhecimento",
        ],
      },
      {
        title: "Composição Principal (INCI)",
        items: [
          "Cobre Tripeptídeo-1 (GHK-Cu)",
          "Acetil Hexapeptídeo-8",
          "Acetil Octapeptídeo-3",
          "SH-Oligopeptídeo-2",
          "Complexo de peptídeos bioativos e Ácido Hialurônico",
        ],
      },
      {
        title: "Modo de Usar",
        body: "Aplicar de 4 a 5 gotas 2 vezes ao dia sobre a pele limpa e seca (rosto, pescoço, colo e mãos), massageando suavemente até completa absorção.",
      },
    ],
  }),
  item({
    slug: "dermal-peptys-pdrn-plus-serum",
    name: "Dermal.Peptys PDRN+ Sérum",
    category: "Sérum facial reparador e revitalizante",
    collection: "La Cutanée.MED",
    summary: "PDRN, peptídeos e aminoácidos em uma fórmula voltada à renovação e revitalização da pele.",
    tags: ["🧬 PDRN", "Peptídeos", "30 ml"],
    image: "/images/products/la-cutanee/dermal-peptys-pdrn-plus-serum-30ml.png",
    presentation: "Frasco conta-gotas de 30 ml",
    offers: [{ id: "dermal-peptys-pdrn-plus-serum", price: 362.85 }],
    sections: [
      { title: "Composição", items: ["PDRN", "Peptídeos", "Aminoácidos"] },
      { title: "Tecnologia", body: "Nanotecnologia para apoiar uma ação direcionada e uma rotina de cuidado regenerativo." },
      { title: "Benefícios", items: ["Reparar", "Hidratar", "Revitalizar", "Auxílio na renovação da aparência da pele"] },
      { title: "Indicação", items: ["Aspecto desvitalizado", "Ressecamento", "Necessidade de suporte à renovação cutânea"] },
    ],
    pending: pendingDefault,
  }),
  item({
    slug: "dermal-peptys-pads-multifuncionais",
    name: "DERMAL.Peptys (Pads Ultraconcentrados)",
    category: "Pads faciais multifuncionais",
    collection: "La Cutanée.MED",
    summary: "Discos (pads) ultraconcentrados com blend de nanoativos para melhora da textura, controle da oleosidade, poros e uniformização.",
    tags: ["💧 70 pads", "7 nanoativos", "130 g"],
    image: "/images/products/la-cutanee/dermal-peptys-pads-70.png",
    presentation: "Pote com 70 pads · 130 g",
    offers: [{ id: "dermal-peptys-pads-multifuncionais", price: 284.25 }],
    sections: [
      {
        title: "Descrição",
        body: "Discos (pads) ultraconcentrados com blend de nanoativos para melhora da textura, controle da oleosidade, aparência dos poros e uniformização da pele.",
      },
      {
        title: "Fórmula Ativa",
        items: [
          "Nanocápsulas de PDRN",
          "GHK-Cu (Peptídeo de Cobre)",
          "Exossomos",
          "Niacinamida",
          "Complexo de 13 Peptídeos biomiméticos",
          "Alfa e Beta Hidroxiácidos (AHAs e BHA)",
        ],
      },
      {
        title: "Principais Benefícios",
        items: [
          "Melhora visível da textura e uniformização do tom",
          "Ação hidratante balanceada sem pesar",
          "Controle efetivo da oleosidade e diminuição dos poros dilatados",
          "Estímulo à renovação suave da pele",
        ],
      },
      {
        title: "Modo de Usar",
        body: "Com a pele limpa e seca, utilize a pinça para retirar o pad e passe suavemente no rosto e pescoço com movimentos circulares até a absorção (sem enxágue). Uso diário (peles sensíveis podem usar de 2 a 3 vezes por semana). Fechar bem o pote para não ressecar.",
      },
    ],
  }),
  item({
    slug: "revytra-c20-nano",
    name: "Revytra C20+ Nano",
    category: "Sérum facial antioxidante com vitamina C",
    collection: "Linha Revytra",
    summary: "Sérum antioxidante com 20% de vitamina C nanoestabilizada combinada a ativos sinérgicos contra rugas, flacidez e melasma.",
    tags: ["🍊 Vitamina C 20%", "Nanoencapsulada", "30 ml"],
    image: "/images/products/la-cutanee/revytra-c20-nano-serum-30ml.png",
    presentation: "Frasco dosador de 30 ml",
    offers: [{ id: "revytra-c20-nano", price: 314.85 }],
    sections: [
      {
        title: "Descrição",
        body: "Sérum antioxidante com 20% de vitamina C nanoestabilizada combinada a outros ativos sinérgicos para potencializar resultados, prevenir o envelhecimento precoce, reduzir rugas, combater a flacidez e clarear manchas (melasma).",
      },
      {
        title: "Principais Ativos (Nanocapsulados)",
        items: [
          "Vitamina C nanoestabilizada (20%)",
          "Vitamina A e Vitamina E",
          "Ácido Hialurônico de baixo peso molecular",
          "Ácido Ferúlico",
          "Idebenona",
          "Água Thermal pura",
          "Clean beauty: livre de parabenos, óleo mineral, lauril sulfato de sódio e ingredientes animais (não testado em animais)",
        ],
      },
      {
        title: "Mecanismos e Benefícios",
        items: [
          "Aumenta a síntese de colágeno e elastina",
          "Bloqueia a síntese de melanina, auxiliando no clareamento e prevenção de hiperpigmentações",
          "Estimula a renovação celular contínua",
          "Ação antioxidante potente, anti-inflamatória e calmante",
          "Suaviza manchas, melhora a textura e ilumina a pele",
        ],
      },
      {
        title: "Eficácia Clínica Comprovada",
        items: [
          "97% de redução comprovada de rugas e linhas finas, melhora da hidratação e iluminação",
          "93% de melhora na textura geral da pele",
          "87% de clareamento de manchas e melhora da firmeza e elasticidade",
        ],
      },
      {
        title: "Modo de Usar",
        body: "Aplicar de 1 a 2 vezes ao dia (manhã e noite). Devido à alta concentração, usar a quantidade equivalente ao tamanho de um grão de ervilha para todo o rosto, massageando suavemente até completa absorção.",
      },
    ],
  }),
  item({
    slug: "hyalu-b3-preenchedor-biomimetico",
    name: "Hyalu [B3] Sérum Preenchedor Full Face",
    category: "Sérum facial hidratante e preenchedor",
    collection: "Linha Hyalu",
    summary: "Sérum preenchedor full face reestruturante que promove volumização, contorno, firmeza e redução de rugas.",
    tags: ["💧 8 tipos de AH", "Vitamina B3", "30 ml"],
    image: "/images/products/la-cutanee/hyalu-b3-full-face-30ml.png",
    presentation: "Frasco conta-gotas de 30 ml",
    offers: [{ id: "hyalu-b3-preenchedor-biomimetico", price: 439.35 }],
    sections: [
      {
        title: "Descrição",
        body: "Sérum preenchedor full face reestruturante que promove volumização, contorno, firmeza e redução de rugas pela reposição direta de Ácido Hialurônico (AH) e estímulo da síntese endógena. Indicado para todos os tipos de pele e manutenção de procedimentos (harmonização, preenchimento, fios).",
      },
      {
        title: "Principais Ativos",
        items: [
          "8 tipos de Ácido Hialurônico (4 de baixo peso molecular, 1 de médio peso molecular e 3 de alto peso molecular)",
          "Niacinamida (Vitamina B3)",
          "Oligofurcellaran (algas vermelhas)",
          "Colágeno Vegetal Hidrolisado",
          "Aminoácidos essenciais",
        ],
      },
      {
        title: "Resultados de Eficácia Clínica (em 15 dias)",
        items: [
          "100% melhora na elasticidade e redução de rugas/linhas finas",
          "100% hidratação profunda e pele com viço revitalizado",
          "100% melhora na textura e maciez",
          "73% efeito preenchedor comprovado com aumento de volume",
          "73% pele visivelmente mais uniformizada",
        ],
      },
      {
        title: "Selos e Certificações",
        items: [
          "Vegano e Cruelty free",
          "Sulfateless (sulfate free)",
          "Gluten free e Paraben free",
          "Selo eureciclo",
          "ECO & HEALTH FRIENDLY",
          "Hipoalergênico e Dermatologicamente Testado",
        ],
      },
      {
        title: "Modo de Usar",
        body: "Aplicar de manhã e/ou à noite (3 a 4 gotas) no rosto e pescoço, massageando suavemente até completa absorção. Durante o dia, associar protetor solar de alto FPS.",
      },
    ],
  }),
  item({
    slug: "solary-aox-fps-60",
    name: "Solary AOX FPS 60 (Protetor Solar)",
    category: "Protetor solar facial de amplo espectro",
    collection: "Linha Solary",
    summary: "Fotoprotetor multiespectral com FPS 60, UVA 47, proteção contra luz visível/azul e infravermelho com Phloretin antioxidante.",
    tags: ["☀️ FPS 60", "UVA 47", "40 g"],
    image: "/images/products/la-cutanee/solary-aox-fps-60-sem-cor-40g.png",
    presentation: "Bisnaga de 40 g",
    variantName: "Cobertura",
    offers: [
      { id: "solary-aox-fps-60-sem-cor", label: "Sem cor", price: 188.85, image: "/images/products/la-cutanee/solary-aox-fps-60-sem-cor-40g.png" },
      { id: "solary-aox-fps-60-com-cor", label: "Com cor", price: 224.85, image: "/images/products/la-cutanee/solary-aox-fps-60-com-cor-40g.png" },
    ],
    sections: [
      {
        title: "Descrição",
        body: "Fotoprotetor de alta tecnologia com FPS 60, UVA 47, proteção contra luz visível/azul e infravermelho. Contém Phloretin, um potente antioxidante que previne radicais livres, fotoenvelhecimento e ajuda a combater o melasma. Possui toque seco imediato e fórmula sem fragrância.",
      },
      {
        title: "Principais Benefícios",
        items: [
          "Amplo espectro solar: UVA 47, UVB FPS 60, luz visível/azul e infravermelho",
          "Ação antioxidante e anti-idade avançada com Phloretin",
          "Proteção efetiva e combate ativo a manchas e melasma",
          "Melhora comprovada da firmeza e elasticidade cutânea",
          "Toque seco com controle de oleosidade e acabamento matte",
        ],
      },
      {
        title: "Testes Clínicos e Aprovação dos Voluntários",
        items: [
          "94% aprovaram o produto e notaram ação clareadora contra manchas",
          "84% constataram auxílio direto na prevenção ao envelhecimento",
          "81% comprovaram eficácia redutora contra rugas",
          "80% comprovaram efeito matte prolongado",
          "Dermatologicamente testado e hipoalergênico",
        ],
      },
      {
        title: "Segurança Ambiental e Humana",
        items: [
          "Desenvolvido sem substâncias tóxicas ao ecossistema aquático ou bioacumuladas no organismo humano",
          "Livre de: Octocrylene, Benzofenonas, Avobenzona, Metoxicinamatos e Derivados de cânfora",
          "Livre de: PABA, Fenoxietanol, Homosalate e Parabenos",
          "Fórmula 100% Vegana e Cruelty Free",
        ],
      },
      {
        title: "Modo de Usar",
        body: "Uso diário (mesmo em dias nublados). Aplicar abundantemente 30 minutos antes da exposição solar e reaplicar após suor intenso, banho, secagem com toalha ou exposição prolongada.",
      },
    ],
    pending: [...pendingResolved, { label: "Nomes das tonalidades da opção com cor", public: true }],
  }),
];
