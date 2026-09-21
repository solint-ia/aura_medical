-- Enquadramento da imagem: como ela preenche o espaço reservado na tela.
-- O padrão reproduz o comportamento atual (preencher, centralizada, sem zoom),
-- então nenhuma imagem já publicada muda de aparência.
CREATE TYPE "MediaFit" AS ENUM ('COVER', 'CONTAIN');

ALTER TABLE "media_assets"
  ADD COLUMN "fit" "MediaFit" NOT NULL DEFAULT 'COVER',
  ADD COLUMN "focal_x" INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN "focal_y" INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN "zoom" INTEGER NOT NULL DEFAULT 100;
