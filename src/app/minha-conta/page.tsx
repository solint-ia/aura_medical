"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileText,
  LogOut,
  MapPin,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Order, UserAddress, useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";
import { formatCpfOrCnpj } from "@/lib/validators";

type TabType = "pedidos" | "enderecos" | "perfil";

function CustomerPortalContent() {
  const router = useRouter();
  const { user, addresses, selectedAddress, setSelectedAddress, orders, addAddress, logout, isHydrated } = useAuth();
  const { items: cartItems, addToCart, clearCart } = useCart();

  const [activeTab, setActiveTab] = useState<TabType>("pedidos");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Re-order modal state (Suggestion 1)
  const [reorderOrder, setReorderOrder] = useState<Order | null>(null);

  // New address modal state
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newCep, setNewCep] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newComplement, setNewComplement] = useState("");
  const [newNeighborhood, setNewNeighborhood] = useState("");
  const [newCity, setNewCity] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono text-sm text-content/60">
        Carregando painel do cliente...
      </div>
    );
  }

  // UNAUTHENTICATED STATE
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#C59D3F]/15 text-[#C59D3F]">
          <User className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-bold text-content mb-3">
          Área do Profissional
        </h1>
        <p className="text-base text-content/75 mb-8 max-w-md mx-auto">
          Faça login ou cadastre-se para acessar seus pedidos anteriores, acompanhar entregas e gerenciar seus endereços.
        </p>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="rounded-lg bg-[#C59D3F] px-8 py-3.5 font-semibold text-[#0D1B2A] transition-colors hover:bg-[#d4ac4c] shadow-md"
          >
            Entrar / Cadastrar
          </button>
        </div>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  // Handle Re-order (Suggestion 1: Re-order items without manually searching)
  const executeReorder = (replace: boolean) => {
    if (!reorderOrder) return;

    if (replace) {
      clearCart();
    }

    reorderOrder.items.forEach((item) => {
      addToCart(
        {
          id: item.productId,
          name: item.productName,
          unitPrice: item.unitPrice,
          sessions: "Tratamento Personalizado",
          vials: 1,
          quantity: item.quantity,
          imagePath: item.imagePath,
        },
        item.quantity
      );
    });

    setReorderOrder(null);
    router.push("/checkout");
  };

  const handleViaCep = async (cepValue: string) => {
    const digits = cepValue.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setNewStreet(data.logradouro || "");
        setNewNeighborhood(data.bairro || "");
        setNewCity(data.localidade ? `${data.localidade} - ${data.uf}` : "");
      }
    } catch {
      // Ignorar erro
    } finally {
      setCepLoading(false);
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCep || !newStreet || !newNumber || !newNeighborhood || !newCity) return;

    await addAddress({
      cep: newCep,
      street: newStreet,
      number: newNumber,
      complement: newComplement,
      neighborhood: newNeighborhood,
      city: newCity,
      uf: newCity.includes("-") ? newCity.split("-")[1].trim() : "SE",
    });

    setNewCep("");
    setNewStreet("");
    setNewNumber("");
    setNewComplement("");
    setNewNeighborhood("");
    setNewCity("");
    setIsAddAddressOpen(false);
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pago":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Pagamento Aprovado</span>;
      case "em_transporte":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">🚚 Em Transporte</span>;
      case "entregue":
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 font-mono text-xs font-bold text-green-700 dark:text-green-300">📦 Pedido Entregue</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">⏳ Processando</span>;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-[clamp(20px,4vw,56px)] py-10">
      {/* Top Welcome Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-content/12 pb-6">
        <div>
          <span className="font-mono text-xs font-semibold text-[#C59D3F] uppercase tracking-wider">
            Painel do Profissional
          </span>
          <h1 className="font-display text-3xl font-bold text-content mt-1">
            Olá, {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-content/70 mt-0.5 font-mono">
            {user.email} · CPF/CNPJ: {formatCpfOrCnpj(user.cpfCnpj)}
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-red-500/30 px-4 py-2 font-mono text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8 flex border-b border-content/12 font-mono text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("pedidos")}
          className={`flex items-center gap-2 py-3 px-5 font-bold uppercase transition-colors border-b-2 shrink-0 ${
            activeTab === "pedidos"
              ? "border-[#C59D3F] text-[#C59D3F]"
              : "border-transparent text-content/60 hover:text-content"
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          <span>Meus Pedidos ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("enderecos")}
          className={`flex items-center gap-2 py-3 px-5 font-bold uppercase transition-colors border-b-2 shrink-0 ${
            activeTab === "enderecos"
              ? "border-[#C59D3F] text-[#C59D3F]"
              : "border-transparent text-content/60 hover:text-content"
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Meus Endereços ({addresses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("perfil")}
          className={`flex items-center gap-2 py-3 px-5 font-bold uppercase transition-colors border-b-2 shrink-0 ${
            activeTab === "perfil"
              ? "border-[#C59D3F] text-[#C59D3F]"
              : "border-transparent text-content/60 hover:text-content"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Meus Dados Cadastrais</span>
        </button>
      </div>

      {/* TAB 1: MEUS PEDIDOS */}
      {activeTab === "pedidos" && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-content/12 bg-card p-12 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-content/30 mb-3" />
              <h3 className="font-display text-xl font-bold text-content">
                Nenhum pedido realizado ainda
              </h3>
              <p className="text-sm text-content/70 max-w-md mx-auto mt-2 mb-6">
                Explore nosso catálogo de bio-remodeladores enzimáticos e monte seu primeiro pedido.
              </p>
              <Link
                href="/#protocolos"
                className="inline-flex items-center gap-2 rounded-lg bg-[#C59D3F] px-6 py-3 font-semibold text-[#0D1B2A] transition-colors hover:bg-[#d4ac4c]"
              >
                Explorar Protocolos
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-content/12 bg-card p-6 shadow-xs transition-all hover:border-[#C59D3F]/40"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-content/10 pb-4 mb-4 font-mono text-xs">
                  <div>
                    <span className="text-content/50 uppercase">Pedido:</span>{" "}
                    <strong className="text-content text-sm">{order.orderNumber}</strong>
                    <span className="text-content/40 ml-3">
                      Data: {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="font-bold text-sm text-[#C59D3F]">
                      {formatBRL(order.totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-6 divide-y divide-content/10">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C59D3F]/15 font-display font-bold text-[#C59D3F]">
                          {item.productName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-content">
                            Protocolo {item.productName}
                          </p>
                          <p className="font-mono text-xs text-content/65">
                            Qtd: {item.quantity} × {formatBRL(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-content">
                        {formatBRL(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-content/10 pt-4 font-mono text-xs">
                  <div className="space-y-1 text-content/75">
                    <p>📍 <strong className="text-content">Endereço:</strong> {order.addressSummary}</p>
                    <p>🚚 <strong className="text-content">Frete:</strong> {order.shippingMethod} ({formatBRL(order.shippingCost)})</p>
                    {order.trackingCode && (
                      <p>📦 <strong className="text-content">Rastreio:</strong> <span className="text-[#C59D3F] font-bold">{order.trackingCode}</span></p>
                    )}
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {/* Placeholder for Invoice (NF-e) */}
                    <button
                      type="button"
                      onClick={() => alert("Nota Fiscal eletrônica emitida pelo Mercado Pago em breve.")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-content/20 bg-canvas px-4 py-2 font-semibold text-content hover:border-[#C59D3F]"
                    >
                      <FileText className="h-4 w-4 text-[#C59D3F]" />
                      <span>Nota Fiscal (PDF)</span>
                    </button>

                    {/* SUGGESTION 1: Re-order Button ("Comprar Novamente") */}
                    <button
                      type="button"
                      onClick={() => setReorderOrder(order)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#C59D3F] px-5 py-2 font-semibold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-sm"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Comprar Novamente</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: MEUS ENDEREÇOS */}
      {activeTab === "enderecos" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-content">
              Endereços Cadastrados para Entrega
            </h2>
            <button
              type="button"
              onClick={() => setIsAddAddressOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C59D3F] px-4 py-2 font-mono text-xs font-bold text-[#0D1B2A] hover:bg-[#d4ac4c]"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Novo Endereço</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {addresses.map((addr) => {
              const isSelected = selectedAddress?.id === addr.id;
              return (
                <div
                  key={addr.id}
                  className={`rounded-2xl border p-5 transition-all space-y-2 ${
                    isSelected
                      ? "border-[#C59D3F] bg-[#C59D3F]/10 text-content shadow-sm"
                      : "border-content/12 bg-card hover:border-content/30"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs border-b border-content/10 pb-2">
                    <span className="font-bold text-[#C59D3F] uppercase">
                      {addr.isDefault ? "📍 Endereço Padrão" : "Endereço Cadastrado"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedAddress(addr)}
                      className="text-[#C59D3F] underline font-bold"
                    >
                      {isSelected ? "Selecionado" : "Usar no Checkout"}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-content">
                    {addr.street}, {addr.number} {addr.complement && `(${addr.complement})`}
                  </p>
                  <p className="text-xs text-content/75 font-mono">
                    {addr.neighborhood} · {addr.city}
                  </p>
                  <p className="text-xs text-content/65 font-mono">
                    CEP: {addr.cep}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Modal Adicionar Novo Endereço */}
          {isAddAddressOpen && (
            <form onSubmit={handleSaveNewAddress} className="rounded-2xl border border-content/12 bg-card p-6 space-y-4 max-w-lg mt-6 shadow-xl">
              <h3 className="font-display text-lg font-bold text-content">Novo Endereço de Entrega</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">CEP *</label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    maxLength={9}
                    value={newCep}
                    onChange={(e) => {
                      setNewCep(e.target.value);
                      handleViaCep(e.target.value);
                    }}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                  {cepLoading && <span className="text-[10px] font-mono text-[#C59D3F]">Buscando CEP...</span>}
                </div>
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Número *</label>
                  <input
                    type="text"
                    placeholder="1000"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Logradouro / Rua *</label>
                <input
                  type="text"
                  placeholder="Av. Paulista"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Complemento</label>
                  <input
                    type="text"
                    placeholder="Sala 402"
                    value={newComplement}
                    onChange={(e) => setNewComplement(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Bairro *</label>
                  <input
                    type="text"
                    placeholder="Bela Vista"
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Cidade / UF *</label>
                <input
                  type="text"
                  placeholder="São Paulo - SP"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="w-1/2 rounded-lg border border-content/20 py-2.5 font-mono text-xs font-semibold text-content"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-lg bg-[#C59D3F] py-2.5 font-mono text-xs font-bold text-[#0D1B2A]"
                >
                  Salvar Endereço
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: MEUS DADOS */}
      {activeTab === "perfil" && (
        <div className="max-w-xl space-y-6">
          <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider">
              Dados Cadastrais do Profissional
            </h3>

            <div className="space-y-3 font-mono text-xs text-content/80">
              <div className="flex justify-between border-b border-content/10 pb-2">
                <span className="text-content/50">Nome Completo:</span>
                <strong className="text-content">{user.firstName} {user.lastName}</strong>
              </div>
              <div className="flex justify-between border-b border-content/10 pb-2">
                <span className="text-content/50">CPF / CNPJ:</span>
                <strong className="text-content">{formatCpfOrCnpj(user.cpfCnpj)}</strong>
              </div>
              <div className="flex justify-between border-b border-content/10 pb-2">
                <span className="text-content/50">E-mail:</span>
                <strong className="text-content">{user.email}</strong>
              </div>
              <div className="flex justify-between border-b border-content/10 pb-2">
                <span className="text-content/50">Telefone / WhatsApp:</span>
                <strong className="text-content">{user.phone}</strong>
              </div>
              {user.birthDate && (
                <div className="flex justify-between border-b border-content/10 pb-2">
                  <span className="text-content/50">Data de Nascimento:</span>
                  <strong className="text-content">{user.birthDate}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUGGESTION 1: REORDER CONFIRMATION MODAL */}
      {reorderOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-content/12 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C59D3F]/15 text-[#C59D3F]">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-content">Comprar Novamente</h3>
                <p className="text-xs font-mono text-content/65">Pedido {reorderOrder.orderNumber}</p>
              </div>
            </div>

            <p className="text-sm text-content/80 leading-relaxed">
              Como deseja adicionar os itens do pedido <strong className="text-content">{reorderOrder.orderNumber}</strong> ao seu carrinho?
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => executeReorder(true)}
                className="w-full rounded-xl bg-[#C59D3F] py-3 text-sm font-bold text-[#0D1B2A] hover:bg-[#d4ac4c]"
              >
                Substituir Carrinho Atual & Ir para Checkout
              </button>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => executeReorder(false)}
                  className="w-full rounded-xl border border-content/20 bg-canvas py-3 text-sm font-semibold text-content hover:bg-content/5"
                >
                  Adicionar ao Carrinho Existente
                </button>
              )}
              <button
                type="button"
                onClick={() => setReorderOrder(null)}
                className="w-full py-2 font-mono text-xs text-content/60 hover:underline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MinhaContaPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main className="bg-canvas min-h-screen">
        <CustomerPortalContent />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
