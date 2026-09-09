import { enzymesData, PRICE_PER_VIAL } from "@/data/enzymes";
import { PROTOCOLS } from "@/data/protocols";

export interface CheckoutItemInput {
  id?: unknown;
  quantity?: unknown;
}

export interface VerifiedCheckoutItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imagePath?: string;
}

export type VerifiedCheckout =
  | { ok: true; items: VerifiedCheckoutItem[]; subtotal: number }
  | { ok: false; error: string };

const MAX_DISTINCT_ITEMS = 25;
const MAX_QUANTITY_PER_ITEM = 20;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveCatalogItem(id: string, allowTestProducts: boolean) {
  const protocol = PROTOCOLS.find((item) => item.id === id);
  if (protocol) {
    if (protocol.hidden && !allowTestProducts) return null;
    return {
      id: protocol.id,
      name: protocol.name,
      unitPrice: protocol.totalPrice,
      imagePath: protocol.image,
    };
  }

  if (id.startsWith("enz-")) {
    const slug = id.slice(4);
    const enzyme = enzymesData.find(
      (item) => item.slug === slug || item.slug === `${slug}-plus`
    );
    if (enzyme) {
      return {
        id,
        name: `Ampola Individual ${enzyme.name} (${enzyme.activeIngredient})`,
        unitPrice: PRICE_PER_VIAL,
        imagePath: `/frascos/${enzyme.slug.replace(/-plus$/, "")}.png`,
      };
    }
  }

  return null;
}

/**
 * Resolve nomes e preços exclusivamente pelo catálogo do servidor. Dados de
 * preço enviados pelo navegador nunca são usados para criar cobranças/pedidos.
 */
export function verifyCheckoutItems(
  rawItems: unknown,
  allowTestProducts = false
): VerifiedCheckout {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, error: "Nenhum item válido foi informado." };
  }

  if (rawItems.length > MAX_DISTINCT_ITEMS) {
    return { ok: false, error: "Quantidade de itens acima do limite permitido." };
  }

  const items: VerifiedCheckoutItem[] = [];

  for (const raw of rawItems as CheckoutItemInput[]) {
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    const quantity = Number(raw.quantity);
    const catalogItem = resolveCatalogItem(id, allowTestProducts);

    if (!catalogItem) {
      return { ok: false, error: `Produto inválido ou indisponível: ${id || "sem código"}.` };
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
      return { ok: false, error: `Quantidade inválida para o produto ${id}.` };
    }

    items.push({ ...catalogItem, quantity });
  }

  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  return { ok: true, items, subtotal };
}

export function calculateCheckoutTotal(
  subtotal: number,
  paymentMethod: "card" | "pix",
  shippingCost = 0
): number {
  const totalBeforeDiscount = subtotal + shippingCost;
  const total = paymentMethod === "pix" ? totalBeforeDiscount * 0.95 : totalBeforeDiscount;
  return roundMoney(total);
}
