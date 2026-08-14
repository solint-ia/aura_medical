import type { Metadata } from "next";
import Link from "next/link";
import { Camera, CheckCircle2, ChevronRight, FileCheck, Sparkles } from "lucide-react";

import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import { AccreditationProvider } from "@/components/accreditation/AccreditationProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CasosClinicosGallery } from "@/components/sections/CasosClinicosGallery";

export const metadata: Metadata = {
  title: "Casos Clínicos · Evidência e Resultados Reais | Aura Regenera",
  description:
    "Resultados clínicos comprovados em fotos de antes e depois com bioregenerativos recombinantes pbserum Plus em tratamentos faciais e corporais.",
};

export default function CasosClinicosPage() {
  return (
    <AccreditationProvider>
      <div className="min-h-screen bg-[#0D1B2A] text-[#F6F3EC]">
        <SiteHeader />

        <main className="relative overflow-hidden pb-24">
          {/* Ambient Lighting & Glow Orbs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -z-0 h-[650px] w-full max-w-7xl -translate-x-1/2 overflow-hidden blur-3xl opacity-30"
          >
            <div className="absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-[#C59D3F]/25" />
            <div className="absolute top-20 right-1/4 h-[450px] w-[450px] rounded-full bg-[#162A3D]" />
          </div>

          <div className="relative z-10 mx-auto max-w-[1280px] px-[clamp(20px,4vw,56px)] pt-8 md:pt-12">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Navegação estrutural" className="mb-8">
              <ol className="flex items-center gap-2 font-mono text-xs text-[#F6F3EC]/60">
                <li>
                  <Link href="/" className="transition-colors hover:text-[#C59D3F]">
                    Home
                  </Link>
                </li>
                <li>
                  <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                </li>
                <li className="font-semibold text-[#C59D3F]">
                  Casos Clínicos
                </li>
              </ol>
            </nav>

            {/* Hero Header */}
            <div className="mb-14 max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C59D3F]/40 bg-[#C59D3F]/10 px-4 py-1.5 font-mono text-xs font-semibold tracking-widest text-[#C59D3F] uppercase backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Evidência Clínica Documentada</span>
                <span className="h-1 w-1 rounded-full bg-[#C59D3F]" />
                <span>pbserum Plus</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Resultados comprovados em fotos de{" "}
                <span className="bg-gradient-to-r from-[#C59D3F] via-[#E2C376] to-[#C59D3F] bg-clip-text text-transparent">
                  antes e depois
                </span>
                .
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#F6F3EC]/80 font-normal">
                Explore a documentação fotográfica de tratamentos realizados por profissionais credenciados utilizando a biotecnologia recombinante pbserum Plus para remodelação de tecidos, queixo duplo, cicatrizes, fibroses e celulite.
              </p>
            </div>

            {/* Interactive Cases Gallery (Filter Tabs, Search & Cards) */}
            <section aria-labelledby="galeria-title" className="mb-20">
              <h2 id="galeria-title" className="sr-only">
                Galeria Interativa de Casos Clínicos
              </h2>
              <CasosClinicosGallery />
            </section>

            {/* Methodology & Rigor Section */}
            <section className="mb-20 rounded-2xl border border-white/10 bg-[#162A3D]/60 p-8 sm:p-12 backdrop-blur-md">
              <div className="mb-8 max-w-2xl">
                <p className="font-mono text-xs font-semibold tracking-widest text-[#C59D3F] uppercase mb-2">
                  Metodologia & Critérios de Avaliação
                </p>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Como são documentados os resultados clínicos pbserum
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-white/8 bg-[#0D1B2A]/80 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C59D3F]/15 text-[#C59D3F] mb-4">
                    <Camera className="h-5 w-5" />
                  </div>
                  <h4 className="font-display text-base font-bold text-white mb-2">
                    Padronização Fotográfica
                  </h4>
                  <p className="text-xs leading-relaxed text-white/70">
                    Registros capturados com controle rigoroso de iluminação, mesmo ângulo, mesma distância focal e posicionamento anatômico idêntico entre o antes e o depois.
                  </p>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#0D1B2A]/80 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C59D3F]/15 text-[#C59D3F] mb-4">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <h4 className="font-display text-base font-bold text-white mb-2">
                    Protocolos Oficiais pbserum
                  </h4>
                  <p className="text-xs leading-relaxed text-white/70">
                    Aplicações realizadas conforme os protocolos padronizados de reconstituição, marcação em malha milimétrica e volumetria precisa por ponto.
                  </p>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#0D1B2A]/80 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C59D3F]/15 text-[#C59D3F] mb-4">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h4 className="font-display text-base font-bold text-white mb-2">
                    Acompanhamento Evolutivo
                  </h4>
                  <p className="text-xs leading-relaxed text-white/70">
                    Avaliação médica periódica para mensuração do remodelamento dos tecidos, redução de medidas e melhora da textura dérmica ao longo do ciclo de sessões.
                  </p>
                </div>
              </div>
            </section>

            {/* Bottom Conversion CTA Banner */}
            <div className="rounded-2xl border border-[#C59D3F]/40 bg-gradient-to-br from-[#162A3D] via-[#0D1B2A] to-[#162A3D] p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center sm:text-left">
              {/* Background ambient gold ring */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.18)_0%,transparent_70%)] blur-2xl"
              />

              <div className="relative z-10 flex flex-col items-center justify-between gap-8 lg:flex-row">
                <div className="max-w-2xl">
                  <span className="font-mono text-xs font-bold tracking-widest text-[#C59D3F] uppercase">
                    Credenciamento & Suporte Médico
                  </span>
                  <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
                    Aplique a biotecnologia pbserum Plus na sua prática clínica
                  </h3>
                  <p className="mt-3 text-sm text-[#F6F3EC]/75 max-w-xl">
                    Tenha acesso direto ao portfólio de bioregenerativos recombinantes, suporte científico individualizado e materiais clínicos exclusivos da Aura Regenera.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 flex-none">
                  <AccreditationButton className="rounded-lg bg-[#C59D3F] px-7 py-3.5 text-sm font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-lg shadow-[#C59D3F]/20 active:scale-[0.99]">
                    Falar com nossa equipe
                  </AccreditationButton>
                  <Link
                    href="/#protocolos"
                    className="rounded-lg border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-[#C59D3F]/50"
                  >
                    Ver Todos os Protocolos
                  </Link>
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
