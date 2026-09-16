CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'INTERNAL');
CREATE TYPE "MediaProvider" AS ENUM ('LOCAL', 'SUPABASE');
CREATE TYPE "LineMediaRole" AS ENUM ('LOGO', 'HERO', 'BANNER');
CREATE TYPE "FaqScope" AS ENUM ('GLOBAL', 'LINE');

CREATE TABLE "catalog_lines" (
  "id" UUID NOT NULL, "slug" VARCHAR(80) NOT NULL, "name" VARCHAR(120) NOT NULL,
  "descriptor" VARCHAR(160) NOT NULL, "tagline" TEXT NOT NULL,
  "surface_light" VARCHAR(9) NOT NULL, "surface_dark" VARCHAR(9) NOT NULL,
  "accent_light" VARCHAR(9) NOT NULL, "accent_dark" VARCHAR(9) NOT NULL,
  "ink_light" VARCHAR(9) NOT NULL, "ink_dark" VARCHAR(9) NOT NULL,
  "mission" TEXT, "vision" TEXT, "values" TEXT, "differentials" TEXT[], "commitments" TEXT[],
  "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT', "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "catalog_lines_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "media_assets" (
  "id" UUID NOT NULL, "provider" "MediaProvider" NOT NULL, "bucket" VARCHAR(60),
  "path" VARCHAR(500) NOT NULL, "alt" VARCHAR(300) NOT NULL, "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL, "mime_type" VARCHAR(40) NOT NULL, "size_bytes" INTEGER NOT NULL,
  "has_alpha" BOOLEAN NOT NULL DEFAULT false, "created_by_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "catalog_line_media" (
  "line_id" UUID NOT NULL, "asset_id" UUID NOT NULL, "role" "LineMediaRole" NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "catalog_line_media_pkey" PRIMARY KEY ("line_id","asset_id","role")
);
CREATE TABLE "catalog_categories" (
  "id" UUID NOT NULL, "line_id" UUID, "slug" VARCHAR(80) NOT NULL, "name" VARCHAR(80) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "catalog_categories_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "catalog_products" (
  "id" UUID NOT NULL, "line_id" UUID NOT NULL, "category_id" UUID,
  "slug" VARCHAR(120) NOT NULL, "name" VARCHAR(160) NOT NULL, "eyebrow" VARCHAR(160) NOT NULL,
  "collection" VARCHAR(80), "summary" TEXT NOT NULL, "presentation" VARCHAR(160) NOT NULL,
  "net_content" VARCHAR(40), "highlights" TEXT[], "variant_name" VARCHAR(40),
  "specs" JSONB NOT NULL DEFAULT '[]', "regulatory_name" VARCHAR(160), "regulatory_number" VARCHAR(60),
  "weight_grams" INTEGER, "length_cm" DECIMAL(6,1), "width_cm" DECIMAL(6,1), "height_cm" DECIMAL(6,1),
  "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT', "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
  "featured" BOOLEAN NOT NULL DEFAULT false, "featured_order" INTEGER, "sort_order" INTEGER NOT NULL DEFAULT 0,
  "published_at" TIMESTAMPTZ, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL, CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "catalog_product_images" (
  "product_id" UUID NOT NULL, "asset_id" UUID NOT NULL, "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "catalog_product_images_pkey" PRIMARY KEY ("product_id","asset_id")
);
CREATE TABLE "catalog_product_sections" (
  "id" UUID NOT NULL, "product_id" UUID NOT NULL, "title" VARCHAR(80) NOT NULL,
  "body" TEXT, "items" TEXT[], "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "catalog_product_sections_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "catalog_pending_fields" (
  "id" UUID NOT NULL, "product_id" UUID NOT NULL, "label" VARCHAR(120) NOT NULL,
  "is_public" BOOLEAN NOT NULL DEFAULT true, "resolved_at" TIMESTAMPTZ,
  CONSTRAINT "catalog_pending_fields_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "catalog_protocols" (
  "id" UUID NOT NULL, "line_id" UUID NOT NULL, "slug" VARCHAR(120) NOT NULL,
  "name" VARCHAR(160) NOT NULL, "introduction" TEXT NOT NULL, "note" TEXT, "indications" TEXT[],
  "sessions" VARCHAR(40) NOT NULL, "frequency" VARCHAR(60) NOT NULL,
  "reconstitution" TEXT[], "application" TEXT[], "marking" TEXT NOT NULL, "expected_results" TEXT[],
  "cover_image_id" UUID, "mapping_image_id" UUID, "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
  "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC', "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "catalog_protocols_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "catalog_skus" (
  "id" UUID NOT NULL, "code" VARCHAR(100) NOT NULL, "product_id" UUID, "protocol_id" UUID,
  "label" VARCHAR(60), "price" DECIMAL(10,2) NOT NULL, "image_id" UUID,
  "track_stock" BOOLEAN NOT NULL DEFAULT false, "stock_quantity" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true, "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "catalog_skus_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "catalog_skus_owner_check" CHECK ((product_id IS NULL) <> (protocol_id IS NULL)),
  CONSTRAINT "catalog_skus_price_check" CHECK (price >= 0),
  CONSTRAINT "catalog_skus_stock_check" CHECK (stock_quantity IS NULL OR stock_quantity >= 0)
);
CREATE TABLE "catalog_sku_aliases" (
  "alias" VARCHAR(100) NOT NULL, "sku_id" UUID NOT NULL,
  CONSTRAINT "catalog_sku_aliases_pkey" PRIMARY KEY ("alias")
);
CREATE TABLE "catalog_protocol_components" (
  "id" UUID NOT NULL, "protocol_id" UUID NOT NULL, "product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL, "role" TEXT NOT NULL, "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "catalog_protocol_components_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "catalog_clinical_cases" (
  "id" UUID NOT NULL, "line_id" UUID NOT NULL, "protocol_id" UUID, "slug" VARCHAR(120) NOT NULL,
  "title" VARCHAR(160) NOT NULL, "description" TEXT, "professional" VARCHAR(160) NOT NULL,
  "country" VARCHAR(60), "sessions" INTEGER NOT NULL, "parameters" JSONB NOT NULL DEFAULT '[]',
  "before_image_id" UUID NOT NULL, "after_image_id" UUID NOT NULL,
  "image_rights_confirmed" BOOLEAN NOT NULL DEFAULT false, "image_rights_note" TEXT,
  "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT', "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "catalog_clinical_cases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "catalog_cases_rights_check" CHECK (status <> 'PUBLISHED' OR image_rights_confirmed)
);
CREATE TABLE "content_faq_items" (
  "id" UUID NOT NULL, "scope" "FaqScope" NOT NULL DEFAULT 'GLOBAL', "line_id" UUID,
  "question" TEXT NOT NULL, "answer" TEXT NOT NULL, "links" JSONB NOT NULL DEFAULT '[]',
  "is_published" BOOLEAN NOT NULL DEFAULT false, "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "content_faq_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "content_faq_scope_check" CHECK ((scope = 'GLOBAL') = (line_id IS NULL))
);
CREATE TABLE "content_safety_notes" (
  "id" UUID NOT NULL, "line_id" UUID, "label" VARCHAR(120) NOT NULL, "body" TEXT NOT NULL,
  "is_published" BOOLEAN NOT NULL DEFAULT false, "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "content_safety_notes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "content_blocks" (
  "id" UUID NOT NULL, "key" VARCHAR(100) NOT NULL, "line_id" UUID, "eyebrow" VARCHAR(120),
  "title" TEXT, "body" TEXT, "items" JSONB NOT NULL DEFAULT '[]', "cta_label" VARCHAR(60),
  "cta_href" VARCHAR(300), "is_published" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "slug_redirects" (
  "from_path" VARCHAR(300) NOT NULL, "to_path" VARCHAR(300) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "slug_redirects_pkey" PRIMARY KEY ("from_path")
);
CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL, "actor_id" UUID NOT NULL, "entity" VARCHAR(40) NOT NULL,
  "entity_id" VARCHAR(100) NOT NULL, "action" VARCHAR(20) NOT NULL, "diff" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catalog_lines_slug_key" ON "catalog_lines"("slug");
CREATE UNIQUE INDEX "catalog_categories_slug_key" ON "catalog_categories"("slug");
CREATE UNIQUE INDEX "catalog_products_slug_key" ON "catalog_products"("slug");
CREATE INDEX "catalog_products_line_id_status_idx" ON "catalog_products"("line_id", "status");
CREATE INDEX "catalog_products_featured_featured_order_idx" ON "catalog_products"("featured", "featured_order");
CREATE UNIQUE INDEX "catalog_skus_code_key" ON "catalog_skus"("code");
CREATE UNIQUE INDEX "catalog_protocols_slug_key" ON "catalog_protocols"("slug");
CREATE UNIQUE INDEX "catalog_protocol_components_protocol_id_product_id_key" ON "catalog_protocol_components"("protocol_id", "product_id");
CREATE UNIQUE INDEX "catalog_clinical_cases_slug_key" ON "catalog_clinical_cases"("slug");
CREATE UNIQUE INDEX "content_blocks_key_key" ON "content_blocks"("key");
CREATE UNIQUE INDEX "media_assets_provider_bucket_path_key" ON "media_assets"("provider", "bucket", "path");
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

ALTER TABLE "catalog_line_media" ADD CONSTRAINT "catalog_line_media_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "catalog_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_line_media" ADD CONSTRAINT "catalog_line_media_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_categories" ADD CONSTRAINT "catalog_categories_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "catalog_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "catalog_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_product_images" ADD CONSTRAINT "catalog_product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_product_images" ADD CONSTRAINT "catalog_product_images_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_product_sections" ADD CONSTRAINT "catalog_product_sections_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_pending_fields" ADD CONSTRAINT "catalog_pending_fields_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_protocols" ADD CONSTRAINT "catalog_protocols_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "catalog_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_protocols" ADD CONSTRAINT "catalog_protocols_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_protocols" ADD CONSTRAINT "catalog_protocols_mapping_image_id_fkey" FOREIGN KEY ("mapping_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_skus" ADD CONSTRAINT "catalog_skus_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_skus" ADD CONSTRAINT "catalog_skus_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "catalog_protocols"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_skus" ADD CONSTRAINT "catalog_skus_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_sku_aliases" ADD CONSTRAINT "catalog_sku_aliases_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "catalog_skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_protocol_components" ADD CONSTRAINT "catalog_protocol_components_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "catalog_protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_protocol_components" ADD CONSTRAINT "catalog_protocol_components_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_clinical_cases" ADD CONSTRAINT "catalog_clinical_cases_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "catalog_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_clinical_cases" ADD CONSTRAINT "catalog_clinical_cases_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "catalog_protocols"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_clinical_cases" ADD CONSTRAINT "catalog_clinical_cases_before_image_id_fkey" FOREIGN KEY ("before_image_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_clinical_cases" ADD CONSTRAINT "catalog_clinical_cases_after_image_id_fkey" FOREIGN KEY ("after_image_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "content_faq_items" ADD CONSTRAINT "content_faq_items_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "catalog_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_safety_notes" ADD CONSTRAINT "content_safety_notes_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "catalog_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "catalog_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "catalog_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_line_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_product_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_product_sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_pending_fields" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_protocols" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_skus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_sku_aliases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_protocol_components" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_clinical_cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_faq_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_safety_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "slug_redirects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
