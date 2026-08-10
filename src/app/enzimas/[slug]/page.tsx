import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Award } from "lucide-react";

import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BuyEnzymeVialButton } from "@/components/enzymes/BuyEnzymeVialButton";
import {
  enzymesData,
  getEnzymeBySlug,
  safetyInformation,
} from "@/data/enzymes";
import { PRODUCTS } from "@/data/products";

interface EnzymePageProps {
  params: Promise<{
    slug: string;
  }>;
}

const VIAL_IMAGE_MAP: Record<string, string> = {
  slim: "/frascos/slim.png",
  smooth: "/frascos/smooth.png",
  drain: "/frascos/drain.png",
};

export async function generateStaticParams() {
  return enzymesData.map((enzyme) => ({
    slug: enzyme.slug,
  }));
}

export async function generateMetadata({
  params,
}: EnzymePageProps): Promise<Metadata> {
  const { slug } = await params;
  const enzyme = getEnzymeBySlug(slug);

  if (!enzyme) {
    return {
      title: "Bioregenerativo não encontrado · Aura Regenera",
    };
  }

  return {
    title: `${enzyme.name} (${enzyme.activeIngredient}) · Bioregenerativos Recombinantes | Aura Regenera`,
    description: enzyme.shortDescription,
  };
}

export default async function EnzymeDetailPage({ params }: EnzymePageProps) {
  const { slug } = await params;
  const enzyme = getEnzymeBySlug(slug);

  if (!enzyme) {
    notFound();
  }

  const baseId = slug.replace("-plus", "");
  const matchingProduct = PRODUCTS.find((p) => p.id === baseId);
  const vialImage = VIAL_IMAGE_MAP[baseId] || "/frascos/slim.png";

  return (
    <AccreditationProvider>
      <SiteHeader />
      <main className="min-h-screen bg-canvas">
        {/* Hero Section (Dark Navy) */}
        <section
          id="hero-enzima"
          className="relative overflow-hidden bg-[#0D1B2A] px-[clamp(20px,4vw,56px)] pt-12 pb-16 md:pt-16 md:pb-24 text-[#F6F3EC]"
        >
          {/* Subtle Ambient Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.18)_0%,transparent_70%)] blur-3xl"
          />

          <div className="relative z-10 mx-auto max-w-[1280px]">
            {/* Back Navigation */}
            <Link
              href="/#produtos"
              className="inline-flex items-center gap-2 font-mono text-xs tracking-wider text-[#C59D3F] transition-colors hover:text-[#d4ac4c] mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar para Linha Profissional</span>
            </Link>

            {/* Strict 2-Column Grid (Span 7 Left, Span 5 Right) */}
            <div className="grid grid-cols-1 gap-10 lg:gap-12 items-center lg:grid-cols-12 max-w-7xl mx-auto">
              {/* Left Column: Text & Actions (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-semibold tracking-[0.18em] text-[#C59D3F] uppercase">
                    Bioregenerativo Recombinante
                  </span>
                  {enzyme.patented ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#C59D3F]/40 bg-[#C59D3F]/15 px-3 py-1 font-mono text-[11px] font-semibold text-[#C59D3F]">
                      <Award className="h-3 w-3" /> Patented
                    </span>
                  ) : null}
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F6F3EC] leading-[1.08]">
                  {enzyme.name}
                </h1>

                <p className="font-mono text-lg text-[#C59D3F]">
                  Ingrediente Ativo: <strong className="text-[#F6F3EC] font-semibold">{enzyme.activeIngredient}</strong>
                </p>

                <p className="text-base sm:text-lg text-[#F6F3EC]/80 leading-relaxed max-w-2xl">
                  {enzyme.shortDescription}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <BuyEnzymeVialButton
                    id={baseId}
                    name={enzyme.name}
                    activeIngredient={enzyme.activeIngredient}
                    imagePath={vialImage}
                    price={390}
                  />

                  <Link
                    href="/#protocolos"
                    className="group inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition-all hover:border-[#C59D3F] hover:bg-white/15"
                  >
                    <span>Ver Protocolos com {enzyme.name}</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Floating 3D Box Packaging Image (Original Main Display) */}
              {matchingProduct ? (
                <div className="lg:col-span-5 flex items-center justify-center py-4 lg:py-0">
                  <Image
                    src={matchingProduct.imageSrc}
                    alt={`Embalagem ${enzyme.name}`}
                    width={720}
                    height={720}
                    priority
                    sizes="(max-width: 768px) 95vw, 720px"
                    className="h-auto w-full max-w-[440px] sm:max-w-[540px] lg:max-w-[620px] object-contain -rotate-3 lg:-rotate-6 drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] transition-all duration-500 hover:rotate-0 hover:scale-[1.05]"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Science & Mechanism Section */}
        <section
          id="ciencia"
          aria-labelledby="ciencia-enzima-title"
          className="px-[clamp(20px,4vw,56px)] py-16 md:py-24 bg-canvas text-content"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-12">
              <span className="font-mono text-xs font-semibold tracking-[0.18em] text-[#C59D3F] uppercase">
                Mecanismo de Ação & Especificações
              </span>
              <h2
                id="ciencia-enzima-title"
                className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-content"
              >
                Ciência Recombinante pbserum
              </h2>
            </div>

            {/* Data Display Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="rounded-2xl border border-content/12 bg-card p-6 shadow-sm">
                <span className="block font-mono text-xs font-semibold tracking-wider text-content/50 uppercase mb-2">
                  Origem do Ativo
                </span>
                <p className="font-display text-lg font-bold text-content">
                  {enzyme.origin}
                </p>
              </div>

              <div className="rounded-2xl border border-content/12 bg-card p-6 shadow-sm">
                <span className="block font-mono text-xs font-semibold tracking-wider text-content/50 uppercase mb-2">
                  Substrato-Alvo
                </span>
                <p className="font-display text-lg font-bold text-content">
                  {enzyme.targetSubstrate}
                </p>
              </div>

              {/*
                "Apresentação: 10 ampolas liofilizadas" saiu daqui porque esta página
                vende a ampola avulsa — informar a caixa fechada confundia o que o
                cliente está comprando. O dado segue em `enzyme.presentation`.
              */}

              <div
                id="registro-anvisa"
                className="scroll-mt-32 rounded-2xl border border-[#C59D3F]/30 bg-card p-6 shadow-sm"
              >
                <span className="block font-mono text-xs font-semibold tracking-wider text-content/50 uppercase mb-2">
                  Registro ANVISA
                </span>
                <p className="font-mono text-lg font-bold text-content break-all">
                  {enzyme.anvisaRegistration}
                </p>
                <p className="mt-1.5 text-xs font-medium text-content/70">
                  {enzyme.anvisaProduct}
                </p>
              </div>
            </div>

            {/* Editorial Full Description */}
            <div className="rounded-2xl border border-[#C59D3F]/25 bg-card/60 p-8 md:p-10 mb-12 shadow-sm">
              <h3 className="font-display text-xl font-bold text-content mb-4">
                Descrição Detalhada do Mecanismo
              </h3>
              <p className="text-lg md:text-xl leading-relaxed text-content/85 font-light">
                {enzyme.fullDescription}
              </p>
            </div>

            {/* Indications */}
            <div>
              <h3 className="font-display text-lg font-bold text-content mb-4">
                Indicações Principais
              </h3>
              <div className="flex flex-wrap gap-3">
                {enzyme.indications.map((indication) => (
                  <span
                    key={indication}
                    className="inline-flex items-center gap-2 rounded-full border border-[#C59D3F]/40 bg-[#C59D3F]/12 px-4 py-2 font-mono text-xs font-semibold text-[#C59D3F] uppercase tracking-wider"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {indication}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Global Safety Information Section */}
        <section
          id="seguranca-uso"
          aria-labelledby="seguranca-title"
          className="border-t border-content/10 bg-card/40 px-[clamp(20px,4vw,56px)] py-16 md:py-20 text-content"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-[#C59D3F]" />
                <span className="font-mono text-xs font-semibold tracking-[0.18em] text-[#C59D3F] uppercase">
                  Transparência e Controle
                </span>
              </div>
              <h2
                id="seguranca-title"
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-content"
              >
                Informações de Segurança e Uso
              </h2>
            </div>

            {/* Adverse Effects Note */}
            <div className="mb-10 rounded-xl border border-amber-500/20 bg-amber-500/8 p-5 text-content/90">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-sm font-bold text-content uppercase tracking-wider mb-1">
                    Efeitos Adversos Transitórios
                  </h4>
                  <p className="text-sm leading-relaxed text-content/80">
                    {safetyInformation.adverseEffects}
                  </p>
                </div>
              </div>
            </div>

            {/* 2-Column Lists: Contraindications & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contraindications */}
              <div className="rounded-xl border border-content/10 bg-canvas p-6">
                <h4 className="font-display text-base font-bold text-content mb-4 pb-2 border-b border-content/10">
                  Contraindicações Principais
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {safetyInformation.contraindications.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-content/75">
                      <span className="block h-1.5 w-1.5 rounded-full bg-red-500/70 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="rounded-xl border border-content/10 bg-canvas p-6">
                <h4 className="font-display text-base font-bold text-content mb-4 pb-2 border-b border-content/10">
                  Recomendações e Pós-Uso
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {safetyInformation.recommendations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-content/75">
                      <span className="block h-1.5 w-1.5 rounded-full bg-[#C59D3F] shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </AccreditationProvider>
  );
}
