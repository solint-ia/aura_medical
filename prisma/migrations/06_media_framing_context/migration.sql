-- Enquadramento por contexto: a mesma foto pode preencher o card do catálogo e
-- aparecer inteira na página do item. Sem ajuste próprio, o contexto herda o
-- enquadramento padrão da imagem, então nada muda para o acervo atual.
ALTER TABLE "media_assets" ADD COLUMN "framing_by_context" JSONB;
