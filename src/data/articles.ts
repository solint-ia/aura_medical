export interface ScientificArticle {
  title: string;
  fileUrl: string;
  category?: string;
}

export const scientificArticles: ScientificArticle[] = [
  {
    title: "Produtos Recombinantes Enzimáticos na Dermatologia",
    fileUrl: "/artigos/efetividade-dermatologia.pdf",
    category: "Dermatologia & Eficácia",
  },
  {
    title: "Avaliação da Deposição e Permeabilidade da Queratinase na Pele",
    fileUrl: "/artigos/efetividade-keratinase.pdf",
    category: "Enzimas Recombinantes",
  },
  {
    title: "Ácido Hialurônico e Enzimas Recombinantes Pbserum Low para o Tratamento da Flacidez Corporal",
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
    title: "Fundamentos do Uso de Enzimas Recombinantes na Dermatologia",
    fileUrl: "/artigos/fundamentos-dermatologia.pdf",
    category: "Fundamentos Científicos",
  },
  {
    title: "Enzimas Recombinantes: Um Novo Caminho para a Remodelação Facial e Rejuvenescimento da Pele",
    fileUrl: "/artigos/remodelacao-facial.pdf",
    category: "Remodelação Facial",
  },
  {
    title: "Eficácia e Segurança da Mistura Enzimática: Lipase, Colagenase e Hialuronidase",
    fileUrl: "/artigos/remodelacao-corporal.pdf",
    category: "Segurança & Eficácia",
  },
  {
    title: "Tratamento de Granulomas de Corpo Estranho com Terapia Enzimática Combinada",
    fileUrl: "/artigos/resolucao-granulomas.pdf",
    category: "Casos Clínicos & Resolução",
  },
  {
    title: "Grau de Satisfação de Pacientes Tratados Esteticamente com Enzimas Recombinantes: Experiência Clínica",
    fileUrl: "/artigos/satisfacao-pacientes.pdf",
    category: "Estudos Clínicos",
  },
  {
    title: "Eficácia do Tratamento da Celulite com Terapia Enzimática Combinada",
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
