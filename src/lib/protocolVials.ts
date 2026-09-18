/**
 * Protocolos aplicados em mais de uma região. Celulite trata as duas pernas,
 * então o kit é descrito por região e no total.
 */
const REGIONS_BY_SLUG: Record<string, number> = {
  celulite: 2,
};

const ampoules = (count: number) => `${count} ampola${count === 1 ? "" : "s"}`;

/** Texto do tamanho do kit: "4 ampolas no total" ou, por exceção, por região. */
export function protocolVialsLabel(slug: string, total: number): string {
  const regions = REGIONS_BY_SLUG[slug];
  if (regions && regions > 1 && total % regions === 0) {
    return `${ampoules(total / regions)} por região (${ampoules(total)} no total)`;
  }
  return `${ampoules(total)} no total`;
}
