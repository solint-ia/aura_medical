"use client";
import { GripVertical } from "lucide-react";

export function AdminField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="block"><span className="text-sm font-semibold">{label}</span>{hint ? <span className="mt-0.5 block text-xs text-content/55">{hint}</span> : null}<span className="mt-2 block">{children}</span></label>; }
export const toSlug = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const inputClass = "w-full rounded-xl border border-content/15 bg-canvas px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

export function AdminSwitch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3 text-left text-sm font-semibold"><span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-action" : "bg-content/15"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} /></span>{label}</button>; }

export function StatusBadge({ status }: { status: unknown }) { const value = String(status || "DRAFT"); const style = value === "PUBLISHED" || value === "Publicado" ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : value === "ARCHIVED" ? "bg-content/10 text-content/60" : "bg-amber-500/12 text-amber-700 dark:text-amber-300"; return <span className={`inline-flex rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase ${style}`}>{value === "PUBLISHED" ? "Publicado" : value === "ARCHIVED" ? "Arquivado" : value === "DRAFT" ? "Rascunho" : value}</span>; }

export function SaveBar({ state, onSave, onPublish, disabled }: { state: "saved" | "dirty" | "saving" | "conflict"; onSave: () => void; onPublish?: () => void; disabled?: boolean }) {
  const labels = { saved: "Tudo salvo", dirty: "Alterações não salvas", saving: "Salvando…", conflict: "Este registro foi atualizado em outra sessão" };
  return <div className="sticky bottom-4 z-30 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-content/12 bg-card/95 px-4 py-3 shadow-xl backdrop-blur">
    <span className={`text-xs font-semibold ${state === "conflict" ? "text-red-600" : "text-content/60"}`}>{labels[state]}</span>
    <div className="flex gap-2">
      {state === "conflict" ? <button type="button" onClick={() => window.location.reload()} className="rounded-full border border-content/15 px-4 py-2 text-sm font-semibold">Recarregar dados</button> : null}
      {onPublish ? <button type="button" onClick={onPublish} className="rounded-full border border-content/15 px-4 py-2 text-sm font-semibold">Publicar</button> : null}
      <button type="button" onClick={onSave} disabled={disabled || state === "saving" || state === "conflict"} className="rounded-full bg-action px-5 py-2 text-sm font-semibold text-action-fg disabled:opacity-50">Salvar</button>
    </div>
  </div>;
}

export function ReorderList<T>({ items, render, onMove }: { items: T[]; render: (item: T, index: number) => React.ReactNode; onMove: (from: number, to: number) => void }) { return <div className="space-y-2">{items.map((item, index) => <div key={index} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onMove(Number(event.dataTransfer.getData("text/plain")), index); }} className="flex items-start gap-2 rounded-xl border border-content/10 bg-raised p-3"><GripVertical className="mt-2 h-4 w-4 shrink-0 cursor-grab text-content/35" />{render(item, index)}</div>)}</div>; }

export function AdminTabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) { return <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-content/10" role="tablist">{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={active === tab} onClick={() => onChange(tab)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${active === tab ? "border-accent text-accent" : "border-transparent text-content/55"}`}>{tab}</button>)}</div>; }
