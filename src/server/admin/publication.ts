type ProductCandidate = { name: string; summary: string; presentation: string; highlights: string[]; images: unknown[]; skus: { isActive: boolean }[]; line: { status: string } };
type ProtocolCandidate = { introduction: string; sessions: string; frequency: string; coverImageId: string | null; components: unknown[]; skus: { isActive: boolean }[]; line: { status: string } };
type CaseCandidate = { imageRightsConfirmed: boolean; products: unknown[]; protocols: unknown[] };

const hasEmoji = (value: string) => /\p{Extended_Pictographic}/u.test(value);

export function productPublicationError(product: ProductCandidate): string | null {
  if (product.line.status !== "PUBLISHED") return "Publique a marca antes de publicar o produto.";
  if (!product.name.trim() || !product.summary.trim() || !product.presentation.trim()) return "Preencha nome, resumo e apresentação antes de publicar.";
  if (!product.images.length) return "Adicione ao menos uma foto.";
  if (!product.skus.some((sku) => sku.isActive)) return "Adicione ao menos um preço/SKU ativo.";
  if (product.highlights.length > 2 || product.highlights.some(hasEmoji)) return "Use no máximo 2 destaques, sem emoji.";
  return null;
}

export function protocolPublicationError(protocol: ProtocolCandidate): string | null {
  if (protocol.line.status !== "PUBLISHED") return "Publique a marca antes de publicar o protocolo.";
  if (!protocol.components.length) return "Adicione ao menos um produto à composição.";
  if (!protocol.introduction.trim()) return "Escreva a introdução do protocolo.";
  if (!protocol.sessions.trim() || !protocol.frequency.trim()) return "Preencha sessões e frequência.";
  if (!protocol.coverImageId) return "Adicione uma foto de capa.";
  if (!protocol.skus.some((sku) => sku.isActive)) return "Adicione ao menos um preço/SKU ativo.";
  return null;
}

export function casePublicationError(clinicalCase: CaseCandidate): string | null {
  if (!clinicalCase.imageRightsConfirmed) return "Confirme o direito de uso das imagens antes de publicar.";
  if (!clinicalCase.products.length && !clinicalCase.protocols.length) return "Vincule pelo menos um produto ou protocolo antes de publicar.";
  return null;
}
