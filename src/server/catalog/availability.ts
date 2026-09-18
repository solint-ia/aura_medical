/**
 * Disponibilidade do catálogo.
 *
 * Produto: as unidades vêm dos próprios SKUs ativos.
 * Protocolo: o kit só existe enquanto houver ampolas de todos os produtos da
 * composição, então a disponibilidade é o menor número de kits que dá para
 * montar — limitada também pelo estoque do próprio SKU do protocolo, quando ele
 * é controlado.
 */

export const UNLIMITED = Number.POSITIVE_INFINITY;

export interface StockSku {
  isActive: boolean;
  trackStock: boolean;
  stockQuantity: number | null;
}

export interface StockComponent {
  quantity: number;
  product: { skus: StockSku[] };
}

/**
 * Unidades de um produto. Sem SKU ativo não há informação de estoque, então o
 * produto não limita nada — zerar aqui faria um kit inteiro sumir do site só
 * porque um componente ainda não tem preço cadastrado. Um SKU ativo sem
 * controle de estoque também torna o produto ilimitado; fora isso, somamos o
 * que há nos SKUs ativos.
 */
export function productUnits(skus: StockSku[]): number {
  const active = skus.filter((sku) => sku.isActive);
  if (active.length === 0) return UNLIMITED;
  if (active.some((sku) => !sku.trackStock)) return UNLIMITED;
  return active.reduce((total, sku) => total + (sku.stockQuantity ?? 0), 0);
}

/** Quantos kits a composição permite montar. Sem composição, não há limite. */
export function kitsFromComponents(components: StockComponent[]): number {
  if (components.length === 0) return UNLIMITED;
  return components.reduce((fewest, component) => {
    const units = productUnits(component.product.skus);
    const kits = component.quantity > 0 ? Math.floor(units / component.quantity) : units;
    return Math.min(fewest, kits);
  }, UNLIMITED);
}

/** Estoque efetivo de uma oferta, cruzando o SKU com um teto externo. */
export function effectiveStock(
  sku: { trackStock: boolean; stockQuantity: number | null },
  ceiling: number = UNLIMITED,
): { trackStock: boolean; stock?: number } {
  const own = sku.trackStock ? (sku.stockQuantity ?? 0) : UNLIMITED;
  const limit = Math.min(own, ceiling);
  return limit === UNLIMITED ? { trackStock: false } : { trackStock: true, stock: Math.max(0, limit) };
}

/** Um item está esgotado quando tem oferta, mas nenhuma delas com unidade livre. */
export function isSoldOut(offers: { trackStock?: boolean; stock?: number }[]): boolean {
  if (offers.length === 0) return false;
  return offers.every((offer) => offer.trackStock === true && (offer.stock ?? 0) <= 0);
}
