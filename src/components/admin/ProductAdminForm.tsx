"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AdminJsonEditor } from "./AdminJsonEditor";

interface LineOption {
  id: string;
  name: string;
  slug: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export function ProductAdminForm({
  title,
  endpoint,
  create = false,
}: {
  title: string;
  endpoint: string;
  create?: boolean;
}) {
  const { authToken } = useAuth();
  const router = useRouter();

  const [lines, setLines] = useState<LineOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [useJsonMode, setUseJsonMode] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>();

  // Campos do formulário
  const [lineId, setLineId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [eyebrow, setEyebrow] = useState("");
  const [collection, setCollection] = useState("");
  const [summary, setSummary] = useState("");
  const [presentation, setPresentation] = useState("");
  const [highlight1, setHighlight1] = useState("");
  const [highlight2, setHighlight2] = useState("");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  // Carrega linhas e categorias disponíveis
  useEffect(() => {
    if (!authToken) return;

    Promise.all([
      fetch("/api/admin/catalog/lines", { headers: { Authorization: `Bearer ${authToken}` } }).then((r) => r.json()),
      fetch("/api/admin/catalog/categories", { headers: { Authorization: `Bearer ${authToken}` } }).then((r) => r.json()),
      !create ? fetch(endpoint, { headers: { Authorization: `Bearer ${authToken}` } }).then((r) => r.json()) : Promise.resolve(null),
    ])
      .then(([linesData, catsData, prodData]) => {
        if (linesData.lines) setLines(linesData.lines);
        if (catsData.categories) setCategories(catsData.categories);

        if (prodData?.product) {
          const p = prodData.product;
          setUpdatedAt(p.updatedAt);
          setLineId(p.lineId || "");
          setCategoryId(p.categoryId || "");
          setName(p.name || "");
          setSlug(p.slug || "");
          setEyebrow(p.eyebrow || "");
          setCollection(p.collection || "");
          setSummary(p.summary || "");
          setPresentation(p.presentation || "");
          setHighlight1(p.highlights?.[0] || "");
          setHighlight2(p.highlights?.[1] || "");
          setFeatured(Boolean(p.featured));
          setSortOrder(p.sortOrder || 0);
        } else if (create && catsData.categories?.length) {
          // Padrão para novo produto se disponível
          setCategoryId(catsData.categories[0].id);
        }
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Erro ao carregar dados."))
      .finally(() => setLoading(false));
  }, [authToken, create, endpoint]);

  function handleNameChange(value: string) {
    setName(value);
    if (create && !slug) {
      const autoSlug = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(autoSlug);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Salvando...");

    if (!lineId) {
      setMessage("Selecione a Linha à qual o produto pertence.");
      return;
    }
    if (!categoryId) {
      setMessage("Selecione a Categoria (Profissional ou Doméstico).");
      return;
    }
    if (!name || !slug || !eyebrow || !summary || !presentation) {
      setMessage("Preencha todos os campos obrigatórios.");
      return;
    }

    const highlights = [highlight1.trim(), highlight2.trim()].filter(Boolean);

    const payload = {
      lineId,
      categoryId,
      name: name.trim(),
      slug: slug.trim(),
      eyebrow: eyebrow.trim(),
      collection: collection.trim() || undefined,
      summary: summary.trim(),
      presentation: presentation.trim(),
      highlights,
      featured,
      sortOrder: Number(sortOrder) || 0,
      specs: [],
    };

    try {
      const response = await fetch(endpoint, {
        method: create ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...(!create && updatedAt ? { "If-Match": updatedAt } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || JSON.stringify(data.fields) || "Falha ao salvar.");
      }

      setMessage("Produto salvo com sucesso!");
      const value = data.product;
      if (create && value?.id) {
        router.replace(`/admin/produtos/${value.id}`);
      } else if (value?.updatedAt) {
        setUpdatedAt(value.updatedAt);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar produto.");
    }
  }

  if (useJsonMode) {
    return (
      <div>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setUseJsonMode(false)}
            className="rounded-full border border-content/20 px-4 py-2 text-xs font-semibold hover:bg-content/5"
          >
            ← Voltar para Formulário Visual
          </button>
        </div>
        <AdminJsonEditor
          create={create}
          title={title}
          endpoint={endpoint}
          dataKey="product"
          template={{
            lineId: lineId || lines[0]?.id || "",
            categoryId: categoryId || categories[0]?.id || "",
            slug,
            name,
            eyebrow,
            collection,
            summary,
            presentation,
            highlights: [highlight1, highlight2].filter(Boolean),
            specs: [],
            featured,
            sortOrder,
          }}
        />
      </div>
    );
  }

  return (
    <section className="max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-accent">Catálogo de Produtos</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{title}</h1>
        </div>
        <button
          type="button"
          onClick={() => setUseJsonMode(true)}
          className="rounded-full border border-content/20 px-4 py-2 text-xs font-semibold hover:bg-content/5"
        >
          Modo JSON Avançado →
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-content/60">Carregando dados...</p>
      ) : (
        <form onSubmit={handleSave} className="mt-8 grid gap-6 rounded-3xl border border-content/12 bg-card p-6 sm:p-8 shadow-sm">
          {/* Categoria e Linha em destaque */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-content">
                Categoria do Produto <span className="text-amber-500">*</span>
              </label>
              <p className="mt-0.5 text-xs text-content/60">Selecione se o produto é de uso profissional ou doméstico</p>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none"
              >
                <option value="">Selecione uma categoria...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.slug === "profissional" ? "PBSerum / Clínico" : "La Cutanée / Home Care"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-content">
                Linha / Marca <span className="text-amber-500">*</span>
              </label>
              <p className="mt-0.5 text-xs text-content/60">Marca associada ao produto</p>
              <select
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none"
              >
                <option value="">Selecione uma linha...</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nome e Slug */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-content">
                Nome do Produto <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Ex.: Pbserum Slim+, Revytra C20+ Nano"
                className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-content">
                Slug (URL) <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="ex.: pbserum-slim-plus"
                className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm font-mono focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Eyebrow e Coleção */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-content">
                Subtítulo / Eyebrow <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                required
                placeholder="Ex.: Bioregenerativo recombinante, Sérum facial regenerativo"
                className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-content">Coleção / Família</label>
              <input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="Ex.: PBSerum Plus, La Cutanée.MED"
                className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Apresentação e Ordem */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-content">
                Apresentação <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={presentation}
                onChange={(e) => setPresentation(e.target.value)}
                required
                placeholder="Ex.: Ampola individual liofilizada, Frasco conta-gotas de 30 ml"
                className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-content/30 text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium">Destaque na Home</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Ordem:</span>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-16 rounded-lg border border-content/20 bg-canvas px-2 py-1 text-sm font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div>
            <label className="block text-sm font-semibold text-content">
              Resumo / Descrição Curta <span className="text-amber-500">*</span>
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              placeholder="Breve descrição dos benefícios e ativos do produto para o card..."
              className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </div>

          {/* Destaques */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-content">Destaque 1 (Tag do Card)</label>
              <input
                type="text"
                value={highlight1}
                onChange={(e) => setHighlight1(e.target.value)}
                placeholder="Ex.: Lipase, Vitamina C 20%"
                className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-content">Destaque 2 (Tag do Card)</label>
              <input
                type="text"
                value={highlight2}
                onChange={(e) => setHighlight2(e.target.value)}
                placeholder="Ex.: Redução de gordura, 30 ml"
                className="mt-2 w-full rounded-xl border border-content/20 bg-canvas px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="mt-4 flex items-center justify-between border-t border-content/10 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full border border-content/20 px-6 py-2.5 text-sm font-semibold hover:bg-content/5"
            >
              Cancelar
            </button>
            <div className="flex items-center gap-4">
              {message ? <p className="text-sm font-medium text-accent">{message}</p> : null}
              <button
                type="submit"
                className="rounded-full bg-action px-8 py-3 text-sm font-semibold text-action-fg hover:bg-action-hover shadow-md transition"
              >
                {create ? "Criar Produto" : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
