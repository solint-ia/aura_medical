import type { EnzymeId } from "./enzymes";

export interface Indication {
  id: string;
  title: string;
  description: string;
  enzymes: EnzymeId[];
  /** Featured indications span two columns in the bento grid. */
  featured: boolean;
  /** Caption shown in the empty photo slot until a photo is supplied. */
  photoPlaceholder: string;
}

export const INDICATIONS: Indication[] = [
  {
    id: "perfil-facial",
    title: "Perfil Facial",
    description:
      "Redefine o contorno facial, tratando adiposidade localizada e simetria da linha mandibular.",
    enzymes: ["slim", "smooth", "drain"],
    featured: true,
    photoPlaceholder: "Close-up · Perfil Facial",
  },
  {
    id: "queixo-duplo",
    title: "Queixo Duplo / Papada",
    description:
      "Reduz o acúmulo adiposo submentual e melhora o ângulo cervicomentoniano.",
    enzymes: ["slim", "drain"],
    featured: false,
    photoPlaceholder: "Close-up · Queixo Duplo / Papada",
  },
  {
    id: "celulite",
    title: "Celulite",
    description:
      "Rompe septos fibrosos subcutâneos responsáveis pelo aspecto de casca de laranja.",
    enzymes: ["slim", "smooth", "drain"],
    featured: false,
    photoPlaceholder: "Close-up · Celulite",
  },
  {
    id: "gordura-localizada",
    title: "Gordura Localizada",
    description:
      "Trata bolsas de gordura resistente em abdômen, flancos e demais áreas do corpo.",
    enzymes: ["slim", "smooth"],
    featured: true,
    photoPlaceholder: "Close-up · Gordura Localizada",
  },
  {
    id: "cicatrizes",
    title: "Cicatrizes",
    description:
      "Amolece e reorganiza colágeno fibrótico retraído em cicatrizes atróficas ou aderentes.",
    enzymes: ["smooth"],
    featured: false,
    photoPlaceholder: "Close-up · Cicatrizes",
  },
  {
    id: "fibrose-pos-cirurgica",
    title: "Fibrose Pós-Cirúrgica",
    description:
      "Dissolve septos fibróticos e nódulos formados após lipoaspiração ou cirurgia.",
    enzymes: ["smooth"],
    featured: false,
    photoPlaceholder: "Close-up · Fibrose Pós-Cirúrgica",
  },
];

export const SESSION_INTERVAL_NOTE =
  "Intervalo entre sessões — Flacidez: 4–6 semanas · Adiposidade, celulite, cicatrizes e fibrose: 2–3 semanas.";
