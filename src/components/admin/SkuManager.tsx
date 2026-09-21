"use client";

import { useCallback, useState } from "react";
import { Check, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminField, AdminSwitch, inputClass } from "./AdminUi";
import { MediaPicker } from "./AdminSelectors";
import { formErrorMessage } from "./formErrors";

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
  imageId?: string | null;
  swatchColor?: string | null;
  swatchImageId?: string | null;
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
  lineId,
  variantName,
  onVariantName,
}: {
  owner: "products" | "protocols";
  ownerId?: string;
  skus: Row[];
  onMessage: (message: string) => void;
  /** Quantos kits a composição permite montar (só protocolos). */
  derivedKits?: number;
  /** Marca do produto, para o acervo já abrir filtrado. */
  lineId?: string;
  /** Como a página chama a escolha entre variações, ex.: Cor, Tom. */
  variantName?: string;
  onVariantName?: (value: string) => void;
}) {
  const { authToken } = useAuth();
  const [rows, setRows] = useState<Row[]>(skus);
  const [draft, setDraft] = useState(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    if (!row.id) return;
    setSavingId(row.id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/catalog/${owner}/${ownerId}/skus/${row.id}`, {
        method: "PATCH",
        headers: { ...headers(true), ...(row.updatedAt ? { "X-Record-Version": row.updatedAt } : {}) },
        body: JSON.stringify({
          label: row.label || null,
          price: Number(row.price),
          trackStock: Boolean(row.trackStock),
          stockQuantity: row.trackStock ? Number(row.stockQuantity ?? 0) : null,
          isActive: Boolean(row.isActive),
          imageId: row.imageId || null,
          swatchColor: row.swatchColor || null,
          swatchImageId: row.swatchImageId || null,
        }),
      });
      const data = await response.json();
      const msg = response.ok
        ? `Preço e estoque de ${row.code} salvos com sucesso!`
        : formErrorMessage(data, "Falha ao salvar a variação.");
      onMessage(msg);
      setFeedback({ type: response.ok ? "success" : "error", text: msg });
      if (response.ok) {
        setSavedId(row.id);
        setTimeout(() => setSavedId((curr) => (curr === row.id ? null : curr)), 3500);
        void reload();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao conectar com o servidor.";
      setFeedback({ type: "error", text: msg });
      onMessage(msg);
    } finally {
      setSavingId(null);
    }
  }

  async function removeRow(row: Row) {
    if (!row.id) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${row.code}?`)) return;
    setRemovingId(row.id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/catalog/${owner}/${ownerId}/skus/${row.id}`, {
        method: "DELETE",
        headers: headers(),
      });
      const data = await response.json();
      const msg = response.ok
        ? data.archived
          ? `${row.code} já foi vendido, então foi desativado em vez de excluído.`
          : `${row.code} excluído com sucesso.`
        : (data.error ?? "Falha ao excluir.");
      onMessage(msg);
      setFeedback({ type: response.ok ? "success" : "error", text: msg });
      if (response.ok) void reload();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao conectar com o servidor.";
      setFeedback({ type: "error", text: msg });
      onMessage(msg);
    } finally {
      setRemovingId(null);
    }
  }

  async function createSku() {
    setCreating(true);
    setFeedback(null);
    try {
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
      const msg = response.ok ? "Nova variação cadastrada com sucesso!" : formErrorMessage(data, "Falha ao cadastrar a variação.");
      onMessage(msg);
      setFeedback({ type: response.ok ? "success" : "error", text: msg });
      if (response.ok) {
        setDraft(emptyDraft);
        void reload();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao conectar com o servidor.";
      setFeedback({ type: "error", text: msg });
      onMessage(msg);
    } finally {
      setCreating(false);
    }
  }

  const price = Number(draft.price || 0);

  return (
    <div className="space-y-7">
      {feedback ? (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === "success" ? <Check className="h-4 w-4" /> : null}
            {feedback.text}
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
            aria-label="Fechar mensagem"
          >
            ✕
          </button>
        </div>
      ) : null}

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

      {owner === "products" && onVariantName ? (
        <AdminField
          label="Como chamar a escolha"
          hint="Título acima dos círculos na página, ex.: Cor, Tom de pele, Tamanho"
        >
          <input
            className={inputClass}
            value={variantName ?? ""}
            placeholder="Escolha a variação"
            onChange={(event) => onVariantName(event.target.value)}
          />
        </AdminField>
      ) : null}

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-content/10 bg-raised p-4 transition-all">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold">{row.code}</p>
                <div className="flex items-center gap-2">
                  {savedId === row.id ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                      <Check className="h-3.5 w-3.5" />
                      Salvo!
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void saveRow(row)}
                    disabled={savingId === row.id}
                    className="inline-flex items-center justify-center rounded-lg border border-accent/25 bg-accent/10 p-2 text-accent shadow-xs transition-all hover:bg-accent hover:text-white hover:shadow-sm active:scale-95 disabled:opacity-50"
                    title={`Salvar alterações de ${row.code}`}
                    aria-label={`Salvar ${row.code}`}
                  >
                    {savingId === row.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeRow(row)}
                    disabled={removingId === row.id}
                    className="inline-flex items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 p-2 text-red-600 shadow-xs transition-all hover:bg-red-600 hover:text-white hover:shadow-sm active:scale-95 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white disabled:opacity-50"
                    title={`Excluir ${row.code}`}
                    aria-label={`Excluir ${row.code}`}
                  >
                    {removingId === row.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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

              {owner === "products" ? (
                <div className="mt-4 grid gap-3 border-t border-content/10 pt-4 md:grid-cols-3">
                  <MediaPicker
                    label="Foto desta variação"
                    hint="Aparece na galeria e no carrinho quando ela é escolhida"
                    value={row.imageId ?? ""}
                    onChange={(value) => update(row.id!, { imageId: value })}
                    defaults={{ category: "PRODUCT", lineId }}
                  />
                  <MediaPicker
                    label="Foto do círculo"
                    hint="Fundo do círculo na página: tom de pele, acabamento"
                    value={row.swatchImageId ?? ""}
                    onChange={(value) => update(row.id!, { swatchImageId: value })}
                    defaults={{ category: "PRODUCT", lineId }}
                  />
                  <AdminField label="Cor do círculo" hint="Use quando uma cor sólida já representa a variação">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={row.swatchColor || "#D8C3A5"}
                        onChange={(event) => update(row.id!, { swatchColor: event.target.value.toUpperCase() })}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-content/15 bg-canvas"
                        aria-label={`Cor do círculo de ${row.code}`}
                      />
                      <input
                        className={inputClass}
                        value={row.swatchColor ?? ""}
                        placeholder="#RRGGBB"
                        onChange={(event) => update(row.id!, { swatchColor: event.target.value.toUpperCase() })}
                      />
                      {row.swatchColor ? (
                        <button
                          type="button"
                          onClick={() => update(row.id!, { swatchColor: null })}
                          className="shrink-0 text-xs font-semibold text-content/55 hover:text-content"
                        >
                          Limpar
                        </button>
                      ) : null}
                    </div>
                  </AdminField>
                </div>
              ) : null}

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
            className="rounded-full bg-action px-5 py-2.5 text-sm font-semibold text-action-fg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {creating ? <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> : <Plus className="mr-1 inline h-4 w-4" />}
            Adicionar preço
          </button>
        </div>
      </div>
    </div>
  );
}
