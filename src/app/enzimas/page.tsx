import type { Metadata } from "next";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { EnzymesBiotechIntroSection } from "@/components/sections/EnzymesBiotechIntroSection";
import { ProductsSection } from "@/components/sections/ProductsSection";
import { ScienceSection } from "@/components/sections/ScienceSection";

export const metadata: Metadata = {
  title: "Bioregenerativos Recombinantes pbserum · Aura Regenera",
  description:
    "Conceito, biotecnologia recombinante, linha profissional pbserum Plus e detalhamento científico para bioremodelação tecidual.",
};

export default function EnzimasPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
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
