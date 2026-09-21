"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Plus, Trash2 } from "lucide-react";

import { assetUrl, type AdminAsset } from "./assetUrl";
import { FramingButton, FramingEditor } from "./FramingEditor";
import { framingStyle, toFraming } from "@/lib/imageFraming";
import { MediaModal } from "./AdminSelectors";
import { useMediaAssets } from "./useMediaAssets";
import { ClinicalCaseManager } from "./ClinicalCaseManager";
import { SkuManager } from "./SkuManager";
import { EditableLines, EditableText, EditRegion } from "./visual/EditableBits";
import { EditorDrawer } from "./visual/EditorDrawer";
import { PublicAddress, SidebarInput, SidebarSection } from "./visual/EditorSidebar";
import { AdminField, inputClass, StatusBadge } from "./AdminUi";
import { protocolVialsLabel } from "@/lib/protocolVials";

type Row = Record<string, any>;

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type Picking = { kind: "cover" } | { kind: "mapping" } | { kind: "gallery"; index: number } | null;

/** Mesma ideia do editor de produto, com os campos clínicos do protocolo. */
export function ProtocolVisualEditor({
  form,
  change,
  lines,
  products,
  derivedKits,
  onMessage,
  onPublish,
}: {
  form: Row;
  change: (key: string, value: unknown) => void;
  lines: Row[];
  products: Row[];
  derivedKits: number;
  onMessage: (message: string) => void;
  onPublish: (action: "publish" | "archive") => void;
}) {
  const { byId, reload } = useMediaAssets();
  const [picking, setPicking] = useState<Picking>(null);
  const [framingAsset, setFramingAsset] = useState<AdminAsset | null>(null);
  const [drawer, setDrawer] = useState<"precos" | "casos" | null>(null);

  const line = lines.find((entry) => entry.id === form.lineId);
  const images: Row[] = form.images ?? [];
  const components: Row[] = form.components ?? [];
  const skus: Row[] = form.skus ?? [];

  const activeSkus = skus.filter((sku) => sku.isActive);
  const cheapest = activeSkus.length ? Math.min(...activeSkus.map((sku) => Number(sku.price))) : null;
  const vials = components.reduce((sum, component) => sum + (Number(component.quantity) || 0), 0);

  const lineStyle = line
    ? ({
        "--line-surface-light": line.surfaceLight,
        "--line-surface-dark": line.surfaceDark,
        "--line-accent-light": line.accentLight,
        "--line-accent-dark": line.accentDark,
        "--line-ink-light": line.inkLight,
        "--line-ink-dark": line.inkDark,
      } as React.CSSProperties)
    : undefined;

  const coverAsset = byId.get(form.coverImageId);
  const mappingAsset = byId.get(form.mappingImageId);
  const cover = assetUrl(coverAsset);
  const mapping = assetUrl(mappingAsset);

  function pickedAsset(assetId: string) {
    if (!picking) return;
    if (picking.kind === "cover") change("coverImageId", assetId);
    else if (picking.kind === "mapping") change("mappingImageId", assetId);
    else {
      const next = [...images];
      if (picking.index >= next.length) next.push({ assetId, caption: "", sortOrder: next.length });
      else next[picking.index] = { ...next[picking.index], assetId };
      change("images", next.map((entry, position) => ({ ...entry, sortOrder: position })));
    }
    setPicking(null);
  }

  function updateComponent(index: number, patch: Row) {
    change(
      "components",
      components.map((entry, position) => (position === index ? { ...entry, ...patch } : entry)),
    );
  }

  return (
    <div className="line-scope grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" style={lineStyle}>
      <div className="min-w-0 rounded-[32px] border border-dashed border-content/20 bg-canvas p-5 md:p-8">
        <p className="mb-5 text-xs text-content/50">Clique em qualquer texto ou foto para editar.</p>
        <div className="grid gap-6 lg:grid-cols-2">
          <EditRegion label="Fotos">
            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[32px] bg-card md:min-h-[420px]">
              {cover ? <Image src={cover} alt="" fill sizes="46vw" className="object-cover" style={framingStyle(toFraming(coverAsset, "page"))} /> : <span className="text-sm text-content/40">Sem foto de capa</span>}
              <button
                type="button"
                onClick={() => setPicking({ kind: "cover" })}
                className="absolute inset-0 grid place-items-center text-sm font-semibold text-on-panel opacity-0 transition hover:bg-panel/55 hover:opacity-100"
              >
                {cover ? "Trocar foto de capa" : "Escolher foto de capa"}
              </button>
              {coverAsset ? <FramingButton onClick={() => setFramingAsset(coverAsset)} /> : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((image, index) => {
                const asset = byId.get(image.assetId);
                const url = assetUrl(asset);
                return (
                  <div key={index} className="group/thumb relative h-16 w-16 overflow-hidden rounded-xl border border-content/15 bg-raised">
                    {url ? <Image src={url} alt="" fill sizes="64px" className="object-cover" style={framingStyle(toFraming(asset, "page"))} /> : null}
                    <button
                      type="button"
                      onClick={() => setPicking({ kind: "gallery", index })}
                      className="absolute inset-0 bg-panel/60 opacity-0 transition group-hover/thumb:opacity-100"
                      aria-label={`Trocar foto ${index + 1}`}
                    />
                    {asset ? <FramingButton compact onClick={() => setFramingAsset(asset)} /> : null}
                    <button
                      type="button"
                      onClick={() => change("images", images.filter((_, position) => position !== index))}
                      aria-label={`Remover foto ${index + 1}`}
                      className="absolute right-0.5 bottom-0.5 rounded bg-canvas/90 p-0.5 opacity-0 transition group-hover/thumb:opacity-100"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setPicking({ kind: "gallery", index: images.length })}
                className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-content/25 text-content/40 hover:border-accent hover:text-accent"
                aria-label="Adicionar foto à galeria"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            </div>
          </EditRegion>

          <EditRegion label="Texto principal">
            <section className="rounded-[32px] border border-content/10 bg-card p-6 shadow-[0_18px_55px_rgba(18,40,60,0.08)] md:p-8">
              <p className="font-mono text-xs font-semibold tracking-[0.15em] text-(--line-accent) uppercase">
                {line?.name ?? "Marca"} · Protocolo clínico
              </p>

              <div className="mt-3">
                <EditableText
                  value={form.name ?? ""}
                  onChange={(value) => change("name", value)}
                  label="Nome do protocolo"
                  placeholder="Nome do protocolo"
                  className="font-display text-3xl leading-[1.08] font-semibold text-content sm:text-4xl"
                />
              </div>

              <div className="mt-4">
                <EditableText
                  value={form.introduction ?? ""}
                  onChange={(value) => change("introduction", value)}
                  label="Introdução"
                  placeholder="Parágrafo de abertura do protocolo"
                  multiline
                  className="text-base leading-relaxed text-content/72 md:text-lg"
                />
              </div>

              <dl className="mt-7 divide-y divide-content/10 border-y border-content/10 text-sm">
                <div className="grid grid-cols-[8rem_1fr] items-center gap-4 py-2">
                  <dt className="font-mono text-xs tracking-wider text-content/55 uppercase">Sessões</dt>
                  <dd>
                    <EditableText
                      value={form.sessions ?? ""}
                      onChange={(value) => change("sessions", value)}
                      label="Sessões"
                      placeholder="Ex.: 4 sessões"
                      className="font-semibold"
                    />
                  </dd>
                </div>
                <div className="grid grid-cols-[8rem_1fr] items-center gap-4 py-2">
                  <dt className="font-mono text-xs tracking-wider text-content/55 uppercase">Frequência</dt>
                  <dd>
                    <EditableText
                      value={form.frequency ?? ""}
                      onChange={(value) => change("frequency", value)}
                      label="Frequência"
                      placeholder="Ex.: a cada 15 dias"
                      className="font-semibold"
                    />
                  </dd>
                </div>
                <div className="grid grid-cols-[8rem_1fr] items-center gap-4 py-2">
                  <dt className="font-mono text-xs tracking-wider text-content/55 uppercase">Kit</dt>
                  <dd className="font-semibold">{protocolVialsLabel(form.slug ?? "", vials)}</dd>
                </div>
              </dl>

              <div className="mt-6 rounded-2xl border border-content/12 bg-raised p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-semibold">
                      {cheapest === null ? "Sem preço" : BRL.format(cheapest)}
                    </p>
                    <p className="mt-1 text-xs text-content/55">
                      {Number.isFinite(derivedKits)
                        ? derivedKits > 0
                          ? `A composição permite montar ${derivedKits} kit(s)`
                          : "Esgotado: falta ampola de algum produto do kit"
                        : "Sem limite de estoque na composição"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawer("precos")}
                    className="rounded-full bg-action px-4 py-2 text-xs font-semibold text-action-fg"
                  >
                    Editar preços e estoque
                  </button>
                </div>
              </div>
            </section>
          </EditRegion>
        </div>

        {/* Composição */}
        <div className="mt-10">
          <h2 className="mb-4 font-mono text-xs tracking-[.18em] text-content/50 uppercase">Composição do kit</h2>
          <div className="overflow-hidden rounded-2xl border border-content/10 bg-card">
            <table className="w-full text-left text-sm">
              <thead className="font-mono text-xs tracking-wider text-content/55 uppercase">
                <tr>
                  <th className="p-3">Ampolas</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Função</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {components.map((component, index) => (
                  <tr key={index} className="border-t border-content/10">
                    <td className="p-3">
                      <input
                        type="number"
                        min="1"
                        value={component.quantity ?? 1}
                        onChange={(event) => updateComponent(index, { quantity: Number(event.target.value) })}
                        className="w-16 rounded-lg border border-content/15 bg-canvas px-2 py-1"
                        aria-label={`Ampolas do item ${index + 1}`}
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={component.productId ?? ""}
                        onChange={(event) => updateComponent(index, { productId: event.target.value })}
                        className="w-full rounded-lg border border-content/15 bg-canvas px-2 py-1"
                        aria-label={`Produto do item ${index + 1}`}
                      >
                        <option value="">Selecione</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <EditableText
                        value={component.role ?? ""}
                        onChange={(value) => updateComponent(index, { role: value })}
                        label={`Função do item ${index + 1}`}
                        placeholder="O que esta ampola faz"
                        className="text-sm"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => change("components", components.filter((_, position) => position !== index))}
                        aria-label={`Remover item ${index + 1}`}
                        className="rounded p-1.5 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={() =>
                change("components", [...components, { productId: "", quantity: 1, role: "", sortOrder: components.length }])
              }
              className="w-full border-t border-dashed border-content/20 py-3 text-sm font-semibold text-content/55 hover:text-accent"
            >
              <Plus className="mr-1 inline h-4 w-4" />
              Adicionar produto ao kit
            </button>
          </div>
        </div>

        {/* Blocos clínicos fixos da página */}
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {(
            [
              ["Indicações", "indications"],
              ["Reconstituição", "reconstitution"],
              ["Resultados esperados", "expectedResults"],
            ] as const
          ).map(([label, key]) => (
            <EditRegion key={key} label={label}>
              <article className="rounded-2xl border border-content/10 bg-card p-5">
                <h3 className="font-display text-xl font-semibold">{label}</h3>
                <div className="mt-3">
                  <EditableLines
                    values={form[key] ?? []}
                    onChange={(values) => change(key, values)}
                    label={`Item de ${label.toLocaleLowerCase("pt-BR")}`}
                  />
                </div>
              </article>
            </EditRegion>
          ))}

          <EditRegion label="Marcação">
            <article className="rounded-2xl border border-content/10 bg-card p-5">
              <h3 className="font-display text-xl font-semibold">Marcação</h3>
              <div className="mt-3">
                <EditableText
                  value={form.marking ?? ""}
                  onChange={(value) => change("marking", value)}
                  label="Marcação"
                  placeholder="Como marcar as áreas de aplicação"
                  multiline
                  className="text-[15px] leading-[1.7] text-content/75"
                />
              </div>
              <div className="mt-5">
                <p className="mb-2 font-mono text-xs tracking-wider text-content/50 uppercase">Imagem de mapeamento</p>
                <div className="relative h-40 overflow-hidden rounded-xl border border-content/15 bg-raised">
                  {mapping ? <Image src={mapping} alt="" fill sizes="30vw" className="object-cover" style={framingStyle(toFraming(mappingAsset, "page"))} /> : null}
                  <button
                    type="button"
                    onClick={() => setPicking({ kind: "mapping" })}
                    className="absolute inset-0 grid place-items-center text-xs font-semibold text-on-panel opacity-0 transition hover:bg-panel/55 hover:opacity-100"
                  >
                    {mapping ? "Trocar imagem" : "Escolher imagem"}
                  </button>
                  {mappingAsset ? <FramingButton onClick={() => setFramingAsset(mappingAsset)} /> : null}
                  {!mapping ? (
                    <span className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-content/40">
                      Sem imagem de mapeamento
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          </EditRegion>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 font-mono text-xs tracking-[.18em] text-content/50 uppercase">Antes e depois</h2>
          <button
            type="button"
            disabled={!form.id}
            onClick={() => setDrawer("casos")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-content/25 py-5 text-sm font-semibold text-content/55 transition hover:border-accent hover:text-accent disabled:opacity-45"
          >
            <Plus className="h-4 w-4" />
            {form.id ? "Gerenciar casos clínicos deste protocolo" : "Salve o protocolo para adicionar casos"}
          </button>
        </div>
      </div>

      {/* Barra lateral fixa */}
      <aside className="rounded-[24px] border border-content/10 bg-card lg:sticky lg:top-6">
        <SidebarSection title="Publicação">
          <div className="flex items-center justify-between">
            <StatusBadge status={form.status} />
            {form.id ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onPublish("publish")}
                  className="rounded-full bg-action px-3 py-1.5 text-xs font-semibold text-action-fg"
                >
                  Publicar
                </button>
                <button
                  type="button"
                  onClick={() => onPublish("archive")}
                  className="rounded-full border border-content/15 px-3 py-1.5 text-xs font-semibold"
                >
                  Arquivar
                </button>
              </div>
            ) : null}
          </div>
          <AdminField label="Visibilidade" hint="Interno não aparece na vitrine">
            <select
              className={inputClass}
              value={form.visibility ?? "PUBLIC"}
              onChange={(event) => change("visibility", event.target.value)}
            >
              <option value="PUBLIC">Público</option>
              <option value="INTERNAL">Interno</option>
            </select>
          </AdminField>
          <SidebarInput
            label="Ordem na lista"
            type="number"
            value={String(form.sortOrder ?? 0)}
            onChange={(value) => change("sortOrder", Number(value) || 0)}
          />
        </SidebarSection>

        <SidebarSection title="Onde aparece">
          <AdminField label="Marca">
            <select className={inputClass} value={form.lineId ?? ""} onChange={(event) => change("lineId", event.target.value)}>
              <option value="">Selecione</option>
              {lines.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </AdminField>
        </SidebarSection>

        <SidebarSection title="Uso interno" collapsible>
          <AdminField label="Nota" hint="Observação exibida no fim da página">
            <textarea
              className={inputClass}
              rows={3}
              value={form.note ?? ""}
              onChange={(event) => change("note", event.target.value)}
            />
          </AdminField>
          <AdminField label="Aplicação" hint="Uma por linha. Campo interno: não aparece no site.">
            <textarea
              className={inputClass}
              rows={5}
              value={(form.application ?? []).join("\n")}
              onChange={(event) => change("application", event.target.value.split("\n").filter(Boolean))}
            />
          </AdminField>
        </SidebarSection>

        <SidebarSection title="Endereço no site">
          <PublicAddress path={`/protocolos/${form.slug || "…"}`} canOpen={Boolean(form.slug) && form.status === "PUBLISHED"} />
        </SidebarSection>
      </aside>

      {picking ? (
        <MediaModal
          defaults={{ category: "PROTOCOL", lineId: form.lineId || undefined }}
          value={
            picking.kind === "cover"
              ? (form.coverImageId ?? "")
              : picking.kind === "mapping"
                ? (form.mappingImageId ?? "")
                : (images[picking.index]?.assetId ?? "")
          }
          onClose={() => setPicking(null)}
          onPick={pickedAsset}
          onUploaded={reload}
        />
      ) : null}

      {framingAsset ? (
        <FramingEditor asset={framingAsset} onClose={() => setFramingAsset(null)} onSaved={reload} />
      ) : null}

      {drawer === "precos" ? (
        <EditorDrawer
          title="Preços e estoque"
          description="O protocolo fica esgotado assim que faltar ampola de qualquer produto do kit."
          onClose={() => setDrawer(null)}
        >
          <SkuManager owner="protocols" ownerId={form.id} skus={skus} onMessage={onMessage} derivedKits={derivedKits} />
        </EditorDrawer>
      ) : null}

      {drawer === "casos" && form.id ? (
        <EditorDrawer
          title="Antes e depois"
          description="As fotos aparecem na página pública deste protocolo."
          onClose={() => setDrawer(null)}
        >
          <ClinicalCaseManager owner="protocol" ownerId={form.id} />
        </EditorDrawer>
      ) : null}
    </div>
  );
}
