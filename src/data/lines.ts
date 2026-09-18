export type LineId = string;

export interface ProductLine {
  id: LineId;
  name: string;
  descriptor: string;
  tagline: string;
  emoji: string;
  colors: {
    surface: string;
    accent: string;
    foreground: string;
  };
  highlights: string[];
  mission?: string;
  vision?: string;
  values?: string;
  differentials?: string[];
  seals?: string[];
  links?: { label: string; href: string; description: string }[];
}

export const LINES: Record<"pbserum" | "la-cutanee", ProductLine> = {
  pbserum: {
    id: "pbserum",
    name: "Pbserum",
    descriptor: "Bioregenerativos recombinantes",
    tagline: "Precisão biotecnológica para protocolos de remodelação e regeneração tecidual.",
    emoji: "🧬",
    colors: { surface: "#F5EEDC", accent: "#B4872D", foreground: "#12283C" },
    highlights: ["3 produtos", "6 protocolos", "Tecnologia recombinante"],
    links: [
      { label: "Ciência Pbserum", href: "/enzimas", description: "Entenda os ativos, mecanismos e registros." },
    ],
  },
  "la-cutanee": {
    id: "la-cutanee",
    name: "La Cutanée",
    descriptor: "Dermocosméticos de precisão",
    tagline: "Ciência, tecnologia e alta performance para o cuidado avançado da pele.",
    emoji: "💧",
    colors: { surface: "#E7EEF8", accent: "#2B5C9E", foreground: "#153459" },
    highlights: ["7 produtos", "Água termal", "Precisão biomolecular"],
    mission: "Desenvolver dermocosméticos de alta performance que unem ciência, inovação e cuidado com a pele.",
    vision: "Ser referência em tecnologia dermocosmética e em soluções de precisão para diferentes necessidades da pele.",
    values: "Ciência, inovação, qualidade, segurança, respeito à pele e responsabilidade.",
    differentials: [
      "Ativos de alta performance",
      "Tecnologia de precisão biomolecular",
      "Nanotecnologia aplicada",
      "Água termal nas formulações",
      "Fórmulas multifuncionais",
      "Produtos dermatologicamente testados",
      "Cuidado para diferentes fototipos",
      "Pesquisa e inovação dermocosmética",
    ],
    seals: ["Vegano", "Cruelty free", "Dermatologicamente testado", "Alta performance"],
  },
};

export const LINE_LIST = Object.values(LINES);

export function getLine(id: string): ProductLine | undefined {
  return LINE_LIST.find((line) => line.id === id);
}
