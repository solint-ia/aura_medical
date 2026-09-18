"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ClipboardList,
  Images,
  LayoutDashboard,
  Layers,
  Menu,
  Package,
  ScrollText,
  Sparkles,
  Stethoscope,
  Tags,
  Users,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const groups = [
  {
    label: "Catálogo",
    links: [
      { label: "Marcas", href: "/admin/linhas", icon: Sparkles },
      { label: "Produtos", href: "/admin/produtos", icon: Package },
      { label: "Protocolos", href: "/admin/protocolos", icon: Layers },
      { label: "Casos clínicos", href: "/admin/casos", icon: Stethoscope },
      { label: "Categorias", href: "/admin/categorias", icon: Tags },
      { label: "Fotos", href: "/admin/midia", icon: Images },
    ],
  },
  {
    label: "Operação",
    links: [
      { label: "Pedidos", href: "/admin/pedidos", icon: ClipboardList },
      { label: "Clientes", href: "/admin/clientes", icon: Users },
      { label: "Auditoria", href: "/admin/auditoria", icon: ScrollText },
    ],
  },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navigation = (
    <>
      <Link
        href="/admin"
        onClick={() => setOpen(false)}
        className={`mb-6 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          pathname === "/admin" ? "bg-action text-action-fg" : "hover:bg-content/5"
        }`}
      >
        <LayoutDashboard className="h-4 w-4" />
        Visão geral
      </Link>

      {groups.map((group) => (
        <section key={group.label} className="mb-7">
          <p className="mb-2 px-3 font-mono text-[10px] font-semibold tracking-[.18em] text-content/45 uppercase">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.links.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-raised font-semibold text-accent"
                      : "text-content/70 hover:bg-content/5 hover:text-content"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-canvas text-content">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-content/10 bg-canvas/95 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2" aria-label="Abrir menu">
          <Menu />
        </button>
        <strong className="font-display text-lg">Aura Admin</strong>
        <ThemeToggle />
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-panel/45 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-content/10 bg-card p-5 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/admin" className="font-display text-xl font-semibold">
            Aura Admin
          </Link>
          <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X />
          </button>
        </div>

        <nav aria-label="Administração" className="flex-1 overflow-y-auto">
          {navigation}
        </nav>

        <div className="mt-4 flex items-center justify-between border-t border-content/10 pt-4">
          <div className="flex flex-col gap-1.5">
            <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-content/60 hover:text-content">
              <ChevronLeft className="h-4 w-4" />
              Voltar ao site
            </Link>
            <Link href="/minha-conta" className="text-xs font-semibold text-content/45 hover:text-content">
              Minha conta e senha
            </Link>
          </div>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-7 sm:px-6 lg:ml-72 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
