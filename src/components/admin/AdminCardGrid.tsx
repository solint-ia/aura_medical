"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { assetUrl, type AdminAsset } from "./assetUrl";
import { inputClass, StatusBadge } from "./AdminUi";

type Row = Record<string, any>;
type Variant = "product" | "protocol" | "line" | "case";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Listagem visual do catálogo: cada registro aparece como o card que o cliente
 * vê no site, não como linha de planilha.
 */
export function AdminCardGrid({
  endpoint,
  dataKey,
  title,
  eyebrow,
  editBase,
  variant,
  createLabel = "Cadastrar",
  description,
}: {
  endpoint: string;
  dataKey: string;
  title: string;
  eyebrow: string;
  editBase?: string;
  variant: Variant;
  createLabel?: string;
  description?: string;
}) {
  const { authToken } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    if (!authToken) return;
    void fetch(endpoint, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Falha ao carregar.");
        setRows(data[dataKey] || []);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [authToken, dataKey, endpoint]);

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        const haystack = `${row.name ?? ""} ${row.title ?? ""} ${row.slug ?? ""} ${row.line?.name ?? ""}`;
        const matchesQuery = haystack.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
        return matchesQuery && (status === "ALL" || String(row.status ?? "DRAFT") === status);
      }),
    [rows, query, status],
  );

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[.18em] text-accent uppercase">{eyebrow}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-content/60">{description}</p> : null}
        </div>
        {editBase ? (
          <Link
            href={`${editBase}/novo`}
            className="inline-flex items-center gap-2 rounded-full bg-action px-5 py-3 text-sm font-semibold text-action-fg"
          >
            <Plus className="h-4 w-4" />
            {createLabel}
          </Link>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="relative min-w-[16rem] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-content/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pelo nome…"
            className={`${inputClass} pl-9`}
          />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClass} w-auto`}>
          <option value="ALL">Todos os status</option>
          <option value="DRAFT">Rascunho</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-content/55">Carregando…</p>
      ) : visible.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((row) => (
            <Card key={row.id} row={row} variant={variant} href={editBase ? `${editBase}/${row.id}` : undefined} />
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-content/15 py-16 text-center">
          <p className="text-sm text-content/55">Nenhum registro encontrado.</p>
          {editBase ? (
            <Link href={`${editBase}/novo`} className="mt-3 inline-block text-sm font-semibold text-accent">
              {createLabel}
            </Link>
          ) : null}
        </div>
      )}

      {!loading && rows.length ? (
        <p className="mt-6 text-xs text-content/50">
          {visible.length} de {rows.length} registro(s)
        </p>
      ) : null}
    </section>
  );
}

function Card({ row, variant, href }: { row: Row; variant: Variant; href?: string }) {
  const body = (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-content/10 bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg">
      <Preview row={row} variant={variant} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[10px] tracking-[.16em] text-accent uppercase">
            {variant === "case"
              ? (row.professional ?? "Caso clínico")
              : variant === "line"
                ? (row.descriptor ?? "Marca")
                : (row.line?.name ?? "—")}
          </p>
          <StatusBadge status={row.status} />
        </div>
        <h2 className="mt-2 font-display text-lg leading-snug font-semibold">{row.name ?? row.title}</h2>
        <Meta row={row} variant={variant} />
        {href ? (
          <span className="mt-4 text-sm font-semibold text-accent group-hover:underline">Abrir editor</span>
        ) : null}
      </div>
    </article>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

function Preview({ row, variant }: { row: Row; variant: Variant }) {
  if (variant === "case") {
    const before = assetUrl(row.beforeImage as AdminAsset);
    const after = assetUrl(row.afterImage as AdminAsset);
    return (
      <div className="grid grid-cols-2 gap-px bg-content/10">
        {[
          ["Antes", before],
          ["Depois", after],
        ].map(([caption, url]) => (
          <div key={caption} className="relative aspect-[4/5] bg-raised">
            {url ? <Image src={url} alt="" fill sizes="25vw" className="object-cover" /> : null}
            <span className="absolute bottom-2 left-2 rounded-md bg-panel/85 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-on-panel uppercase">
              {caption}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const asset: AdminAsset | undefined =
    variant === "line"
      ? (row.media?.find((entry: Row) => entry.role === "HERO") ?? row.media?.[0])?.asset
      : variant === "protocol"
        ? (row.coverImage ?? row.images?.[0]?.asset)
        : row.images?.[0]?.asset;
  const url = assetUrl(asset);

  return (
    <div className="relative aspect-[16/10] bg-raised">
      {url ? (
        <Image
          src={url}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className={variant === "product" ? "object-contain p-6" : "object-cover"}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center font-mono text-[10px] tracking-wider text-content/35 uppercase">
          Sem imagem
        </span>
      )}
    </div>
  );
}

function Meta({ row, variant }: { row: Row; variant: Variant }) {
  if (variant === "line") {
    return (
      <p className="mt-2 text-sm text-content/60">
        {row._count?.products ?? 0} produto(s) · {row._count?.protocols ?? 0} protocolo(s)
      </p>
    );
  }

  if (variant === "case") {
    return (
      <div className="mt-2 space-y-1 text-sm text-content/60">
        <p>
          {row.sessions} sessão(ões)
          {row.country ? ` · ${row.country}` : ""}
        </p>
        <p className="flex flex-wrap gap-1.5 text-xs">
          {[...(row.products ?? []).map((link: Row) => link.product?.name), ...(row.protocols ?? []).map((link: Row) => link.protocol?.name)]
            .filter(Boolean)
            .map((label: string) => (
              <span key={label} className="rounded-full bg-raised px-2 py-0.5">
                {label}
              </span>
            ))}
        </p>
        {!row.imageRightsConfirmed ? (
          <p className="font-semibold text-red-600 dark:text-red-400">Sem confirmação de direito de imagem</p>
        ) : null}
      </div>
    );
  }

  const prices = (row.skus ?? []).filter((sku: Row) => sku.isActive).map((sku: Row) => Number(sku.price));
  const cheapest = prices.length ? Math.min(...prices) : null;

  return (
    <div className="mt-2 space-y-1 text-sm text-content/60">
      {row.summary || row.introduction ? <p className="line-clamp-2">{row.summary ?? row.introduction}</p> : null}
      <p className="font-mono text-xs">
        {cheapest === null ? "Sem preço cadastrado" : `A partir de ${BRL.format(cheapest)}`}
        {variant === "protocol" && row.components?.length ? ` · ${row.components.length} produto(s) no kit` : ""}
      </p>
    </div>
  );
}
