"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Menu, PackageCheck, ShoppingCart, User, X } from "lucide-react";
import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { LINE_LIST } from "@/data/lines";
import { HEADER_ACCREDITATION_CTA_LABEL } from "@/data/site";

export interface HeaderLine { slug: string; name: string; descriptor: string }

/** Botões redondos de ícone: mesma borda e mesma tinta em cada tema. */
const ICON_BUTTON =
  "flex items-center justify-center rounded-full border border-black/10 text-slate-800 transition-colors hover:border-[#C59D3F] hover:text-[#C59D3F] dark:border-white/20 dark:text-white dark:hover:border-[#D8B657] dark:hover:text-[#D8B657]";

/** Painéis suspensos: dropdown de linhas, menu da conta e menu mobile. */
const PANEL =
  "border border-black/8 bg-white/95 text-slate-900 shadow-[0_18px_50px_rgba(12,24,39,.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#102438]/95 dark:text-white dark:shadow-2xl";

export function SiteHeader({ lines = LINE_LIST.map((line) => ({ slug: line.id, name: line.name, descriptor: line.descriptor })) }: { lines?: HeaderLine[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { totalItems, isHydrated } = useCart();
  const { user, logout } = useAuth();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "";
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-content/8 bg-canvas/80 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-4 sm:px-8 sm:py-5 lg:py-6">
        {/* O lockup horizontal padrão tem o texto em branco e só se sustenta sobre o vidro
            escuro; no tema claro entra a versão dourada, legível sobre o vidro branco. */}
        <Link href="/" className="shrink-0" aria-label="Aura Regenera — início">
          <Image src="/logos/logo-header-light.png" alt="Aura Regenera" width={300} height={75} priority className="h-12 w-auto object-contain sm:h-15 lg:h-[4.5rem] dark:hidden" />
          <Image src="/logos/logo-aura-horizontal.png" alt="" aria-hidden="true" width={300} height={75} priority className="hidden h-12 w-auto object-contain sm:h-15 lg:h-[4.5rem] dark:block" />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-9 lg:flex">
          <NavLink href="/" current={active("/")}>Home</NavLink>
          <NavLink href="/catalogo" current={pathname === "/catalogo"}>Catálogo</NavLink>
          <div className="group relative">
            <button type="button" className={`inline-flex items-center gap-2 py-3 text-[17px] font-semibold transition-colors hover:text-[#C59D3F] dark:hover:text-[#D8B657] ${pathname.startsWith("/linhas") ? "text-[#C59D3F] dark:text-[#D8B657]" : "text-slate-700 dark:text-white/85"}`}>Linhas <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" /></button>
            <div className={`invisible absolute left-1/2 top-full w-[360px] -translate-x-1/2 translate-y-2 rounded-[20px] p-2 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${PANEL}`}>
              {lines.map((line) => <Link key={line.slug} href={`/linhas/${line.slug}`} className="flex gap-3 rounded-[15px] p-3.5 hover:bg-black/4 dark:hover:bg-white/7"><span><strong className="block text-sm font-semibold">{line.name}</strong><span className="mt-0.5 block text-xs text-slate-500 dark:text-white/55">{line.descriptor}</span></span></Link>)}
              <Link href="/catalogo" className="mt-1 block rounded-[14px] border-t border-black/6 px-4 py-3 text-center text-xs font-semibold text-[#A8801F] hover:bg-black/4 dark:border-white/8 dark:text-[#D8B657] dark:hover:bg-white/5">Ver catálogo completo</Link>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <AccreditationButton className="rounded-full bg-[#C59D3F] px-5 py-2.5 text-sm font-semibold text-[#0D1B2A] shadow-[0_6px_18px_rgba(197,157,63,.28)] hover:bg-[#D4AC4C]">{HEADER_ACCREDITATION_CTA_LABEL}</AccreditationButton>
          <AccountControl user={user} initials={initials} open={profileOpen} setOpen={setProfileOpen} logout={logout} />
          <CartLink count={isHydrated ? totalItems : 0} />
          {/* O ThemeToggle já se apoia nos tokens `content`, que viram com o tema. */}
          <ThemeToggle className="h-10 w-10" />
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <CartLink count={isHydrated ? totalItems : 0} />
          <button type="button" onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen} aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} className={`h-10 w-10 ${ICON_BUTTON}`}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>

        {mobileOpen ? (
          <div className={`absolute left-4 right-4 top-[calc(100%+8px)] rounded-[22px] p-4 lg:hidden ${PANEL}`}>
            <div className="flex flex-col gap-1"><Link href="/" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-black/4 dark:hover:bg-white/5">Home</Link><Link href="/catalogo" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-black/4 dark:hover:bg-white/5">Catálogo</Link></div>
            <div className="my-2 border-y border-black/6 py-2 dark:border-white/8"><p className="px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-white/45">Linhas</p>{lines.map((line) => <Link key={line.slug} href={`/linhas/${line.slug}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-black/4 dark:hover:bg-white/5"><span><strong className="block text-sm">{line.name}</strong><span className="block text-xs text-slate-500 dark:text-white/50">{line.descriptor}</span></span></Link>)}</div>
            <div className="grid grid-cols-[auto_1fr] gap-2 sm:grid-cols-[auto_1fr_1fr]"><ThemeToggle className="h-11 w-11" />{user ? <Link href="/minha-conta" onClick={() => setMobileOpen(false)} className={`gap-2 px-4 py-3 text-sm font-semibold ${ICON_BUTTON}`}><User className="h-4 w-4" />Minha conta</Link> : <Link href="/entrar" onClick={() => setMobileOpen(false)} className={`gap-2 px-4 py-3 text-sm font-semibold ${ICON_BUTTON}`}><User className="h-4 w-4" />Entrar</Link>}<AccreditationButton onActivate={() => setMobileOpen(false)} className="col-span-2 rounded-full bg-[#C59D3F] px-4 py-3 text-sm font-semibold text-[#0D1B2A] sm:col-span-1">{HEADER_ACCREDITATION_CTA_LABEL}</AccreditationButton></div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function NavLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  return <Link href={href} className={`py-3 text-[17px] font-semibold transition-colors hover:text-[#C59D3F] dark:hover:text-[#D8B657] ${current ? "text-[#C59D3F] dark:text-[#D8B657]" : "text-slate-700 dark:text-white/90"}`}>{children}</Link>;
}

function CartLink({ count }: { count: number }) {
  return <Link href="/carrinho" aria-label={`Carrinho (${count} itens)`} className={`relative h-11 w-11 ${ICON_BUTTON}`}><ShoppingCart className="h-4.5 w-4.5" />{count > 0 ? <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C59D3F] px-1 font-mono text-[10px] font-bold text-[#0D1B2A]">{count}</span> : null}</Link>;
}

function AccountControl({ user, initials, open, setOpen, logout }: { user: ReturnType<typeof useAuth>["user"]; initials: string; open: boolean; setOpen: (value: boolean) => void; logout: () => void }) {
  if (!user) return <Link href="/entrar" aria-label="Entrar" className={`h-10 w-10 ${ICON_BUTTON}`}><User className="h-4.5 w-4.5" /></Link>;
  return <div className="relative"><button type="button" onClick={() => setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C59D3F] font-mono text-xs font-bold text-[#0D1B2A]">{initials}</button>{open ? <div className={`absolute right-0 top-full mt-2 w-56 rounded-[16px] p-2 ${PANEL}`}><p className="truncate border-b border-black/6 px-3 py-2 text-xs text-slate-500 dark:border-white/8 dark:text-white/60">{user.email}</p><Link href={user.role === "ADMIN" ? "/admin" : "/minha-conta"} onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs hover:bg-black/4 dark:hover:bg-white/6"><PackageCheck className="h-4 w-4" />{user.role === "ADMIN" ? "Painel admin" : "Minha conta"}</Link><button type="button" onClick={() => { setOpen(false); logout(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-red-600 hover:bg-red-500/10 dark:text-red-300"><LogOut className="h-4 w-4" />Sair</button></div> : null}</div>;
}
