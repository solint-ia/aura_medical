import type { Metadata } from "next";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { ScienceSection } from "@/components/sections/ScienceSection";

export const metadata: Metadata = {
  title: "Enzimas & Bioremodelação pbserum · Aura Regenera",
  description:
    "Detalhamento científico das enzimas recombinantes de 2ª geração pbserum. Mecanismos de ação na matriz extracelular para bioremodelação tecidual.",
};

export default function EnzimasPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main>
        <ScienceSection />
        <ArticlesSection />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
