"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

/**
 * Peças do editor visual: o texto aparece com a mesma tipografia do site e vira
 * campo ao ser clicado, para o admin editar onde ele enxerga o resultado.
 */

export function EditableText({
  value,
  onChange,
  className = "",
  placeholder,
  label,
  multiline = false,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder: string;
  label: string;
  multiline?: boolean;
  maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onChange(draft);
  }

  function start() {
    setDraft(value);
    setEditing(true);
  }

  const shared = `w-full resize-none rounded-md border border-accent bg-canvas px-1.5 py-0.5 outline-none ${className}`;

  if (editing) {
    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        aria-label={label}
        value={draft}
        maxLength={maxLength}
        rows={Math.max(2, draft.split("\n").length + 1)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Escape") setEditing(false);
        }}
        className={shared}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        aria-label={label}
        value={draft}
        maxLength={maxLength}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") setEditing(false);
        }}
        className={shared}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      title={`Editar: ${label}`}
      className={`group/edit relative w-full cursor-text rounded-md px-1.5 py-0.5 text-left ring-1 ring-transparent ring-offset-0 transition hover:bg-accent/5 hover:ring-accent/40 ${className} ${
        value ? "" : "text-content/35 italic"
      }`}
    >
      {value || placeholder}
      <Pencil className="pointer-events-none absolute -top-1 -right-1 h-3.5 w-3.5 opacity-0 transition group-hover/edit:opacity-100" />
    </button>
  );
}

/** Moldura de uma região editável, com rótulo discreto no topo. */
export function EditRegion({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="group/region relative rounded-2xl ring-1 ring-transparent transition hover:ring-content/12">
      <div className="pointer-events-none absolute -top-2.5 left-3 z-10 flex items-center gap-2 opacity-0 transition group-hover/region:opacity-100">
        <span className="rounded-full bg-content px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-canvas uppercase">
          {label}
        </span>
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="absolute -top-3 right-3 z-10 rounded-full bg-action px-3 py-1 text-[11px] font-semibold text-action-fg opacity-0 shadow transition group-hover/region:opacity-100"
        >
          {action.label}
        </button>
      ) : null}
      {children}
    </div>
  );
}

/** Lista curta de textos, como os destaques do produto. */
export function EditableTagList({
  values,
  onChange,
  max,
  label,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  max: number;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.map((entry, index) => (
        <span key={index} className="group/tag relative inline-flex items-center">
          <EditableText
            value={entry}
            onChange={(next) =>
              onChange(values.map((item, itemIndex) => (itemIndex === index ? next : item)).filter(Boolean))
            }
            label={`${label} ${index + 1}`}
            placeholder="Destaque"
            className="rounded-full border border-content/15 bg-card px-3 py-1 text-xs font-semibold"
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
            aria-label={`Remover ${label} ${index + 1}`}
            className="ml-1 rounded-full p-1 text-content/40 opacity-0 transition group-hover/tag:opacity-100 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </span>
      ))}
      {values.length < max ? (
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-content/25 px-3 py-1 text-xs font-semibold text-content/55 hover:border-accent hover:text-accent"
        >
          <Plus className="h-3 w-3" />
          {label}
        </button>
      ) : null}
    </div>
  );
}

/** Lista de linhas soltas, como os itens de um bloco de descrição. */
export function EditableLines({
  values,
  onChange,
  label,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  label: string;
}) {
  return (
    <ul className="divide-y divide-content/10">
      {values.map((entry, index) => (
        <li key={index} className="group/line flex items-start gap-2 py-1">
          <EditableText
            value={entry}
            onChange={(next) => onChange(values.map((item, itemIndex) => (itemIndex === index ? next : item)))}
            label={`${label} ${index + 1}`}
            placeholder="Item da lista"
            className="flex-1 text-[15px] leading-relaxed"
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
            aria-label={`Remover item ${index + 1}`}
            className="mt-1 rounded p-1 text-content/35 opacity-0 transition group-hover/line:opacity-100 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
      <li className="pt-2">
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
        >
          <Plus className="h-3 w-3" />
          Adicionar item
        </button>
      </li>
    </ul>
  );
}
