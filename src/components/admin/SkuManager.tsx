"use client";

import { useCallback, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminField, AdminSwitch, inputClass } from "./AdminUi";

type Row = Record<string, unknown> & {
  id?: string;
  code?: string;
  label?: string | null;
  price?: number | string;
  trackStock?: boolean;
  stockQuantity?: number | null;
  isActive?: boolean;
  sortOrder?: number;
  updatedAt?: string;
  aliases?: { alias: string }[];
};

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const emptyDraft = {
  code: "",
  label: "",
  price: "",
  trackStock: true,
  stockQuantity: 0,
  aliasText: "",
};

export function SkuManager({
  owner,
  ownerId,
  skus,
  onMessage,
  derivedKits,
}: {
  owner: "products" | "protocols";
  ownerId?: string;
  skus: Row[];
  onMessage: (message: string) => void;
  /** Quantos kits a composição permite montar (só protocolos). */
  derivedKits?: number;
}) {
  const { authToken } = useAuth();
  const [rows, setRows] = useState<Row[]>(skus);
  const [draft, setDraft] = useState(emptyDraft);
  const [creating, setCreating] = useState(false);

  // Quando o formulário dono recarrega, a lista local volta a espelhar o servidor.
  const [seed, setSeed] = useState(skus);
  if (seed !== skus) {
    setSeed(skus);
    setRows(skus);
  }

  const headers = useCallback(
    (json = false) => ({
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    }),
    [authToken],
  );

  const reload = useCallback(async () => {
    if (!ownerId) return;
    const response = await fetch(`/api/admin/catalog/${owner}/${ownerId}`, { headers: headers() });
    const data = await response.json();
    const fresh = owner === "products" ? data.product?.skus : data.protocol?.skus;
    if (fresh) setRows(fresh);
  }, [owner, ownerId, headers]);

  if (!ownerId) return <p className="text-sm text-content/65">Salve o registro antes de cadastrar preços e estoque.</p>;

  const update = (id: string, patch: Row) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  async function saveRow(row: Row) {
    const response = await fetch(`/api/admin/catalog/${owner}/${ownerId}/skus/${row.id}`, {
      method: "PATCH",
      headers: { ...headers(true), ...(row.updatedAt ? { "If-Match": row.updatedAt } : {}) },
      body: JSON.stringify({
        label: row.label || null,
        price: Number(row.price),
        trackStock: Boolean(row.trackStock),
        stockQuantity: row.trackStock ? Number(row.stockQuantity ?? 0) : null,
        isActive: Boolean(row.isActive),
      }),
    });
    const data = await response.json();
    onMessage(response.ok ? `Preço e estoque de ${row.code} salvos.` : (data.error ?? "Falha ao salvar o preço."));
    if (response.ok) void reload();
  }

  async function removeRow(row: Row) {
    const response = await fetch(`/api/admin/catalog/${owner}/${ownerId}/skus/${row.id}`, {
      method: "DELETE",
      headers: headers(),
    });
    const data = await response.json();
    onMessage(
      response.ok
        ? data.archived
          ? `${row.code} já foi vendido, então foi desativado em vez de excluído.`
          : `${row.code} excluído.`
        : (data.error ?? "Falha ao excluir."),
    );
    if (response.ok) void reload();
  }

  async function createSku() {
    setCreating(true);
    const response = await fetch(`/api/admin/catalog/${owner}/${ownerId}/skus`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({
        code: draft.code.trim(),
        label: draft.label.trim() || null,
        price: Number(draft.price),
        trackStock: draft.trackStock,
        stockQuantity: draft.trackStock ? Number(draft.stockQuantity ?? 0) : null,
        sortOrder: rows.length,
        aliases: draft.aliasText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });
    const data = await response.json();
    onMessage(response.ok ? "Preço cadastrado." : (data.error ?? JSON.stringify(data.fields)));
    setCreating(false);
    if (response.ok) {
      setDraft(emptyDraft);
      void reload();
    }
  }

  const price = Number(draft.price || 0);

  return (
    <div className="space-y-7">
      {owner === "protocols" && derivedKits !== undefined ? (
        <p className="rounded-xl bg-raised p-4 text-sm text-content/70">
          A composição atual permite montar{" "}
          <strong className="font-semibold text-content">
            {Number.isFinite(derivedKits) ? `${derivedKits} kit(s)` : "kits ilimitados"}
          </strong>
          . O site usa o menor valor entre isso e o estoque abaixo, então o protocolo aparece como esgotado assim que
          faltar ampola de qualquer produto do kit.
        </p>
      ) : null}

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-content/10 bg-raised p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold">{row.code}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void saveRow(row)}
                    className="rounded-lg p-2 text-accent"
                    aria-label={`Salvar ${row.code}`}
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeRow(row)}
                    className="rounded-lg p-2 text-red-600"
                    aria-label={`Excluir ${row.code}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <AdminField label="Rótulo">
                  <input
                    className={inputClass}
                    value={row.label ?? ""}
                    onChange={(event) => update(row.id!, { label: event.target.value })}
                  />
                </AdminField>
                <AdminField label="Preço (R$)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    value={String(row.price ?? "")}
                    onChange={(event) => update(row.id!, { price: event.target.value })}
                  />
                </AdminField>
                <AdminField label="Quantidade em estoque" hint={row.trackStock ? undefined : "Controle desligado"}>
                  <input
                    type="number"
                    min="0"
                    disabled={!row.trackStock}
                    className={`${inputClass} disabled:opacity-45`}
                    value={row.trackStock ? String(row.stockQuantity ?? 0) : ""}
                    onChange={(event) => update(row.id!, { stockQuantity: Number(event.target.value) })}
                  />
                </AdminField>
                <div className="flex flex-col justify-center gap-3 pt-5">
                  <AdminSwitch
                    checked={Boolean(row.trackStock)}
                    onChange={(value) => update(row.id!, { trackStock: value })}
                    label="Controlar estoque"
                  />
                  <AdminSwitch
                    checked={Boolean(row.isActive)}
                    onChange={(value) => update(row.id!, { isActive: value })}
                    label="À venda"
                  />
                </div>
              </div>

              <p className="mt-3 font-mono text-xs text-content/50">
                {row.aliases?.length ? `Apelidos: ${row.aliases.map((alias) => alias.alias).join(", ")} · ` : ""}
                {row.trackStock
                  ? (row.stockQuantity ?? 0) > 0
                    ? `${row.stockQuantity} disponível(is)`
                    : "Esgotado no site"
                  : "Sem limite de estoque"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-content/15 p-6 text-center text-sm text-content/55">
          Nenhum preço cadastrado. Sem preço, o item não pode ser publicado.
        </p>
      )}

      <div className="rounded-2xl border border-content/10 p-4">
        <h3 className="mb-4 font-display text-lg font-semibold">Novo preço</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <AdminField label="Código" hint="Identificador único, em minúsculas com hífen">
            <input
              className={inputClass}
              value={draft.code}
              onChange={(event) => setDraft({ ...draft, code: event.target.value })}
            />
          </AdminField>
          <AdminField label="Rótulo" hint="Opcional. Ex.: frasco de 5 ml">
            <input
              className={inputClass}
              value={draft.label}
              onChange={(event) => setDraft({ ...draft, label: event.target.value })}
            />
          </AdminField>
          <AdminField label="Preço (R$)">
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
            />
          </AdminField>
          <AdminField label="Quantidade em estoque" hint={draft.trackStock ? "Quantas unidades existem hoje" : "Controle desligado"}>
            <input
              type="number"
              min="0"
              disabled={!draft.trackStock}
              className={`${inputClass} disabled:opacity-45`}
              value={draft.trackStock ? draft.stockQuantity : ""}
              onChange={(event) => setDraft({ ...draft, stockQuantity: Number(event.target.value) })}
            />
          </AdminField>
          <div className="flex items-center pt-5">
            <AdminSwitch
              checked={draft.trackStock}
              onChange={(value) => setDraft({ ...draft, trackStock: value })}
              label="Controlar estoque"
            />
          </div>
          <AdminField label="Apelidos" hint="Códigos antigos aceitos no checkout, separados por vírgula">
            <input
              className={inputClass}
              value={draft.aliasText}
              onChange={(event) => setDraft({ ...draft, aliasText: event.target.value })}
            />
          </AdminField>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-content/55">
            Prévia: 10× de {BRL.format(price / 10)} · PIX {BRL.format(price * 0.95)}
          </p>
          <button
            type="button"
            disabled={creating || !draft.code.trim() || !draft.price}
            onClick={() => void createSku()}
            className="rounded-full bg-action px-5 py-2.5 text-sm font-semibold text-action-fg disabled:opacity-50"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            Adicionar preço
          </button>
        </div>
      </div>
    </div>
  );
}
