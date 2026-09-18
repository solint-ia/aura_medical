import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export class InsufficientStockError extends Error {
  constructor(label: string) {
    super(`Estoque insuficiente para ${label}.`);
    this.name = "InsufficientStockError";
  }
}

async function findSku(tx: Tx, identifier: string) {
  return tx.sku.findFirst({
    where: { OR: [{ code: identifier }, { aliases: { some: { alias: identifier } } }] },
    include: { protocol: { select: { name: true, components: { select: { productId: true, quantity: true } } } } },
  });
}

/**
 * Move unidades de um produto entre os SKUs ativos, na ordem de exibição.
 * Um SKU ativo sem controle de estoque torna o produto ilimitado.
 */
async function moveProductUnits(tx: Tx, productId: string, units: number, direction: -1 | 1) {
  if (units <= 0) return;
  const skus = await tx.sku.findMany({ where: { productId, isActive: true }, orderBy: { sortOrder: "asc" } });
  if (skus.length === 0 || skus.some((sku) => !sku.trackStock)) return;

  if (direction === 1) {
    // Devolução vai toda para o primeiro SKU: não dá para saber de onde saiu.
    await tx.sku.update({ where: { id: skus[0].id }, data: { stockQuantity: { increment: units } } });
    return;
  }

  let remaining = units;
  for (const sku of skus) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, sku.stockQuantity ?? 0);
    if (take <= 0) continue;
    const changed = await tx.sku.updateMany({
      where: { id: sku.id, stockQuantity: { gte: take } },
      data: { stockQuantity: { decrement: take } },
    });
    if (changed.count !== 1) throw new InsufficientStockError(sku.code);
    remaining -= take;
  }
  if (remaining > 0) throw new InsufficientStockError(skus[0].code);
}

async function moveSkuUnits(tx: Tx, identifier: string, quantity: number, direction: -1 | 1) {
  const sku = await findSku(tx, identifier);
  // Devolução de item cujo SKU sumiu do catálogo não deve travar o cancelamento.
  if (!sku) {
    if (direction === 1) return;
    throw new InsufficientStockError(identifier);
  }

  // Protocolo consome as ampolas de cada produto da composição.
  for (const component of sku.protocol?.components ?? []) {
    await moveProductUnits(tx, component.productId, component.quantity * quantity, direction);
  }

  if (!sku.trackStock) return;
  if (direction === 1) {
    await tx.sku.update({ where: { id: sku.id }, data: { stockQuantity: { increment: quantity } } });
    return;
  }
  const changed = await tx.sku.updateMany({
    where: { id: sku.id, trackStock: true, stockQuantity: { gte: quantity } },
    data: { stockQuantity: { decrement: quantity } },
  });
  if (changed.count !== 1) throw new InsufficientStockError(sku.protocol?.name ?? sku.code);
}

/** Baixa o estoque de um item vendido, expandindo a composição do protocolo. */
export function consumeStock(tx: Tx, identifier: string, quantity: number) {
  return moveSkuUnits(tx, identifier, quantity, -1);
}

/** Devolve ao estoque o que um pedido cancelado havia reservado. */
export function restoreStock(tx: Tx, identifier: string, quantity: number) {
  return moveSkuUnits(tx, identifier, quantity, 1);
}
