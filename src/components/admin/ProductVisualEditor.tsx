"use client";

import { useState } from "react";
import Image from "next/image";
import { GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";

import { assetUrl } from "./assetUrl";
import { MediaModal } from "./AdminSelectors";
import { AdminField, AdminSwitch, inputClass, StatusBadge } from "./AdminUi";
import { useMediaAssets } from "./useMediaAssets";
import { ClinicalCaseManager } from "./ClinicalCaseManager";
import { SkuManager } from "./SkuManager";
import { EditableLines, EditableTagList, EditableText, EditRegion } from "./visual/EditableBits";
import { EditorDrawer } from "./visual/EditorDrawer";
import { PairEditor, PublicAddress, SidebarInput, SidebarSection } from "./visual/EditorSidebar";

type Row = Record<string, any>;

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const SECTION_PRESETS = ["Mecanismo de ação", "Indicações", "Como usar", "Benefícios", "Tecnologia", "Registro ANVISA"];

/**
 * Edição na própria página: à esquerda o produto como o cliente vê, com cada
 * pedaço clicável; à direita uma barra fixa com o que não aparece na página.
 */
export function ProductVisualEditor({
  form,
  change,
  lines,
  categories,
  onMessage,
  onPublish,
}: {
  form: Row;
  change: (key: string, value: unknown) => void;
  lines: Row[];
  categories: Row[];
  onMessage: (message: string) => void;
  onPublish: (action: "publish" | "archive") => void;
}) {
  const { byId, reload } = useMediaAssets();
  const [picking, setPicking] = useState<number | null>(null);
  const [drawer, setDrawer] = useState<"precos" | "casos" | null>(null);

  const line = lines.find((entry) => entry.id === form.lineId);
  const category = categories.find((entry) => entry.id === form.categoryId);
  const images: Row[] = form.images ?? [];
  const sections: Row[] = form.sections ?? [];
  const skus: Row[] = form.skus ?? [];

  const activeSkus = skus.filter((sku) => sku.isActive);
  const cheapest = activeSkus.length ? Math.min(...activeSkus.map((sku) => Number(sku.price))) : null;
  const tracked = activeSkus.filter((sku) => sku.trackStock);
  const units =
    activeSkus.length > 0 && tracked.length === activeSkus.length
      ? tracked.reduce((sum, sku) => sum + (sku.stockQuantity ?? 0), 0)
      : null;

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

  function setImageAt(index: number, assetId: string) {
    if (images.some((image, position) => position !== index && image.assetId === assetId)) {
      onMessage("Esta foto já está na galeria. Arraste as miniaturas para reordenar.");
      return;
    }
    const next = [...images];
    if (index >= next.length) next.push({ assetId, caption: "", sortOrder: next.length });
    else next[index] = { ...next[index], assetId };
    change("images", next.map((entry, position) => ({ ...entry, sortOrder: position })));
  }

  function moveImage(from: number, to: number) {
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    change("images", next.map((entry, position) => ({ ...entry, sortOrder: position })));
  }

  function updateSection(index: number, patch: Row) {
    change(
      "sections",
      sections.map((entry, position) => (position === index ? { ...entry, ...patch } : entry)),
    );
  }

  const cover = images[0] ? assetUrl(byId.get(images[0].assetId)) : "";

  return (
    <div className="line-scope grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" style={lineStyle}>
      {/* Prévia da página */}
      <div className="min-w-0 rounded-[32px] border border-dashed border-content/20 bg-canvas p-5 md:p-8">
        <p className="mb-5 text-xs text-content/50">Clique em qualquer texto ou foto para editar.</p>

        <div className="grid gap-6 xl:grid-cols-2">
          <EditRegion label="Fotos">
            <div className="product-halo relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[32px] md:min-h-[400px]">
              {cover ? (
                <Image src={cover} alt="" fill sizes="40vw" className="object-contain p-8" />
              ) : (
                <span className="text-sm text-content/40">Sem foto</span>
              )}
              <button
                type="button"
                onClick={() => setPicking(0)}
                className="absolute inset-0 grid place-items-center text-sm font-semibold text-on-panel opacity-0 transition hover:bg-panel/55 hover:opacity-100"
              >
                {cover ? "Trocar foto de capa" : "Escolher foto de capa"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((image, index) => {
                const url = assetUrl(byId.get(image.assetId));
                return (
                  <div
                    key={index}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      moveImage(Number(event.dataTransfer.getData("text/plain")), index);
                    }}
                    className="group/thumb relative h-16 w-16 overflow-hidden rounded-xl border border-content/15 bg-raised"
                  >
                    {url ? <Image src={url} alt="" fill sizes="64px" className="object-contain" /> : null}
                    <button
                      type="button"
                      onClick={() => setPicking(index)}
                      className="absolute inset-0 bg-panel/60 opacity-0 transition group-hover/thumb:opacity-100"
                      aria-label={`Trocar foto ${index + 1}`}
                    />
                    <span className="pointer-events-none absolute top-0.5 left-0.5 opacity-0 group-hover/thumb:opacity-100">
                      <GripVertical className="h-3 w-3 text-on-panel" />
                    </span>
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
                onClick={() => setPicking(images.length)}
                className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-content/25 text-content/40 hover:border-accent hover:text-accent"
                aria-label="Adicionar foto à galeria"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-content/45">A primeira foto é a capa. Arraste as miniaturas para reordenar.</p>
          </EditRegion>

          <EditRegion label="Texto principal">
            <section className="rounded-[32px] border border-content/10 bg-card p-6 shadow-[0_18px_55px_rgba(18,40,60,0.08)] md:p-8">
              <p className="font-mono text-xs font-semibold tracking-[0.15em] text-(--line-accent) uppercase">
                {line?.name ?? "Marca"} · {category?.name ?? "Categoria"}
              </p>

              <div className="mt-3">
                <EditableText
                  value={form.name ?? ""}
                  onChange={(value) => change("name", value)}
                  label="Nome do produto"
                  placeholder="Nome do produto"
                  className="font-display text-3xl leading-[1.08] font-semibold text-content"
                />
              </div>

              <div className="mt-4">
                <EditableText
                  value={form.eyebrow ?? ""}
                  onChange={(value) => change("eyebrow", value)}
                  label="Linha de apoio"
                  placeholder="Linha de apoio (texto curto acima do nome)"
                  className="font-mono text-xs tracking-wider text-content/55 uppercase"
                />
              </div>

              <div className="mt-4">
                <EditableText
                  value={form.summary ?? ""}
                  onChange={(value) => change("summary", value)}
                  label="Resumo"
                  placeholder="Resumo do produto, um parágrafo"
                  multiline
                  className="text-base leading-relaxed text-content/72"
                />
              </div>

              <div className="mt-5">
                <EditableTagList
                  values={form.highlights ?? []}
                  onChange={(values) => change("highlights", values.slice(0, 2))}
                  max={2}
                  label="Destaque"
                />
              </div>

              <dl className="mt-7 divide-y divide-content/10 border-y border-content/10 text-sm">
                <div className="grid grid-cols-[8rem_1fr] items-center gap-4 py-2">
                  <dt className="font-mono text-xs tracking-wider text-content/55 uppercase">Apresentação</dt>
                  <dd>
                    <EditableText
                      value={form.presentation ?? ""}
                      onChange={(value) => change("presentation", value)}
                      label="Apresentação"
                      placeholder="Ex.: frasco de 5 ml"
                      className="font-semibold"
                    />
                  </dd>
                </div>
              </dl>

              <div className="mt-6 rounded-2xl border border-content/12 bg-raised p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-semibold">
                      {cheapest === null ? "Sem preço" : BRL.format(cheapest)}
                    </p>
                    <p className="mt-1 text-xs text-content/55">
                      {activeSkus.length === 0
                        ? "Cadastre um preço para poder publicar"
                        : units === null
                          ? `${activeSkus.length} opção(ões) · estoque livre`
                          : units > 0
                            ? `${activeSkus.length} opção(ões) · ${units} em estoque`
                            : "Esgotado no site"}
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

        <div className="mt-10">
          <h2 className="mb-4 font-mono text-xs tracking-[.18em] text-content/50 uppercase">Descrições da página</h2>
          <div className="space-y-4">
            {sections.map((section, index) => (
              <EditRegion key={index} label={`Bloco ${index + 1}`}>
                <article className="grid gap-4 rounded-2xl border border-content/10 bg-card p-5 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] lg:gap-8">
                  <div>
                    <EditableText
                      value={section.title ?? ""}
                      onChange={(value) => updateSection(index, { title: value })}
                      label={`Título do bloco ${index + 1}`}
                      placeholder="Título do bloco"
                      className="font-display text-xl font-semibold"
                    />
                    {!section.title ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {SECTION_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => updateSection(index, { title: preset })}
                            className="rounded-full border border-content/15 px-2.5 py-1 text-[11px] text-content/60 hover:border-accent hover:text-accent"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => change("sections", sections.filter((_, position) => position !== index))}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remover bloco
                    </button>
                  </div>
                  <div>
                    <EditableText
                      value={section.body ?? ""}
                      onChange={(value) => updateSection(index, { body: value })}
                      label={`Texto do bloco ${index + 1}`}
                      placeholder="Texto corrido (opcional)"
                      multiline
                      className="text-[15px] leading-[1.7] text-content/75"
                    />
                    <div className="mt-3">
                      <EditableLines
                        values={section.items ?? []}
                        onChange={(values) => updateSection(index, { items: values })}
                        label={`Item do bloco ${index + 1}`}
                      />
                    </div>
                  </div>
                </article>
              </EditRegion>
            ))}

            <button
              type="button"
              onClick={() => change("sections", [...sections, { title: "", body: "", items: [], sortOrder: sections.length }])}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-content/25 py-5 text-sm font-semibold text-content/55 hover:border-accent hover:text-accent"
            >
              <Plus className="h-4 w-4" />
              Adicionar bloco de descrição
            </button>
          </div>
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
            {form.id ? "Gerenciar casos clínicos deste produto" : "Salve o produto para adicionar casos"}
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
          <AdminSwitch
            checked={Boolean(form.featured)}
            onChange={(value) => change("featured", value)}
            label="Destaque na home"
          />
          {form.featured ? (
            <SidebarInput
              label="Ordem do destaque"
              type="number"
              value={String(form.featuredOrder ?? "")}
              onChange={(value) => change("featuredOrder", value ? Number(value) : null)}
            />
          ) : null}
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
          <AdminField label="Categoria">
            <select
              className={inputClass}
              value={form.categoryId ?? ""}
              onChange={(event) => change("categoryId", event.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </AdminField>
        </SidebarSection>

        <SidebarSection title="Frete e ficha técnica" collapsible>
          <SidebarInput
            label="Conteúdo líquido"
            hint="Ex.: 5 ml"
            value={form.netContent ?? ""}
            onChange={(value) => change("netContent", value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <SidebarInput
              label="Peso (g)"
              type="number"
              value={String(form.weightGrams ?? "")}
              onChange={(value) => change("weightGrams", value)}
            />
            <SidebarInput
              label="Compr. (cm)"
              type="number"
              value={String(form.lengthCm ?? "")}
              onChange={(value) => change("lengthCm", value)}
            />
            <SidebarInput
              label="Largura (cm)"
              type="number"
              value={String(form.widthCm ?? "")}
              onChange={(value) => change("widthCm", value)}
            />
            <SidebarInput
              label="Altura (cm)"
              type="number"
              value={String(form.heightCm ?? "")}
              onChange={(value) => change("heightCm", value)}
            />
          </div>
          <p className="rounded-xl bg-raised p-3 text-xs text-content/60">
            Sem dimensões, o frete usa o padrão de 10 × 15 × 20 cm e 0,5 kg.
          </p>
          <div>
            <p className="mb-2 text-sm font-semibold">Pares da ficha</p>
            <PairEditor rows={form.specs ?? []} onChange={(rows) => change("specs", rows)} />
          </div>
        </SidebarSection>

        <SidebarSection title="Endereço no site">
          <PublicAddress path={`/produtos/${form.slug || "…"}`} canOpen={Boolean(form.slug) && form.status === "PUBLISHED"} />
        </SidebarSection>
      </aside>

      {picking !== null ? (
        <MediaModal
          defaults={{ category: "PRODUCT", lineId: form.lineId || undefined }}
          value={images[picking]?.assetId ?? ""}
          onClose={() => setPicking(null)}
          onPick={(assetId) => {
            setImageAt(picking, assetId);
            setPicking(null);
          }}
          onUploaded={reload}
        />
      ) : null}

      {drawer === "precos" ? (
        <EditorDrawer
          title="Preços e estoque"
          description="Cada linha é uma forma de comprar este produto, com preço e estoque próprios."
          onClose={() => setDrawer(null)}
        >
          <SkuManager owner="products" ownerId={form.id} skus={skus} onMessage={onMessage} />
        </EditorDrawer>
      ) : null}

      {drawer === "casos" && form.id ? (
        <EditorDrawer
          title="Antes e depois"
          description="As fotos aparecem na página pública deste produto."
          onClose={() => setDrawer(null)}
        >
          <ClinicalCaseManager owner="product" ownerId={form.id} />
        </EditorDrawer>
      ) : null}
    </div>
  );
}
