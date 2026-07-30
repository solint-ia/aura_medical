"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";

const PROTOCOL_IMAGE_MAP: Record<string, string> = {
  "queixo-duplo": "/images/fotos-protocolos/queixoduplo-2.png",
  "perfilamento-facial": "/images/fotos-protocolos/perfilamento-2.png",
  "gordura-localizada": "/images/fotos-protocolos/gorduralocalizada-2.png",
  celulite: "/images/fotos-protocolos/celulite-2.png",
  cicatrizes: "/images/fotos-protocolos/cicatrizes-2.png",
  "fibrose-pos-cirurgica": "/images/fotos-protocolos/fibrose-2.png",
};

function CartContent() {
  const { items, updateQuantity, removeFromCart, subtotal, isHydrated } = useCart();

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
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#C59D3F]/15 text-[#C59D3F]">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold text-content mb-3">
          Seu carrinho está vazio
        </h1>
        <p className="text-base text-content/75 mb-8 max-w-md mx-auto">
          Você ainda não adicionou nenhum protocolo enzimático ao seu carrinho. Explore nosso catálogo clínico e monte seu pedido.
        </p>
        <Link
          href="/#protocolos"
          className="inline-flex items-center gap-2 rounded-lg bg-[#C59D3F] px-8 py-3.5 text-base font-semibold text-[#0D1B2A] transition-colors hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
        >
          Explorar Protocolos
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  // POPULATED STATE
  return (
    <div className="mx-auto max-w-7xl px-[clamp(20px,4vw,56px)] py-10">
      {/* Top Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-content/12 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-content">
            Seu Carrinho de Compras
          </h1>
          <p className="text-sm text-content/70 mt-1">
            Revise os protocolos selecionados antes de prosseguir para o checkout.
          </p>
        </div>
        <Link
          href="/#protocolos"
          className="inline-flex items-center gap-2 font-mono text-xs text-content/70 hover:text-accent uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Adicionar mais protocolos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8">
          <div className="divide-y divide-content/12 rounded-2xl border border-content/12 bg-card shadow-xs">
            {items.map((item) => {
              const displayImg =
                (item.imagePath && item.imagePath.includes("/fotos-protocolos/") ? item.imagePath : null) ||
                PROTOCOL_IMAGE_MAP[item.id] ||
                `/images/fotos-protocolos/${item.id.replace(/-/g, "")}-2.png`;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  {/* Product Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#C59D3F]/40 shadow-sm ring-2 ring-[#C59D3F]/10">
                      {displayImg ? (
                        <Image
                          src={displayImg}
                          alt={item.name}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-display text-xl font-bold text-[#C59D3F]">
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-content">
                      Protocolo {item.name}
                    </h3>
                    <p className="text-xs text-content/65 font-mono">
                      {item.vials} ampola{item.vials > 1 ? "s" : ""}
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-[#C59D3F]">
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
                <span>Calculado no checkout</span>
              </div>
              <div className="flex justify-between border-t border-content/10 pt-3 text-lg font-bold text-content">
                <span>Total Estimado</span>
                <span className="font-mono text-[#C59D3F]">{formatBRL(subtotal)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C59D3F] py-4 text-center font-semibold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-lg active:scale-[0.99]"
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
