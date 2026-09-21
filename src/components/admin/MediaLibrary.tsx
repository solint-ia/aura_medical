"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Crop, Search, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { assetUrl } from "./assetUrl";
import { inputClass } from "./AdminUi";
import { MEDIA_CATEGORIES } from "./mediaCategories";
import { FramingEditor } from "./FramingEditor";
import { framingStyle, toFraming } from "@/lib/imageFraming";

type Asset = {
  id: string;
  provider?: string;
  bucket?: string | null;
  path?: string;
  alt: string;
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

const PAGE_SIZE = 24;

export function MediaLibrary() {
  const { authToken } = useAuth();
  const [lines, setLines] = useState<{ id: string; name: string }[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [lineId, setLineId] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [uploadCategory, setUploadCategory] = useState("PRODUCT");
  const [uploadLineId, setUploadLineId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [framingAsset, setFramingAsset] = useState<Asset | null>(null);

  const headers = (json = false) => ({
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${authToken}`,
  });

  useEffect(() => {
    if (!authToken) return;
    void fetch("/api/admin/catalog/lines", { headers: { Authorization: `Bearer ${authToken}` } })
      .then((response) => response.json())
      .then((data) => setLines(data.lines ?? []));
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (lineId) params.set("lineId", lineId);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`/api/admin/media?${params}`, { headers: { Authorization: `Bearer ${authToken}` }, signal: controller.signal })
        .then((response) => response.json())
        .then((data) => {
          setAssets(data.assets ?? []);
          setPages(data.pages ?? 1);
          setTotal(data.total ?? 0);
        })
        .catch(() => undefined);
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [authToken, page, query, category, lineId, reloadKey]);

  const refilter = (update: () => void) => {
    update();
    setPage(1);
  };

  async function upload(file: File) {
    setMessage(`Enviando ${file.name}…`);
    const request = await fetch("/api/admin/media/upload-url", {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({ filename: file.name, mimeType: file.type, sizeBytes: file.size }),
    });
    const signed = await request.json();
    if (!request.ok) return setMessage(signed.error);
    const uploaded = await fetch(signed.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!uploaded.ok) return setMessage("Falha ao enviar o arquivo ao armazenamento.");
    const confirmed = await fetch("/api/admin/media", {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({
        path: signed.path,
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        purpose: uploadCategory === "CLINICAL_CASE" ? "clinical" : "catalog",
        category: uploadCategory,
        lineId: uploadLineId || null,
      }),
    });
    const data = await confirmed.json();
    setMessage(confirmed.ok ? `${file.name} enviada.` : data.error);
    if (confirmed.ok) {
      setPage(1);
      setReloadKey((key) => key + 1);
    }
  }

  async function updateAsset(asset: Asset, patch: Partial<Pick<Asset, "alt" | "category" | "lineId">>) {
    const response = await fetch(`/api/admin/media?id=${asset.id}`, {
      method: "PATCH",
      headers: { ...headers(true), ...(asset.updatedAt ? { "If-Match": asset.updatedAt } : {}) },
      body: JSON.stringify(patch),
    });
    const data = await response.json();
    setMessage(response.ok ? "Imagem atualizada." : data.error);
    if (response.ok) setAssets((current) => current.map((item) => (item.id === asset.id ? data.asset : item)));
  }

  async function remove(asset: Asset) {
    const response = await fetch(`/api/admin/media?id=${asset.id}`, { method: "DELETE", headers: headers() });
    const data = await response.json();
    setMessage(response.ok ? "Imagem excluída." : `${data.error}${data.usages?.length ? ` Usada em: ${data.usages.join("; ")}` : ""}`);
    if (response.ok) setReloadKey((key) => key + 1);
  }

  return (
    <section>
      <p className="font-mono text-xs tracking-wider text-accent uppercase">Catálogo</p>
      <h1 className="mt-1 font-display text-4xl font-semibold">Fotos</h1>
      <p className="mt-2 max-w-2xl text-sm text-content/60">
        Todas as imagens usadas em marcas, produtos, protocolos e casos clínicos. Classifique cada envio para achá-lo depois.
      </p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          [...event.dataTransfer.files].forEach((file) => void upload(file));
        }}
        className={`mt-7 rounded-2xl border-2 border-dashed p-6 text-center ${dragging ? "border-accent bg-accent/5" : "border-content/15"}`}
      >
        <Upload className="mx-auto h-6 w-6 text-accent" />
        <p className="mt-2 text-sm font-semibold">Arraste imagens aqui</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="font-semibold">Enviar como</span>
          <select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} className="rounded-lg border border-content/15 bg-canvas px-2 py-1.5" aria-label="Tipo das imagens enviadas">
            {MEDIA_CATEGORIES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
          <select value={uploadLineId} onChange={(event) => setUploadLineId(event.target.value)} className="rounded-lg border border-content/15 bg-canvas px-2 py-1.5" aria-label="Marca das imagens enviadas">
            <option value="">Sem marca</option>
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
          <label className="cursor-pointer rounded-full bg-action px-4 py-2 font-semibold text-action-fg">
            Escolher arquivos
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" onChange={(event) => [...(event.target.files ?? [])].forEach((file) => void upload(file))} />
          </label>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
        <label className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-content/40" />
          <input className={`${inputClass} pl-9`} value={query} onChange={(event) => refilter(() => setQuery(event.target.value))} placeholder="Buscar pelo nome da imagem…" />
        </label>
        <select className={inputClass} value={category} onChange={(event) => refilter(() => setCategory(event.target.value))} aria-label="Filtrar por tipo">
          <option value="">Todos os tipos</option>
          {MEDIA_CATEGORIES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
          <option value="NONE">Sem tipo</option>
        </select>
        <select className={inputClass} value={lineId} onChange={(event) => refilter(() => setLineId(event.target.value))} aria-label="Filtrar por marca">
          <option value="">Todas as marcas</option>
          {lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.name}
            </option>
          ))}
        </select>
      </div>

      {message ? <p className="mt-4 rounded-xl bg-raised p-3 text-sm">{message}</p> : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map((asset) => {
          const url = assetUrl(asset);
          return (
            <article key={asset.id} className="overflow-hidden rounded-2xl border border-content/10 bg-card">
              <div className="relative h-48 bg-raised">
                {url ? <Image src={url} alt={asset.alt} fill sizes="(max-width: 640px) 90vw, 25vw" className="object-contain p-3" style={framingStyle(toFraming(asset))} /> : null}
              </div>
              <div className="space-y-2.5 p-4">
                <textarea
                  defaultValue={asset.alt}
                  onBlur={(event) => {
                    if (event.target.value !== asset.alt) void updateAsset(asset, { alt: event.target.value });
                  }}
                  className={inputClass}
                  rows={2}
                  aria-label="Nome da imagem"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={asset.category ?? ""}
                    onChange={(event) => void updateAsset(asset, { category: event.target.value || null })}
                    className="rounded-lg border border-content/15 bg-canvas px-2 py-1.5 text-xs"
                    aria-label="Tipo"
                  >
                    <option value="">Sem tipo</option>
                    {MEDIA_CATEGORIES.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={asset.lineId ?? ""}
                    onChange={(event) => void updateAsset(asset, { lineId: event.target.value || null })}
                    className="rounded-lg border border-content/15 bg-canvas px-2 py-1.5 text-xs"
                    aria-label="Marca"
                  >
                    <option value="">Sem marca</option>
                    {lines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-content/45">
                    {asset.width}×{asset.height}
                  </span>
                  <button type="button" onClick={() => setFramingAsset(asset)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-content/70 hover:text-accent">
                    <Crop className="h-3.5 w-3.5" /> Enquadramento
                  </button>
                  <button type="button" onClick={() => void remove(asset)} className="p-2 text-red-600" aria-label="Excluir imagem">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!assets.length ? <p className="mt-10 text-center text-sm text-content/55">Nenhuma imagem encontrada com esses filtros.</p> : null}

      {framingAsset ? (
        <FramingEditor
          asset={framingAsset}
          onClose={() => setFramingAsset(null)}
          onSaved={(saved) => setAssets((current) => current.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)))}
        />
      ) : null}

      <div className="mt-6 flex items-center justify-between text-xs text-content/60">
        <span>{total} imagem(ns)</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-content/15 p-2 disabled:opacity-30" aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono">
            {page} / {pages}
          </span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-content/15 p-2 disabled:opacity-30" aria-label="Próxima página">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
