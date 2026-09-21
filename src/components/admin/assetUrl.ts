export type AdminAsset = {
  id: string;
  provider?: string;
  bucket?: string | null;
  path?: string;
  alt?: string;
  width?: number;
  height?: number;
  category?: string | null;
  lineId?: string | null;
  fit?: string | null;
  focalX?: number | null;
  focalY?: number | null;
  zoom?: number | null;
  framingByContext?: unknown;
  updatedAt?: string;
};

/** URL pública de um MediaAsset, montada no cliente (espelha `mediaUrl` do servidor). */
export function assetUrl(asset: AdminAsset | null | undefined): string {
  if (!asset?.path) return "";
  if (asset.provider === "LOCAL") return asset.path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !asset.bucket) return "";
  const encodedPath = asset.path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${encodeURIComponent(asset.bucket)}/${encodedPath}`;
}
