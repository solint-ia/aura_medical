import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.join(process.cwd(), "public", "images", "products", "la-cutanee");
const outputDir = path.join(process.cwd(), "public", "images", "products", "la-cutanee", "optimized");
const files = [
  "dermal-peptys-pads-70.png",
  "dermal-peptys-pdrn-plus-serum-30ml.png",
  "exosso-dermal-serum-booster-15ml.png",
  "ghk-cu-serum-booster-30ml.png",
  "hyalu-b3-full-face-30ml.png",
  "revytra-c20-nano-serum-30ml.png",
  "solary-aox-fps-60-com-cor-40g.png",
  "solary-aox-fps-60-sem-cor-40g.png",
];

await mkdir(outputDir, { recursive: true });
for (const file of files) {
  await sharp(path.join(sourceDir, file))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ height: 1600, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(path.join(outputDir, file.replace(/\.png$/i, ".webp")));
}

console.log(`${files.length} imagens recortadas e convertidas para WebP.`);
