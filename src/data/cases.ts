export type CaseCategoryId =
  "flacidez" | "gordura" | "celulite" | "cicatrizes" | "fibrose";

export interface CaseCategory {
  id: CaseCategoryId;
  label: string;
}

export interface CasePhotos {
  before: string;
  after: string;
}

export interface ClinicalCase {
  id: number;
  category: CaseCategoryId;
  doctor: string;
  /** Country and number of sessions, as documented by the practitioner. */
  meta: string;
  note?: string;
  /** Absent until the before/after photos for the case are supplied. */
  photos?: CasePhotos;
}

export const CASE_CATEGORIES: CaseCategory[] = [
  { id: "flacidez", label: "Flacidez Facial" },
  { id: "gordura", label: "Gordura Localizada" },
  { id: "celulite", label: "Celulite" },
  { id: "cicatrizes", label: "Cicatrizes" },
  { id: "fibrose", label: "Fibrose Pós-Cirúrgica" },
];

export const CLINICAL_CASES: ClinicalCase[] = [
  {
    id: 1,
    category: "flacidez",
    doctor: "Dr. Ramón Alejandro Chapa",
    meta: "México · 2 sessões",
    photos: {
      before: "/images/cases/case-1-before.webp",
      after: "/images/cases/case-1-after.webp",
    },
  },
  {
    id: 2,
    category: "gordura",
    doctor: "Dra. Plakhota A.",
    meta: "Rússia · 4 sessões",
  },
  {
    id: 3,
    category: "gordura",
    doctor: "Dra. Olga Gaziullina",
    meta: "Alemanha · 1 sessão",
  },
  {
    id: 4,
    category: "gordura",
    doctor: "Dra. Susana Misticone",
    meta: "Venezuela · 2 sessões",
    note: "Foco: queixo",
  },
  {
    id: 5,
    category: "gordura",
    doctor: "Dra. Farah el Chaer",
    meta: "Líbano · 3 sessões",
    note: "Foco: queixo",
  },
  {
    id: 6,
    category: "gordura",
    doctor: "Dra. Sevinj Rustamzade",
    meta: "Azerbaijão · 2 sessões",
  },
  {
    id: 7,
    category: "celulite",
    doctor: "Dra. Evelin Veras",
    meta: "México · 6 sessões",
  },
  {
    id: 8,
    category: "celulite",
    doctor: "Dra. Desirée Castelanich",
    meta: "Argentina · 6 sessões",
  },
  {
    id: 9,
    category: "cicatrizes",
    doctor: "Dra. Maira González",
    meta: "3 sessões",
  },
  {
    id: 10,
    category: "fibrose",
    doctor: "Dr. Andrés Cabrera",
    meta: "Espanha · 4 sessões",
    note: "Pós-lipolaser",
  },
  {
    id: 11,
    category: "fibrose",
    doctor: "Dr. Andrés Cabrera",
    meta: "Espanha · 3 sessões",
    note: "Pós-cirúrgica (HA High)",
  },
];

export function countCasesInCategory(category: CaseCategoryId): number {
  return CLINICAL_CASES.filter((item) => item.category === category).length;
}

export function getCasesInCategory(category: CaseCategoryId): ClinicalCase[] {
  return CLINICAL_CASES.filter((item) => item.category === category);
}
