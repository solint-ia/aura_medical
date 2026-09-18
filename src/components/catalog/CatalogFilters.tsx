"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { CatalogItem } from "@/data/catalog";
import { CatalogCard } from "./CatalogCard";

const ITEMS_PER_PAGE = 9;

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function CatalogFilters({ items }: { items: CatalogItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const line = searchParams.get("linha") || "";
  const category = searchParams.get("categoria") || "";
  const typeParam = searchParams.get("tipo") || "";
  const pageParam = parseInt(searchParams.get("pagina") || "1", 10);
  const rawPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const lines = useMemo(
    () => [...new Map(items.map((item) => [item.line, item.lineInfo?.name || item.line])).entries()],
    [items],
  );

  // Garante que apareçam exclusivamente "Profissional" e "Doméstico" (e futuras categorias se cadastradas)
  const categories = useMemo(() => {
    const present = new Set(
      items
        .filter((item) => !line || item.line === line)
        .map((item) => item.category)
        .filter(Boolean),
    );

    const list: { slug: string; name: string }[] = [];
    if (present.has("Profissional")) list.push({ slug: "profissional", name: "Profissional" });
    if (present.has("Doméstico")) list.push({ slug: "domestico", name: "Doméstico" });

    present.forEach((cat) => {
      if (cat !== "Profissional" && cat !== "Doméstico") {
        list.push({ slug: slugify(cat), name: cat });
      }
    });

    return list;
  }, [items, line]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesLine = !line || item.line === line;
      const matchesCategory = !category || slugify(item.category) === category;
      const matchesType =
        !typeParam ||
        (typeParam === "produtos" ? item.kind === "product" : item.kind === "protocol");
      return matchesLine && matchesCategory && matchesType;
    });
  }, [items, line, category, typeParam]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const currentPage = Math.min(rawPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  function update(key: "linha" | "categoria" | "tipo", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);

    if (key === "linha") params.delete("categoria");
    params.delete("pagina"); // reseta a página ao mudar qualquer filtro
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  function goToPage(page: number) {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage > 1) {
      params.set("pagina", String(targetPage));
    } else {
      params.delete("pagina");
    }
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });

    // Scroll suave até o topo da listagem de produtos
    const anchor = document.getElementById("catalogo-grid");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }


  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  return (
    <div>
      {/* Abas de Tipo: Todos, Produtos, Protocolos */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        {[
          { id: "", label: "Todos os Itens" },
          { id: "produtos", label: "Produtos Individuais" },
          { id: "protocolos", label: "Protocolos Clínicos" },
        ].map((tab) => {
          const isActive = typeParam === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => update("tipo", tab.id)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-action text-action-fg shadow-sm"
                  : "border border-content/15 bg-card text-content/75 hover:border-content/30 hover:text-content"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Barra de Filtros: Linha, Categoria, Limpar */}
      <div className="mb-8 grid gap-4 rounded-[24px] border border-content/10 bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-semibold">
          Linha / Marca
          <select
            value={line}
            onChange={(event) => update("linha", event.target.value)}
            className="min-h-11 rounded-xl border border-content/15 bg-canvas px-3 font-normal"
          >
            <option value="">Todas as linhas</option>
            {lines.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Categoria
          <select
            value={category}
            onChange={(event) => update("categoria", event.target.value)}
            className="min-h-11 rounded-xl border border-content/15 bg-canvas px-3 font-normal"
          >
            <option value="">Todas as categorias</option>
            {categories.map(({ slug, name }) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          disabled={!line && !category && !typeParam && !searchParams.get("pagina")}
          className="min-h-11 rounded-full border border-content/20 px-5 text-sm font-semibold disabled:opacity-40 hover:bg-content/5 transition"
        >
          Limpar filtros
        </button>
      </div>

      <div id="catalogo-grid" className="scroll-mt-36 mb-5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-content/65">
        <p aria-live="polite" className="uppercase tracking-wider">
          {filtered.length === 0
            ? "Nenhum item encontrado"
            : filtered.length === 1
            ? "1 item encontrado"
            : `Exibindo ${startIdx}–${endIdx} de ${filtered.length} itens`}
        </p>
        {totalPages > 1 && (
          <span className="font-semibold text-accent">
            Página {currentPage} de {totalPages}
          </span>
        )}
      </div>

      {filtered.length ? (
        <>
          {/* Grid de 3 colunas (máximo 3 linhas = 9 produtos por página) */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((item) => (
              <CatalogCard key={`${item.kind}-${item.slug}`} item={item} />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginação do catálogo"
              className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-content/10 pt-8"
            >
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1.5 rounded-full border border-content/15 bg-card px-4 py-2.5 text-xs font-semibold text-content transition-colors hover:border-content/30 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => goToPage(pageNum)}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`h-10 min-w-10 rounded-full font-mono text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-action text-action-fg shadow-sm"
                          : "border border-content/15 bg-card text-content/80 hover:border-content/30 hover:text-content"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1.5 rounded-full border border-content/15 bg-card px-4 py-2.5 text-xs font-semibold text-content transition-colors hover:border-content/30 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span>Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="rounded-[24px] border border-dashed border-content/20 p-10 text-center">
          <p>Nenhum item encontrado para os filtros selecionados.</p>
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="mt-4 font-semibold text-accent"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
