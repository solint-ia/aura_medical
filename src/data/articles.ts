export interface ScientificArticle {
  title: string;
  fileUrl: string;
  category?: string;
}

export const scientificArticles: ScientificArticle[] = [
  {
    title: "Discussão sobre a Efetividade dos Produtos Enzimáticos na Dermatologia",
    fileUrl: "/artigos/efetividade-dermatologia.pdf",
    category: "Dermatologia & Eficácia"
  },
  {
    title: "Efetividade da Keratinase Recombinante",
    fileUrl: "/artigos/efetividade-keratinase.pdf",
    category: "Enzimas Recombinantes"
  },
  {
    title: "Tratamento de Firmeza e Flacidez Corporal com Ácido Hialurônico e Enzimas",
    fileUrl: "/artigos/tratamento-flacidez.pdf",
    category: "Remodelação Corporal"
  },
  {
    title: "Avaliação da Eficácia na Firmeza e Elasticidade da Pele via Peeling Enzimático",
    fileUrl: "/artigos/firmeza-elasticidade-peeling.pdf",
    category: "Textura & Elasticidade"
  },
  {
    title: "Avaliação de Eficácia e Tolerância na Melhoria da Qualidade da Pele",
    fileUrl: "/artigos/qualidade-pele-smartkare.pdf",
    category: "Qualidade de Pele"
  },
  {
    title: "Fundamentos e Prova de Princípios do Uso de Enzimas na Dermatologia",
    fileUrl: "/artigos/fundamentos-dermatologia.pdf",
    category: "Fundamentos Científicos"
  },
  {
    title: "Remodelação Facial com Polipeptídeos Recombinantes",
    fileUrl: "/artigos/remodelacao-facial.pdf",
    category: "Remodelação Facial"
  },
  {
    title: "Eficácia e Segurança na Remodelação Corporal",
    fileUrl: "/artigos/remodelacao-corporal.pdf",
    category: "Segurança & Eficácia"
  },
  {
    title: "Resolução de Granulomas utilizando Polipeptídeos Recombinantes",
    fileUrl: "/artigos/resolucao-granulomas.pdf",
    category: "Casos Clínicos & Resolução"
  },
  {
    title: "Experiência Clínica e Satisfação de Pacientes Tratados",
    fileUrl: "/artigos/satisfacao-pacientes.pdf",
    category: "Estudos Clínicos"
  },
  {
    title: "Tratamento de Celulite Corporal com Enzimas Recombinantes",
    fileUrl: "/artigos/tratamento-celulite.pdf",
    category: "Tratamento de Celulite"
  }
];

// Compatibility alias for legacy components
export const ARTICLES = scientificArticles.map((article, idx) => ({
  id: `article-${idx + 1}`,
  year: "2024",
  title: article.title,
  topic: article.category || "Estudo Científico",
  href: article.fileUrl,
}));
