import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { Prisma } from "@prisma/client";
import { mediaCategorySchema, mediaConfirmSchema, mediaPatchSchema } from "@/lib/validation/catalog";
import { audit, requireUnchanged, validationError } from "@/server/admin/mutation";

const USAGE_COUNT = { _count: { select: { productImages: true, protocolImages: true, lineMedia: true, skus: true, skuSwatches: true, protocolCovers: true, protocolMappings: true, casesBefore: true, casesAfter: true } } } as const;

/**
 * Sem `page` devolve o acervo inteiro (usado para montar prévias por id).
 * Com `page`, pagina e filtra por busca, tipo e marca para a galeria.
 */
export async function GET(req: Request) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
  const params = new URL(req.url).searchParams;
  const category = mediaCategorySchema.safeParse(params.get("category"));
  const lineId = params.get("lineId");
  const query = params.get("q")?.trim();
  const where: Prisma.MediaAssetWhereInput = {
    ...(category.success ? { category: category.data } : params.get("category") === "NONE" ? { category: null } : {}),
    ...(lineId ? { lineId } : {}),
    ...(query ? { OR: [{ alt: { contains: query, mode: "insensitive" } }, { path: { contains: query, mode: "insensitive" } }] } : {}),
  };
  if (!params.get("page")) {
    return NextResponse.json({ assets: await prisma.mediaAsset.findMany({ where, include: USAGE_COUNT, orderBy: { createdAt: "desc" } }) });
  }
  const pageSize = Math.min(60, Math.max(1, Number(params.get("pageSize")) || 24));
  const total = await prisma.mediaAsset.count({ where });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pages, Math.max(1, Number(params.get("page")) || 1));
  const assets = await prisma.mediaAsset.findMany({ where, include: USAGE_COUNT, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });
  return NextResponse.json({ assets, total, page, pages, pageSize });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
  const parsed = mediaConfirmSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const bucket = process.env.SUPABASE_CATALOG_BUCKET || "Catalogo"; const storage = getSupabaseAdmin().storage.from(bucket);
  const { data, error } = await storage.download(parsed.data.path); if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const input = Buffer.from(await data.arrayBuffer()); if (input.length > 8 * 1024 * 1024) return NextResponse.json({ error: "Arquivo acima do limite de 8 MB." }, { status: 400 });
  let output = input; let objectPath = parsed.data.path; let metadata = await sharp(input).metadata();
  if (!["png", "jpeg", "webp"].includes(metadata.format || "")) return NextResponse.json({ error: "Use PNG, JPEG ou WebP." }, { status: 400 });
  if (parsed.data.purpose === "clinical") { output = Buffer.from(await sharp(input).rotate().webp({ quality: 90 }).toBuffer()); objectPath = `clinical/${randomUUID()}.webp`; const uploaded = await storage.upload(objectPath, output, { contentType: "image/webp", cacheControl: "31536000", upsert: false }); if (uploaded.error) return NextResponse.json({ error: uploaded.error.message }, { status: 502 }); metadata = await sharp(output).metadata(); }
  const mimeType = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
  const asset = await prisma.mediaAsset.create({ data: { provider: "SUPABASE", bucket, path: objectPath, alt: parsed.data.alt, width: metadata.width || 1, height: metadata.height || 1, mimeType, sizeBytes: output.length, hasAlpha: Boolean(metadata.hasAlpha), category: parsed.data.category ?? (parsed.data.purpose === "clinical" ? "CLINICAL_CASE" : null), lineId: parsed.data.lineId ?? null, createdById: admin.user.userId } });
  await audit(admin.user.userId, "MediaAsset", asset.id, "create", { purpose: parsed.data.purpose, path: objectPath }); return NextResponse.json({ asset }, { status: 201 });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
  const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  const parsed = mediaPatchSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const before = await prisma.mediaAsset.findUnique({ where: { id } }); if (!before) return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 });
  const stale = requireUnchanged(req, before.updatedAt); if (stale) return stale;

  // O ajuste por contexto chega parcial: o que não veio continua como está e
  // `null` faz o contexto voltar a seguir o enquadramento padrão da imagem.
  const { framingByContext, ...fields } = parsed.data;
  let contexts: Prisma.InputJsonValue | typeof Prisma.DbNull | undefined;
  if (framingByContext) {
    const current = (before.framingByContext ?? {}) as Record<string, unknown>;
    const merged = { ...current };
    for (const [context, framing] of Object.entries(framingByContext)) {
      if (framing) merged[context] = framing;
      else delete merged[context];
    }
    contexts = Object.keys(merged).length ? (merged as Prisma.InputJsonValue) : Prisma.DbNull;
  }

  const asset = await prisma.mediaAsset.update({ where: { id }, data: { ...fields, ...(contexts === undefined ? {} : { framingByContext: contexts }) } });
  await audit(admin.user.userId, "MediaAsset", id, "update", parsed.data);
  return NextResponse.json({ asset });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  const asset = await prisma.mediaAsset.findUnique({ where: { id }, include: { productImages: { include: { product: { select: { name: true } } } }, protocolImages: { include: { protocol: { select: { name: true } } } }, lineMedia: { include: { line: { select: { name: true } } } }, skus: { select: { code: true } }, skuSwatches: { select: { code: true } }, protocolCovers: { select: { name: true } }, protocolMappings: { select: { name: true } }, casesBefore: { select: { title: true } }, casesAfter: { select: { title: true } } } });
  if (!asset) return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 });
  const usages = [...asset.productImages.map(({ product }) => `Produto: ${product.name}`), ...asset.protocolImages.map(({ protocol }) => `Protocolo: ${protocol.name}`), ...asset.lineMedia.map(({ line }) => `Marca: ${line.name}`), ...asset.skus.map((sku) => `Variação: ${sku.code}`), ...asset.skuSwatches.map((sku) => `Círculo da variação: ${sku.code}`), ...asset.protocolCovers.map((protocol) => `Capa: ${protocol.name}`), ...asset.protocolMappings.map((protocol) => `Mapeamento: ${protocol.name}`), ...asset.casesBefore.map((item) => `Antes: ${item.title}`), ...asset.casesAfter.map((item) => `Depois: ${item.title}`)];
  if (usages.length) return NextResponse.json({ error: "Mídia em uso não pode ser excluída.", usages }, { status: 409 });
  if (asset.provider === "SUPABASE" && asset.bucket) await getSupabaseAdmin().storage.from(asset.bucket).remove([asset.path]); await prisma.mediaAsset.delete({ where: { id } }); await audit(admin.user.userId, "MediaAsset", id, "delete", { path: asset.path }); return NextResponse.json({ success: true });
}
