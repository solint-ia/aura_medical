"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatBRL } from "@/lib/format";

function CartContent() {
  const { items, updateQuantity, removeFromCart, subtotal, isHydrated, reconcile } = useCart();
  const { authToken } = useAuth();
  const quoted = useRef(false);
  const [priceNotice, setPriceNotice] = useState<string[]>([]);

  useEffect(() => {
    if (!isHydrated || quoted.current || items.length === 0) return;
    quoted.current = true;
    void fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: JSON.stringify({ items: items.map((item) => ({ id: item.id, quantity: item.quantity })) }),
    }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setPriceNotice(reconcile(data.items));
    });
  }, [authToken, isHydrated, items, reconcile]);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono text-sm text-content/60">
        Carregando seu carrinho...
      </div>
    );
  }

  // EMPTY STATE
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-accent">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold text-content mb-3">
          Seu carrinho está vazio
        </h1>
        <p className="text-base text-content/75 mb-8 max-w-md mx-auto">
          Você ainda não adicionou produtos ou protocolos ao carrinho. Explore o catálogo Aura Regenera e monte seu pedido.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3.5 text-base font-semibold text-accent-fg transition-colors hover:bg-accent shadow-md active:scale-[0.99]"
        >
          Explorar catálogo
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  // POPULATED STATE
  return (
    <div className="mx-auto max-w-7xl px-[clamp(20px,4vw,56px)] py-10">
      {priceNotice.length ? (
        <p role="status" className="mb-5 rounded-2xl border border-accent/30 bg-card px-5 py-4 text-sm text-content">
          {priceNotice.length === 1
            ? `O preço de ${priceNotice[0]} foi atualizado.`
            : `Os preços de ${priceNotice.join(", ")} foram atualizados.`}
        </p>
      ) : null}
      {/* Top Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-content/12 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-content">
            Seu Carrinho de Compras
          </h1>
          <p className="text-sm text-content/70 mt-1">
            Revise os itens selecionados antes de prosseguir para o checkout.
          </p>
        </div>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 font-mono text-xs text-content/70 hover:text-accent uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Adicionar mais itens
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8">
          <div className="divide-y divide-content/12 rounded-2xl border border-content/12 bg-card shadow-xs">
            {items.map((item) => {
              const displayImg = item.imagePath;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  {/* Product Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent/40 bg-panel shadow-sm ring-2 ring-[#C59D3F]/10">
                      {displayImg ? (
                        <Image
                          src={displayImg}
                          alt={item.name}
                          fill
                          sizes="72px"
                          className={displayImg.includes("/frascos/") ? "object-contain p-1.5" : "object-cover"}
                        />
                      ) : (
                        <span className="font-display text-xl font-bold text-accent">
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-content">
                      {/* "Frasco" cobre carrinhos salvos no localStorage antes da troca do termo */}
                      {item.kind === "protocol" && !item.name.startsWith("Protocolo") ? `Protocolo ${item.name}` : item.name}
                    </h3>
                    <p className="text-xs text-content/65 font-mono">
                      {item.presentation ?? (item.kind === "product" ? "Produto" : `${item.vials} ampola${item.vials > 1 ? "s" : ""}`)}
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-accent">
                      {formatBRL(item.unitPrice)}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Row Total & Trash */}
                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  {/* Quantity Selector */}
                  <div className="flex items-center rounded-lg border border-content/18 bg-canvas dark:bg-card">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Diminuir quantidade"
                      className="flex h-9 w-9 items-center justify-center text-content/75 transition-colors hover:text-content hover:bg-content/5"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-mono text-sm font-semibold text-content">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Aumentar quantidade"
                      className="flex h-9 w-9 items-center justify-center text-content/75 transition-colors hover:text-content hover:bg-content/5"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Row Total */}
                  <div className="text-right">
                    <span className="block font-mono text-xs text-content/50 uppercase">
                      Total
                    </span>
                    <span className="font-mono text-base font-bold text-content">
                      {formatBRL(item.unitPrice * item.quantity)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remover ${item.name} do carrinho`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-content/45 transition-colors hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 rounded-2xl border border-content/12 bg-card p-6 shadow-md">
            <h2 className="font-display text-lg font-bold text-content mb-4 border-b border-content/10 pb-3">
              Resumo do Pedido
            </h2>

            <div className="space-y-3 text-sm text-content/75 mb-6">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} item(ns))</span>
                <span className="font-mono font-semibold text-content">
                  {formatBRL(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-content/60">
                <span>Frete</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Grátis</span>
              </div>
              <div className="flex justify-between border-t border-content/10 pt-3 text-lg font-bold text-content">
                <span>Total Estimado</span>
                <span className="font-mono text-accent">{formatBRL(subtotal)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-4 text-center font-semibold text-accent-fg transition-all hover:bg-accent shadow-lg active:scale-[0.99]"
            >
              <span>Avançar para o Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-4 text-center font-mono text-[11px] text-content/55">
              🔒 Compra 100% Segura & Criptografada
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CarrinhoPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main className="bg-canvas min-h-screen">
        <CartContent />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
