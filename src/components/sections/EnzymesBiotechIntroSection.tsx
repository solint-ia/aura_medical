"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dna,
  Snowflake,
  ShieldCheck,
  Building2,
  Award,
  Sparkles,
  CheckCircle2,
  Globe2,
} from "lucide-react";

interface BiotechHighlight {
  title: string;
  description: string;
  icon: typeof Dna;
}

interface BiotechChapter {
  id: string;
  stepNumber: string;
  navTitle: string;
  subtitleTag: string;
  title: string;
  subtitle?: string;
  body1?: string;
  body2?: string;
  highlights?: BiotechHighlight[];
  factoryDetails?: {
    location: string;
    founded: string;
    guarantee: string;
  };
}

const BIOTECH_CHAPTERS: BiotechChapter[] = [
  {
    id: "conceito",
    stepNumber: "01",
    navTitle: "O Conceito",
    subtitleTag: "Fundamentos",
    title: "O que são Enzimas Recombinantes?",
    body1:
      "As enzimas são proteínas que atuam como catalisadores biológicos, acelerando reações químicas essenciais sem serem consumidas.",
    body2:
      "As enzimas recombinantes da pbserum são concebidas utilizando a tecnologia de ADN recombinante, permitindo a produção em grande escala com qualidade consistente. Desenvolvidas através de investigação biotecnológica avançada em Albacete, Espanha, utilizam uma biotecnologia única para melhorar os tratamentos regenerativos de várias patologias da pele.",
  },
  {
    id: "tecnologia",
    stepNumber: "02",
    navTitle: "Tecnologia Recombinante",
    subtitleTag: "Inovação Biotecnológica",
    title: "Biotecnologia Única de Duas Gerações",
    subtitle:
      "A pbserum utiliza ADN recombinante para criar enzimas de origem bacteriana que imitam com precisão as enzimas humanas.",
    highlights: [
      {
        title: "Eficácia & Seletividade",
        description:
          "Elevada especificidade do substrato para tratamento eficaz de rugas, cicatrizes, celulite e gordura localizada.",
        icon: Dna,
      },
      {
        title: "Pureza & Estabilidade (Liofilização)",
        description:
          "Processo de congelação rápida e sublimação que mantém 100% da atividade enzimática sem necessidade de conservantes.",
        icon: Snowflake,
      },
      {
        title: "Baixa Imunogenicidade",
        description:
          "Estrutura recombinante pura que minimiza respostas imunes adversas e garante máxima segurança clínica.",
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: "origem",
    stepNumber: "03",
    navTitle: "Origem & Produção",
    subtitleTag: "Excelência Farmacêutica",
    title: "Quem produz as Enzimas Recombinantes?",
    body1:
      "Fundada em 2010, a Proteos Biotech é especializada na investigação e produção de enzimas recombinantes para biomedicina e cosmética em Albacete, Espanha.",
    body2:
      "Garantia dos mais rigorosos padrões de qualidade e certificações internacionais no fabrico e fornecimento de produtos farmacêuticos estéreis e dispositivos médicos.",
    factoryDetails: {
      location: "Albacete, Espanha",
      founded: "Fundada em 2010 · Proteos Biotech",
      guarantee:
        "Garantia dos mais rigorosos padrões de qualidade e certificações internacionais no fabrico e fornecimento de produtos farmacêuticos estéreis e dispositivos médicos.",
    },
  },
];

export function EnzymesBiotechIntroSection() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const chapter = BIOTECH_CHAPTERS[activeStep];

  return (
    <section
      aria-label="Introdução Conceitual e Biotecnologia"
      className="relative overflow-hidden bg-[#0A1622] px-[clamp(20px,4vw,56px)] pt-4 sm:pt-6 md:pt-8 pb-[clamp(64px,8vw,104px)] text-[#F6F3EC]"
    >
      {/* Background ambient radial glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.16)_0%,transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.1)_0%,transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-[1240px]">
        {/* Prominent Vertical Brand Centerpiece Logo */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <Image
            src="/logos/logo-vertical-2.png"
            alt="Aura Regenera"
            width={340}
            height={340}
            className="h-48 sm:h-56 md:h-64 lg:h-72 w-auto object-contain drop-shadow-xl"
            priority
          />
        </div>

        {/* Section Header */}
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C59D3F]/40 bg-[#C59D3F]/12 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#C59D3F]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>BIOTECNOLOGIA EXCLUSIVA</span>
          </div>
          <h2 className="font-display text-[clamp(28px,4vw,48px)] font-bold leading-[1.15] tracking-[-0.01em] text-[#F6F3EC]">
            Biotecnologia Avançada para Resultados Visíveis
          </h2>
        </div>

        {/* Editorial Storytelling Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Navigation: Vertical Timeline & Step Controllers (Span 4) */}
          <nav
            aria-label="Capítulos conceituais"
            className="lg:col-span-4 flex flex-col space-y-4"
          >
            {BIOTECH_CHAPTERS.map((item, index) => {
              const isActive = index === activeStep;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`group relative flex items-center gap-5 rounded-2xl border p-5 text-left transition-all duration-300 ${isActive
                    ? "border-[#C59D3F] bg-[#122436] shadow-[0_10px_30px_rgba(197,157,63,0.2)]"
                    : "border-white/10 bg-white/4 hover:border-white/25 hover:bg-white/7"
                    }`}
                >
                  {/* Left Active Pillar Line */}
                  <div
                    className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full transition-all duration-300 ${isActive ? "bg-[#C59D3F]" : "bg-transparent group-hover:bg-white/30"
                      }`}
                  />

                  {/* Step Number Circle */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold transition-all duration-300 ${isActive
                      ? "bg-[#C59D3F] text-[#0D1B2A] shadow-md"
                      : "border border-white/15 bg-white/5 text-[#F6F3EC]/60 group-hover:text-[#F6F3EC]"
                      }`}
                  >
                    {item.stepNumber}
                  </div>

                  {/* Nav Title & Tag */}
                  <div>
                    <span className="block font-mono text-[10.5px] uppercase tracking-wider text-[#C59D3F]">
                      {item.subtitleTag}
                    </span>
                    <span
                      className={`block font-display text-lg font-bold transition-colors ${isActive ? "text-[#F6F3EC]" : "text-[#F6F3EC]/70 group-hover:text-[#F6F3EC]"
                        }`}
                    >
                      {item.navTitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Right Content Display Panel (Span 8) */}
          <div className="lg:col-span-8 relative min-h-[460px] rounded-3xl border border-[#C59D3F]/35 bg-[#122436]/90 p-7 sm:p-10 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-500">
            {/* Subtle Inner Glow Element */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.22)_0%,transparent_70%)] blur-2xl"
            />

            <div key={chapter.id} className="relative z-10 space-y-6 animate-fade-in">
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#C59D3F]">
                  Capítulo {chapter.stepNumber} · {chapter.subtitleTag}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] text-[#F6F3EC]/70 uppercase">
                  pbserum Recombinante
                </span>
              </div>

              {/* Main Chapter Title */}
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F6F3EC]">
                {chapter.title}
              </h3>

              {/* Subtitle if present */}
              {chapter.subtitle ? (
                <p className="text-base sm:text-lg font-semibold leading-relaxed text-[#C59D3F]">
                  {chapter.subtitle}
                </p>
              ) : null}

              {/* Body paragraphs if present */}
              {chapter.body1 ? (
                <p className="text-base sm:text-lg leading-relaxed text-[#F6F3EC]/90 font-medium">
                  {chapter.body1}
                </p>
              ) : null}

              {chapter.body2 ? (
                <p className="text-base leading-relaxed text-[#F6F3EC]/80 font-normal">
                  {chapter.body2}
                </p>
              ) : null}

              {/* Chapter 2 Highlights: Interactive Bullet Badges */}
              {chapter.highlights ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {chapter.highlights.map((hl) => {
                    const IconComponent = hl.icon;
                    return (
                      <div
                        key={hl.title}
                        className="rounded-2xl border border-[#C59D3F]/25 bg-[#C59D3F]/10 p-5 space-y-2.5 transition-colors hover:bg-[#C59D3F]/15"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C59D3F] text-[#0D1B2A]">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <h4 className="font-display text-base font-bold text-[#F6F3EC]">
                          {hl.title}
                        </h4>
                        <p className="text-xs leading-relaxed text-[#F6F3EC]/80 font-normal">
                          {hl.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Chapter 3 Factory Details */}
              {chapter.factoryDetails ? (
                <div className="mt-6 rounded-2xl border border-[#C59D3F]/30 bg-[#0D1E2E] p-6 space-y-4 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#C59D3F]" />
                      <span className="font-display text-base font-bold text-[#F6F3EC]">
                        Proteos Biotech S.L.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#C59D3F]">
                      <Globe2 className="h-4 w-4" />
                      <span>{chapter.factoryDetails.location}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-[#C59D3F] shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-[#F6F3EC]/90 leading-relaxed font-medium">
                      {chapter.factoryDetails.guarantee}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
