"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Link que, quando aponta para a página já aberta, leva o usuário de volta ao
 * topo. Clicar na URL atual não gera navegação, então sem isso nada acontecia.
 */
export function ScrollTopLink({ href, onClick, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const [targetPath, targetQuery = ""] = href.split("#")[0].split("?");
        const currentQuery = window.location.search.replace(/^\?/, "");
        // Filtros diferentes (ex.: /catalogo?linha=…) são navegação de verdade.
        if (targetPath !== pathname || targetQuery !== currentQuery) return;
        event.preventDefault();
        if (window.location.hash) window.history.replaceState(window.history.state, "", href);
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      }}
      {...props}
    />
  );
}
