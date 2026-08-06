export interface SafetyNote {
  label: string;
  body: string;
}

export interface FaqLink {
  href: string;
  label: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  /** Links exibidos abaixo da resposta, quando ela aponta para outra página. */
  links?: FaqLink[];
}

export const SAFETY_NOTES: SafetyNote[] = [
  {
    label: "Efeitos transitórios esperados",
    body: "Eritema leve ou sensibilidade local transitória (<72h). Hidratação e cuidados básicos pós-uso ajudam na rápida recuperação.",
  },
  {
    label: "Precauções gerais",
    body: "Gravidez, amamentação ou alergia conhecida a componentes enzimáticos. Em caso de dúvidas, consulte nosso suporte especializado.",
  },
  {
    label: "Cuidados pós-uso",
    body: "Hidratação adequada da pele, uso diário de protetor solar FPS 50 e higiene cuidadosa da área tratada.",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Como funciona o processo de compra?",
    answer:
      "A compra é direta e descomplicada. Você pode escolher seu protocolo ideal em nosso site, adicionar ao carrinho e finalizar o pedido com entrega rápida em todo o Brasil.",
  },
  {
    question: "Existe pedido mínimo?",
    answer:
      "Não há valor mínimo de pedido. Você pode adquirir desde enzimas individuais até protocolos completos.",
  },
  {
    question: "Quais os prazos de entrega?",
    answer: "Os prazos de entrega variam conforme o CEP informado no checkout, com rastreamento completo até a entrega.",
  },
  {
    question: "Os produtos possuem registro e comprovação?",
    answer:
      "Sim. Cada enzima da linha pbserum Plus possui registro na ANVISA, além do registro cosmético conforme o Regulamento (CE) 1223/2009. Os números de processo de Slim+, Smooth+ e Drain+ estão no link abaixo:",
    links: [
      { href: "/enzimas#registro-anvisa", label: "Registro ANVISA" },
    ],
  },
  {
    question: "Como utilizar os produtos?",
    answer:
      "Cada protocolo acompanha instruções detalhadas de uso e reconstituição. Nossas fórmulas recombinantes possuem alta tecnologia para máxima eficiência.",
  },
];
