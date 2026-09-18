"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SaveBar, toSlug } from "./AdminUi";
import { ProtocolVisualEditor } from "./ProtocolVisualEditor";

type Row = Record<string, any>;

async function responseData(response: Response): Promise<Row> {
  const body = await response.text();
  if (!body.trim()) return { error: "O servidor retornou uma resposta vazia. Tente salvar novamente." };
  try {
    return JSON.parse(body) as Row;
  } catch {
    return { error: "O servidor retornou uma resposta inválida. Tente salvar novamente." };
  }
}

const empty: Row = {
  lineId: "",
  slug: "",
  name: "",
  introduction: "",
  note: "",
  indications: [],
  sessions: "",
  frequency: "",
  reconstitution: [],
  application: [],
  marking: "",
  expectedResults: [],
  coverImageId: "",
  mappingImageId: "",
  visibility: "PUBLIC",
  sortOrder: 0,
  components: [],
  images: [],
  skus: [],
  status: "DRAFT",
};

/** Espelha `kitsFromComponents` do servidor, para avisar o admin em tempo real. */
function kitsAvailable(components: Row[], products: Row[]) {
  return components.reduce((fewest: number, component: Row) => {
    const product = products.find((entry) => entry.id === component.productId);
    const active = (product?.skus ?? []).filter((sku: Row) => sku.isActive);
    const units =
      active.length === 0 || active.some((sku: Row) => !sku.trackStock)
        ? Infinity
        : active.reduce((sum: number, sku: Row) => sum + (sku.stockQuantity ?? 0), 0);
    const quantity = Number(component.quantity) || 0;
    return Math.min(fewest, quantity > 0 ? Math.floor(units / quantity) : units);
  }, Infinity);
}

export function ProtocolAdminForm({ endpoint, create = false }: { endpoint: string; create?: boolean }) {
  const { authToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Row>(empty);
  const [lines, setLines] = useState<Row[]>([]);
  const [products, setProducts] = useState<Row[]>([]);
  const [state, setState] = useState<"saved" | "dirty" | "saving" | "conflict">("saved");
  const [message, setMessage] = useState("");

  function change(key: string, value: unknown) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      // O endereço da página nasce do nome e não muda depois.
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
      fetch("/api/admin/catalog/products", { headers }).then((response) => response.json()),
      create ? Promise.resolve(null) : fetch(endpoint, { headers }).then((response) => response.json()),
    ]).then(([lineData, productData, protocolData]) => {
      setLines(lineData.lines ?? []);
      setProducts(productData.products ?? []);
      if (protocolData?.protocol) {
        setForm({
          ...empty,
          ...protocolData.protocol,
          images: (protocolData.protocol.images ?? []).map((image: Row) => ({
            assetId: image.assetId,
            caption: image.caption ?? "",
            sortOrder: image.sortOrder,
          })),
        });
      }
    });
  }, [authToken, create, endpoint]);

  async function save() {
    setState("saving");
    setMessage("");
    const payload = {
      ...form,
      coverImageId: form.coverImageId || null,
      mappingImageId: form.mappingImageId || null,
      line: undefined,
      coverImage: undefined,
      mappingImage: undefined,
      skus: undefined,
      caseLinks: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      status: undefined,
    };
    try {
      const response = await fetch(endpoint, {
        method: create ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...(!create && form.updatedAt ? { "If-Match": form.updatedAt } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await responseData(response);
      if (!response.ok || !data.protocol) {
        setState(response.status === 409 ? "conflict" : "dirty");
        return setMessage(data.error || JSON.stringify(data.fields) || "Não foi possível salvar o protocolo.");
      }
      setForm((current) => ({ ...current, ...data.protocol }));
      setState("saved");
      setMessage("Protocolo salvo.");
      if (create) router.replace(`/admin/protocolos/${data.protocol.id}`);
    } catch (error) {
      setState("dirty");
      setMessage(error instanceof Error ? `Falha ao salvar: ${error.message}` : "Falha de comunicação ao salvar o protocolo.");
    }
  }

  async function publish(action: "publish" | "archive") {
    if (!form.id) return;
    const response = await fetch(`/api/admin/catalog/protocols/${form.id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await responseData(response);
    if (!response.ok) return setMessage(data.error || "Falha na publicação.");
    setForm((current) => ({ ...current, status: data.protocol.status }));
    setMessage(action === "publish" ? "Protocolo publicado." : "Protocolo arquivado.");
  }

  return (
    <section className="max-w-[1440px]">
      <p className="font-mono text-xs tracking-wider text-accent uppercase">Protocolos</p>
      <h1 className="mt-1 mb-6 font-display text-3xl font-semibold">
        {create ? "Novo protocolo" : `Editar ${form.name || "protocolo"}`}
      </h1>

      <ProtocolVisualEditor
        form={form}
        change={change}
        lines={lines}
        products={products}
        derivedKits={kitsAvailable(form.components ?? [], products)}
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
