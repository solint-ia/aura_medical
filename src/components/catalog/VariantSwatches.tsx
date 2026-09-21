"use client";

import type { CatalogOffer } from "@/data/catalog";

const isSoldOut = (offer: CatalogOffer) => offer.trackStock === true && (offer.stock ?? 0) <= 0;

/**
 * Escolha da variação em círculos, para quando a diferença é visual: cor,
 * tom de pele, acabamento. O círculo mostra a cor cadastrada ou a foto que a
 * representa, e o nome da variação escolhida fica escrito ao lado — cor
 * sozinha não informa quem não enxerga a diferença.
 */
export function VariantSwatches({
  offers,
  selectedId,
  onSelect,
  legend,
}: {
  offers: CatalogOffer[];
  selectedId: string;
  onSelect: (offer: CatalogOffer) => void;
  legend: string;
}) {
  const selected = offers.find((offer) => offer.id === selectedId);

  return (
    <fieldset className="mb-5">
      <legend className="mb-2 font-mono text-xs font-semibold tracking-wider text-content/55 uppercase">
        {legend}
        {selected?.label ? <span className="ml-2 tracking-normal text-content/80 normal-case">{selected.label}</span> : null}
      </legend>
      <div className="flex flex-wrap items-center gap-2.5">
        {offers.map((offer) => {
          const active = offer.id === selectedId;
          const soldOut = isSoldOut(offer);
          const swatch = offer.swatch;
          return (
            <button
              key={offer.id}
              type="button"
              onClick={() => onSelect(offer)}
              aria-pressed={active}
              title={soldOut ? `${offer.label ?? "Variação"} · esgotado` : offer.label}
              className={`relative h-11 w-11 overflow-hidden rounded-full border-2 transition ${
                active ? "border-(--line-accent)" : "border-content/15 hover:border-content/35"
              } ${soldOut ? "opacity-45" : ""}`}
              style={
                swatch?.image
                  ? { backgroundImage: `url(${swatch.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : swatch?.color
                    ? { backgroundColor: swatch.color }
                    : undefined
              }
            >
              {/* Sem cor nem foto, o círculo ainda precisa dizer de qual variação se trata. */}
              {!swatch?.image && !swatch?.color ? (
                <span className="grid h-full w-full place-items-center bg-card text-[10px] font-semibold text-content/70">
                  {(offer.label ?? "").slice(0, 3)}
                </span>
              ) : null}
              <span className="sr-only">
                {offer.label ?? "Variação"}
                {soldOut ? " (esgotado)" : ""}
              </span>
              {soldOut ? <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -rotate-45 bg-content/70" /> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
