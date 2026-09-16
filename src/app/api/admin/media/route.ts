import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { mediaConfirmSchema } from "@/lib/validation/catalog";
import { audit, validationError } from "@/server/admin/mutation";

export async function GET(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; return NextResponse.json({ assets: await prisma.mediaAsset.findMany({ include: { _count: { select: { productImages: true, lineMedia: true, skus: true, casesBefore: true, casesAfter: true } } }, orderBy: { createdAt: "desc" } }) }); }
export async function POST(req: Request) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
  const parsed = mediaConfirmSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const bucket = process.env.SUPABASE_CATALOG_BUCKET || "Catalogo";
  const storage = getSupabaseAdmin().storage.from(bucket);
  const { data, error } = await storage.download(parsed.data.path); if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const input = Buffer.from(await data.arrayBuffer()); if (input.length > 8 * 1024 * 1024) return NextResponse.json({ error: "Arquivo acima do limite de 8 MB." }, { status: 400 });
  let output = input; let objectPath = parsed.data.path; let metadata = await sharp(input).metadata();
  if (!['png', 'jpeg', 'webp'].includes(metadata.format || '')) return NextResponse.json({ error: "Use PNG, JPEG ou WebP." }, { status: 400 });
  if (parsed.data.purpose === "clinical") { output = await sharp(input).rotate().webp({ quality: 90 }).toBuffer(); objectPath = `clinical/${randomUUID()}.webp`; const uploaded = await storage.upload(objectPath, output, { contentType: "image/webp", cacheControl: "31536000", upsert: false }); if (uploaded.error) return NextResponse.json({ error: uploaded.error.message }, { status: 502 }); metadata = await sharp(output).metadata(); }
  const mimeType = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
  const asset = await prisma.mediaAsset.create({ data: { provider: "SUPABASE", bucket, path: objectPath, alt: parsed.data.alt, width: metadata.width || 1, height: metadata.height || 1, mimeType, sizeBytes: output.length, hasAlpha: Boolean(metadata.hasAlpha), createdById: admin.user.userId } });
  await audit(admin.user.userId, "MediaAsset", asset.id, "create", { purpose: parsed.data.purpose, path: objectPath });
  return NextResponse.json({ asset }, { status: 201 });
}
export async function DELETE(req: Request) { const admin = await requireAdmin(req); if (!admin.ok) return admin.response; const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 }); const asset = await prisma.mediaAsset.findUnique({ where: { id }, include: { _count: { select: { productImages: true, lineMedia: true, skus: true, protocolCovers: true, protocolMappings: true, casesBefore: true, casesAfter: true } } } }); if (!asset) return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 }); if (Object.values(asset._count).some(Boolean)) return NextResponse.json({ error: "Mídia em uso não pode ser excluída." }, { status: 409 }); if (asset.provider === "SUPABASE" && asset.bucket) await getSupabaseAdmin().storage.from(asset.bucket).remove([asset.path]); await prisma.mediaAsset.delete({ where: { id } }); await audit(admin.user.userId, "MediaAsset", id, "delete", { path: asset.path }); return NextResponse.json({ success: true }); }
