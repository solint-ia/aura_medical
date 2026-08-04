"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowRight, Check, Sparkles, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";

interface EnzymeVialCard {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  activeIngredient: string;
  description: string;
  price: number;
  imagePath: string;
  badge: string;
  badgeColor: string;
  accentColor: string;
  targetSubstrate: string;
  patented?: boolean;
}

const ENZYME_VIALS: EnzymeVialCard[] = [
  {
    id: "enz-slim-plus",
    slug: "slim-plus",
    name: "Slim+",
    subtitle: "Ampola Avulsa de Lipase",
    activeIngredient: "Lipase PB500 Recombinante",
    description: "Atua na interface água/lipídio hidrolisando triglicerídeos de forma seletiva para redução de gordura localizada.",
    price: 390,
    imagePath: "/frascos/slim.png",
    badge: "Hidrólise de Lipídios",
    badgeColor: "bg-[#C59D3F]/15 text-[#C59D3F] border-[#C59D3F]/30",
    accentColor: "#C59D3F",
    targetSubstrate: "Triglicerídeos do adipócito",
  },
  {
    id: "enz-smooth-plus",
    slug: "smooth-plus",
    name: "Smooth+",
    subtitle: "Ampola Avulsa de Colagenase",
    activeIngredient: "Colagenases G&H PB220 Patenteadas",
    description: "Cliva o colágeno desorganizado e rompe septos fibrosos da celulite e cicatrizes sem agredir tecidos sadios.",
    price: 390,
    imagePath: "/frascos/smooth.png",
    badge: "Tecnologia Patenteada",
    badgeColor: "bg-[#D97706]/15 text-[#D97706] border-[#D97706]/30",
    accentColor: "#D97706",
    targetSubstrate: "Colágeno fibrótico & septos",
    patented: true,
  },
  {
    id: "enz-drain-plus",
    slug: "drain-plus",
    name: "Drain+",
    subtitle: "Ampola Avulsa de Hialuronidase",
    activeIngredient: "Hialuronidase PB3000 Purificada",
    description: "Degrada os polissacarídeos da matriz extracelular, eliminando retenção hídrica e otimizando a difusão dos ativos.",
    price: 390,
    imagePath: "/frascos/drain.png",
    badge: "Difusão & Drenagem",
    badgeColor: "bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/30",
    accentColor: "#EAB308",
    targetSubstrate: "Matriz extracelular & edemas",
  },
];

export function IndividualEnzymesSection() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleBuyVial = (vial: EnzymeVialCard) => {
    addToCart({
      id: vial.id,
      name: `Ampola Avulsa ${vial.name} (${vial.activeIngredient})`,
      unitPrice: vial.price,
      vials: 1,
      quantity: 1,
      sessions: "1",
      imagePath: vial.imagePath,
    });

    setAddedId(vial.id);
    setTimeout(() => {
      setAddedId(null);
      router.push("/carrinho");
    }, 600);
  };

  return (
    <section
      id="enzimas-avulsas"
      aria-labelledby="enzimas-avulsas-title"
      className="relative overflow-hidden bg-[#070E17] px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)] text-white"
    >
      {/* Background Ambient Glow Effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C59D3F]/5 blur-[120px]"
      />

      <div className="relative mx-auto max-w-[1280px]">
        {/* Section Intro Header */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C59D3F]/30 bg-[#C59D3F]/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#C59D3F] mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Reposição & Composição Personalizada</span>
          </div>

          <h2
            id="enzimas-avulsas-title"
            className="font-display text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-white mb-4"
          >
            Ampolas de Enzimas Individuais
          </h2>

          <p className="mx-auto max-w-2xl text-base text-slate-300">
            Adquira ampolas avulsas de alta concentração para compor sessões sob medida ou repor enzimas específicas em sua clínica médica com entrega rápida.
          </p>
        </div>

        {/* 3 Enzyme Vial Cards Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {ENZYME_VIALS.map((vial) => {
            const isAdded = addedId === vial.id;

            return (
              <div
                key={vial.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#0D1B2A] p-7 transition-all duration-300 hover:border-[#C59D3F]/50 hover:shadow-2xl hover:shadow-[#C59D3F]/10 hover:-translate-y-1"
              >
                <div>
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <span
                      className={`inline-block rounded-full border px-3 py-1 font-mono text-xs font-bold ${vial.badgeColor}`}
                    >
                      {vial.badge}
                    </span>
                  </div>

                  {/* Vial Product Image Card Showcase */}
                  <div className="relative mx-auto mb-6 flex h-52 w-full items-center justify-center rounded-2xl border border-white/8 bg-gradient-to-b from-white/5 to-transparent p-4 shadow-inner">
                    <div className="absolute inset-0 bg-radial from-[#C59D3F]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <Image
                      src={vial.imagePath}
                      alt={`Ampola ${vial.name}`}
                      width={160}
                      height={180}
                      className="h-44 w-auto object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Enzyme Titles & Substrate Info */}
                  <div className="mb-4">
                    <h3 className="font-display text-2xl font-bold text-white mb-1">
                      {vial.name}
                    </h3>
                    <p className="font-mono text-xs font-bold text-[#C59D3F] uppercase tracking-wider mb-2">
                      {vial.activeIngredient}
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                      {vial.description}
                    </p>
                  </div>
                </div>

                {/* Price & Dual Action Buttons */}
                <div className="mt-6 border-t border-white/10 pt-5 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-mono block">Investimento:</span>
                      <span className="font-display text-2xl font-bold text-white">
                        {formatBRL(vial.price)}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#C59D3F] font-semibold">
                      até 10x no cartão
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {/* Button 1: Buy Vial (Adds to Cart) */}
                    <button
                      type="button"
                      onClick={() => handleBuyVial(vial)}
                      disabled={isAdded}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-mono text-xs font-bold transition-all duration-200 active:scale-[0.98] ${isAdded
                        ? "bg-emerald-500 text-white"
                        : "bg-[#C59D3F] text-[#0D1B2A] hover:bg-[#d4ac4c] shadow-md"
                        }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Adicionado!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          <span>Comprar</span>
                        </>
                      )}
                    </button>

                    {/* Button 2: View Full Enzyme Details (Directs to /enzimas/[slug]) */}
                    <Link
                      href={`/enzimas/${vial.slug}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 py-3 font-mono text-xs font-semibold text-white transition-colors hover:border-[#C59D3F] hover:bg-white/10"
                    >
                      <span>Mais Detalhes</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#C59D3F]" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
