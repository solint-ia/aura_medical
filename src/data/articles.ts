export interface ScientificArticle {
  title: string;
  fileUrl: string;
  category?: string;
}

export const scientificArticles: ScientificArticle[] = [
  {
    title: "Bioregenerativos Recombinantes na Dermatologia",
    fileUrl: "/artigos/efetividade-dermatologia.pdf",
    category: "Dermatologia & Eficácia",
  },
  {
    title: "Avaliação da Deposição e Permeabilidade da Queratinase na Pele",
    fileUrl: "/artigos/efetividade-keratinase.pdf",
    category: "Bioregenerativos Recombinantes",
  },
  {
    title: "Ácido Hialurônico e Bioregenerativos Recombinantes pbserum Low para Flacidez Corporal",
    fileUrl: "/artigos/tratamento-flacidez.pdf",
    category: "Remodelação Corporal",
  },
  {
    title: "Avaliação da Eficácia do pbserum Extreme Firmness na Firmeza e Elasticidade da Pele",
    fileUrl: "/artigos/firmeza-elasticidade-peeling.pdf",
    category: "Textura & Elasticidade",
  },
  {
    title: "Avaliação da Eficácia e Tolerância do pbserum smartker Equilibrium Professional",
    fileUrl: "/artigos/qualidade-pele-smartkare.pdf",
    category: "Qualidade de Pele",
  },
  {
    title: "Fundamentos do Uso de Bioregenerativos Recombinantes na Dermatologia",
    fileUrl: "/artigos/fundamentos-dermatologia.pdf",
    category: "Fundamentos Científicos",
  },
  {
    title: "Bioregenerativos Recombinantes: Um Novo Caminho para a Remodelação Facial e Rejuvenescimento da Pele",
    fileUrl: "/artigos/remodelacao-facial.pdf",
    category: "Remodelação Facial",
  },
  {
    title: "Eficácia e Segurança da Associação de Bioregenerativos: Lipase, Colagenase e Hialuronidase",
    fileUrl: "/artigos/remodelacao-corporal.pdf",
    category: "Segurança & Eficácia",
  },
  {
    title: "Tratamento de Granulomas de Corpo Estranho com Bioregenerativos Recombinantes",
    fileUrl: "/artigos/resolucao-granulomas.pdf",
    category: "Casos Clínicos & Resolução",
  },
  {
    title: "Grau de Satisfação de Pacientes Tratados Esteticamente com Bioregenerativos Recombinantes: Experiência Clínica",
    fileUrl: "/artigos/satisfacao-pacientes.pdf",
    category: "Estudos Clínicos",
  },
  {
    title: "Eficácia do Tratamento da Celulite com Bioregenerativos Recombinantes",
    fileUrl: "/artigos/tratamento-celulite.pdf",
    category: "Tratamento de Celulite",
  },
];

// Compatibility alias for legacy components
export const ARTICLES = scientificArticles.map((article, idx) => ({
  id: `article-${idx + 1}`,
  year: "2024",
  title: article.title,
  topic: article.category || "Estudo Científico",
  href: article.fileUrl,
}));
