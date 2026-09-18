"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { inputClass } from "./AdminUi";

interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  createdAt: string;
}

const ACTION_LABEL: Record<string, string> = {
  create: "criou",
  update: "alterou",
  delete: "excluiu",
  publish: "publicou",
  archive: "arquivou",
};

const ENTITY_LABEL: Record<string, string> = {
  Product: "Produto",
  Protocol: "Protocolo",
  Line: "Marca",
  Category: "Categoria",
  ClinicalCase: "Caso clínico",
  MediaAsset: "Imagem",
  Sku: "Preço",
};

export function AuditTrail() {
  const { authToken } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) return;
    void fetch("/api/admin/audit", { headers: { Authorization: `Bearer ${authToken}` } })
      .then((response) => response.json())
      .then((data) => setLogs(data.logs ?? []))
      .finally(() => setLoading(false));
  }, [authToken]);

  const visible = useMemo(
    () =>
      logs.filter((log) =>
        `${ENTITY_LABEL[log.entity] ?? log.entity} ${log.action} ${log.entityId}`
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR")),
      ),
    [logs, query],
  );

  return (
    <section>
      <div className="mb-6">
        <p className="font-mono text-xs tracking-[.18em] text-accent uppercase">Operação</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Auditoria</h1>
        <p className="mt-2 max-w-2xl text-sm text-content/60">
          Últimas 200 alterações feitas no catálogo, com quem mexeu e quando.
        </p>
      </div>

      <label className="relative mb-6 block max-w-xl">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-content/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filtrar por tipo ou ação…"
          className={`${inputClass} pl-9`}
        />
      </label>

      {loading ? (
        <p className="py-16 text-center text-sm text-content/55">Carregando…</p>
      ) : visible.length ? (
        <ol className="space-y-px overflow-hidden rounded-[24px] border border-content/10 bg-card">
          {visible.map((log) => (
            <li key={log.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-content/8 px-5 py-4 text-sm last:border-b-0">
              <span>
                <strong className="font-semibold">{ENTITY_LABEL[log.entity] ?? log.entity}</strong>{" "}
                <span className="text-content/65">{ACTION_LABEL[log.action] ?? log.action}</span>{" "}
                <span className="font-mono text-xs text-content/45">{log.entityId.slice(0, 8)}</span>
              </span>
              <time dateTime={log.createdAt} className="font-mono text-xs text-content/50">
                {new Date(log.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-[24px] border border-dashed border-content/15 py-16 text-center text-sm text-content/55">
          Nenhum registro de auditoria.
        </p>
      )}
    </section>
  );
}
