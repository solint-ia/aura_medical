import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { FeaturedProducts } from "@/components/catalog/FeaturedProducts";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderServer } from "@/components/layout/SiteHeaderServer";
import { HeroSection } from "@/components/sections/HeroSection";
import { SafetyFaqSection } from "@/components/sections/SafetyFaqSection";
import { getFaq, getFeaturedProducts, getPublishedLines, getPublishedProducts } from "@/server/catalog/repository";

export default async function LandingPage() {
  const [lines, products, heroProducts, faqs] = await Promise.all([
    getPublishedLines(),
    getFeaturedProducts(6),
    getPublishedProducts(),
    getFaq("GLOBAL"),
  ]);
  return <AccreditationProvider><SiteHeaderServer /><main><HeroSection lines={lines} products={heroProducts} /><FeaturedProducts items={products} /><SafetyFaqSection items={faqs.map((faq) => ({ question: faq.question, answer: faq.answer, links: faq.links as never }))} /></main><SiteFooter /></AccreditationProvider>;
}
