-- Variações com cor: o círculo que representa cada variação na página do
-- produto pode ser uma cor sólida ou uma foto (tom de pele, acabamento).
ALTER TABLE "catalog_skus"
  ADD COLUMN "swatch_color" VARCHAR(9),
  ADD COLUMN "swatch_image_id" UUID;

ALTER TABLE "catalog_skus"
  ADD CONSTRAINT "catalog_skus_swatch_image_id_fkey" FOREIGN KEY ("swatch_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
