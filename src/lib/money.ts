export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Preço digitado pelo admin: "285,90", "285.9" e "1.234,56" viram número; texto inválido vira null. */
export function parsePrice(text: string): number | null {
  const raw = text.replace(/[R$\s]/g, "");
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? roundMoney(value) : null;
}
