"use client";

import { useRef, useState } from "react";
import { Crop, Maximize2, Minimize2, RotateCcw, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { assetUrl, type AdminAsset } from "./assetUrl";
import { DEFAULT_FRAMING, framingStyle, toFraming, type ImageFraming } from "@/lib/imageFraming";

/** Proporções em que a mesma foto aparece no site, para conferir antes de salvar. */
const PREVIEWS = [
  { label: "Card do catálogo", className: "aspect-[4/3]" },
  { label: "Página", className: "aspect-[3/4]" },
] as const;

/**
 * Ajuste manual do enquadramento de uma foto do acervo.
 *
 * O admin arrasta para escolher o que fica no centro, aproxima e decide entre
 * preencher o espaço ou mostrar a foto inteira. O ajuste vale em todo lugar
 * onde a foto aparece.
 */
export function FramingEditor({
  asset,
  onClose,
  onSaved,
}: {
  asset: AdminAsset;
  onClose: () => void;
  onSaved?: (asset: AdminAsset) => void;
}) {
  const { authToken } = useAuth();
  const [framing, setFraming] = useState<ImageFraming>(toFraming(asset));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const url = assetUrl(asset);

  function pointTo(event: React.PointerEvent) {
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    setFraming((current) => ({
      ...current,
      x: Math.round(Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100))),
      y: Math.round(Math.min(100, Math.max(0, ((event.clientY - box.top) / box.height) * 100))),
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/media?id=${asset.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...(asset.updatedAt ? { "If-Match": asset.updatedAt } : {}),
      },
      body: JSON.stringify({
        fit: framing.fit === "contain" ? "CONTAIN" : "COVER",
        focalX: framing.x,
        focalY: framing.y,
        zoom: framing.zoom,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return setError(data.error || "Não foi possível salvar o enquadramento.");
    onSaved?.(data.asset);
    onClose();
  }

  const preview = framingStyle(framing) ?? { objectFit: "cover" as const, objectPosition: "50% 50%" };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-panel/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label="Ajustar enquadramento" className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-content/12 bg-card shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-content/10 p-5">
          <div>
            <h2 className="font-display text-2xl font-semibold">Ajustar enquadramento</h2>
            <p className="mt-1 max-w-lg text-sm text-content/60">
              Clique ou arraste sobre a foto para escolher o que deve ficar no centro. O ajuste vale em todos os lugares onde ela aparece.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[1fr_14rem]">
          <div>
            <div
              ref={stage}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                pointTo(event);
              }}
              onPointerMove={(event) => {
                if (event.buttons === 1) pointTo(event);
              }}
              className="relative aspect-[4/3] w-full cursor-crosshair overflow-hidden rounded-2xl border border-content/12 bg-raised"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {url ? <img src={url} alt={asset.alt ?? ""} className="h-full w-full select-none" style={preview} draggable={false} /> : null}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.35)]"
                style={{ left: `${framing.x}%`, top: `${framing.y}%` }}
              />
            </div>

            <label className="mt-4 block">
              <span className="font-mono text-xs tracking-wider text-content/55 uppercase">Aproximação: {framing.zoom}%</span>
              <input
                type="range"
                min={100}
                max={300}
                step={5}
                value={framing.zoom}
                onChange={(event) => setFraming({ ...framing, zoom: Number(event.target.value) })}
                className="mt-2 w-full accent-[var(--color-accent)]"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 font-mono text-xs tracking-wider text-content/55 uppercase">Como preencher</p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setFraming({ ...framing, fit: "cover" })}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${framing.fit === "cover" ? "border-accent text-accent" : "border-content/15"}`}
                >
                  <Maximize2 className="h-4 w-4" /> Preencher o espaço
                </button>
                <button
                  type="button"
                  onClick={() => setFraming({ ...framing, fit: "contain", zoom: 100 })}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${framing.fit === "contain" ? "border-accent text-accent" : "border-content/15"}`}
                >
                  <Minimize2 className="h-4 w-4" /> Mostrar a foto inteira
                </button>
              </div>
              <p className="mt-2 text-xs text-content/55">
                {framing.fit === "cover"
                  ? "A foto cobre todo o espaço e as sobras são cortadas."
                  : "A foto aparece inteira, com folga nas laterais."}
              </p>
            </div>

            <div>
              <p className="mb-2 font-mono text-xs tracking-wider text-content/55 uppercase">Como vai ficar</p>
              <div className="grid grid-cols-2 gap-2">
                {PREVIEWS.map((entry) => (
                  <figure key={entry.label}>
                    <div className={`relative ${entry.className} overflow-hidden rounded-xl border border-content/12 bg-raised`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {url ? <img src={url} alt="" className="h-full w-full" style={preview} /> : null}
                    </div>
                    <figcaption className="mt-1 text-[10px] text-content/55">{entry.label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFraming(DEFAULT_FRAMING)}
              className="flex items-center gap-2 text-xs font-semibold text-content/60 hover:text-content"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão
            </button>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-content/10 p-5">
          <span className="text-xs text-content/55">{error || `Posição ${framing.x}% × ${framing.y}%`}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-full border border-content/15 px-4 py-2 text-sm font-semibold">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-full bg-action px-5 py-2 text-sm font-semibold text-action-fg disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar enquadramento"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Atalho para abrir o ajuste de enquadramento sobre uma foto já escolhida. */
export function FramingButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Ajustar enquadramento"
        title="Ajustar enquadramento"
        className="absolute top-0.5 right-0.5 rounded bg-canvas/90 p-0.5 opacity-0 transition group-hover/thumb:opacity-100"
      >
        <Crop className="h-3 w-3" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-canvas/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur"
    >
      <Crop className="h-3.5 w-3.5" /> Ajustar enquadramento
    </button>
  );
}
