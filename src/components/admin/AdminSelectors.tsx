"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImagePlus, Search, Upload, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { assetUrl, type AdminAsset } from "./assetUrl";
import { inputClass } from "./AdminUi";
import { MEDIA_CATEGORIES, mediaCategoryLabel, type MediaDefaults } from "./mediaCategories";

type Option = { id: string; name?: string; title?: string; slug?: string };

type GalleryAsset = AdminAsset & { category?: string | null; lineId?: string | null };

const PAGE_SIZE = 24;

/**
 * Seleção de imagem em grade visual. Um `<select>` com centenas de arquivos
 * ficava impossível de ler — aqui a escolha é pela miniatura, com busca e envio
 * no mesmo lugar.
 */
export function MediaPicker({
  value,
  onChange,
  label = "Imagem",
  hint,
  defaults,
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  hint?: string;
  defaults?: MediaDefaults;
}) {
  const { authToken } = useAuth();
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    if (!authToken) return;
    void fetch("/api/admin/media", { headers: { Authorization: `Bearer ${authToken}` } })
      .then((response) => response.json())
      .then((data) => setAssets(data.assets ?? []));
  }, [authToken]);

  useEffect(load, [load]);

  const selected = assets.find((asset) => asset.id === value);
  const url = assetUrl(selected);

  return (
    <div className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs text-content/55">{hint}</span> : null}
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-content/15 bg-raised transition hover:border-accent"
          aria-label={selected ? `Trocar imagem: ${selected.alt}` : "Escolher imagem"}
        >
          {url ? (
            <Image src={url} alt="" fill sizes="80px" className="object-contain p-1" />
          ) : (
            <ImagePlus className="absolute inset-0 m-auto h-6 w-6 text-content/35" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{selected?.alt || "Nenhuma imagem escolhida"}</p>
          <div className="mt-1 flex gap-3">
            <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-accent">
              {selected ? "Trocar" : "Escolher"}
            </button>
            {selected ? (
              <button type="button" onClick={() => onChange("")} className="text-xs font-semibold text-content/55">
                Remover
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {open ? (
        <MediaModal
          value={value}
          defaults={defaults}
          onClose={() => setOpen(false)}
          onPick={(id) => {
            onChange(id);
            setOpen(false);
          }}
          onUploaded={load}
        />
      ) : null}
    </div>
  );
}

/**
 * Galeria do acervo: busca, filtro por tipo e marca, páginas de 24 imagens e
 * envio já classificado. As miniaturas usam `object-contain` num quadro fixo,
 * então a imagem aparece inteira.
 */
export function MediaModal({
  value,
  onClose,
  onPick,
  onUploaded,
  defaults,
}: {
  value: string;
  onClose: () => void;
  onPick: (id: string) => void;
  onUploaded?: () => void;
  defaults?: MediaDefaults;
}) {
  const { authToken } = useAuth();
  const [lines, setLines] = useState<{ id: string; name: string }[]>([]);
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(defaults?.category ?? "");
  const [lineId, setLineId] = useState(defaults?.lineId ?? "");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [uploadCategory, setUploadCategory] = useState<string>(defaults?.category ?? "OTHER");
  const [uploadLineId, setUploadLineId] = useState(defaults?.lineId ?? "");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      void fetch(`/api/admin/media?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((data) => {
          setAssets(data.assets ?? []);
          setPages(data.pages ?? 1);
          setTotal(data.total ?? 0);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [authToken, page, query, category, lineId, reloadKey]);

  const lineName = useMemo(() => new Map(lines.map((line) => [line.id, line.name])), [lines]);

  function filterBy(update: () => void) {
    update();
    setPage(1);
  }

  async function upload(file: File) {
    setStatus(`Enviando ${file.name}…`);
    const request = await fetch("/api/admin/media/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ filename: file.name, mimeType: file.type, sizeBytes: file.size }),
    });
    const signed = await request.json();
    if (!request.ok) return setStatus(signed.error ?? "Falha ao preparar o envio.");
    const uploaded = await fetch(signed.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!uploaded.ok) return setStatus("Falha ao enviar o arquivo.");
    const confirmed = await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        path: signed.path,
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        purpose: uploadCategory === "CLINICAL_CASE" ? "clinical" : "catalog",
        category: uploadCategory,
        lineId: uploadLineId || null,
      }),
    });
    const data = await confirmed.json();
    setStatus(confirmed.ok ? `${file.name} enviada.` : (data.error ?? "Falha ao registrar a imagem."));
    if (confirmed.ok) {
      setPage(1);
      setReloadKey((key) => key + 1);
      onUploaded?.();
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-panel/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Escolher imagem"
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-content/12 bg-card shadow-2xl"
      >
        <header className="flex items-center gap-3 border-b border-content/10 p-4">
          <h2 className="font-display text-xl font-semibold">Acervo de fotos</h2>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg p-2" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-3 border-b border-content/10 p-4 md:grid-cols-[1fr_11rem_11rem]">
          <label className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-content/40" />
            <input
              autoFocus
              value={query}
              onChange={(event) => filterBy(() => setQuery(event.target.value))}
              placeholder="Buscar pelo nome da imagem…"
              className={`${inputClass} pl-9`}
            />
          </label>
          <select
            aria-label="Filtrar por tipo"
            value={category}
            onChange={(event) => filterBy(() => setCategory(event.target.value))}
            className={inputClass}
          >
            <option value="">Todos os tipos</option>
            {MEDIA_CATEGORIES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
            <option value="NONE">Sem tipo</option>
          </select>
          <select
            aria-label="Filtrar por marca"
            value={lineId}
            onChange={(event) => filterBy(() => setLineId(event.target.value))}
            className={inputClass}
          >
            <option value="">Todas as marcas</option>
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-16 text-center text-sm text-content/55">Carregando…</p>
          ) : assets.length ? (
            <div className="grid content-start grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {assets.map((asset) => {
                const url = assetUrl(asset);
                const isSelected = asset.id === value;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => onPick(asset.id)}
                    aria-pressed={isSelected}
                    title={asset.alt}
                    className={`flex flex-col overflow-hidden rounded-xl border-2 bg-raised text-left transition ${
                      isSelected ? "border-accent" : "border-transparent hover:border-content/25"
                    }`}
                  >
                    <span className="relative block h-32 w-full shrink-0">
                      {url ? <Image src={url} alt="" fill sizes="(max-width: 768px) 45vw, 16vw" className="object-contain p-2" /> : null}
                    </span>
                    <span className="block truncate bg-card px-2 pt-1.5 text-[11px] text-content/75">{asset.alt}</span>
                    <span className="block truncate bg-card px-2 pb-1.5 font-mono text-[9px] tracking-wide text-content/45 uppercase">
                      {mediaCategoryLabel(asset.category)}
                      {asset.lineId ? ` · ${lineName.get(asset.lineId) ?? ""}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-content/55">Nenhuma imagem encontrada com esses filtros.</p>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-content/10 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold">Enviar como</span>
            <select
              aria-label="Tipo da imagem enviada"
              value={uploadCategory}
              onChange={(event) => setUploadCategory(event.target.value)}
              className="rounded-lg border border-content/15 bg-canvas px-2 py-1.5"
            >
              {MEDIA_CATEGORIES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Marca da imagem enviada"
              value={uploadLineId}
              onChange={(event) => setUploadLineId(event.target.value)}
              className="rounded-lg border border-content/15 bg-canvas px-2 py-1.5"
            >
              <option value="">Sem marca</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
            <label className="cursor-pointer rounded-full bg-action px-4 py-2 font-semibold text-action-fg">
              <Upload className="mr-1 inline h-3 w-3" />
              Enviar fotos
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => [...(event.target.files ?? [])].forEach((file) => void upload(file))}
              />
            </label>
            {status ? <span className="text-content/60">{status}</span> : null}
          </div>

          <div className="flex items-center gap-2 text-xs text-content/60">
            <span>{total} imagem(ns)</span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-content/15 p-1.5 disabled:opacity-30"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono">
              {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-content/15 p-1.5 disabled:opacity-30"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function RelationSelector({
  endpoint,
  dataKey,
  values,
  onChange,
  label,
}: {
  endpoint: string;
  dataKey: string;
  values: string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  const { authToken } = useAuth();
  const [options, setOptions] = useState<Option[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!authToken) return;
    void fetch(endpoint, { headers: { Authorization: `Bearer ${authToken}` } })
      .then((response) => response.json())
      .then((data) => setOptions(data[dataKey] ?? []));
  }, [authToken, dataKey, endpoint]);

  const visible = useMemo(
    () =>
      options.filter((option) =>
        (option.name || option.title || option.slug || "")
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR")),
      ),
    [options, query],
  );

  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar…"
        className={`mt-2 ${inputClass}`}
      />
      <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-content/10 p-2">
        {visible.map((option) => (
          <label key={option.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-content/5">
            <input
              type="checkbox"
              checked={values.includes(option.id)}
              onChange={(event) =>
                onChange(event.target.checked ? [...values, option.id] : values.filter((id) => id !== option.id))
              }
            />
            {option.name || option.title || option.slug || option.id}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
