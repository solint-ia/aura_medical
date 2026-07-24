const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NON_BREAKING_SPACE = /\u00a0/g;

/** Formats a price in whole reais, e.g. 1560 -> "R$ 1.560". */
export function formatBRL(value: number): string {
  // Intl separates the symbol with a non-breaking space; normalise it so the
  // markup rendered on the server matches the one hydrated on the client.
  return brl.format(value).replace(NON_BREAKING_SPACE, " ");
}
