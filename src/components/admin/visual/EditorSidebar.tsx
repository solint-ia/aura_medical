"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { AdminField, inputClass } from "../AdminUi";

type Row = Record<string, unknown>;

/** Bloco da barra lateral. `collapsible` guarda o que raramente se mexe. */
export function SidebarSection({
  title,
  children,
  collapsible = false,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  if (collapsible) {
    return (
      <details open={defaultOpen} className="border-t border-content/10 px-4 py-3">
        <summary className="cursor-pointer font-mono text-[10px] font-semibold tracking-[.16em] text-content/50 uppercase">
          {title}
        </summary>
        <div className="mt-4 space-y-4">{children}</div>
      </details>
    );
  }
  return (
    <section className="border-t border-content/10 px-4 py-4 first:border-t-0">
      <h3 className="mb-3 font-mono text-[10px] font-semibold tracking-[.16em] text-content/50 uppercase">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Endereço público do item: gerado a partir do nome, exibido só como informação. */
export function PublicAddress({ path, canOpen }: { path: string; canOpen: boolean }) {
  return (
    <div>
      <p className="font-mono text-xs break-all text-content/60">{path}</p>
      {canOpen ? (
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent"
        >
          Abrir no site
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <p className="mt-2 text-xs text-content/45">Disponível depois de publicar.</p>
      )}
    </div>
  );
}

/** Pares rótulo/valor da ficha técnica e das pendências. */
export function PairEditor({ rows, onChange }: { rows: Row[]; onChange: (rows: Row[]) => void }) {
  return (
    <div>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2">
            <input
              className={inputClass}
              placeholder="Rótulo"
              value={String(row.label ?? "")}
              onChange={(event) =>
                onChange(rows.map((item, position) => (position === index ? { ...item, label: event.target.value } : item)))
              }
            />
            <input
              className={inputClass}
              placeholder="Valor"
              value={String(row.value ?? "")}
              onChange={(event) =>
                onChange(rows.map((item, position) => (position === index ? { ...item, value: event.target.value } : item)))
              }
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, position) => position !== index))}
              className="rounded-lg p-2 text-red-600"
              aria-label={`Remover linha ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...rows, { label: "", value: "" }])} className="mt-2 text-xs font-semibold text-accent">
        + Adicionar linha
      </button>
    </div>
  );
}

/** Campo de texto simples da barra lateral. */
export function SidebarInput({
  label,
  hint,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <AdminField label={label} hint={hint}>
      <input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </AdminField>
  );
}
