"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { collapseTrail, pushTrail, serverTrailSnapshot, subscribeTrail, trailSnapshot } from "@/lib/navigationTrail";
import type { BreadcrumbItem } from "./Breadcrumbs";

/**
 * Caminho visível acima do título. Antes da hidratação — e para quem chega
 * direto por link ou busca — vale a hierarquia declarada pela página; depois,
 * vale o caminho que a pessoa percorreu de verdade nesta aba.
 */
export function BreadcrumbTrail({ fallback }: { fallback: BreadcrumbItem[] }) {
  const pathname = usePathname();
  const label = fallback[fallback.length - 1]?.label;
  const trail = useSyncExternalStore(subscribeTrail, trailSnapshot, serverTrailSnapshot);

  useEffect(() => {
    if (!label) return;
    // Guardar a query mantém o filtro do catálogo ao voltar por aqui.
    pushTrail({ href: `${pathname}${window.location.search}`, label });
  }, [pathname, label]);

  const items: BreadcrumbItem[] = trail.length
    ? trail.map((entry, index) => ({ label: entry.label, ...(index < trail.length - 1 ? { href: entry.href } : {}) }))
    : fallback;

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-content/55">
      {collapseTrail(items).map((entry, index) => (
        <span key={index} className="flex items-center gap-2">
          {index ? <span aria-hidden="true">/</span> : null}
          {entry === "ellipsis" ? (
            <span aria-hidden="true">…</span>
          ) : entry.href ? (
            <Link href={entry.href} className="hover:text-content">
              {entry.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-content/80">
              {entry.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
