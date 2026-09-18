-- Classificação das imagens do acervo: tipo de uso e marca, para filtrar a galeria.
CREATE TYPE "MediaCategory" AS ENUM ('PRODUCT', 'PROTOCOL', 'CLINICAL_CASE', 'BRAND', 'OTHER');

ALTER TABLE "media_assets"
  ADD COLUMN "category" "MediaCategory",
  ADD COLUMN "line_id" UUID;

ALTER TABLE "media_assets"
  ADD CONSTRAINT "media_assets_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "catalog_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "media_assets_category_line_id_idx" ON "media_assets"("category", "line_id");

-- Classifica o acervo existente pelo uso atual. A ordem define a prioridade
-- quando a mesma imagem aparece em mais de um lugar.
UPDATE "media_assets" AS asset SET "category" = 'CLINICAL_CASE', "line_id" = clinical."line_id"
FROM "catalog_clinical_cases" AS clinical
WHERE asset."category" IS NULL AND asset."id" IN (clinical."before_image_id", clinical."after_image_id");

UPDATE "media_assets" AS asset SET "category" = 'PROTOCOL', "line_id" = protocol."line_id"
FROM "catalog_protocols" AS protocol
WHERE asset."category" IS NULL AND asset."id" IN (protocol."cover_image_id", protocol."mapping_image_id");

UPDATE "media_assets" AS asset SET "category" = 'PROTOCOL', "line_id" = protocol."line_id"
FROM "catalog_protocol_images" AS image
JOIN "catalog_protocols" AS protocol ON protocol."id" = image."protocol_id"
WHERE asset."category" IS NULL AND asset."id" = image."asset_id";

UPDATE "media_assets" AS asset SET "category" = 'PRODUCT', "line_id" = product."line_id"
FROM "catalog_product_images" AS image
JOIN "catalog_products" AS product ON product."id" = image."product_id"
WHERE asset."category" IS NULL AND asset."id" = image."asset_id";

UPDATE "media_assets" AS asset SET "category" = 'BRAND', "line_id" = media."line_id"
FROM "catalog_line_media" AS media
WHERE asset."category" IS NULL AND asset."id" = media."asset_id";
