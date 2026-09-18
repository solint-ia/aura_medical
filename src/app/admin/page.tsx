"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Images,
  Layers,
  PackageCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatBRL } from "@/lib/format";

interface Stats {
  totalRevenue?: number;
  totalOrdersCount?: number;
  totalUsersCount?: number;
  ordersTodayCount?: number;
  products?: number;
  media?: number;
  cases?: number;
}

export default function AdminPage() {
  const { authToken, user } = useAuth();
  const [stats, setStats] = useState<Stats>({});
  const [protocols, setProtocols] = useState(0);
  const [rightsRisk, setRightsRisk] = useState(0);

  useEffect(() => {
    if (!authToken) return;
    const headers = { Authorization: `Bearer ${authToken}` };
    void Promise.all([
      fetch("/api/admin/stats", { headers }).then((response) => response.json()),
      fetch("/api/admin/catalog/cases", { headers }).then((response) => response.json()),
      fetch("/api/admin/catalog/protocols", { headers }).then((response) => response.json()),
    ]).then(([summary, cases, protocolData]) => {
      setStats(summary ?? {});
      setProtocols((protocolData.protocols ?? []).length);
      setRightsRisk(
        (cases.cases ?? []).filter(
          (item: { status: string; imageRightsConfirmed: boolean }) =>
            item.status === "PUBLISHED" && !item.imageRightsConfirmed,
        ).length,
      );
    });
  }, [authToken]);

  const catalog = [
    { label: "Produtos", value: stats.products ?? 0, href: "/admin/produtos", icon: Boxes },
    { label: "Protocolos", value: protocols, href: "/admin/protocolos", icon: Layers },
    { label: "Casos clínicos", value: stats.cases ?? 0, href: "/admin/casos", icon: Stethoscope },
    { label: "Fotos", value: stats.media ?? 0, href: "/admin/midia", icon: Images },
  ];

  const operation = [
    { label: "Pedidos", value: String(stats.totalOrdersCount ?? 0), href: "/admin/pedidos", icon: PackageCheck },
    { label: "Clientes", value: String(stats.totalUsersCount ?? 0), href: "/admin/clientes", icon: Users },
    { label: "Faturamento", value: formatBRL(stats.totalRevenue ?? 0), href: "/admin/pedidos", icon: PackageCheck },
  ];

  return (
    <section>
      <p className="font-mono text-xs tracking-[.18em] text-accent uppercase">Administração</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">
        Olá{user?.firstName ? `, ${user.firstName}` : ""}
      </h1>
      <p className="mt-3 max-w-2xl text-content/65">
        Tudo o que aparece no site — marcas, produtos, protocolos, fotos e casos clínicos — é editado por aqui.
      </p>

      {rightsRisk ? (
        <Link
          href="/admin/casos"
          className="mt-7 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-700 dark:text-red-300"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {rightsRisk} caso publicado sem confirmação de direito de imagem.
          <ArrowRight className="ml-auto h-4 w-4 shrink-0" />
        </Link>
      ) : null}

      <h2 className="mt-10 font-mono text-xs tracking-[.18em] text-content/50 uppercase">Catálogo</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {catalog.map(({ label, value, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-[24px] border border-content/10 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40"
          >
            <Icon className="h-5 w-5 text-accent" />
            <p className="mt-7 font-mono text-3xl font-semibold">{value}</p>
            <div className="mt-2 flex items-center justify-between text-sm font-semibold">
              <span>{label}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 font-mono text-xs tracking-[.18em] text-content/50 uppercase">Operação</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {operation.map(({ label, value, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-[24px] border border-content/10 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40"
          >
            <Icon className="h-5 w-5 text-accent" />
            <p className="mt-7 font-mono text-2xl font-semibold">{value}</p>
            <div className="mt-2 flex items-center justify-between text-sm font-semibold">
              <span>{label}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-[24px] border border-content/10 bg-card p-6">
        <h2 className="font-display text-2xl font-semibold">Começar agora</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Cadastrar um produto", "/admin/produtos/novo"],
            ["Cadastrar um protocolo", "/admin/protocolos/novo"],
            ["Enviar fotos", "/admin/midia"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="rounded-xl bg-raised px-4 py-3 text-sm font-semibold hover:text-accent">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
