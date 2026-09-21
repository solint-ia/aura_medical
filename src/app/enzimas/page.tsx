import type { Metadata } from "next";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SubNavBar, type SubNavItem } from "@/components/navigation/SubNavBar";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { ANVISA_CHAPTER_ID, EnzymesBiotechIntroSection } from "@/components/sections/EnzymesBiotechIntroSection";
import { ProductsSection } from "@/components/sections/ProductsSection";
import { ScienceSection } from "@/components/sections/ScienceSection";

export const metadata: Metadata = {
  title: "Bioregenerativos Recombinantes Pbserum · Aura Regenera",
  description:
    "Conceito, biotecnologia recombinante, linha profissional Pbserum Plus e detalhamento científico para bioremodelação tecidual.",
};

// O bloco de capítulos responde pelo id `registro-anvisa` desde antes da
// sub-barra, porque o FAQ aponta direto para o capítulo da ANVISA. O rótulo
// descreve o bloco inteiro, que começa na biotecnologia recombinante.
const SECTIONS: SubNavItem[] = [
  { id: ANVISA_CHAPTER_ID, label: "Biotecnologia" },
  { id: "produtos", label: "Enzimas" },
  { id: "ciencia", label: "Mecanismos" },
  { id: "artigos", label: "Evidências" },
];

export default function EnzimasPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <SubNavBar items={SECTIONS} brandLabel="Ciência Pbserum" />
      <main>
        <EnzymesBiotechIntroSection />
        <ProductsSection />
        <ScienceSection />
        <ArticlesSection />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
