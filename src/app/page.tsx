import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ClinicalCasesSection } from "@/components/sections/ClinicalCasesSection";
import { ClinicalMappingSection } from "@/components/sections/ClinicalMappingSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { MosaicSection } from "@/components/sections/MosaicSection";
import { PartnershipCtaSection } from "@/components/sections/PartnershipCtaSection";
import { ProductsSection } from "@/components/sections/ProductsSection";
import { ProtocolsSection } from "@/components/sections/ProtocolsSection";
import { SafetyFaqSection } from "@/components/sections/SafetyFaqSection";

export default function LandingPage() {
  return (
    <AccreditationProvider>
      <SiteHeader />
      <main>
        <HeroSection />
        <MosaicSection />
        <ProductsSection />
        <ClinicalCasesSection />
        <ClinicalMappingSection />
        <ProtocolsSection />
        <SafetyFaqSection />
        <PartnershipCtaSection />
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
