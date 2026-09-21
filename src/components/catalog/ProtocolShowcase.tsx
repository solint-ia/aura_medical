"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FramedImage } from "@/components/ui/FramedImage";
import { SectionIntro } from "@/components/ui/SectionIntro";
import type { CatalogItem } from "@/data/catalog";
import { protocolVialsLabel } from "@/lib/protocolVials";

function totalVials(item: CatalogItem) {
  return item.protocol?.composition.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
}

/**
 * Configurador de protocolos da marca: índice à esquerda, composição do kit à
 * direita. Não exibe preço nem compra — a conversão acontece no detalhe.
 */
export function ProtocolShowcase({ items, lineName }: { items: CatalogItem[]; lineName: string }) {
  const [selectedSlug, setSelectedSlug] = useState(items[0]?.slug);
  const selected = items.find((item) => item.slug === selectedSlug) ?? items[0];
  if (!selected) return null;

  return (
    <section
      id="protocolos"
      aria-labelledby="protocolos-title"
      className="anchor-section relative overflow-hidden bg-raised px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)] dark:bg-panel"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-65 -right-50 h-[600px] w-[600px] rounded-full border border-content/8 dark:border-on-panel/6"
      />

      <div className="relative mx-auto max-w-[1280px]">
        <SectionIntro
          tone="adaptive"
          titleId="protocolos-title"
          eyebrow="Protocolos · Configurador interativo"
          title={`Protocolos ${lineName} prontos, com a proporção certa para cada indicação.`}
          lead="Selecione um protocolo para ver a composição exata do kit e o plano de sessões."
          className="mb-14"
        />

        <div className="grid grid-cols-1 items-start gap-6 wide:grid-cols-[minmax(300px,380px)_1fr] wide:gap-12">
          {/* Telas estreitas: o mesmo índice vira uma trilha de pílulas. */}
          <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pt-0.5 pb-3 wide:hidden">
            {items.map((item) => {
              const isSelected = item.slug === selected.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedSlug(item.slug)}
                  className={`flex-none rounded-full border px-5 py-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? "border-accent bg-accent text-accent-fg dark:border-accent-panel dark:bg-accent-panel"
                      : "border-content/20 bg-card text-content/78 hover:border-accent/60 dark:border-on-panel/24 dark:bg-transparent dark:text-on-panel/78 dark:hover:border-accent-panel/60"
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Telas largas: índice numerado, com o tamanho do kit em vez do preço. */}
          <div className="hidden flex-col gap-0.5 wide:flex" role="tablist" aria-label="Protocolos disponíveis">
            {items.map((item, index) => {
              const isSelected = item.slug === selected.slug;
              const vials = totalVials(item);
              const soldOut = Boolean(item.soldOut);
              return (
                <button
                  key={item.slug}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedSlug(item.slug)}
                  className={`flex w-full items-center justify-between gap-3.5 rounded-xl px-[22px] py-[19px] text-left transition-all ${
                    isSelected
                      ? "bg-card font-semibold shadow-[0_10px_28px_rgba(18,40,60,0.09)] dark:bg-on-panel/12 dark:shadow-sm"
                      : "opacity-65 hover:bg-content/5 hover:opacity-100 dark:hover:bg-on-panel/5"
                  } ${soldOut && !isSelected ? "opacity-45" : ""}`}
                >
                  <span className="flex min-w-0 items-center gap-3.5">
                    <span className={`flex-none font-mono text-[11px] ${isSelected ? "text-accent dark:text-accent-panel" : "text-content/35 dark:text-on-panel/35"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`truncate text-[16.5px] font-semibold ${isSelected ? "text-content dark:text-on-panel" : "text-content/55 dark:text-on-panel/55"}`}>
                      {item.name}
                    </span>
                  </span>
                  <span className={`flex-none font-mono text-xs whitespace-nowrap ${isSelected ? "text-accent dark:text-accent-panel" : "text-content/35 dark:text-on-panel/35"}`}>
                    {soldOut ? "Esgotado" : vials ? `${vials} amp.` : ""}
                  </span>
                </button>
              );
            })}
          </div>

          <ProtocolCard item={selected} />
        </div>
      </div>
    </section>
  );
}

function ProtocolCard({ item }: { item: CatalogItem }) {
  const protocol = item.protocol;
  const vials = totalVials(item);
  const soldOut = Boolean(item.soldOut);

  return (
    <article
      // Re-montar no slug repete a animação de entrada a cada troca.
      key={item.slug}
      className="flex animate-fade-up flex-col gap-7 rounded-[32px] border border-content/8 bg-card p-[clamp(28px,4vw,48px)] shadow-[0_24px_60px_rgba(18,40,60,0.12)] [animation-duration:280ms] motion-reduce:animate-none dark:border-on-panel/6 dark:shadow-[0_30px_80px_rgba(4,12,20,0.4)]"
    >
      <header className="flex items-center gap-5 sm:gap-6">
        {item.image ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-[3px] border-(--line-accent)/50 shadow-lg ring-4 ring-(--line-accent)/15 sm:h-24 sm:w-24 md:h-28 md:w-28">
            <FramedImage src={item.image} alt="" framing={item.imageFraming} fill sizes="(max-width: 768px) 96px, 112px" className="object-cover" />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col">
          <p className="mb-1.5 flex flex-wrap items-center gap-2 font-mono text-[13px] font-semibold tracking-[0.1em] text-(--line-accent) uppercase">
            Protocolo padrão
            {soldOut ? (
              <span className="rounded-full bg-content/80 px-2.5 py-0.5 text-[10px] font-bold text-canvas">Esgotado</span>
            ) : null}
          </p>
          <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-tight font-semibold tracking-[-0.01em] text-content">
            {item.name}
          </h3>
        </div>
      </header>

      <hr className="border-content/10" />

      {protocol?.composition.length ? (
        <div>
          <h4 className="mb-3.5 font-mono text-[13px] font-semibold tracking-[0.08em] text-content/85 uppercase">
            Composição do kit
          </h4>
          <ul className="flex flex-wrap gap-3">
            {protocol.composition.map((entry) => (
              <li
                key={`${entry.product}-${entry.role}`}
                className="flex items-center gap-3 rounded-[18px] border border-content/10 bg-raised px-4 py-2.5 text-sm text-content shadow-xs dark:bg-canvas"
              >
                {entry.image ? (
                  <Image
                    src={entry.image}
                    alt=""
                    width={50}
                    height={70}
                    className="h-12 w-auto shrink-0 object-contain drop-shadow-sm"
                  />
                ) : (
                  <span aria-hidden="true" className="inline-block h-[9px] w-[9px] rounded-full bg-(--line-accent)" />
                )}
                <span className="flex flex-col">
                  <span className="font-semibold text-content">{entry.product}</span>
                  <span className="font-mono text-xs font-semibold text-(--line-accent)">
                    {entry.quantity}x ampola{entry.quantity > 1 ? "s" : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {vials ? (
            <p className="mt-3.5 font-mono text-[13px] font-semibold tracking-[0.05em] text-content/90 uppercase">
              {protocolVialsLabel(item.slug, vials)}
            </p>
          ) : null}
        </div>
      ) : null}

      {protocol?.sessions || protocol?.frequency ? (
        <>
          <hr className="border-content/10" />
          <dl className="grid gap-4 sm:grid-cols-2">
            {protocol.sessions ? (
              <div>
                <dt className="font-mono text-xs tracking-wider text-content/55 uppercase">Sessões</dt>
                <dd className="mt-1 font-display text-lg font-semibold text-content">{protocol.sessions}</dd>
              </div>
            ) : null}
            {protocol.frequency ? (
              <div>
                <dt className="font-mono text-xs tracking-wider text-content/55 uppercase">Frequência</dt>
                <dd className="mt-1 font-display text-lg font-semibold text-content">{protocol.frequency}</dd>
              </div>
            ) : null}
          </dl>
        </>
      ) : null}

      <hr className="border-content/10" />

      {soldOut ? (
        <p className="text-sm text-content/65">
          Sem estoque de algum produto da composição. O kit volta assim que as ampolas forem repostas.
        </p>
      ) : null}

      <Link
        href={`/protocolos/${item.slug}`}
        className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-action px-7 py-[17px] text-[15.5px] font-semibold text-action-fg shadow-md transition-all hover:bg-action-hover hover:shadow-lg active:scale-[0.99] sm:w-auto sm:self-start"
      >
        Ver protocolo completo
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
      </Link>
    </article>
  );
}
