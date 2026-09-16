import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadRequestSchema } from "@/lib/validation/catalog";
import { validationError } from "@/server/admin/mutation";

export async function POST(req: Request) {
  const admin = await requireAdmin(req); if (!admin.ok) return admin.response;
  const parsed = uploadRequestSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const bucket = process.env.SUPABASE_CATALOG_BUCKET || "Catalogo";
  const extension = path.extname(parsed.data.filename).toLowerCase().replace(/[^.a-z0-9]/g, "") || (parsed.data.mimeType === "image/png" ? ".png" : parsed.data.mimeType === "image/webp" ? ".webp" : ".jpg");
  const objectPath = `uploads/${randomUUID()}${extension}`;
  const { data, error } = await getSupabaseAdmin().storage.from(bucket).createSignedUploadUrl(objectPath);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ bucket, path: objectPath, token: data.token, signedUrl: data.signedUrl });
}
