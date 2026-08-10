import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BuyNowButton } from "@/components/ui/BuyNowButton";
import { formatBRL } from "@/lib/format";
import {
  getProtocolBySlug,
  getProtocolPricing,
  PROTOCOLS,
  protocolsData,
} from "@/data/protocols";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return protocolsData
    .filter((protocol) => !protocol.hidden)
    .map((protocol) => ({
      slug: protocol.slug,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const protocol = getProtocolBySlug(slug);

  if (!protocol || protocol.hidden) {
    return {
      title: "Protocolo não encontrado · Aura Regenera",
    };
  }

  return {
    title: `Protocolo ${protocol.title} · pbserum Plus | Aura Regenera`,
    description: `Detalhamento clínico do protocolo de ${protocol.title}: composição de bioregenerativos recombinantes, reconstituição, frequência de sessões e técnica de uso.`,
  };
}

export default async function ProtocolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const protocol = getProtocolBySlug(slug);

  if (!protocol || protocol.hidden) {
    notFound();
  }

  const pricing = getProtocolPricing(slug);

  return (
    <AccreditationProvider>
      <div className="min-h-screen bg-canvas text-content dark:bg-canvas">
        <SiteHeader />

        <main className="relative pb-24">
          {/* Subtle ambient background glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 overflow-hidden blur-3xl opacity-30"
          >
            <div className="absolute top-[-100px] left-1/4 h-[350px] w-[350px] rounded-full bg-[#C59D3F]/20" />
            <div className="absolute top-[50px] right-1/4 h-[400px] w-[400px] rounded-full bg-[#0D1B2A]/15" />
          </div>

          <div className="mx-auto max-w-[1280px] px-[clamp(20px,4vw,56px)] pt-8 md:pt-12">
            {/* Top Navigation / Back Button */}
            <nav className="mb-8">
              <Link
                href="/#protocolos"
                className="group inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-content/60 uppercase transition-colors hover:text-accent"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Voltar aos Protocolos</span>
              </Link>
            </nav>

            {/* Header Section */}
            <div className="mb-12 max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C59D3F]/30 bg-[#C59D3F]/10 px-3.5 py-1 text-[11px] font-mono font-medium tracking-widest text-[#C59D3F] uppercase">
                <span>Protocolo Clínico Oficial</span>
                <span className="h-1 w-1 rounded-full bg-[#C59D3F]" />
                <span>pbserum Plus</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-content">
                {protocol.title}
              </h1>

              {/* Introduction Text */}
              {protocol.introduction ? (
                <p className="mt-4 text-lg md:text-xl leading-relaxed text-content/80 font-normal">
                  {protocol.introduction}
                </p>
              ) : null}

              {protocol.note ? (
                <p className="mt-3 inline-block rounded-md border border-content/10 bg-card px-3 py-1.5 font-mono text-xs text-content/75">
                  ℹ️ {protocol.note}
                </p>
              ) : null}
            </div>

            {/* Main Content Layout Grid */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
              {/* Left Column: Visual Anchor 1 (Top Hero Circle: imagePath1) & Quick Specs */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="sticky top-28 w-full flex flex-col items-center">
                  {/* Circle Image Container 1 (imagePath1) */}
                  <div className="group relative aspect-square w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden border-[3px] border-[#C59D3F] shadow-[0_20px_50px_rgba(197,157,63,0.18)] ring-8 ring-[#C59D3F]/10 transition-transform duration-500 hover:scale-[1.02]">
                    <Image
                      src={protocol.imagePath1}
                      alt={`Área de tratamento do protocolo ${protocol.title}`}
                      fill
                      sizes="(max-width: 768px) 280px, 320px"
                      priority
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 pointer-events-none" />
                  </div>

                  <p className="mt-4 font-mono text-xs tracking-wider text-content/50 uppercase text-center">
                    Mapeamento Anatômico
                  </p>

                  {/* Summary Card */}
                  <div className="mt-8 w-full rounded-2xl border border-content/10 bg-card p-6 shadow-sm">
                    <h3 className="font-mono text-xs font-semibold tracking-wider text-content/50 uppercase mb-4">
                      Resumo da Prescrição
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between border-b border-content/8 pb-3">
                        <span className="text-sm font-medium text-content/70">Sessões Estimadas</span>
                        <span className="font-mono text-sm font-bold text-content">{protocol.sessions} sessões</span>
                      </div>
                      <div className="flex items-start justify-between border-b border-content/8 pb-3">
                        <span className="text-sm font-medium text-content/70">Intervalo entre Sessões</span>
                        <span className="font-mono text-sm font-bold text-content">{protocol.frequency}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-content/70">Bioregenerativos</span>
                        <span className="font-mono text-sm font-bold text-[#C59D3F]">
                          {protocol.composition.length} Recombinantes
                        </span>
                      </div>
                    </div>

                    {pricing ? (
                      <div className="mt-6 border-t border-content/10 pt-5">
                        <div className="flex items-end justify-between">
                          <span className="font-mono text-xs tracking-wider text-content/50 uppercase">
                            Valor do protocolo
                          </span>
                          <span className="font-display text-2xl font-bold text-content">
                            {formatBRL(pricing.totalPrice)}
                          </span>
                        </div>
                        <p className="mt-1 text-right font-mono text-[13px] font-medium text-content/90">
                          {pricing.vials} ampolas por região · <span className="font-bold text-[#C59D3F]">em até 10x no cartão</span>
                        </p>

                        <div className="mt-4">
                          <BuyNowButton
                            protocol={
                              PROTOCOLS.find((p) => p.id === protocol.slug) || {
                                id: protocol.slug,
                                name: protocol.title,
                                composition: [],
                                sessions: protocol.sessions,
                                totalPrice: pricing.totalPrice,
                              }
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C59D3F] px-6 py-3.5 text-center text-sm font-semibold text-[#0D1B2A] shadow-md transition-all hover:bg-[#d4ac4c] active:scale-[0.99]"
                          >
                            Comprar Agora
                          </BuyNowButton>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right Column: Detailed Clinical Data Cards */}
              <div className="lg:col-span-7 space-y-8">
                {/* 1. Composição do Kit */}
                <section className="rounded-2xl border border-content/10 bg-card p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      01
                    </span>
                    <h2 className="font-display text-2xl sm:text-[26px] font-bold text-content">
                      Composição do Kit
                    </h2>
                  </div>

                  <ul className="grid grid-cols-1 gap-4">
                    {protocol.composition.map((item, index) => {
                      const lowerName = item.name.toLowerCase();
                      const vialImg = lowerName.includes("slim")
                        ? "/frascos/slim.png"
                        : lowerName.includes("smooth")
                          ? "/frascos/smooth.png"
                          : lowerName.includes("drain")
                            ? "/frascos/drain.png"
                            : null;

                      // Extract quantity if starting with digit e.g. "2 Slim+" -> "2x"
                      const matchQty = item.name.match(/^(\d+)/);
                      const qtyBadge = matchQty ? `${matchQty[1]}x` : null;

                      return (
                        <li
                          key={index}
                          className="flex items-center gap-4 rounded-xl border border-content/10 bg-canvas p-4 transition-all hover:border-[#C59D3F]/40 shadow-xs"
                        >
                          {vialImg ? (
                            <Image
                              src={vialImg}
                              alt={`Ampola ${item.name}`}
                              width={50}
                              height={70}
                              className="h-12 w-auto object-contain shrink-0 drop-shadow-sm"
                            />
                          ) : (
                            <span className="h-2.5 w-2.5 flex-none rounded-full bg-[#C59D3F]" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-base font-bold text-content">{item.name}</h3>
                              {qtyBadge ? (
                                <span className="inline-flex items-center rounded-full bg-[#C59D3F]/15 px-2.5 py-0.5 font-mono text-xs font-bold text-[#C59D3F]">
                                  {qtyBadge}
                                </span>
                              ) : null}
                            </div>
                            {item.description ? (
                              <p className="mt-0.5 text-xs leading-relaxed text-content/70 font-medium">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {/* 2. Sessões & Frequência */}
                <section className="rounded-2xl border border-content/10 bg-card p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      02
                    </span>
                    <h2 className="font-display text-xl font-bold text-content">
                      Sessões & Frequência
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-content/8 bg-canvas p-5">
                      <p className="font-mono text-xs text-content/50 uppercase tracking-wider mb-1">
                        Número de Sessões
                      </p>
                      <p className="text-2xl font-bold text-content">{protocol.sessions} sessões</p>
                    </div>
                    <div className="rounded-xl border border-content/8 bg-canvas p-5">
                      <p className="font-mono text-xs text-content/50 uppercase tracking-wider mb-1">
                        Frequência das Sessões
                      </p>
                      <p className="text-2xl font-bold text-content">{protocol.frequency}</p>
                    </div>
                  </div>
                </section>

                {/* 3. Reconstituição */}
                <section className="rounded-2xl border border-content/10 bg-card p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      03
                    </span>
                    <h2 className="font-display text-xl font-bold text-content">
                      Reconstituição (Passo a Passo)
                    </h2>
                  </div>

                  <ol className="space-y-4">
                    {protocol.reconstitution.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-4 rounded-xl border border-content/8 bg-canvas p-4"
                      >
                        <span className="flex-none font-mono text-sm font-bold text-[#C59D3F]">
                          Passo {idx + 1}.
                        </span>
                        <span className="text-sm leading-relaxed text-content/90 font-medium">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Task 2: Inject Second Circular Image (imagePath2) Between Reconstituição and Marcação */}
                {protocol.imagePath2 ? (
                  <div className="my-10 flex flex-col items-center justify-center py-4">
                    <div className="group relative aspect-square w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden border-[3px] border-[#C59D3F] shadow-[0_20px_50px_rgba(197,157,63,0.18)] ring-8 ring-[#C59D3F]/10 transition-transform duration-500 hover:scale-[1.02]">
                      <Image
                        src={protocol.imagePath2}
                        alt={`Mapeamento de marcação do protocolo ${protocol.title}`}
                        fill
                        sizes="(max-width: 768px) 280px, 320px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 pointer-events-none" />
                    </div>
                    <p className="mt-4 font-mono text-xs tracking-wider text-content/50 uppercase text-center">
                      Mapeamento de Marcação em Malha
                    </p>
                  </div>
                ) : null}

                {/* 4. Marcação */}
                <section className="rounded-2xl border border-content/10 bg-card p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                      04
                    </span>
                    <h2 className="font-display text-xl font-bold text-content">
                      Distribuição & Marcação de Malha
                    </h2>
                  </div>

                  <div className="rounded-xl border border-[#C59D3F]/25 bg-canvas p-5">
                    <p className="text-sm leading-relaxed text-content/90 font-medium">
                      {protocol.marking}
                    </p>
                  </div>
                </section>

                {/* 5. Resultados Esperados */}
                {protocol.expectedResults && protocol.expectedResults.length > 0 ? (
                  <section className="rounded-2xl border border-content/10 bg-card p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C59D3F]/15 font-mono text-sm font-bold text-[#C59D3F]">
                        05
                      </span>
                      <h2 className="font-display text-xl font-bold text-content">
                        Resultados Esperados
                      </h2>
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {protocol.expectedResults.map((result, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-content/8 bg-canvas p-4 transition-all hover:border-[#C59D3F]/40"
                        >
                          <Check className="mt-0.5 h-5 w-5 flex-none text-[#C59D3F]" />
                          <span className="text-sm font-medium leading-snug text-content/90">
                            {result}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {/* Bottom CTA Block */}
                <div className="rounded-2xl border border-[#C59D3F]/30 bg-panel p-8 text-on-panel shadow-xl">
                  <h3 className="font-display text-2xl font-bold text-on-panel mb-2">
                    Adquira este Protocolo de Alta Performance
                  </h3>
                  <p className="text-sm text-on-panel/75 mb-6 max-w-xl">
                    Tenha acesso direto aos bioregenerativos recombinantes pbserum Plus com suporte técnico especializado.
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <AccreditationButton
                      protocolName={protocol.title}
                      className="rounded-lg bg-action px-6 py-3.5 text-sm font-semibold text-action-fg transition-all hover:bg-action-hover shadow-md active:scale-[0.99]"
                    >
                      Falar com nossa equipe
                    </AccreditationButton>
                    <Link
                      href="/#protocolos"
                      className="rounded-lg border border-on-panel/20 px-6 py-3.5 text-sm font-semibold text-on-panel transition-colors hover:bg-on-panel/10"
                    >
                      Voltar aos Protocolos
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </AccreditationProvider>
  );
}
