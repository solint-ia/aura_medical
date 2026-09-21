"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CatalogOffer } from "@/data/catalog";

interface VariantState {
  offerId: string;
  select: (id: string) => void;
  /** Foto da variação escolhida, quando ela tem uma própria. */
  image?: string;
}

const VariantContext = createContext<VariantState | null>(null);

/**
 * Liga a escolha da variação à galeria e ao painel de compra, que ficam em
 * colunas diferentes da página. Escolher um tom troca o preço, o estoque e a
 * foto grande ao mesmo tempo.
 */
export function VariantProvider({ offers, children }: { offers: CatalogOffer[]; children: React.ReactNode }) {
  const [offerId, setOfferId] = useState(offers[0]?.id ?? "");
  const value = useMemo<VariantState>(
    () => ({
      offerId,
      select: setOfferId,
      image: offers.find((offer) => offer.id === offerId)?.image,
    }),
    [offerId, offers],
  );
  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
}

/** `null` fora da página de detalhe: os componentes seguem funcionando sozinhos. */
export function useVariant() {
  return useContext(VariantContext);
}
