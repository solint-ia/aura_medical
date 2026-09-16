"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function AdminResourceList({ endpoint, dataKey, title, editBase }: { endpoint: string; dataKey: string; title: string; editBase?: string }) {
  const { authToken } = useAuth();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { if (!authToken) return; void fetch(endpoint, { headers: { Authorization: `Bearer ${authToken}` } }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Falha ao carregar."); setRows(data[dataKey] || []); }).catch((reason) => setError(reason.message)); }, [authToken, dataKey, endpoint]);
  return <section><div className="mb-6 flex items-end justify-between"><div><p className="font-mono text-xs uppercase tracking-wider text-accent">Catálogo</p><h1 className="font-display text-4xl font-semibold">{title}</h1></div>{editBase ? <Link href={`${editBase}/novo`} className="rounded-full bg-action px-5 py-3 text-sm font-semibold text-action-fg">Cadastrar</Link> : null}</div>{error ? <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-red-700">{error}</p> : null}<div className="overflow-x-auto rounded-2xl border border-content/10 bg-card"><table className="w-full text-left text-sm"><thead><tr className="border-b border-content/10 font-mono text-xs uppercase tracking-wider text-content/55"><th className="p-4">Nome/chave</th><th className="p-4">Status</th><th className="p-4">Ação</th></tr></thead><tbody>{rows.map((row, index) => { const id = String(row.id || row.key || index); const label = String(row.name || row.title || row.label || row.question || row.key || id); return <tr key={id} className="border-b border-content/8"><td className="p-4 font-semibold">{label}</td><td className="p-4">{String(row.status || (row.isPublished ? "Publicado" : "Rascunho") || "")}</td><td className="p-4">{editBase && row.id ? <Link href={`${editBase}/${row.id}`} className="font-semibold text-accent">Editar</Link> : "—"}</td></tr>; })}</tbody></table>{!rows.length && !error ? <p className="p-8 text-center text-content/55">Nenhum registro.</p> : null}</div></section>;
}
