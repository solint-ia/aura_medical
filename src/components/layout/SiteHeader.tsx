"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, MapPin, PackageCheck, ShoppingCart, User } from "lucide-react";

import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import { AuthModal } from "@/components/auth/AuthModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { HEADER_ACCREDITATION_CTA_LABEL, NAV_LINKS } from "@/data/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuRequested, setIsMenuRequested] = useState(false);
  const isWideViewport = useMediaQuery("(min-width: 1180px)", true);
  const { totalItems, isHydrated } = useCart();
  const { user, logout } = useAuth();
  const [activeHash, setActiveHash] = useState<string>("");

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const isMenuOpen = isMenuRequested && !isWideViewport;
  const closeMenu = () => setIsMenuRequested(false);

  // Active section scroll spy for homepage anchor links
  useEffect(() => {
    if (pathname !== "/") {
      setActiveHash("");
      return;
    }

    const handleScroll = () => {
      const sectionIds = ["protocolos", "casos"];
      const scrollPos = window.scrollY + 220;

      let current = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            current = `#${id}`;
            break;
          }
        }
      }
      setActiveHash(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" && activeHash === "";
    }
    if (href.startsWith("/#")) {
      const hash = href.replace("/", "");
      return pathname === "/" && activeHash === hash;
    }
    return pathname.startsWith(href);
  };

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between gap-6 bg-[#0D1B2A]/95 px-[clamp(20px,4vw,56px)] py-4 backdrop-blur-[14px] text-[#F6F3EC] shadow-[0_10px_35px_rgba(10,22,34,0.3)] relative">
        {/* Soft Fading Gold Gradient Line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C59D3F]/40 to-transparent"
        />
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <Image
            src="/logos/logo-horizontal-3.png"
            alt="Aura Regenera"
            width={280}
            height={70}
            className="h-11 sm:h-12 md:h-14 w-auto object-contain drop-shadow-sm"
            priority
          />
        </Link>

        <nav
          aria-label="Seções da página"
          className="hidden items-center gap-[22px] wide:flex"
        >
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[14.5px] whitespace-nowrap transition-colors ${
                  active
                    ? "font-bold text-[#C59D3F] border-b-2 border-[#C59D3F] pb-0.5"
                    : "font-medium text-white/85 hover:text-[#C59D3F]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <AccreditationButton className="rounded-[7px] bg-[#C59D3F] px-[22px] py-[11px] text-sm font-semibold whitespace-nowrap text-[#0D1B2A] transition-colors hover:bg-[#d4ac4c] shadow-md active:scale-[0.99]">
            {HEADER_ACCREDITATION_CTA_LABEL}
          </AccreditationButton>

          {/* User Profile Circular Icon / Avatar & Dropdown */}
          <div className="relative">
            {user ? (
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C59D3F] font-mono text-xs font-bold text-[#0D1B2A] ring-2 ring-[#C59D3F]/40 transition-all hover:scale-105"
                title={`Perfil de ${user.firstName}`}
              >
                {userInitials}
              </button>
            ) : (
              <Link
                href="/entrar"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-[#C59D3F] hover:text-[#C59D3F]"
                title="Entrar na Conta / Cadastrar"
              >
                <User className="h-4.5 w-4.5" />
              </Link>
            )}

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && user && (
              <div className="absolute right-0 top-12 w-56 rounded-xl border border-white/15 bg-[#0D1B2A] p-2 shadow-2xl text-xs font-mono">
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="font-bold text-white text-sm">{user.firstName} {user.lastName}</p>
                  <p className="text-[11px] text-white/60 truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/minha-conta"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/90 hover:bg-[#C59D3F]/15 hover:text-[#C59D3F]"
                  >
                    <PackageCheck className="h-4 w-4" />
                    <span>Minha Área</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/carrinho"
            aria-label={`Carrinho de compras (${isHydrated ? totalItems : 0} itens)`}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white transition-colors hover:border-[#C59D3F] hover:text-[#C59D3F]"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            {isHydrated && totalItems > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#C59D3F] font-mono text-[10.5px] font-bold text-[#0D1B2A] shadow-md animate-scale-up">
                {totalItems}
              </span>
            ) : null}
          </Link>
          <ThemeToggle className="border-white/20 text-white hover:border-[#C59D3F] hover:text-[#C59D3F]" />
        </nav>

        {/* Mobile nav toggle */}
        <div className="flex items-center gap-2 wide:hidden">
          {/* Mobile Profile Icon */}
          {user && (
            <Link
              href="/minha-conta"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C59D3F] font-mono text-xs font-bold text-[#0D1B2A]"
            >
              {userInitials}
            </Link>
          )}
          {!user && (
            <Link
              href="/entrar"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white"
              title="Entrar na Conta / Cadastrar"
            >
              <User className="h-5 w-5" />
            </Link>
          )}

          <Link
            href="/carrinho"
            aria-label={`Carrinho de compras (${isHydrated ? totalItems : 0} itens)`}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 text-white transition-colors hover:border-[#C59D3F] hover:text-[#C59D3F]"
          >
            <ShoppingCart className="h-5 w-5" />
            {isHydrated && totalItems > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#C59D3F] font-mono text-[10.5px] font-bold text-[#0D1B2A] shadow-md animate-scale-up">
                {totalItems}
              </span>
            ) : null}
          </Link>
          <ThemeToggle className="h-11 w-11 border-white/20 text-white hover:border-[#C59D3F] hover:text-[#C59D3F]" />

          <button
            type="button"
            onClick={() => setIsMenuRequested((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="menu-mobile"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-lg border border-white/20 text-white wide:hidden"
          >
            {isMenuOpen ? (
              <>
                <span className="h-0.5 w-[18px] translate-y-px rotate-45 bg-[#C59D3F]" />
                <span className="-mt-0.5 h-0.5 w-[18px] -translate-y-px -rotate-45 bg-[#C59D3F]" />
              </>
            ) : (
              <>
                <span className="h-0.5 w-[18px] bg-white" />
                <span className="h-0.5 w-[18px] bg-white" />
                <span className="h-0.5 w-[18px] bg-white" />
              </>
            )}
          </button>
        </div>

        {isMenuOpen ? (
          <div
            id="menu-mobile"
            className="absolute top-full right-0 left-0 flex flex-col gap-[18px] border-b border-white/10 bg-[#0D1B2A] px-[clamp(20px,4vw,56px)] pt-5 pb-7 shadow-2xl wide:hidden text-[#F6F3EC]"
          >
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`text-base transition-colors ${
                    active ? "font-bold text-[#C59D3F]" : "font-medium text-white/90 hover:text-[#C59D3F]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <AccreditationButton
              onActivate={closeMenu}
              className="rounded-[7px] bg-[#C59D3F] px-[22px] py-3.5 text-[15px] font-semibold text-[#0D1B2A]"
            >
              {HEADER_ACCREDITATION_CTA_LABEL}
            </AccreditationButton>
          </div>
        ) : null}
      </header>

      {/* Auth Modal Triggered from Profile Icon */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
