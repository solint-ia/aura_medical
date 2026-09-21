"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SaveBar, toSlug } from "./AdminUi";
import { ProductVisualEditor } from "./ProductVisualEditor";
import { formErrorMessage } from "./formErrors";
import { matchesSaved } from "./savedMatch";

type Row = Record<string, any>;

const emptyProduct: Row = {
  lineId: "",
  categoryId: "",
  slug: "",
  name: "",
  eyebrow: "",
  collection: "",
  summary: "",
  presentation: "",
  netContent: "",
  highlights: [],
  variantName: "",
  specs: [],
  regulatoryName: "",
  regulatoryNumber: "",
  weightGrams: null,
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  featured: false,
  featuredOrder: null,
  sortOrder: 0,
  visibility: "PUBLIC",
  sections: [],
  images: [],
  pending: [],
  skus: [],
};

const numberOrNull = (value: unknown) => (value === "" || value === null || value === undefined ? null : Number(value));

function normalizeProduct(product: Row) {
  return {
    ...emptyProduct,
    ...product,
    specs: product.specs ?? [],
    // Essas linhas são recriadas no servidor a cada salvamento. Não carregue
    // IDs efêmeros para o payload nem para a confirmação de `alreadySaved`.
    sections: (product.sections ?? []).map((section: Row) => ({
      title: section.title,
      body: section.body ?? "",
      items: section.items ?? [],
      sortOrder: section.sortOrder,
    })),
    images: (product.images ?? []).map((image: Row) => ({
      assetId: image.assetId,
      caption: image.caption ?? "",
      sortOrder: image.sortOrder,
    })),
    pending: (product.pending ?? []).map((field: Row) => ({
      label: field.label,
      isPublic: field.isPublic,
      resolvedAt: field.resolvedAt ?? null,
    })),
  };
}

export function ProductAdminForm({ title, endpoint, create = false }: { title: string; endpoint: string; create?: boolean }) {
  const { authToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Row>(emptyProduct);
  const [lines, setLines] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [state, setState] = useState<"saved" | "dirty" | "saving" | "conflict">("saved");
  const [message, setMessage] = useState("");
  const savingRef = useRef(false);

  function change(key: string, value: unknown) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      // O endereço da página nasce do nome e não muda depois: editá-lo quebraria
      // os links já publicados.
      if (key === "name" && !current.id) next.slug = toSlug(String(value));
      return next;
    });
    setState("dirty");
  }

  useEffect(() => {
    if (!authToken) return;
    const headers = { Authorization: `Bearer ${authToken}` };
    void Promise.all([
      fetch("/api/admin/catalog/lines", { headers }).then((response) => response.json()),
      fetch("/api/admin/catalog/categories", { headers }).then((response) => response.json()),
      create ? Promise.resolve(null) : fetch(endpoint, { headers }).then((response) => response.json()),
    ]).then(([lineData, categoryData, productData]) => {
      setLines(lineData.lines ?? []);
      setCategories(categoryData.categories ?? []);
      if (productData?.product) {
        setForm(normalizeProduct(productData.product));
      }
    });
  }, [authToken, create, endpoint]);

  /**
   * O servidor pode gravar e a resposta se perder no caminho — rede instável,
   * recompilação em desenvolvimento — ou a segunda tentativa bater de frente
   * com a primeira, que deu certo. Antes de acusar erro, conferimos o registro:
   * se ele já está como queríamos, a gravação foi um sucesso.
   */
  async function alreadySaved(payload: Row) {
    if (create || !form.id) return false;
    try {
      const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${authToken}` } });
      const data = await response.json();
      if (!data.product || !matchesSaved(payload, data.product)) return false;
      setForm(normalizeProduct(data.product));
      setState("saved");
      setMessage("Produto salvo.");
      return true;
    } catch {
      return false;
    }
  }

  async function save() {
    if (savingRef.current) return;
    savingRef.current = true;
    setState("saving");
    setMessage("");
    const payload = {
      ...form,
      categoryId: form.categoryId || null,
      collection: form.collection || null,
      netContent: form.netContent || null,
      variantName: form.variantName || null,
      regulatoryName: form.regulatoryName || null,
      regulatoryNumber: form.regulatoryNumber || null,
      weightGrams: numberOrNull(form.weightGrams),
      lengthCm: numberOrNull(form.lengthCm),
      widthCm: numberOrNull(form.widthCm),
      heightCm: numberOrNull(form.heightCm),
      skus: undefined,
      status: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      line: undefined,
      category: undefined,
      caseLinks: undefined,
    };
    try {
      const response = await fetch(endpoint, {
        method: create ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...(!create && form.updatedAt ? { "X-Record-Version": form.updatedAt } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) setState("conflict");
        throw new Error(formErrorMessage(data, "Não foi possível salvar o produto."));
      }
      setForm(normalizeProduct(data.product));
      setState("saved");
      setMessage("Produto salvo.");
      if (create) router.replace(`/admin/produtos/${data.product.id}`);
    } catch (error) {
      if (await alreadySaved(payload)) return;
      setMessage(error instanceof Error ? error.message : "Falha ao salvar.");
      setState((current) => (current === "conflict" ? current : "dirty"));
    } finally {
      savingRef.current = false;
    }
  }

  async function publish(action: "publish" | "archive") {
    if (!form.id) return;
    const response = await fetch(`/api/admin/catalog/products/${form.id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Falha na publicação.");
    setForm((current) => ({ ...current, status: data.product.status }));
    setMessage(action === "publish" ? "Produto publicado." : "Produto arquivado.");
  }

  return (
    <section className="max-w-[1440px]">
      <p className="font-mono text-xs tracking-wider text-accent uppercase">Catálogo de produtos</p>
      <h1 className="mt-1 mb-6 font-display text-3xl font-semibold">{title}</h1>

      <ProductVisualEditor
        form={form}
        change={change}
        lines={lines}
        categories={categories}
        onMessage={setMessage}
        onPublish={publish}
      />

      {message ? (
        <p role="status" className="mt-4 rounded-xl bg-raised p-3 text-sm">
          {message}
        </p>
      ) : null}

      <SaveBar state={state} onSave={() => void save()} disabled={!form.lineId || !form.name} />
    </section>
  );
}
