import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ClinicalCasesSection } from "@/components/sections/ClinicalCasesSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { IndicationsSection } from "@/components/sections/IndicationsSection";
import { ProductsSection } from "@/components/sections/ProductsSection";
import { ProtocolsSection } from "@/components/sections/ProtocolsSection";
import { SafetyFaqSection } from "@/components/sections/SafetyFaqSection";
import { ScienceSection } from "@/components/sections/ScienceSection";

export default function LandingPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main>
        <HeroSection />
        <ScienceSection />
        <ProductsSection />
        <ClinicalCasesSection />
        <IndicationsSection />
        <ProtocolsSection />
        <SafetyFaqSection />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
