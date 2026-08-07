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

/**
 * Normaliza uma data vinda do banco para `YYYY-MM-DD`, o formato que as rotas
 * devolvem ao cliente (e que `<input type="date">` espera).
 *
 * O Prisma e o driver `pg` entregam colunas de data como objetos `Date`, e
 * `String(date)` produz o formato longo em inglês
 * ("Fri Apr 23 2004 00:00:00 GMT-0300 (...)") — cortá-lo por "T" quebra dentro
 * de "GMT" e sobra "...00:00:00 GM". Por isso a conversão passa sempre por
 * `toISOString()` quando o valor é um `Date`.
 */
export function toISODateString(value: Date | string | null | undefined): string {
  if (!value) return "";

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().split("T")[0];
  }

  const text = String(value).trim();
  if (text === "") return "";

  // Já é ISO ("2004-04-23" ou "2004-04-23T00:00:00.000Z").
  const isoMatch = text.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];

  // Valor legado gravado no formato longo em inglês, possivelmente já truncado
  // no "T" de "GMT" ("Fri Apr 23 2004 00:00:00 GM" — inválido para `new Date`).
  // O trecho "Www Mmm DD YYYY" basta e representa a data local de quem gravou.
  const legacy = text.match(/^[A-Za-z]{3} [A-Za-z]{3} \d{1,2} \d{4}/);
  if (legacy) {
    const parsedLegacy = new Date(legacy[0]);
    if (Number.isNaN(parsedLegacy.getTime())) return "";
    const month = String(parsedLegacy.getMonth() + 1).padStart(2, "0");
    const day = String(parsedLegacy.getDate()).padStart(2, "0");
    return `${parsedLegacy.getFullYear()}-${month}-${day}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
}
