const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NON_BREAKING_SPACE = /\u00a0/g;

/** Formats a price in BRL currency with cents, e.g. 1597 -> "R$ 1.597,00". */
export function formatBRL(value: number): string {
  return brl.format(value).replace(NON_BREAKING_SPACE, " ");
}
