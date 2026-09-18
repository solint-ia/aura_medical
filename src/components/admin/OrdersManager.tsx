"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, MapPin, Package, Search, Trash2, Truck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatBRL } from "@/lib/format";
import { inputClass } from "./AdminUi";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressSummary: string;
  uf: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  trackingCode: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUSES = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "em_transporte", label: "Em transporte" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

const STATUS_STYLE: Record<string, string> = {
  pago: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  entregue: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  em_transporte: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  pendente: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  cancelado: "bg-red-500/12 text-red-700 dark:text-red-300",
};

const PERIODS = [
  { value: "all", label: "Todo o período" },
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
];

const UFS = ["ALL", "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export function OrdersManager() {
  const { authToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [uf, setUf] = useState("ALL");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [trackingFor, setTrackingFor] = useState<AdminOrder | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [deleting, setDeleting] = useState<AdminOrder | null>(null);

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }),
    [authToken],
  );

  const load = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/orders?period=${period}&uf=${uf}&query=${encodeURIComponent(query)}`,
        { headers },
      );
      const data = await response.json();
      if (data.orders) setOrders(data.orders);
    } catch {
      setMessage("Falha ao carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, [authToken, headers, period, uf, query]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function updateOrder(id: string, patch: { status?: string; trackingCode?: string }) {
    const response = await fetch("/api/admin/orders", { method: "PUT", headers, body: JSON.stringify({ id, ...patch }) });
    const data = await response.json();
    if (!data.success) return setMessage(data.error ?? "Falha ao atualizar o pedido.");
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, ...patch } : order)));
    setMessage("Pedido atualizado.");
  }

  async function removeOrder(order: AdminOrder) {
    const response = await fetch(`/api/admin/orders?id=${order.id}`, {
      method: "DELETE",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    const data = await response.json();
    if (!data.success) return setMessage(data.error ?? "Falha ao excluir o pedido.");
    setOrders((current) => current.filter((entry) => entry.id !== order.id));
    setDeleting(null);
    setMessage("Pedido excluído.");
  }

  function exportCsv() {
    const header = ["Pedido", "Data", "Cliente", "E-mail", "UF", "Status", "Rastreio", "Total"];
    const lines = orders.map((order) =>
      [
        order.orderNumber,
        new Date(order.createdAt).toLocaleDateString("pt-BR"),
        order.customerName,
        order.customerEmail,
        order.uf,
        order.status,
        order.trackingCode || "",
        order.totalPrice.toFixed(2).replace(".", ","),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob([[header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const revenue = orders.filter((order) => order.status !== "cancelado").reduce((sum, order) => sum + order.totalPrice, 0);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[.18em] text-accent uppercase">Operação</p>
          <h1 className="mt-1 font-display text-4xl font-semibold">Pedidos</h1>
          <p className="mt-2 text-sm text-content/60">
            {orders.length} pedido(s) · {formatBRL(revenue)} em vendas no filtro atual
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-full border border-content/15 px-5 py-3 text-sm font-semibold"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_12rem_10rem]">
        <label className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-content/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por número, cliente ou e-mail…"
            className={`${inputClass} pl-9`}
          />
        </label>
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className={inputClass}>
          {PERIODS.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
        <select value={uf} onChange={(event) => setUf(event.target.value)} className={inputClass}>
          {UFS.map((entry) => (
            <option key={entry} value={entry}>
              {entry === "ALL" ? "Todos os estados" : entry}
            </option>
          ))}
        </select>
      </div>

      {message ? (
        <p role="status" className="mb-4 rounded-xl bg-raised p-3 text-sm">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-content/55">Carregando…</p>
      ) : orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[24px] border border-content/10 bg-card p-5 shadow-sm md:p-6">
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-content/10 pb-4">
                <div>
                  <p className="font-mono text-xs text-content/55">
                    PEDIDO <strong className="text-content">{order.orderNumber}</strong> ·{" "}
                    {new Date(order.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{order.customerName}</h2>
                  <p className="text-sm text-content/60">
                    {order.customerEmail}
                    {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-display text-2xl font-semibold">{formatBRL(order.totalPrice)}</p>
                  <select
                    value={order.status}
                    onChange={(event) => void updateOrder(order.id, { status: event.target.value })}
                    aria-label={`Status do pedido ${order.orderNumber}`}
                    className={`rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold uppercase ${STATUS_STYLE[order.status] ?? "bg-content/10"}`}
                  >
                    {STATUSES.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
              </header>

              <ul className="divide-y divide-content/8 py-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4 shrink-0 text-content/35" />
                      <span className="font-medium">{item.productName}</span>
                      <span className="font-mono text-xs text-content/55">
                        {item.quantity} × {formatBRL(item.unitPrice)}
                      </span>
                    </span>
                    <span className="font-mono">{formatBRL(item.totalPrice)}</span>
                  </li>
                ))}
              </ul>

              <div className="grid gap-4 border-t border-content/10 pt-4 text-sm md:grid-cols-[1fr_auto]">
                <div className="space-y-1.5 text-content/70">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-content/35" />
                    {order.addressSummary}
                  </p>
                  <p className="flex items-center gap-2">
                    <Truck className="h-4 w-4 shrink-0 text-content/35" />
                    {order.shippingMethod} ({formatBRL(order.shippingCost)}) · Pagamento: {order.paymentMethod}
                  </p>
                  <p className="font-mono text-xs">
                    Rastreio: {order.trackingCode ? <strong>{order.trackingCode}</strong> : <em>em preparação</em>}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTrackingFor(order);
                      setTrackingCode(order.trackingCode || "");
                    }}
                    className="rounded-full bg-action px-4 py-2 text-xs font-semibold text-action-fg"
                  >
                    {order.trackingCode ? "Editar rastreio" : "Adicionar rastreio"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(order)}
                    className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-1 inline h-3 w-3" />
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-[24px] border border-dashed border-content/15 py-16 text-center text-sm text-content/55">
          Nenhum pedido encontrado com esses filtros.
        </p>
      )}

      {trackingFor ? (
        <Modal title={`Rastreio do pedido ${trackingFor.orderNumber}`} onClose={() => setTrackingFor(null)}>
          <p className="text-sm text-content/65">
            Ao salvar um código, o pedido passa para “Em transporte” e o cliente recebe um e-mail com a atualização.
          </p>
          <input
            autoFocus
            value={trackingCode}
            onChange={(event) => setTrackingCode(event.target.value)}
            placeholder="Código de rastreamento"
            className={`mt-4 ${inputClass}`}
          />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setTrackingFor(null)} className="rounded-full border border-content/15 px-4 py-2 text-sm font-semibold">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                void updateOrder(trackingFor.id, {
                  trackingCode,
                  status: trackingCode ? "em_transporte" : trackingFor.status,
                });
                setTrackingFor(null);
              }}
              className="rounded-full bg-action px-5 py-2 text-sm font-semibold text-action-fg"
            >
              Salvar
            </button>
          </div>
        </Modal>
      ) : null}

      {deleting ? (
        <Modal title={`Excluir o pedido ${deleting.orderNumber}?`} onClose={() => setDeleting(null)}>
          <p className="text-sm text-content/65">
            Essa ação não pode ser desfeita e o histórico do cliente perde este registro.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className="rounded-full border border-content/15 px-4 py-2 text-sm font-semibold">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void removeOrder(deleting)}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Excluir
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-panel/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-lg rounded-[24px] border border-content/12 bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
