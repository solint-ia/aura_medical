import { MAX_DISTINCT_ITEMS, MAX_QUANTITY_PER_ITEM } from "@/lib/checkoutLimits";
import { roundMoney } from "@/lib/money";

export interface CheckoutItemInput { id?: unknown; quantity?: unknown }
export interface VerifiedCheckoutItem { id: string; skuCode: string; name: string; quantity: number; unitPrice: number; imagePath?: string; trackStock: boolean }
export type VerifiedCheckout = { ok: true; items: VerifiedCheckoutItem[]; subtotal: number } | { ok: false; error: string; status?: number };

export interface ResolvedCheckoutSku {
  requestedCode: string;
  skuCode: string;
  name: string;
  unitPrice: number;
  imagePath?: string;
  isActive: boolean;
  status?: string;
  visibility?: string;
  lineStatus?: string;
  trackStock: boolean;
  stockQuantity?: number | null;
}

export type CheckoutSkuResolver = (codes: string[]) => Promise<(ResolvedCheckoutSku | null)[]>;

async function defaultResolver(codes: string[]) {
  const { resolveSkus } = await import("@/server/catalog/repository");
  return resolveSkus(codes);
}

export async function verifyCheckoutItems(
  rawItems: unknown,
  options: { allowInternal?: boolean; resolver?: CheckoutSkuResolver } = {},
): Promise<VerifiedCheckout> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { ok: false, error: "Nenhum item válido foi informado." };
  if (rawItems.length > MAX_DISTINCT_ITEMS) return { ok: false, error: "Quantidade de itens acima do limite permitido." };

  const parsed = (rawItems as CheckoutItemInput[]).map((raw) => ({
    id: typeof raw.id === "string" ? raw.id.trim() : "",
    quantity: Number(raw.quantity),
  }));
  for (const item of parsed) {
    if (!item.id) return { ok: false, error: "Produto inválido ou indisponível: sem código." };
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY_PER_ITEM) return { ok: false, error: `Quantidade inválida para o produto ${item.id}.` };
  }

  let resolved;
  try {
    resolved = await (options.resolver || defaultResolver)(parsed.map((item) => item.id));
  } catch (error) {
    console.error("Falha ao resolver catálogo do checkout:", error);
    return { ok: false, error: "Catálogo temporariamente indisponível.", status: 503 };
  }

  const items: VerifiedCheckoutItem[] = [];
  for (const [index, input] of parsed.entries()) {
    const sku = resolved[index];
    if (!sku || !sku.isActive || sku.status !== "PUBLISHED" || sku.lineStatus !== "PUBLISHED") return { ok: false, error: `Produto inválido ou indisponível: ${input.id}.` };
    if (sku.visibility === "INTERNAL" && !options.allowInternal) return { ok: false, error: `Produto inválido ou indisponível: ${input.id}.` };
    if (sku.trackStock && input.quantity > (sku.stockQuantity || 0)) return { ok: false, error: `Estoque insuficiente para ${sku.name}.` };
    items.push({ id: input.id, skuCode: sku.skuCode, name: sku.name, quantity: input.quantity, unitPrice: sku.unitPrice, imagePath: sku.imagePath, trackStock: sku.trackStock });
  }

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  return { ok: true, items, subtotal };
}

export function calculateCheckoutTotal(subtotal: number, paymentMethod: "card" | "pix", shippingCost = 0): number {
  const totalBeforeDiscount = subtotal + shippingCost;
  // Desconto de 5% no PIX desativado a pedido (mantido comentado para reaproveitamento futuro):
  // const pixDiscount = paymentMethod === "pix" ? totalBeforeDiscount * 0.05 : 0;
  // return roundMoney(totalBeforeDiscount - pixDiscount);
  return roundMoney(totalBeforeDiscount);
}
