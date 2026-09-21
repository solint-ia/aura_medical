/**
 * Enquadramento de uma imagem: como ela ocupa o espaço reservado na tela.
 *
 * `cover` preenche o espaço e corta o excedente — é o padrão, e foi o que
 * deixou algumas fotos ampliadas demais. `contain` mostra a foto inteira,
 * deixando folga nas laterais. O ponto focal decide qual parte sobrevive ao
 * corte e o zoom aproxima a partir dele.
 */
export interface ImageFraming {
  fit: "cover" | "contain";
  /** Ponto focal em porcentagem da largura e da altura. */
  x: number;
  y: number;
  /** Aproximação em porcentagem; 100 mantém a imagem no tamanho natural. */
  zoom: number;
}

/**
 * Onde a foto está sendo exibida. A mesma imagem costuma pedir tratamentos
 * diferentes: o card da vitrine ganha ao preencher o espaço, enquanto a página
 * do item ganha ao mostrar a foto inteira. Sem ajuste próprio, o contexto
 * herda o padrão da imagem.
 */
export type FramingContext = "card" | "page";

export const FRAMING_CONTEXTS: { value: FramingContext; label: string; hint: string }[] = [
  { value: "card", label: "Card do catálogo", hint: "Miniaturas da vitrine, dos destaques e das listas." },
  { value: "page", label: "Página do item", hint: "Galeria grande da página de produto, protocolo e casos." },
];

export type FramingByContext = Partial<Record<FramingContext, ImageFraming>>;

export const DEFAULT_FRAMING: ImageFraming = { fit: "cover", x: 50, y: 50, zoom: 100 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type FramingRow = {
  fit?: string | null;
  focalX?: number | null;
  focalY?: number | null;
  zoom?: number | null;
  framingByContext?: unknown;
};

function normalize(value: unknown): ImageFraming | undefined {
  if (!value || typeof value !== "object") return undefined;
  const entry = value as Record<string, unknown>;
  const fit = entry.fit === "contain" || entry.fit === "CONTAIN" ? "contain" : "cover";
  const zoom = Number(entry.zoom);
  const x = Number(entry.x);
  const y = Number(entry.y);
  return {
    fit,
    x: clamp(Number.isFinite(x) ? x : 50, 0, 100),
    y: clamp(Number.isFinite(y) ? y : 50, 0, 100),
    zoom: clamp(Number.isFinite(zoom) ? zoom : 100, 100, 300),
  };
}

/** Ajustes por contexto guardados na imagem, ignorando o que estiver corrompido. */
export function contextFramings(asset: FramingRow | null | undefined): FramingByContext {
  if (!asset?.framingByContext || typeof asset.framingByContext !== "object") return {};
  const stored = asset.framingByContext as Record<string, unknown>;
  const result: FramingByContext = {};
  for (const { value } of FRAMING_CONTEXTS) {
    const framing = normalize(stored[value]);
    if (framing) result[value] = framing;
  }
  return result;
}

/**
 * Enquadramento a aplicar. Sem contexto, ou sem ajuste próprio para ele, vale o
 * padrão da imagem — assim uma foto ajustada uma vez continua certa em todo
 * lugar, e só os lugares que pedem tratamento diferente recebem o seu.
 */
export function toFraming(asset: FramingRow | null | undefined, context?: FramingContext): ImageFraming {
  if (!asset) return DEFAULT_FRAMING;
  if (context) {
    const specific = contextFramings(asset)[context];
    if (specific) return specific;
  }
  return {
    fit: asset.fit === "CONTAIN" ? "contain" : "cover",
    x: clamp(asset.focalX ?? 50, 0, 100),
    y: clamp(asset.focalY ?? 50, 0, 100),
    zoom: clamp(asset.zoom ?? 100, 100, 300),
  };
}

/** Só vale a pena carregar o enquadramento quando ele muda algo. */
export function isDefaultFraming(framing: ImageFraming) {
  return framing.fit === "cover" && framing.x === 50 && framing.y === 50 && framing.zoom === 100;
}

/**
 * Estilo aplicado sobre uma imagem que já preenche o contêiner (`fill`).
 * O zoom cresce a partir do ponto focal, então aproximar não desloca o assunto.
 */
export function framingStyle(framing: ImageFraming | undefined): React.CSSProperties | undefined {
  if (!framing || isDefaultFraming(framing)) return undefined;
  const scale = framing.zoom / 100;
  return {
    objectFit: framing.fit,
    objectPosition: `${framing.x}% ${framing.y}%`,
    ...(scale > 1 ? { transform: `scale(${scale})`, transformOrigin: `${framing.x}% ${framing.y}%` } : {}),
  };
}
