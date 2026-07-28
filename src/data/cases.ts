export interface ClinicalCase {
  id: string;
  categoryId: string; // Slug que conecta com o protocolo
  categoryName: string;
  beforeImage: string;
  afterImage: string;
}

export interface CaseCategory {
  id: string;
  label: string;
}

export const CASE_CATEGORIES: CaseCategory[] = [
  { id: "queixo-duplo", label: "Queixo Duplo" },
  { id: "perfilamento-facial", label: "Perfilamento Facial" },
  { id: "gordura-localizada", label: "Gordura Localizada" },
  { id: "celulite", label: "Celulite" },
  { id: "cicatrizes", label: "Cicatrizes" },
  { id: "fibrose-pos-cirurgica", label: "Fibrose Pós-Cirúrgica" },
];

export const clinicalCasesData: ClinicalCase[] = [
  {
    id: "celulite-1",
    categoryId: "celulite",
    categoryName: "Celulite",
    beforeImage: "/fotos-antes-depois/celulite1-antes.png",
    afterImage: "/fotos-antes-depois/celulite1-depois.png",
  },
  {
    id: "celulite-2",
    categoryId: "celulite",
    categoryName: "Celulite",
    beforeImage: "/fotos-antes-depois/celulite2-antes.png",
    afterImage: "/fotos-antes-depois/celulite2-depois.png",
  },
  {
    id: "cicatriz-1",
    categoryId: "cicatrizes",
    categoryName: "Cicatrizes",
    beforeImage: "/fotos-antes-depois/cicatriz1-antes.png",
    afterImage: "/fotos-antes-depois/cicatriz1-depois.png",
  },
  {
    id: "cicatriz-2",
    categoryId: "cicatrizes",
    categoryName: "Cicatrizes",
    beforeImage: "/fotos-antes-depois/cicatriz2-antes.png",
    afterImage: "/fotos-antes-depois/cicatriz2-depois.png",
  },
  {
    id: "fibrose-1",
    categoryId: "fibrose-pos-cirurgica",
    categoryName: "Fibrose Pós-Cirúrgica",
    beforeImage: "/fotos-antes-depois/fibrose1-depois.png",
    afterImage: "/fotos-antes-depois/fibrose1-antes.png",
  },
  {
    id: "gordura-1",
    categoryId: "gordura-localizada",
    categoryName: "Gordura Localizada",
    beforeImage: "/fotos-antes-depois/gorduralocal1-antes.png",
    afterImage: "/fotos-antes-depois/gorduralocal1-depois.png",
  },
  {
    id: "gordura-2",
    categoryId: "gordura-localizada",
    categoryName: "Gordura Localizada",
    beforeImage: "/fotos-antes-depois/gorduralocal2-antes.png",
    afterImage: "/fotos-antes-depois/gorduralocal2-depois.png",
  },
  {
    id: "perfilamento-1",
    categoryId: "perfilamento-facial",
    categoryName: "Perfilamento Facial",
    beforeImage: "/fotos-antes-depois/perfilamentofacial1-antes.png",
    afterImage: "/fotos-antes-depois/perfilamentofacial1-depois.png",
  },
  {
    id: "queixo-1",
    categoryId: "queixo-duplo",
    categoryName: "Queixo Duplo",
    beforeImage: "/fotos-antes-depois/queixoduplo1-antes.png",
    afterImage: "/fotos-antes-depois/queixoduplo1-depois.png",
  },
  {
    id: "queixo-2",
    categoryId: "queixo-duplo",
    categoryName: "Queixo Duplo",
    beforeImage: "/fotos-antes-depois/queixoduplo2-antes.png",
    afterImage: "/fotos-antes-depois/queixoduplo2-depois.png",
  },
];
