export interface SafetyNote {
  label: string;
  body: string;
  line?: string;
}

export interface FaqLink { href: string; label: string }
export interface FaqItem { question: string; answer: string; links?: FaqLink[] }

export const SAFETY_NOTES: SafetyNote[] = [
  { label: "Efeitos transitórios esperados", body: "Eritema leve ou sensibilidade local transitória (<72h). Hidratação e cuidados básicos pós-uso ajudam na rápida recuperação.", line: "Pbserum" },
  { label: "Precauções gerais", body: "Gravidez, amamentação ou alergia conhecida aos componentes da fórmula. Em caso de dúvidas, consulte nosso suporte especializado.", line: "Pbserum" },
  { label: "Cuidados pós-uso", body: "Hidratação adequada da pele, uso diário de protetor solar FPS 50 e higiene cuidadosa da área tratada.", line: "Pbserum" },
];

export const FAQ_ITEMS: FaqItem[] = [
  { question: "Como funciona o processo de compra?", answer: "A compra é direta. Escolha um produto ou protocolo no catálogo, abra os detalhes e use Comprar agora para seguir ao checkout ou Adicionar ao carrinho para continuar explorando." },
  { question: "Existe pedido mínimo?", answer: "Não há valor mínimo. O catálogo reúne ampolas individuais, protocolos completos e dermocosméticos." },
  { question: "Quais os prazos de entrega?", answer: "Os prazos variam conforme o CEP informado no checkout, com rastreamento até a entrega." },
  { question: "Os produtos possuem registro e comprovação?", answer: "Os números de processo dos bioregenerativos Pbserum estão publicados nas páginas de cada produto. Para itens La Cutanée, a regularização permanece sinalizada como informação em confirmação quando ainda não foi fornecida.", links: [{ href: "/linhas/pbserum", label: "Ver linha Pbserum" }] },
  { question: "Como utilizar os produtos?", answer: "Os protocolos Pbserum exibem as informações clínicas disponíveis, incluindo reconstituição e marcação. Nos produtos La Cutanée, dados ainda não confirmados pelo fornecedor aparecem claramente como pendentes." },
];
