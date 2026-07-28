import type { Metadata } from "next";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { ProductsSection } from "@/components/sections/ProductsSection";
import { ScienceSection } from "@/components/sections/ScienceSection";

export const metadata: Metadata = {
  title: "Enzimas & Bioremodelação pbserum · Aura Regenera",
  description:
    "Linha profissional pbserum Plus e detalhamento científico das enzimas recombinantes de 2ª geração para bioremodelação tecidual.",
};

export default function EnzimasPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main>
        <ProductsSection />
        <ScienceSection />
        <ArticlesSection />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
