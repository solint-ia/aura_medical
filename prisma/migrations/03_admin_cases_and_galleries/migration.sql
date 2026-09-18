ALTER TABLE "catalog_product_images"
  ADD COLUMN "caption" VARCHAR(240);

ALTER TABLE "catalog_categories"
  ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "media_assets" ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "content_faq_items" ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "content_safety_notes" ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "content_blocks" ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "catalog_protocol_images" (
  "protocol_id" UUID NOT NULL,
  "asset_id" UUID NOT NULL,
  "caption" VARCHAR(240),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "catalog_protocol_images_pkey" PRIMARY KEY ("protocol_id", "asset_id")
);

CREATE TABLE "catalog_clinical_case_products" (
  "case_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "catalog_clinical_case_products_pkey" PRIMARY KEY ("case_id", "product_id")
);

CREATE TABLE "catalog_clinical_case_protocols" (
  "case_id" UUID NOT NULL,
  "protocol_id" UUID NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "catalog_clinical_case_protocols_pkey" PRIMARY KEY ("case_id", "protocol_id")
);

INSERT INTO "catalog_clinical_case_protocols" ("case_id", "protocol_id", "sort_order")
SELECT "id", "protocol_id", 0
FROM "catalog_clinical_cases"
WHERE "protocol_id" IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE INDEX "catalog_clinical_case_products_product_id_sort_order_idx"
  ON "catalog_clinical_case_products"("product_id", "sort_order");
CREATE INDEX "catalog_clinical_case_protocols_protocol_id_sort_order_idx"
  ON "catalog_clinical_case_protocols"("protocol_id", "sort_order");

ALTER TABLE "catalog_protocol_images"
  ADD CONSTRAINT "catalog_protocol_images_protocol_id_fkey"
  FOREIGN KEY ("protocol_id") REFERENCES "catalog_protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_protocol_images"
  ADD CONSTRAINT "catalog_protocol_images_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_clinical_case_products"
  ADD CONSTRAINT "catalog_clinical_case_products_case_id_fkey"
  FOREIGN KEY ("case_id") REFERENCES "catalog_clinical_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_clinical_case_products"
  ADD CONSTRAINT "catalog_clinical_case_products_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_clinical_case_protocols"
  ADD CONSTRAINT "catalog_clinical_case_protocols_case_id_fkey"
  FOREIGN KEY ("case_id") REFERENCES "catalog_clinical_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_clinical_case_protocols"
  ADD CONSTRAINT "catalog_clinical_case_protocols_protocol_id_fkey"
  FOREIGN KEY ("protocol_id") REFERENCES "catalog_protocols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "catalog_clinical_cases"
  DROP CONSTRAINT IF EXISTS "catalog_clinical_cases_protocol_id_fkey";
ALTER TABLE "catalog_clinical_cases"
  DROP COLUMN "protocol_id";

ALTER TABLE "catalog_protocol_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_clinical_case_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_clinical_case_protocols" ENABLE ROW LEVEL SECURITY;
