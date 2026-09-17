"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import type { CatalogItem } from "@/data/catalog";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/checkoutLimits";
import { roundMoney } from "@/lib/money";

export function PurchasePanel({ item }: { item: CatalogItem }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [offerId, setOfferId] = useState(item.offers[0].id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const offer = item.offers.find((entry) => entry.id === offerId) ?? item.offers[0];
  const max = offer.trackStock ? Math.min(MAX_QUANTITY_PER_ITEM, offer.stock ?? 0) : MAX_QUANTITY_PER_ITEM;
  const subtotal = roundMoney(offer.price * quantity);

  const cartItem = {
    id: offer.id,
    name: offer.label ? `${item.name} · ${offer.label}` : item.name,
    unitPrice: offer.price,
    vials: item.kind === "protocol" ? Number(item.presentation.match(/^\d+/)?.[0] ?? 1) : 1,
    quantity,
    sessions: item.kind === "protocol" ? item.presentation : item.presentation,
    imagePath: offer.image ?? item.image,
    kind: item.kind,
    line: item.line,
    presentation: item.presentation,
  } as const;

  function add(goToCheckout: boolean) {
    addToCart(cartItem, quantity);
    if (goToCheckout) router.push("/checkout");
    else {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    }
  }

  return (
    <div className="mt-7 border-t border-content/10 pt-6">
      {item.variantName && item.offers.length > 1 ? (
        <fieldset className="mb-5">
          <legend className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-content/55">{item.variantName}</legend>
          <div className="flex flex-wrap gap-2">
            {item.offers.map((entry) => <button key={entry.id} type="button" onClick={() => setOfferId(entry.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${offer.id === entry.id ? "border-(--line-accent) bg-(--line-accent) text-(--line-ink)" : "border-content/15 bg-card text-content"}`}>{entry.label}</button>)}
          </div>
        </fieldset>
      ) : null}
      <div className="flex items-end justify-between gap-4">
        <div><p aria-live="polite" className="font-display text-3xl font-semibold tabular-nums text-content">{formatBRL(subtotal)}</p><p className="mt-1 text-xs text-content/55">{quantity > 1 ? `${quantity} × ${formatBRL(offer.price)}` : `por ${item.presentation.toLowerCase()}`}</p></div>
        <div className="flex items-center rounded-full border border-content/15 bg-canvas p-1">
          <button type="button" aria-label="Diminuir quantidade" disabled={quantity === 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-content/5 disabled:cursor-not-allowed disabled:opacity-35"><Minus className="h-4 w-4" /></button>
          <span className="w-8 text-center font-mono text-sm font-semibold">{quantity}</span>
          <button type="button" aria-label="Aumentar quantidade" disabled={quantity >= max} onClick={() => setQuantity((value) => Math.min(max, value + 1))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-content/5 disabled:cursor-not-allowed disabled:opacity-35"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="mt-4 text-sm text-content/65">Até 10x no cartão{/* · 5% de desconto no PIX */}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => add(true)} className="rounded-full bg-action px-5 py-3.5 text-sm font-semibold text-action-fg shadow-md hover:bg-action-hover">Comprar agora</button>
        <button type="button" onClick={() => add(false)} className="inline-flex items-center justify-center gap-2 rounded-full border border-content/20 bg-card px-5 py-3.5 text-sm font-semibold text-content hover:border-content/40">{added ? <><Check className="h-4 w-4" /> Adicionado</> : <><ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho</>}</button>
      </div>
    </div>
  );
}
