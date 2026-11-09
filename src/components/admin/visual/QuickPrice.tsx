"use client";

import { useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { parsePrice } from "@/lib/money";
import { AdminSwitch } from "../AdminUi";
import { formErrorMessage } from "../formErrors";

type Row = Record<string, any>;

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const priceText = (value: unknown) =>
  value === undefined || value === null || value === "" ? "" : Number(value).toFixed(2).replace(".", ",");

const fieldClass =
  "w-full rounded-lg border border-content/15 bg-canvas px-2.5 py-1.5 text-sm outline-none transition focus:border-accent disabled:opacity-45";

/**
 * Preço e estoque editados direto na prévia da página. Cada campo grava sozinho
 * ao sair dele, sem abrir a gaveta de variações. Produto único mostra um
 * conjunto de campos; produto com variações, uma linha por variação à venda.
 */
export function QuickPrice({
  productId,
  slug,
  skus,
  hasVariants,
  onSkus,
  onMessage,
}: {
  productId?: string;
  slug: string;
  skus: Row[];
  hasVariants: boolean;
  onSkus: (skus: Row[]) => void;
  onMessage: (message: string) => void;
}) {
  const { authToken } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  // Uma gravação por vez, sempre com a versão mais recente da variação: sair do
  // preço e logo do estoque não pode esbarrar na própria gravação anterior.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const versions = useRef(new Map<string, string>());

  if (!productId) return <p className="text-xs text-content/55">Salve o produto para definir o preço.</p>;

  const headers = (version?: string) => ({
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(version ? { "X-Record-Version": version } : {}),
  });

  async function reload(): Promise<Row[] | null> {
    try {
      const response = await fetch(`/api/admin/catalog/products/${productId}`, { headers: headers() });
      const data = await response.json();
      const fresh: Row[] | undefined = data.product?.skus;
      if (fresh) {
        fresh.forEach((entry) => versions.current.set(entry.id, entry.updatedAt));
        onSkus(fresh);
      }
      return fresh ?? null;
    } catch {
      return null;
    }
  }

  function done(key: string) {
    setSaved(key);
    setTimeout(() => setSaved((current) => (current === key ? null : current)), 2500);
  }

  function patch(sku: Row, data: Row) {
    queue.current = queue.current.then(() => send(sku, data));
  }

  async function send(sku: Row, data: Row) {
    setBusy(sku.id);
    try {
      const response = await fetch(`/api/admin/catalog/products/${productId}/skus/${sku.id}`, {
        method: "PATCH",
        headers: headers(versions.current.get(sku.id) ?? sku.updatedAt),
        body: JSON.stringify(data),
      });
      const body = await response.json().catch(() => ({}));
      const fresh = await reload();
      // A resposta pode se perder ou a segunda tentativa colidir com a primeira:
      // se o registro já tem o valor pedido, a gravação deu certo.
      const current = fresh?.find((entry) => entry.id === sku.id);
      const applied = current && Object.entries(data).every(([key, value]) => String(current[key]) === String(value));
      if (response.ok || applied) done(sku.id);
      else onMessage(formErrorMessage(body, "Não foi possível salvar o preço."));
    } catch {
      const current = (await reload())?.find((entry) => entry.id === sku.id);
      if (current && Object.entries(data).every(([key, value]) => String(current[key]) === String(value))) done(sku.id);
      else onMessage("Erro ao conectar com o servidor.");
    } finally {
      setBusy(null);
    }
  }

  async function create(price: number, trackStock: boolean, stockQuantity: number) {
    setBusy("new");
    try {
      const response = await fetch(`/api/admin/catalog/products/${productId}/skus`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          code: slug,
          label: null,
          price,
          trackStock,
          stockQuantity: trackStock ? stockQuantity : null,
          sortOrder: 0,
          aliases: [],
        }),
      });
      const body = await response.json().catch(() => ({}));
      const fresh = await reload();
      if (response.ok || fresh?.some((entry) => entry.code === slug)) done("new");
      else onMessage(formErrorMessage(body, "Não foi possível definir o preço."));
    } catch {
      if ((await reload())?.some((entry) => entry.code === slug)) done("new");
      else onMessage("Erro ao conectar com o servidor.");
    } finally {
      setBusy(null);
    }
  }

  const active = skus.filter((sku) => sku.isActive);

  if (!hasVariants) {
    const sku = active[0] ?? skus[0];
    return (
      <SkuFields
        key={sku?.id ?? "new"}
        sku={sku}
        busy={busy === (sku?.id ?? "new")}
        saved={saved === (sku?.id ?? "new")}
        onSave={(data) => (sku ? patch(sku, data) : create(data.price ?? 0, data.trackStock ?? true, data.stockQuantity ?? 0))}
      />
    );
  }

  if (!active.length) return <p className="text-xs text-content/55">Nenhuma variação à venda. Cadastre em Gerenciar variações.</p>;

  return (
    <div className="space-y-3">
      {active.map((sku) => (
        <div key={sku.id}>
          <p className="mb-1 truncate text-xs font-semibold text-content/70">{sku.label || sku.code}</p>
          <SkuFields
            sku={sku}
            compact
            busy={busy === sku.id}
            saved={saved === sku.id}
            onSave={(data) => patch(sku, data)}
          />
        </div>
      ))}
    </div>
  );
}

type SkuData = { price?: number; trackStock?: boolean; stockQuantity?: number | null };

function SkuFields({
  sku,
  busy,
  saved,
  compact = false,
  onSave,
}: {
  sku?: Row;
  busy: boolean;
  saved: boolean;
  compact?: boolean;
  onSave: (data: SkuData) => void;
}) {
  const [price, setPrice] = useState(priceText(sku?.price));
  const [stock, setStock] = useState(String(sku?.stockQuantity ?? 0));
  const [trackStock, setTrackStock] = useState(sku ? Boolean(sku.trackStock) : true);
  const parsed = parsePrice(price);

  function commitPrice() {
    if (parsed === null) {
      setPrice(priceText(sku?.price));
      return;
    }
    setPrice(priceText(parsed));
    if (!sku) onSave({ price: parsed, trackStock, stockQuantity: Number(stock) || 0 });
    else if (parsed !== Number(sku.price)) onSave({ price: parsed });
  }

  function commitStock() {
    const quantity = Math.max(0, Math.floor(Number(stock) || 0));
    setStock(String(quantity));
    if (sku && quantity !== (sku.stockQuantity ?? 0)) onSave({ stockQuantity: quantity });
  }

  function toggleStock(value: boolean) {
    setTrackStock(value);
    if (sku) onSave({ trackStock: value, stockQuantity: value ? Number(stock) || 0 : null });
  }

  return (
    <div className="grid grid-cols-[1fr_6rem] items-end gap-2">
      <label className="block">
        {compact ? null : <span className="mb-1 block text-[11px] font-semibold text-content/55">Preço (R$)</span>}
        <input
          inputMode="decimal"
          aria-label={`Preço ${sku?.label || sku?.code || ""}`.trim()}
          value={price}
          placeholder="0,00"
          onChange={(event) => setPrice(event.target.value)}
          onBlur={commitPrice}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className={`${fieldClass} font-display ${compact ? "text-base" : "text-xl"} font-semibold`}
        />
      </label>
      <label className="block">
        {compact ? null : <span className="mb-1 block text-[11px] font-semibold text-content/55">Estoque</span>}
        <input
          type="number"
          min="0"
          aria-label={`Estoque ${sku?.label || sku?.code || ""}`.trim()}
          disabled={!trackStock}
          value={trackStock ? stock : ""}
          placeholder="Livre"
          onChange={(event) => setStock(event.target.value)}
          onBlur={commitStock}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className={`${fieldClass} ${compact ? "" : "py-2"}`}
        />
      </label>
      <div className="col-span-2 flex items-center justify-between gap-2">
        <AdminSwitch checked={trackStock} onChange={toggleStock} label="Controlar estoque" />
        <span className="inline-flex items-center gap-1 text-[11px] text-content/55" aria-live="polite">
          {busy ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Salvando
            </>
          ) : saved ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" /> Salvo
            </>
          ) : !sku ? (
            "Grava ao sair do campo"
          ) : parsed !== null && !compact ? (
            `PIX ${BRL.format(parsed * 0.95)}`
          ) : null}
        </span>
      </div>
    </div>
  );
}
