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
  { id: "queixo-duplo", label: "Queixo Duplo" },
  { id: "cicatrizes", label: "Cicatrizes" },
  { id: "fibrose-pos-cirurgica", label: "Fibrose Pós-Cirúrgica" },
  { id: "perfilamento-facial", label: "Perfilamento Facial" },
  { id: "gordura-localizada", label: "Gordura Localizada" },
  { id: "celulite", label: "Celulite" },
];

export const clinicalCasesData: ClinicalCase[] = [
  {
    id: "queixo-1",
    categoryId: "queixo-duplo",
    categoryName: "Queixo Duplo",
    beforeImage: "/fotos-antes-depois/queixoduplo1-antes.png",
    afterImage: "/fotos-antes-depois/queixoduplo1-depois.png",
    doctor: "Dra. Susana Misticone",
    country: "Venezuela",
    sessions: 2,
  },
  {
    id: "cicatriz-1",
    categoryId: "cicatrizes",
    categoryName: "Cicatrizes",
    beforeImage: "/fotos-antes-depois/cicatriz1-antes.png",
    afterImage: "/fotos-antes-depois/cicatriz1-depois.png",
    doctor: "Dra. Maira González",
    sessions: 3,
  },
  {
    id: "fibrose-1",
    categoryId: "fibrose-pos-cirurgica",
    categoryName: "Fibrose Pós-Cirúrgica",
    beforeImage: "/fotos-antes-depois/fibrose1-depois.png",
    afterImage: "/fotos-antes-depois/fibrose1-antes.png",
    doctor: "Dr. Andrés Cabrera",
    country: "Espanha",
    sessions: 3,
  },
  {
    id: "queixo-2",
    categoryId: "queixo-duplo",
    categoryName: "Queixo Duplo",
    beforeImage: "/fotos-antes-depois/queixoduplo2-antes.png",
    afterImage: "/fotos-antes-depois/queixoduplo2-depois.png",
    doctor: "Dra. Farah el Chaer",
    country: "Líbano",
    sessions: 3,
  },
  {
    id: "cicatriz-2",
    categoryId: "cicatrizes",
    categoryName: "Cicatrizes",
    beforeImage: "/fotos-antes-depois/cicatriz2-antes.png",
    afterImage: "/fotos-antes-depois/cicatriz2-depois.png",
    doctor: "Dra. Maira González",
    sessions: 3,
  },
  {
    id: "perfilamento-1",
    categoryId: "perfilamento-facial",
    categoryName: "Perfilamento Facial",
    beforeImage: "/fotos-antes-depois/perfilamentofacial1-antes.png",
    afterImage: "/fotos-antes-depois/perfilamentofacial1-depois.png",
    doctor: "Dr. Ramón Alejandro Chapa",
    country: "México",
    sessions: 2,
  },
  {
    id: "gordura-1",
    categoryId: "gordura-localizada",
    categoryName: "Gordura Localizada",
    beforeImage: "/fotos-antes-depois/gorduralocal1-antes.png",
    afterImage: "/fotos-antes-depois/gorduralocal1-depois.png",
    doctor: "Dra. Plakhota A.",
    country: "Rússia",
    sessions: 4,
  },
  {
    id: "gordura-2",
    categoryId: "gordura-localizada",
    categoryName: "Gordura Localizada",
    beforeImage: "/fotos-antes-depois/gorduralocal2-antes.png",
    afterImage: "/fotos-antes-depois/gorduralocal2-depois.png",
    doctor: "Dra. Olga Gaziullina",
    country: "Alemanha",
    sessions: 1,
  },
  {
    id: "celulite-1",
    categoryId: "celulite",
    categoryName: "Celulite",
    beforeImage: "/fotos-antes-depois/celulite1-antes.png",
    afterImage: "/fotos-antes-depois/celulite1-depois.png",
    doctor: "Dra. Evelin Veras",
    country: "México",
    sessions: 6,
  },
  {
    id: "celulite-2",
    categoryId: "celulite",
    categoryName: "Celulite",
    beforeImage: "/fotos-antes-depois/celulite2-antes.png",
    afterImage: "/fotos-antes-depois/celulite2-depois.png",
    doctor: "Dra. Desirée Castelanich",
    country: "Argentina",
    sessions: 6,
  },
];
