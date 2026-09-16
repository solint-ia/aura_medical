import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Fotos La Cutanée chegam em telas largas e transparentes: recortamos as margens e convertemos para WebP. */
const OPTIMIZED_PREFIX = "images/products/la-cutanee/";

export interface PreparedCatalogImage {
  body: Buffer;
  contentType: string;
  width: number;
  height: number;
  hasAlpha: boolean;
  /** Caminho com hash do conteúdo: cada versão ganha URL própria, então nenhum cache serve a anterior. */
  objectPath: string;
  /** Caminho sem versão usado pela primeira migração. */
  legacyPath: string;
  pathStem: string;
  extension: string;
}

export function normalizeLocalPath(localPath: string): string {
  return localPath.replace(/^\/+/, "").replaceAll("\\", "/");
}

export async function prepareCatalogImage(localPath: string): Promise<PreparedCatalogImage> {
  const normalized = normalizeLocalPath(localPath);
  const input = await readFile(path.join(process.cwd(), "public", normalized));
  const optimize = normalized.startsWith(OPTIMIZED_PREFIX);
  const body: Buffer = optimize
    ? await sharp(input)
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize({ height: 1600, withoutEnlargement: true })
        .webp({ quality: 88, alphaQuality: 100 })
        .toBuffer()
    : input;
  const metadata = await sharp(body).metadata();
  const pathStem = normalized.replace(/\.[^./]+$/, "");
  const extension = optimize ? "webp" : path.extname(normalized).slice(1);
  const version = createHash("sha256").update(body).digest("hex").slice(0, 10);

  return {
    body,
    contentType: `image/${optimize ? "webp" : metadata.format || "png"}`,
    width: metadata.width || 1,
    height: metadata.height || 1,
    hasAlpha: Boolean(metadata.hasAlpha),
    objectPath: `${pathStem}.${version}.${extension}`,
    legacyPath: `${pathStem}.${extension}`,
    pathStem,
    extension,
  };
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Reconhece o caminho sem versão ou qualquer versão anterior da mesma imagem. */
export function isSameCatalogImage(
  storedPath: string,
  image: Pick<PreparedCatalogImage, "legacyPath" | "pathStem" | "extension">,
): boolean {
  if (storedPath === image.legacyPath) return true;
  return new RegExp(`^${escapeRegExp(image.pathStem)}\\.[0-9a-f]{10}\\.${escapeRegExp(image.extension)}$`).test(storedPath);
}
