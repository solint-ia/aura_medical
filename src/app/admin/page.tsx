"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Check,
  Download,
  Edit2,
  Filter,
  Globe,
  Lock,
  LogOut,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  Users,
} from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/context/AuthContext";
import { formatBRL } from "@/lib/format";
import { formatCep, formatCpfOrCnpj, formatPhone } from "@/lib/validators";

type AdminTab = "stats" | "orders" | "users" | "profile";

interface AdminStats {
  totalRevenue: number;
  totalOrdersCount: number;
  totalUsersCount: number;
  ordersTodayCount: number;
  ordersWeekCount: number;
  ordersMonthCount: number;
  statusCounts: Record<string, number>;
  stateBreakdown: Array<{ uf: string; ordersCount: number; totalRevenue: number }>;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressSummary: string;
  uf: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  trackingCode: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface AdminUser {
  id: string;
  cpfCnpj: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

const BRAZIL_STATES = [
  "ALL",
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

function AdminDashboardContent() {
  const router = useRouter();
  const { user, isHydrated, logout, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Orders State & Filters
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [ufFilter, setUfFilter] = useState("ALL");
  const [orderQuery, setOrderQuery] = useState("");

  // Order Action Modals
  const [deletingOrder, setDeletingOrder] = useState<AdminOrder | null>(null);
  const [editingTrackingOrder, setEditingTrackingOrder] = useState<AdminOrder | null>(null);
  const [newTrackingCode, setNewTrackingCode] = useState("");

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  // Admin Profile Edit State
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileMsg, setProfileMsg] = useState("");

  // Check Admin Authorization
  const isAdmin =
    user &&
    (user.role === "ADMIN" ||
      user.email.toLowerCase() === "contato@auraregenera.com" ||
      user.email.toLowerCase().includes("admin"));

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async (uf: string) => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/admin/stats?uf=${uf}`);
      const data = await res.json();
      if (!data.error) {
        setStats(data);
      }
    } catch (err) {
      console.error("Erro ao carregar stats admin:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(
        `/api/admin/orders?period=${periodFilter}&uf=${ufFilter}&query=${encodeURIComponent(orderQuery)}`
      );
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos admin:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [periodFilter, ufFilter, orderQuery]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?query=${encodeURIComponent(userQuery)}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Erro ao carregar usuários admin:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [userQuery]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats(ufFilter);
      fetchOrders();
      fetchUsers();
    }
  }, [isAdmin, ufFilter, fetchStats, fetchOrders, fetchUsers]);

  // Update Order Status Inline
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        fetchStats(ufFilter);
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  // Update Order Tracking Code
  const handleSaveTrackingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrackingOrder) return;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTrackingOrder.id,
          trackingCode: newTrackingCode,
          status: newTrackingCode ? "em_transporte" : editingTrackingOrder.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editingTrackingOrder.id
              ? {
                  ...o,
                  trackingCode: newTrackingCode,
                  status: newTrackingCode ? "em_transporte" : o.status,
                }
              : o
          )
        );
        setEditingTrackingOrder(null);
        setNewTrackingCode("");
        fetchStats(ufFilter);
      }
    } catch (err) {
      console.error("Erro ao salvar código de rastreamento:", err);
    }
  };

  // Delete Order
  const handleDeleteOrder = async () => {
    if (!deletingOrder) return;
    try {
      const res = await fetch(`/api/admin/orders?id=${deletingOrder.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
        setDeletingOrder(null);
        fetchStats(ufFilter);
      }
    } catch (err) {
      console.error("Erro ao excluir pedido:", err);
    }
  };

  // Update User Profile by Admin
  const handleSaveUserByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });
      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const res = await fetch(`/api/admin/users?id=${deletingUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setDeletingUser(null);
      }
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
    }
  };

  // Save Admin Self Profile
  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    const res = await updateProfile({
      firstName: editFirstName || user?.firstName || "",
      lastName: editLastName || user?.lastName || "",
      phone: editPhone || user?.phone || "",
      birthDate: user?.birthDate || "",
    });

    if (res) {
      setProfileMsg("Perfil administrativo atualizado com sucesso!");
    }
  };

  // Export Filtered Orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert("Nenhum pedido filtrado para exportar.");
      return;
    }

    const headers = [
      "Numero_Pedido",
      "Data",
      "Cliente",
      "CPF_CNPJ",
      "Email",
      "Telefone",
      "Estado_UF",
      "Endereco",
      "Metodo_Frete",
      "Valor_Frete",
      "Valor_Total",
      "Status",
      "Codigo_Rastreio",
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString("pt-BR"),
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.customerEmail}"`,
      o.uf,
      `"${o.addressSummary.replace(/"/g, '""')}"`,
      `"${o.shippingMethod}"`,
      o.shippingCost.toFixed(2),
      o.totalPrice.toFixed(2),
      o.status,
      `"${o.trackingCode}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio-vendas-aura-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono text-sm text-content/60">
        Carregando ambiente administrativo...
      </div>
    );
  }

  // Auth Protection Notice
  if (!user || !isAdmin) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-500">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-content mb-2">
          Acesso Restrito ao Painel Admin
        </h1>
        <p className="text-sm text-content/75 mb-6">
          Você precisa estar conectado com uma conta de administrador autorizada para acessar o painel de gestão.
        </p>
        <Link
          href="/entrar"
          className="rounded-xl bg-[#C59D3F] px-8 py-3.5 font-bold text-xs text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md"
        >
          Ir para a Tela de Login →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-[clamp(20px,4vw,56px)] py-10">
      {/* Top Welcome Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-content/12 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#C59D3F]/20 px-3 py-1 font-mono text-[11px] font-bold text-[#C59D3F] flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Painel de Gestão Admin
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-content mt-2">
            Administração Aura Regenera
          </h1>
          <p className="text-sm text-content/70 mt-0.5 font-mono">
            Logado como <strong className="text-content">{user.firstName} {user.lastName}</strong> ({user.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 font-mono text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair do Admin</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8 flex border-b border-content/12 font-mono text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`flex items-center gap-2 py-3 px-5 font-bold uppercase transition-colors border-b-2 shrink-0 ${
            activeTab === "stats"
              ? "border-[#C59D3F] text-[#C59D3F]"
              : "border-transparent text-content/60 hover:text-content"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Visão Geral & Métricas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 py-3 px-5 font-bold uppercase transition-colors border-b-2 shrink-0 ${
            activeTab === "orders"
              ? "border-[#C59D3F] text-[#C59D3F]"
              : "border-transparent text-content/60 hover:text-content"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Gestão de Pedidos ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 py-3 px-5 font-bold uppercase transition-colors border-b-2 shrink-0 ${
            activeTab === "users"
              ? "border-[#C59D3F] text-[#C59D3F]"
              : "border-transparent text-content/60 hover:text-content"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Gestão de Clientes ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("profile");
            setEditFirstName(user.firstName);
            setEditLastName(user.lastName);
            setEditPhone(user.phone);
          }}
          className={`flex items-center gap-2 py-3 px-5 font-bold uppercase transition-colors border-b-2 shrink-0 ${
            activeTab === "profile"
              ? "border-[#C59D3F] text-[#C59D3F]"
              : "border-transparent text-content/60 hover:text-content"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Meus Dados Admin</span>
        </button>
      </div>

      {/* TAB 1: VISÃO GERAL & MÉTRICAS (COM FILTRO DE ESTADO/UF) */}
      {activeTab === "stats" && (
        <div className="space-y-8">
          {/* Header Controls for State UF Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-content/12 bg-card p-5">
            <div>
              <h3 className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Filtro Geográfico por Estado (UF)
              </h3>
              <p className="text-xs text-content/70 font-mono mt-0.5">
                Selecione o estado para calcular faturamento e volume de pedidos da região.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-content/60">Estado:</span>
              <select
                value={ufFilter}
                onChange={(e) => setUfFilter(e.target.value)}
                className="rounded-lg border border-content/20 bg-canvas px-3 py-2 font-mono text-xs font-bold text-content outline-none focus:border-[#C59D3F]"
              >
                <option value="ALL">🇧🇷 Todos os Estados do Brasil</option>
                {BRAZIL_STATES.filter((st) => st !== "ALL").map((st) => (
                  <option key={st} value={st}>
                    Estado: {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metric Overview Cards */}
          {stats && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#C59D3F]/30 bg-card p-6 space-y-1 shadow-xs">
                <span className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider">
                  Faturamento Total
                </span>
                <p className="font-display text-3xl font-bold text-[#C59D3F]">
                  {formatBRL(stats.totalRevenue)}
                </p>
                <p className="font-mono text-[11px] text-content/60">
                  {ufFilter === "ALL" ? "Brasil inteiro" : `Estado de ${ufFilter}`}
                </p>
              </div>

              <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-1 shadow-xs">
                <span className="font-mono text-xs font-bold text-content/60 uppercase tracking-wider">
                  Total de Pedidos
                </span>
                <p className="font-display text-3xl font-bold text-content">
                  {stats.totalOrdersCount}
                </p>
                <p className="font-mono text-[11px] text-content/60">
                  Hoje: {stats.ordersTodayCount} · Mês: {stats.ordersMonthCount}
                </p>
              </div>

              <div className="rounded-2xl border border-content/12 bg-card p-6 space-y-1 shadow-xs">
                <span className="font-mono text-xs font-bold text-content/60 uppercase tracking-wider">
                  Ticket Médio
                </span>
                <p className="font-display text-3xl font-bold text-content">
                  {stats.totalOrdersCount > 0
                    ? formatBRL(stats.totalRevenue / stats.totalOrdersCount)
                    : "R$ 0,00"}
                </p>
                <p className="font-mono text-[11px] text-content/60">Por compra realizada</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GESTÃO DE PEDIDOS (COM FILTROS DE PERÍODO, UF, BUSCA, EXPORTAÇÃO CSV E RASTREIO) */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Controls & Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-content/12 bg-card p-5">
            {/* Search Query */}
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Buscar por Nº do Pedido, Nome do Cliente ou E-mail..."
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full rounded-xl border border-content/18 bg-canvas py-2.5 pl-10 pr-4 font-mono text-xs text-content outline-none focus:border-[#C59D3F]"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-content/40" />
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-content/60 font-bold">Período:</span>
              <button
                type="button"
                onClick={() => setPeriodFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  periodFilter === "all"
                    ? "bg-[#C59D3F] text-[#0D1B2A]"
                    : "border border-content/15 text-content/70 hover:text-content"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter("month")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  periodFilter === "month"
                    ? "bg-[#C59D3F] text-[#0D1B2A]"
                    : "border border-content/15 text-content/70 hover:text-content"
                }`}
              >
                Último Mês
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter("week")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  periodFilter === "week"
                    ? "bg-[#C59D3F] text-[#0D1B2A]"
                    : "border border-content/15 text-content/70 hover:text-content"
                }`}
              >
                Última Semana
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter("today")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  periodFilter === "today"
                    ? "bg-[#C59D3F] text-[#0D1B2A]"
                    : "border border-content/15 text-content/70 hover:text-content"
                }`}
              >
                Hoje
              </button>
            </div>

            {/* State (UF) Filter */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-content/60 font-bold">UF:</span>
              <select
                value={ufFilter}
                onChange={(e) => setUfFilter(e.target.value)}
                className="rounded-lg border border-content/20 bg-canvas px-3 py-1.5 font-mono text-xs font-bold text-content outline-none focus:border-[#C59D3F]"
              >
                {BRAZIL_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st === "ALL" ? "Todos os Estados" : st}
                  </option>
                ))}
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C59D3F] px-4 py-2 font-mono text-xs font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </button>
          </div>

          {/* Orders List */}
          {loadingOrders ? (
            <div className="py-12 text-center font-mono text-xs text-[#C59D3F] animate-pulse">
              Buscando lista de pedidos no banco de dados...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-content/12 bg-card p-12 text-center font-mono text-xs text-content/60">
              Nenhum pedido encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl border border-content/12 bg-card p-6 space-y-4 shadow-xs transition-all hover:border-[#C59D3F]/40"
                >
                  {/* Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-content/10 pb-4 font-mono text-xs">
                    <div>
                      <span className="text-content/50 uppercase">Pedido:</span>{" "}
                      <strong className="text-[#C59D3F] text-base">{o.orderNumber}</strong>
                      <span className="text-content/50 ml-3">
                        Data: {new Date(o.createdAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(o.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Status inline selector */}
                    <div className="flex items-center gap-3">
                      <span className="text-content/60 font-bold">Status:</span>
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-bold outline-none ${
                          o.status === "pago"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : o.status === "em_transporte"
                              ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : o.status === "entregue"
                                ? "border-green-600 bg-green-600/15 text-green-700 dark:text-green-300"
                                : o.status === "cancelado"
                                  ? "border-red-500 bg-red-500/10 text-red-500"
                                  : "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        <option value="pendente">⏳ Pendente</option>
                        <option value="pago">✓ Pago</option>
                        <option value="em_separacao">🏬 Em Separação</option>
                        <option value="em_transporte">🚚 Em Transporte</option>
                        <option value="entregue">📦 Entregue</option>
                        <option value="cancelado">❌ Cancelado</option>
                      </select>

                      <span className="font-display text-lg font-bold text-[#C59D3F]">
                        {formatBRL(o.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Customer details & address */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 font-mono text-xs text-content/80">
                    <div>
                      <p className="text-content/50 uppercase font-bold text-[10px] mb-1">
                        Cliente & Contato:
                      </p>
                      <p className="font-bold text-content text-sm">{o.customerName}</p>
                      <p>{o.customerEmail}</p>
                      <p>{formatPhone(o.customerPhone)}</p>
                    </div>

                    <div>
                      <p className="text-content/50 uppercase font-bold text-[10px] mb-1">
                        Endereço de Entrega (UF: {o.uf}):
                      </p>
                      <p className="text-content font-medium">{o.addressSummary}</p>
                      <p className="text-content/60 mt-1">
                        Forma de Envio: <strong>{o.shippingMethod}</strong> ({formatBRL(o.shippingCost)})
                      </p>
                    </div>
                  </div>

                  {/* Tracking code section & actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-content/10 pt-4 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-content/60 font-bold">Código de Rastreio:</span>
                      {o.trackingCode ? (
                        <span className="rounded bg-[#C59D3F]/15 px-2.5 py-1 font-bold text-[#C59D3F]">
                          📦 {o.trackingCode}
                        </span>
                      ) : (
                        <span className="text-content/40 italic">Sem código inserido</span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingTrackingOrder(o);
                          setNewTrackingCode(o.trackingCode || "");
                        }}
                        className="ml-2 font-bold text-[#C59D3F] hover:underline"
                      >
                        {o.trackingCode ? "Alterar Rastreio" : "+ Inserir Rastreio"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeletingOrder(o)}
                      className="inline-flex items-center gap-1 text-red-500 hover:underline font-bold ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir Pedido</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal para Editar Código de Rastreamento */}
          {editingTrackingOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <form
                onSubmit={handleSaveTrackingCode}
                className="w-full max-w-md rounded-2xl border border-content/12 bg-card p-6 shadow-2xl space-y-4"
              >
                <h3 className="font-display text-lg font-bold text-content">
                  Código de Rastreio - Pedido {editingTrackingOrder.orderNumber}
                </h3>
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">
                    Código de Rastreamento (Correios / Melhor Envio)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: ME395817234BR ou JAD123456"
                    value={newTrackingCode}
                    onChange={(e) => setNewTrackingCode(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-sm text-content outline-none focus:border-[#C59D3F]"
                  />
                  <p className="mt-1 font-mono text-[10px] text-content/60">
                    Ao salvar, o status do pedido mudará automaticamente para <strong>Em Transporte</strong>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingTrackingOrder(null)}
                    className="w-1/2 rounded-xl border border-content/20 py-2.5 font-mono text-xs font-semibold text-content hover:bg-content/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 rounded-xl bg-[#C59D3F] py-2.5 font-mono text-xs font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md"
                  >
                    Salvar Rastreio →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Exclusão de Pedido */}
          {deletingOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-card p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-content">Excluir Pedido</h3>
                    <p className="text-xs font-mono text-content/60">{deletingOrder.orderNumber}</p>
                  </div>
                </div>
                <p className="text-xs text-content/80">
                  Tem certeza que deseja remover este pedido permanentemente do banco de dados?
                </p>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingOrder(null)}
                    className="w-1/2 rounded-xl border border-content/20 py-2.5 font-mono text-xs font-semibold text-content hover:bg-content/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteOrder}
                    className="w-1/2 rounded-xl bg-red-600 py-2.5 font-mono text-xs font-bold text-white hover:bg-red-700 shadow-md"
                  >
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GESTÃO DE USUÁRIOS */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-content/12 bg-card p-5">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Buscar cliente por Nome, E-mail ou CPF/CNPJ..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="w-full rounded-xl border border-content/18 bg-canvas py-2.5 pl-10 pr-4 font-mono text-xs text-content outline-none focus:border-[#C59D3F]"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-content/40" />
            </div>

            <span className="font-mono text-xs font-bold text-[#C59D3F]">
              Total: {users.length} cliente(s)
            </span>
          </div>

          {/* Users Table */}
          {loadingUsers ? (
            <div className="py-12 text-center font-mono text-xs text-[#C59D3F] animate-pulse">
              Buscando usuários cadastrados...
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-content/12 bg-card p-12 text-center font-mono text-xs text-content/60">
              Nenhum cliente cadastrado no momento.
            </div>
          ) : (
            <div className="rounded-2xl border border-content/12 bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-content/10 bg-canvas uppercase text-content/60">
                    <tr>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">CPF / CNPJ</th>
                      <th className="p-4">E-mail</th>
                      <th className="p-4">Telefone</th>
                      <th className="p-4">Regra</th>
                      <th className="p-4">Compras</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-content/10">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-content/5 transition-colors">
                        <td className="p-4 font-bold text-content">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="p-4 text-content/80">{formatCpfOrCnpj(u.cpfCnpj)}</td>
                        <td className="p-4 text-content/80">{u.email}</td>
                        <td className="p-4 text-content/80">{formatPhone(u.phone)}</td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                              u.role === "ADMIN"
                                ? "bg-[#C59D3F]/20 text-[#C59D3F]"
                                : "bg-content/10 text-content/70"
                            }`}
                          >
                            {u.role === "ADMIN" ? "ADMIN 👑" : "CLIENTE"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-[#C59D3F]">{u.totalOrders} pedido(s)</span>
                          <p className="text-[10px] text-content/50">{formatBRL(u.totalSpent)}</p>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              className="text-[#C59D3F] hover:underline font-bold"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              className="text-red-500 hover:underline font-bold"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Editar Usuário pelo Admin */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <form
                onSubmit={handleSaveUserByAdmin}
                className="w-full max-w-lg rounded-2xl border border-content/12 bg-card p-6 shadow-2xl space-y-4"
              >
                <h3 className="font-display text-lg font-bold text-content">
                  Editar Cliente - {editingUser.firstName} {editingUser.lastName}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Nome</label>
                    <input
                      type="text"
                      value={editingUser.firstName}
                      onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                      className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-xs text-content outline-none focus:border-[#C59D3F]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Sobrenome</label>
                    <input
                      type="text"
                      value={editingUser.lastName}
                      onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                      className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-xs text-content outline-none focus:border-[#C59D3F]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">E-mail</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-xs text-content outline-none focus:border-[#C59D3F]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Telefone</label>
                    <input
                      type="tel"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-xs text-content outline-none focus:border-[#C59D3F]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">Nível de Permissão</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full rounded-lg border border-content/18 bg-canvas px-3 py-2 text-xs font-bold text-content outline-none focus:border-[#C59D3F]"
                    >
                      <option value="USER">CLIENTE COMUM (USER)</option>
                      <option value="ADMIN">ADMINISTRADOR (ADMIN 👑)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="w-1/2 rounded-xl border border-content/20 py-2.5 font-mono text-xs font-semibold text-content hover:bg-content/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 rounded-xl bg-[#C59D3F] py-2.5 font-mono text-xs font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md"
                  >
                    Salvar Alterações →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Excluir Usuário */}
          {deletingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-card p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-content">Excluir Cliente</h3>
                    <p className="text-xs font-mono text-content/60">
                      {deletingUser.firstName} {deletingUser.lastName}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-content/80">
                  Tem certeza que deseja remover este cliente do banco de dados?
                </p>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingUser(null)}
                    className="w-1/2 rounded-xl border border-content/20 py-2.5 font-mono text-xs font-semibold text-content hover:bg-content/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="w-1/2 rounded-xl bg-red-600 py-2.5 font-mono text-xs font-bold text-white hover:bg-red-700 shadow-md"
                  >
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MEUS DADOS ADMIN */}
      {activeTab === "profile" && (
        <div className="max-w-xl space-y-6">
          {profileMsg && (
            <div className="rounded-xl bg-emerald-500/15 p-4 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ✓ {profileMsg}
            </div>
          )}

          <form onSubmit={handleSaveAdminProfile} className="rounded-2xl border border-[#C59D3F]/30 bg-card p-6 space-y-4 shadow-xl">
            <h3 className="font-display text-lg font-bold text-content">
              Atualizar Perfil do Administrador
            </h3>

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
              <label className="block mb-1 font-mono text-[11px] uppercase text-content/70">E-mail Cadastrado (Bloqueado)</label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full rounded-lg border border-content/10 bg-content/5 px-3 py-2 text-sm text-content/60 outline-none cursor-not-allowed"
              />
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

            <button
              type="submit"
              className="w-full rounded-xl bg-[#C59D3F] py-3 text-xs font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]"
            >
              Salvar Dados Admin →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main className="bg-canvas min-h-screen">
        <AdminDashboardContent />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
