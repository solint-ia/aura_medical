/**
 * Trilha de navegação: o caminho que a pessoa realmente percorreu até a página
 * aberta, e não uma hierarquia fixa do site. Entrar pela home, ir ao catálogo e
 * abrir um produto produz "Início / Catálogo / Produto"; voltar para uma página
 * anterior corta o que veio depois dela.
 *
 * Fica em `sessionStorage` para sobreviver a um recarregamento e desaparecer
 * quando a aba fecha. A trilha é publicada como store para os componentes
 * lerem com `useSyncExternalStore`, sem estado espelhado.
 */
export interface TrailEntry {
  href: string;
  label: string;
}

const KEY = "aura_trail";
/** Trilha longa demais vira ruído; o meio some e as pontas continuam úteis. */
export const TRAIL_LIMIT = 5;

export const HOME_ENTRY: TrailEntry = { href: "/", label: "Início" };

/** Referência fixa: o servidor e a hidratação sempre veem a mesma trilha vazia. */
const EMPTY: TrailEntry[] = [];

const listeners = new Set<() => void>();
let snapshot: TrailEntry[] | null = null;

function readTrail(): TrailEntry[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) || "[]");
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (entry): entry is TrailEntry =>
        Boolean(entry) && typeof entry === "object" && typeof (entry as TrailEntry).href === "string" && typeof (entry as TrailEntry).label === "string",
    );
  } catch {
    return EMPTY;
  }
}

export function subscribeTrail(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function trailSnapshot(): TrailEntry[] {
  if (!snapshot) snapshot = readTrail();
  return snapshot;
}

export function serverTrailSnapshot(): TrailEntry[] {
  return EMPTY;
}

/**
 * Registra a página atual. Se ela já estiver na trilha — por ter voltado ou por
 * clicar num item anterior do caminho — o que veio depois é descartado.
 */
export function pushTrail(entry: TrailEntry) {
  const current = trailSnapshot();
  const path = entry.href.split("?")[0];
  const known = current.findIndex((item) => item.href.split("?")[0] === path);
  const last = current[current.length - 1];
  if (known === current.length - 1 && last?.href === entry.href && last.label === entry.label) return;

  const trail = [...(known >= 0 ? current.slice(0, known) : current), entry];
  snapshot = trail[0]?.href === HOME_ENTRY.href || path === HOME_ENTRY.href ? trail : [HOME_ENTRY, ...trail];
  try {
    sessionStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Navegação anônima ou armazenamento bloqueado: a trilha só deixa de persistir.
  }
  listeners.forEach((listener) => listener());
}

/** Deixa a trilha exibível: mantém a origem, o fim e resume o meio. */
export function collapseTrail<T>(trail: T[]): (T | "ellipsis")[] {
  if (trail.length <= TRAIL_LIMIT) return trail;
  return [trail[0], "ellipsis", ...trail.slice(trail.length - (TRAIL_LIMIT - 2))];
}
