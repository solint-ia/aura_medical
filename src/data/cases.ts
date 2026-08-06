export interface ClinicalCase {
  id: string;
  categoryId: string; // Slug que conecta com o protocolo
  categoryName: string;
  beforeImage: string;
  afterImage: string;
  doctor: string;
  country?: string; // Opcional, pois alguns não possuem país listado
  sessions: number;
}

export interface CaseCategory {
  id: string;
  label: string;
}

export const CASE_CATEGORIES: CaseCategory[] = [
  { id: "queixo-duplo", label: "Queixo Duplo (Papada)" },
  { id: "cicatrizes", label: "Cicatrizes" },
  { id: "fibrose-pos-cirurgica", label: "Fibrose Pós-Cirúrgica" },
  { id: "perfilamento-facial", label: "Perfilamento Facial" },
  { id: "gordura-localizada", label: "Gordura Localizada" },
  { id: "celulite", label: "Celulite" },
];

export const clinicalCasesData: ClinicalCase[] = [
  // Queixo Duplo (Papada)
  {
    id: "queixo-3",
    categoryId: "queixo-duplo",
    categoryName: "Queixo Duplo (Papada)",
    beforeImage: "/Casos-clinicos/queixoduplo3-antes.png",
    afterImage: "/Casos-clinicos/queixoduplo3-depois.png",
    doctor: "Equipe Médica pbserum",
    sessions: 3,
  },

  // Cicatrizes
  {
    id: "cicatriz-3",
    categoryId: "cicatrizes",
    categoryName: "Cicatrizes",
    beforeImage: "/Casos-clinicos/cicatriz3-antes.png",
    afterImage: "/Casos-clinicos/cicatriz3-depois.png",
    doctor: "Equipe Médica pbserum",
    sessions: 3,
  },

  // Fibrose Pós-Cirúrgica
  {
    id: "fibrose-2",
    categoryId: "fibrose-pos-cirurgica",
    categoryName: "Fibrose Pós-Cirúrgica",
    beforeImage: "/Casos-clinicos/fibrose2-antes.png",
    afterImage: "/Casos-clinicos/fibrose2-depois.png",
    doctor: "Equipe Médica pbserum",
    sessions: 3,
  },

  // Perfilamento Facial
  {
    id: "perfilamento-2",
    categoryId: "perfilamento-facial",
    categoryName: "Perfilamento Facial",
    beforeImage: "/Casos-clinicos/perfilamento2-antes.png",
    afterImage: "/Casos-clinicos/perfilamento2-depois.png",
    doctor: "Equipe Médica pbserum",
    sessions: 2,
  },

  // Gordura Localizada
  {
    id: "gordura-4",
    categoryId: "gordura-localizada",
    categoryName: "Gordura Localizada",
    beforeImage: "/Casos-clinicos/gorduralocal4-antes.png",
    afterImage: "/Casos-clinicos/gorduralocal4-depois.png",
    doctor: "Equipe Médica pbserum",
    sessions: 4,
  },

  // Celulite
  {
    id: "celulite-4",
    categoryId: "celulite",
    categoryName: "Celulite",
    beforeImage: "/Casos-clinicos/celulite4-antes.png",
    afterImage: "/Casos-clinicos/celulite4-depois.png",
    doctor: "Equipe Médica pbserum",
    sessions: 4,
  },
];
