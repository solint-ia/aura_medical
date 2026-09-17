import { createClient } from "@supabase/supabase-js";

import { CATALOG } from "../src/data/catalog";
import { clinicalCasesData } from "../src/data/cases";
import { protocolsData } from "../src/data/protocols";
import { prisma } from "../src/lib/prisma";
import { isSameCatalogImage, normalizeLocalPath, prepareCatalogImage } from "./catalog-media";

const requestedBucket = process.env.SUPABASE_CATALOG_BUCKET || "Catalogo";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const onlyArgument = process.argv.find((argument) => argument.startsWith("--only="));
const onlyPath = onlyArgument ? normalizeLocalPath(onlyArgument.slice("--only=".length)) : undefined;
/** Remove do bucket as versões anteriores que nenhum item de pedido referencia. */
const prune = process.argv.includes("--prune");

if (!url || !serviceKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
}

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class {} as never;
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const localPaths = new Set<string>();
for (const item of CATALOG) {
  localPaths.add(item.image);
  for (const offer of item.offers) if (offer.image) localPaths.add(offer.image);
}
for (const protocol of protocolsData) {
  localPaths.add(protocol.imagePath1);
  localPaths.add(protocol.imagePath2);
}
for (const clinicalCase of clinicalCasesData) {
  localPaths.add(clinicalCase.beforeImage);
  localPaths.add(clinicalCase.afterImage);
}

async function removeStaleObjects(bucket: string, objectPaths: string[]): Promise<number> {
  const removable: string[] = [];
  for (const objectPath of objectPaths) {
    const references = await prisma.orderItem.count({ where: { imagePath: { contains: objectPath } } });
    if (references === 0) removable.push(objectPath);
    else console.log(`Mantida ${objectPath}: usada em ${references} item(ns) de pedido.`);
  }
  if (removable.length === 0) return 0;
  const { error } = await supabase.storage.from(bucket).remove(removable);
  if (error) throw new Error(`Falha ao remover versões antigas: ${error.message}`);
  return removable.length;
}

async function main() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  const existing = buckets?.find(
    (entry) => entry.name.toLocaleLowerCase("pt-BR") === requestedBucket.toLocaleLowerCase("pt-BR"),
  );
  if (!existing) throw new Error(`Bucket ${requestedBucket} não encontrado.`);
  const bucket = existing.name;
  if (!existing.public) {
    const { error } = await supabase.storage.updateBucket(bucket, {
      public: true,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
      fileSizeLimit: 8 * 1024 * 1024,
    });
    if (error) throw error;
  }

  const selectedPaths = [...localPaths]
    .filter((localPath) => !onlyPath || normalizeLocalPath(localPath) === onlyPath)
    .sort();
  if (onlyPath && selectedPaths.length === 0) {
    throw new Error(`Imagem ${onlyPath} não pertence ao catálogo.`);
  }

  let uploaded = 0;
  let removed = 0;
  for (const localPath of selectedPaths) {
    const image = await prepareCatalogImage(localPath);
    const { error } = await supabase.storage.from(bucket).upload(image.objectPath, image.body, {
      contentType: image.contentType,
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) throw new Error(`${localPath}: ${error.message}`);
    uploaded += 1;

    const assets = (
      await prisma.mediaAsset.findMany({
        where: { provider: "SUPABASE", bucket, path: { startsWith: `${image.pathStem}.` } },
        select: { id: true, path: true },
      })
    ).filter((asset) => isSameCatalogImage(asset.path, image));
    if (assets.length === 0) {
      console.warn(`${localPath}: enviada, mas sem registro de mídia correspondente. Rode npm run db:seed.`);
      continue;
    }
    if (assets.length > 1) {
      throw new Error(`${localPath}: ${assets.length} registros de mídia apontam para a mesma imagem.`);
    }

    const [asset] = assets;
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        path: image.objectPath,
        width: image.width,
        height: image.height,
        mimeType: image.contentType,
        sizeBytes: image.body.byteLength,
        hasAlpha: image.hasAlpha,
      },
    });

    if (prune) {
      const stale = [...new Set([asset.path, image.legacyPath])].filter((objectPath) => objectPath !== image.objectPath);
      removed += await removeStaleObjects(bucket, stale);
    }
  }

  console.log(`${uploaded} imagens enviadas ao bucket ${bucket}${prune ? `; ${removed} versões antigas removidas` : ""}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
