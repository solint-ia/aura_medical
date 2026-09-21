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

export const DEFAULT_FRAMING: ImageFraming = { fit: "cover", x: 50, y: 50, zoom: 100 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Normaliza o que veio do banco, aceitando registros antigos sem enquadramento. */
export function toFraming(asset: { fit?: string | null; focalX?: number | null; focalY?: number | null; zoom?: number | null } | null | undefined): ImageFraming {
  if (!asset) return DEFAULT_FRAMING;
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
