export interface SafetyNote {
  label: string;
  body: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const SAFETY_NOTES: SafetyNote[] = [
  {
    label: "Efeitos adversos esperados",
    body: "Eritema transitório (<72h), inflamação ou mal-estar local (4–72h) e hematomas. Menos frequente: náuseas, vômitos ou sintomas gripais. Muito raro: anafilaxia (~0,1%).",
  },
  {
    label: "Contraindicações",
    body: "Gravidez e amamentação, doença ativa de pele, alergia a ácido hialurônico ou enzimas, alergia a picada de inseto.",
  },
  {
    label: "Precauções",
    body: "Doenças autoimunes, atopia ou asma, distúrbios vasculares ou de coagulação, doença oncológica ativa.",
  },
  {
    label: "Pós-tratamento",
    body: "Hidratação adequada, evitar sudorese excessiva, uso de FPS 50 e adiamento de outros procedimentos estéticos na área tratada.",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Como funciona o processo de credenciamento?",
    answer:
      "Preencha o formulário de interesse — o time comercial da Aura Medical entra em contato para validar o perfil clínico e liberar o acesso à compra dos protocolos pbserum Plus.",
  },
  {
    question: "Qual o pedido mínimo por clínica?",
    answer:
      "Consulte o time comercial — o pedido mínimo varia conforme a região e o protocolo escolhido.",
  },
  {
    question: "Quais os prazos de entrega?",
    answer: "Consulte o time comercial para os prazos vigentes na sua região.",
  },
  {
    question: "Os produtos têm registro sanitário?",
    answer:
      "Sim. pbserum Plus é um produto cosmético registrado conforme o Regulamento (CE) 1223/2009. A Aura Medical é a distribuidora oficial autorizada no Brasil.",
  },
  {
    question: "Quem pode aplicar os protocolos?",
    answer:
      "Uso exclusivo para profissionais de saúde habilitados — médicos, dermatologistas e cirurgiões credenciados.",
  },
];

export const REGULATORY_DISCLAIMER =
  "Uso exclusivo para profissionais de saúde. Produto cosmético registrado conforme o Regulamento (CE) 1223/2009. pbserum Plus não trata, diagnostica ou cura doenças — resultados individuais podem variar.";
