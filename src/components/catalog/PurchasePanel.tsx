"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import type { CatalogItem, CatalogOffer } from "@/data/catalog";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/checkoutLimits";
import { roundMoney } from "@/lib/money";
import { useVariant } from "./VariantContext";
import { VariantSwatches } from "./VariantSwatches";

const isOfferSoldOut = (offer: CatalogOffer) => offer.trackStock === true && (offer.stock ?? 0) <= 0;

export function PurchasePanel({ item }: { item: CatalogItem }) {
  const router = useRouter();
  const { addToCart } = useCart();
  // A escolha é compartilhada com a galeria quando a página a fornece;
  // isolado (testes, prévias), o painel continua guardando a sua.
  const shared = useVariant();
  const [ownOfferId, setOwnOfferId] = useState(item.offers[0].id);
  const offerId = shared?.offerId ?? ownOfferId;
  const setOfferId = shared?.select ?? setOwnOfferId;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const offer = item.offers.find((entry) => entry.id === offerId) ?? item.offers[0];
  const soldOut = isOfferSoldOut(offer);
  const max = offer.trackStock ? Math.min(MAX_QUANTITY_PER_ITEM, offer.stock ?? 0) : MAX_QUANTITY_PER_ITEM;
  const subtotal = roundMoney(offer.price * quantity);
  // Estoque baixo é informação de decisão; acima disso o número só gera ruído.
  const lowStock = offer.trackStock && !soldOut && (offer.stock ?? 0) <= 5;

  const cartItem = {
    id: offer.id,
    name: offer.label ? `${item.name} · ${offer.label}` : item.name,
    unitPrice: offer.price,
    vials: item.protocol ? item.protocol.composition.reduce((sum, entry) => sum + entry.quantity, 0) || 1 : 1,
    quantity,
    sessions: item.kind === "protocol" ? item.presentation : item.presentation,
    imagePath: offer.image ?? item.image,
    kind: item.kind,
    line: item.line,
    presentation: item.presentation,
  } as const;

  function selectOffer(next: CatalogOffer) {
    setOfferId(next.id);
    const nextMax = next.trackStock ? Math.min(MAX_QUANTITY_PER_ITEM, next.stock ?? 0) : MAX_QUANTITY_PER_ITEM;
    setQuantity((current) => Math.max(1, Math.min(current, nextMax || 1)));
  }

  function add(goToCheckout: boolean) {
    if (soldOut) return;
    addToCart(cartItem, quantity);
    if (goToCheckout) router.push("/checkout");
    else {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    }
  }

  return (
    <div className="mt-7 border-t border-content/10 pt-6">
      {item.offers.length > 1 && item.offers.some((entry) => entry.swatch) ? (
        <VariantSwatches
          offers={item.offers}
          selectedId={offer.id}
          onSelect={selectOffer}
          legend={item.variantName || "Escolha a variação"}
        />
      ) : null}

      {item.offers.length > 1 && !item.offers.some((entry) => entry.swatch) ? (
        <fieldset className="mb-5">
          <legend className="mb-2 font-mono text-xs font-semibold tracking-wider text-content/55 uppercase">
            {item.variantName || "Escolha a variação"}
          </legend>
          <div className="flex flex-wrap gap-2">
            {item.offers.map((entry) => {
              const entrySoldOut = isOfferSoldOut(entry);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => selectOffer(entry)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                    offer.id === entry.id
                      ? "border-(--line-accent) bg-(--line-accent) text-(--line-ink)"
                      : "border-content/15 bg-card text-content"
                  } ${entrySoldOut ? "opacity-55" : ""}`}
                >
                  {entry.label}
                  {entrySoldOut ? <span className="ml-1.5 font-mono text-[10px] uppercase">esgotado</span> : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex items-end justify-between gap-4">
        <div>
          <p aria-live="polite" className="font-display text-3xl font-semibold text-content tabular-nums">
            {formatBRL(subtotal)}
          </p>
          <p className="mt-1 text-xs text-content/55">
            {quantity > 1 ? `${quantity} × ${formatBRL(offer.price)}` : item.kind === "protocol" ? `Kit com ${item.presentation}` : `por ${item.presentation.toLowerCase()}`}
          </p>
        </div>
        <div className="flex items-center rounded-full border border-content/15 bg-canvas p-1">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={quantity === 1 || soldOut}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-content/5 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-mono text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={quantity >= max || soldOut}
            onClick={() => setQuantity((value) => Math.min(max, value + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-content/5 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {soldOut ? (
        <p role="status" className="mt-4 rounded-2xl border border-content/15 bg-raised p-4 text-sm text-content/70">
          <strong className="font-semibold text-content">Esgotado.</strong>{" "}
          {item.kind === "protocol"
            ? "Faltam ampolas de algum produto deste kit. Assim que o estoque for reposto, o protocolo volta a ficar disponível."
            : "Este item está sem estoque no momento."}
        </p>
      ) : (
        <>
          {lowStock ? (
            <p className="mt-4 font-mono text-xs font-semibold text-(--line-accent)">
              Últimas {offer.stock} unidades
            </p>
          ) : null}
          <p className="mt-4 text-sm text-content/65">Até 12x no cartão de crédito ou à vista no débito e no PIX{/* · 5% de desconto no PIX */}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => add(true)}
              className="rounded-full bg-action px-5 py-3.5 text-sm font-semibold text-action-fg shadow-md hover:bg-action-hover"
            >
              Comprar agora
            </button>
            <button
              type="button"
              onClick={() => add(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-content/20 bg-card px-5 py-3.5 text-sm font-semibold text-content hover:border-content/40"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Adicionado
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
