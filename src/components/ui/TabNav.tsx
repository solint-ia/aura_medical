"use client";

import type { LucideIcon } from "lucide-react";

export interface TabNavItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface TabNavProps<T extends string> {
  items: readonly TabNavItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

/**
 * Navegação por abas do painel (admin e área do cliente).
 *
 * Em telas estreitas vira uma grade de chips: todas as seções ficam visíveis
 * de uma vez, sem depender de scroll horizontal — que é invisível e ninguém
 * descobre. A partir de `lg` volta ao formato de abas sublinhadas; se não
 * couberem numa linha elas quebram para a seguinte em vez de sumir na borda.
 */
export function TabNav<T extends string>({
  items,
  active,
  onChange,
  className = "",
}: TabNavProps<T>) {
  return (
    <nav
      aria-label="Seções do painel"
      className={`mb-8 grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-0 lg:border-b lg:border-content/12 ${className}`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center font-bold uppercase leading-tight transition-colors lg:justify-start lg:rounded-none lg:border-0 lg:border-b-2 lg:px-4 lg:py-3 lg:text-left xl:px-5 ${
              isActive
                ? "border-[#C59D3F] bg-[#C59D3F] text-[#0D1B2A] shadow-xs lg:bg-transparent lg:text-[#C59D3F]"
                : "border-content/15 bg-card text-content/70 hover:border-content/30 hover:text-content lg:border-transparent lg:bg-transparent lg:text-content/60 lg:hover:border-transparent"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
