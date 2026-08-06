"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileText,
  Lock,
  LogOut,
  MapPin,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Order, UserAddress, useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";
import { formatDateBR, formatCep, formatCpfOrCnpj, formatPhone, validatePhone } from "@/lib/validators";

const PROTOCOL_IMAGE_MAP: Record<string, string> = {
  "queixo-duplo": "/images/fotos-protocolos/queixoduplo-2.png",
  "perfilamento-facial": "/images/fotos-protocolos/perfilamento-2.png",
  "gordura-localizada": "/images/fotos-protocolos/gorduralocalizada-2.png",
  celulite: "/images/fotos-protocolos/celulite-2.png",
  cicatrizes: "/images/fotos-protocolos/cicatrizes-2.png",
  "fibrose-pos-cirurgica": "/images/fotos-protocolos/fibrose-2.png",
};

function getProtocolImg(productId?: string, productName?: string, imagePath?: string): string {
  if (imagePath && imagePath.includes("/fotos-protocolos/")) return imagePath;

  const rawKey = (productId || productName || "").toLowerCase().trim();
  const slugKey = rawKey
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^protocolo\s+/, "")
    .replace(/\s+/g, "-");

  if (PROTOCOL_IMAGE_MAP[slugKey]) return PROTOCOL_IMAGE_MAP[slugKey];
  if (slugKey.includes("queixo")) return PROTOCOL_IMAGE_MAP["queixo-duplo"];
  if (slugKey.includes("perfilamento")) return PROTOCOL_IMAGE_MAP["perfilamento-facial"];
  if (slugKey.includes("gordura")) return PROTOCOL_IMAGE_MAP["gordura-localizada"];
  if (slugKey.includes("celulite")) return PROTOCOL_IMAGE_MAP["celulite"];
  if (slugKey.includes("cicatriz")) return PROTOCOL_IMAGE_MAP["cicatrizes"];
  if (slugKey.includes("fibrose")) return PROTOCOL_IMAGE_MAP["fibrose-pos-cirurgica"];

  return "/images/fotos-protocolos/queixoduplo-2.png";
}

type TabType = "pedidos" | "enderecos" | "perfil";

function CustomerPortalContent() {
  const router = useRouter();
  const {
    user,
    authToken,
    addresses,
    selectedAddress,
    setSelectedAddress,
    orders,
    addAddress,
    updateAddress,
    deleteAddress,
    updateProfile,
    logout,
    isHydrated,
  } = useAuth();
  const { items: cartItems, addToCart, clearCart } = useCart();

  const [activeTab, setActiveTab] = useState<TabType>("pedidos");

  // Re-order modal state
  const [reorderOrder, setReorderOrder] = useState<Order | null>(null);

  // Address modal state (New or Edit)
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressCep, setAddressCep] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [addressErrorMsg, setAddressErrorMsg] = useState("");

  // Delete Address Confirmation Modal State
  const [deletingAddress, setDeletingAddress] = useState<UserAddress | null>(null);

  // Profile Edit state (Editing Name, Phone, Birth Date & Password)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editCurrentPassword, setEditCurrentPassword] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // REDIRECT ADMIN USERS TO /admin via useEffect side-effect
  useEffect(() => {
    if (user && isHydrated && (user.role === "ADMIN" || user.email.toLowerCase() === "contato@auraregenera.com")) {
      router.push("/admin");
    }
  }, [user, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono text-sm text-content/60">
        Carregando painel do cliente...
      </div>
    );
  }

  if (user && (user.role === "ADMIN" || user.email.toLowerCase() === "contato@auraregenera.com")) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono text-sm text-content/60">
        Redirecionando para o painel administrativo...
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
          Área do Cliente
        </h1>
        <p className="text-base text-content/75 mb-8 max-w-md mx-auto">
          Faça login ou cadastre-se para acessar seus pedidos anteriores, acompanhar entregas e gerenciar seus endereços.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/entrar"
            className="rounded-xl bg-[#C59D3F] px-8 py-3.5 font-bold text-xs text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
          >
            Entrar na Conta ou Criar Cadastro →
          </Link>
        </div>
      </div>
    );
  }

  // Handle Re-order
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
        setAddressStreet(data.logradouro || "");
        setAddressNeighborhood(data.bairro || "");
        setAddressCity(data.localidade ? `${data.localidade} - ${data.uf}` : "");
      }
    } catch {
      // Ignorar erro
    } finally {
      setCepLoading(false);
    }
  };

  const handleOpenNewAddressModal = () => {
    setEditingAddressId(null);
    setAddressCep("");
    setAddressStreet("");
    setAddressNumber("");
    setAddressComplement("");
    setAddressNeighborhood("");
    setAddressCity("");
    setAddressErrorMsg("");
    setIsAddAddressOpen(true);
  };

  const handleOpenEditAddressModal = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setAddressCep(formatCep(addr.cep));
    setAddressStreet(addr.street);
    setAddressNumber(addr.number);
    setAddressComplement(addr.complement || "");
    setAddressNeighborhood(addr.neighborhood);
    setAddressCity(addr.city.includes("-") ? addr.city : `${addr.city} - ${addr.uf}`);
    setAddressErrorMsg("");
    setIsAddAddressOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressErrorMsg("");

    if (!addressCep || !addressStreet || !addressNumber || !addressNeighborhood || !addressCity) {
      setAddressErrorMsg("Preencha todos os campos obrigatórios do endereço.");
      return;
    }

    if (addressCep.replace(/\D/g, "").length !== 8) {
      setAddressErrorMsg("CEP inválido. Deve possuir 8 dígitos.");
      return;
    }

    const payload = {
      cep: formatCep(addressCep),
      street: addressStreet,
      number: addressNumber,
      complement: addressComplement,
      neighborhood: addressNeighborhood,
      city: addressCity,
      uf: addressCity.includes("-") ? addressCity.split("-")[1].trim() : "SE",
    };

    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, payload);
      } else {
        await addAddress(payload);
      }

      setIsAddAddressOpen(false);
      setEditingAddressId(null);
    } catch (err) {
      setAddressErrorMsg(err instanceof Error ? err.message : "Erro ao salvar endereço.");
    }
  };

  const handleConfirmDeleteAddress = async () => {
    if (deletingAddress) {
      try {
        await deleteAddress(deletingAddress.id);
      } catch (err) {
        console.error("Erro ao excluir endereço:", err);
      }
      setDeletingAddress(null);
    }
  };

  // Profile Edit Handlers
  const handleStartEditProfile = () => {
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditPhone(user.phone);
    setEditBirthDate(user.birthDate || "");
    setEditCurrentPassword("");
    setEditNewPassword("");
    setEditConfirmPassword("");
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg("");
    setProfileSuccessMsg("");

    if (!editFirstName.trim() || !editLastName.trim()) {
      setProfileErrorMsg("Nome e Sobrenome são obrigatórios.");
      return;
    }

    if (!validatePhone(editPhone)) {
      setProfileErrorMsg("Telefone/WhatsApp inválido. Informe DDD + número.");
      return;
    }

    // 1. Update basic profile info
    const profileUpdated = await updateProfile({
      firstName: editFirstName,
      lastName: editLastName,
      phone: editPhone,
      birthDate: editBirthDate,
    });

    if (!profileUpdated) {
      setProfileErrorMsg("Erro ao salvar os dados do perfil. Tente novamente.");
      return;
    }

    // 2. If password fields are filled, attempt password update
    if (editCurrentPassword || editNewPassword || editConfirmPassword) {
      if (!editCurrentPassword) {
        setProfileErrorMsg("Informe sua senha atual para alterar a senha.");
        return;
      }
      if (!editNewPassword) {
        setProfileErrorMsg("Informe a nova senha desejada.");
        return;
      }
      if (editNewPassword.length < 6) {
        setProfileErrorMsg("A nova senha deve ter no mínimo 6 caracteres.");
        return;
      }
      if (editNewPassword !== editConfirmPassword) {
        setProfileErrorMsg("A nova senha e a confirmação de senha não coincidem.");
        return;
      }

      setPasswordLoading(true);
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            currentPassword: editCurrentPassword,
            newPassword: editNewPassword,
            email: user.email,
          }),
        });

        const data = await res.json();
        setPasswordLoading(false);

        if (!data.success) {
          setProfileErrorMsg(data.error || "Erro ao alterar a senha.");
          return;
        }
      } catch (err) {
        setPasswordLoading(false);
        setProfileErrorMsg("Erro de comunicação ao alterar senha.");
        return;
      }
    }

    setIsEditingProfile(false);
    setEditCurrentPassword("");
    setEditNewPassword("");
    setEditConfirmPassword("");
    setProfileSuccessMsg("Informações pessoais e senha atualizadas com sucesso!");
    setTimeout(() => setProfileSuccessMsg(""), 4000);
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
            Área do Cliente
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
                      Data: {new Date(order.createdAt).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                  {order.items.map((item) => {
                    const itemImg = getProtocolImg(item.productId, item.productName, item.imagePath);

                    return (
                      <div key={item.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#C59D3F]/40 shadow-xs ring-2 ring-[#C59D3F]/10">
                            <Image
                              src={itemImg}
                              alt={item.productName}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-content">
                              Protocolo {item.productName.replace(/^Protocolo\s+/i, "")}
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
                    );
                  })}
                </div>

                {/* Order Footer & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-content/10 pt-4 font-mono text-xs">
                  <div className="space-y-1 text-content/75">
                    <p>📍 <strong className="text-content">Endereço:</strong> {order.addressSummary}</p>
                    <p>🚚 <strong className="text-content">Frete:</strong> {order.shippingMethod} ({formatBRL(order.shippingCost)})</p>
                    {order.trackingCode && order.trackingCode.trim() !== "" && !order.trackingCode.startsWith("ME-") ? (
                      <p>📦 <strong className="text-content">Rastreio:</strong> <span className="text-[#C59D3F] font-bold">{order.trackingCode}</span></p>
                    ) : (
                      <p>📦 <strong className="text-content">Rastreio:</strong> <span className="text-content/50 italic">Em preparação para envio</span></p>
                    )}
                  </div>

                  <div className="flex gap-3 flex-wrap">
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

      {/* TAB 2: MEUS ENDEREÇOS (COM EDIÇÃO E MODAL DE EXCLUSÃO) */}
      {activeTab === "enderecos" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-content">
              Endereços Cadastrados para Entrega
            </h2>
            <button
              type="button"
              onClick={handleOpenNewAddressModal}
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
                  className={`rounded-2xl border p-5 transition-all space-y-3 ${
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

                  <div>
                    <p className="text-sm font-bold text-content">
                      {addr.street}, {addr.number} {addr.complement && `(${addr.complement})`}
                    </p>
                    <p className="text-xs text-content/75 font-mono">
                      {addr.neighborhood} · {addr.city}
                    </p>
                    <p className="text-xs text-content/65 font-mono">
                      CEP: {formatCep(addr.cep)}
                    </p>
                  </div>

                  {/* AÇÕES DE EDIÇÃO E EXCLUSÃO DE ENDEREÇO */}
                  <div className="flex items-center gap-3 pt-2 border-t border-content/10 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenEditAddressModal(addr)}
                      className="inline-flex items-center gap-1 text-[#C59D3F] hover:underline font-semibold"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingAddress(addr)}
                      className="inline-flex items-center gap-1 text-red-500 hover:underline font-semibold ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Adicionar/Editar Endereço */}
          {isAddAddressOpen && (
            <form onSubmit={handleSaveAddress} className="rounded-2xl border border-content/12 bg-card p-6 space-y-4 max-w-lg mt-6 shadow-xl">
              <h3 className="font-display text-lg font-bold text-content">
                {editingAddressId ? "Editar Endereço de Entrega" : "Novo Endereço de Entrega"}
              </h3>
              {addressErrorMsg && (
                <div className="rounded-xl bg-red-500/10 p-3 font-mono text-xs font-semibold text-red-500 border border-red-500/20">
                  ⚠️ {addressErrorMsg}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">CEP *</label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    maxLength={9}
                    value={addressCep}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      setAddressCep(formatted);
                      handleViaCep(formatted);
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
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Logradouro / Rua *</label>
                <input
                  type="text"
                  placeholder="Av. Paulista"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Complemento</label>
                  <input
                    type="text"
                    placeholder="Sala 402"
                    value={addressComplement}
                    onChange={(e) => setAddressComplement(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Bairro *</label>
                  <input
                    type="text"
                    placeholder="Bela Vista"
                    value={addressNeighborhood}
                    onChange={(e) => setAddressNeighborhood(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Cidade / UF *</label>
                <input
                  type="text"
                  placeholder="São Paulo - SP"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddAddressOpen(false);
                    setEditingAddressId(null);
                    setAddressErrorMsg("");
                  }}
                  className="w-1/2 rounded-lg border border-content/20 py-2.5 font-mono text-xs font-semibold text-content"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-lg bg-[#C59D3F] py-2.5 font-mono text-xs font-bold text-[#0D1B2A]"
                >
                  {editingAddressId ? "Salvar Alterações" : "Salvar Endereço"}
                </button>
              </div>
            </form>
          )}

          {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ENDEREÇO */}
          {deletingAddress && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="relative w-full max-w-sm rounded-2xl border border-red-500/20 bg-card p-6 shadow-2xl space-y-4">
                <button
                  type="button"
                  onClick={() => setDeletingAddress(null)}
                  className="absolute right-3.5 top-3.5 rounded-full p-1 text-content/60 hover:bg-content/10"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-content">
                      Excluir Endereço
                    </h3>
                    <p className="text-xs font-mono text-content/60">Confirmação de exclusão</p>
                  </div>
                </div>

                <p className="text-xs text-content/80 leading-relaxed">
                  Tem certeza que deseja remover o endereço <strong className="text-content">{deletingAddress.street}, {deletingAddress.number}</strong> ({deletingAddress.city})? Esta ação não poderá ser desfeita.
                </p>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingAddress(null)}
                    className="w-1/2 rounded-xl border border-content/20 py-2.5 font-mono text-xs font-semibold text-content hover:bg-content/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteAddress}
                    className="w-1/2 rounded-xl bg-red-600 py-2.5 font-mono text-xs font-bold text-white transition-all hover:bg-red-700 shadow-md active:scale-[0.99]"
                  >
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEUS DADOS (COM EDIÇÃO DE NOME, TELEFONE E DATA DE NASCIMENTO FORMATADA) */}
      {activeTab === "perfil" && (
        <div className="max-w-xl space-y-6">
          {profileSuccessMsg && (
            <div className="rounded-xl bg-emerald-500/15 p-4 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ✓ {profileSuccessMsg}
            </div>
          )}

          {!isEditingProfile ? (
            <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-content/10 pb-3">
                <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider">
                  Dados Cadastrais do Cliente
                </h3>
                <button
                  type="button"
                  onClick={handleStartEditProfile}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C59D3F]/40 bg-[#C59D3F]/10 px-3 py-1.5 font-mono text-xs font-bold text-[#C59D3F] hover:bg-[#C59D3F]/20"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Editar Informações</span>
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs text-content/80">
                <div className="flex justify-between border-b border-content/10 pb-2">
                  <span className="text-content/50">Nome Completo:</span>
                  <strong className="text-[#C59D3F] font-bold">{user.firstName} {user.lastName}</strong>
                </div>
                <div className="flex justify-between border-b border-content/10 pb-2">
                  <span className="text-content/50 flex items-center gap-1">
                    CPF / CNPJ: <Lock className="h-3 w-3 text-content/40" />
                  </span>
                  <strong className="text-content">{formatCpfOrCnpj(user.cpfCnpj)}</strong>
                </div>
                <div className="flex justify-between border-b border-content/10 pb-2">
                  <span className="text-content/50 flex items-center gap-1">
                    E-mail: <Lock className="h-3 w-3 text-content/40" />
                  </span>
                  <strong className="text-content">{user.email}</strong>
                </div>
                <div className="flex justify-between border-b border-content/10 pb-2">
                  <span className="text-content/50">Telefone / WhatsApp:</span>
                  <strong className="text-content">{formatPhone(user.phone)}</strong>
                </div>
                {user.cpfCnpj?.replace(/\D/g, "").length !== 14 && user.birthDate ? (
                  <div className="flex justify-between border-b border-content/10 pb-2">
                    <span className="text-content/50">Data de Nascimento:</span>
                    <strong className="text-content">
                      {formatDateBR(user.birthDate)}
                    </strong>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="rounded-2xl border border-[#C59D3F]/30 bg-card p-6 space-y-4 shadow-xl">
              <h3 className="font-display text-lg font-bold text-content">Editar Informações Pessoais</h3>

              {profileErrorMsg && (
                <div className="rounded-xl bg-red-500/10 p-3 font-mono text-xs font-semibold text-red-500 border border-red-500/20">
                  ⚠️ {profileErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Nome *</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Sobrenome *</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Telefone / WhatsApp *</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                  className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                />
              </div>

              {user.cpfCnpj?.replace(/\D/g, "").length !== 14 && (
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Data de Nascimento</label>
                  <input
                    type="date"
                    value={editBirthDate ? editBirthDate.split("T")[0] : ""}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
              )}

              {/* ALTERAÇÃO DE SENHA */}
              <div className="border-t border-content/12 pt-4 space-y-3">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#C59D3F] uppercase">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Alterar Senha de Acesso (Opcional)</span>
                </div>

                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Senha Atual</label>
                  <input
                    type="password"
                    placeholder="Digite sua senha atual"
                    value={editCurrentPassword}
                    onChange={(e) => setEditCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Nova Senha</label>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={editNewPassword}
                      onChange={(e) => setEditNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      placeholder="Repita a nova senha"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileErrorMsg("");
                  }}
                  className="w-1/2 rounded-lg border border-content/20 py-2.5 font-mono text-xs font-semibold text-content"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-1/2 rounded-lg bg-[#C59D3F] py-2.5 font-mono text-xs font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c]"
                >
                  {passwordLoading ? "Verificando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* REORDER CONFIRMATION MODAL */}
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
