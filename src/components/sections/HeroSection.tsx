import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import type { CatalogItem } from "@/data/catalog";
import { HERO_ACCREDITATION_CTA_LABEL } from "@/data/site";

interface HeroLine {
  slug: string;
  name: string;
  _count: { products: number; protocols: number };
}

export function HeroSection({ lines }: { lines: HeroLine[]; products?: CatalogItem[] }) {
  return (
    <section className="relative isolate overflow-hidden bg-canvas">
      {/* Arte de fundo cinematográfica completa com os produtos e fluidos integrados. */}
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <Image
          src="/fundo-hero-light.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-right opacity-100 transition-opacity duration-500 motion-reduce:transition-none lg:object-center dark:opacity-0"
        />
        <Image
          src="/fundo-hero-dark.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-right opacity-0 transition-opacity duration-500 motion-reduce:transition-none lg:object-center dark:opacity-100"
        />
      </div>

      {/* Scrim suave: protege a leitura do texto sem lavar a vivacidade da arte */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas/75 via-canvas/40 to-transparent lg:bg-gradient-to-r lg:from-canvas/95 lg:via-canvas/40 lg:to-transparent"
      />
      {/* Transição suave de topo com o header — sem corte brusco */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-20 bg-gradient-to-b from-canvas/60 to-transparent" />
      {/* Transição orgânica para a próxima seção, sem borda dura. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-canvas to-transparent" />

      <div className="mx-auto max-w-[1380px] px-[clamp(16px,4vw,48px)] pb-12 pt-8 sm:pb-16 sm:pt-12 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <div className="relative z-10 min-w-0">
            {/* Eyebrow com linhas editoriais sutis */}
            <div className="inline-flex items-center gap-3">
              <span className="h-px w-5 bg-accent/60" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[.20em] text-accent sm:text-sm">
                Inovação em medicina estética
              </span>
              <span className="h-px w-5 bg-accent/60" />
            </div>

            <h1 className="mt-5 max-w-[18ch] text-balance font-display text-4xl font-semibold leading-[1.08] tracking-tight text-content sm:text-5xl md:text-6xl lg:text-[4rem]">
              A nova fronteira dos tratamentos regenerativos.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-content/80 sm:text-lg">
              Soluções biotecnológicas avançadas que respeitam a fisiologia celular, com a segurança e o rigor científico que a sua clínica precisa.
            </p>

            <p className="mt-3 font-display text-sm font-semibold tracking-wide text-content/90 sm:text-base">
              Ciência. Tecnologia. <span className="text-accent font-bold">Resultados comprovados.</span>
            </p>

            <div className="mt-9 flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row sm:flex-wrap sm:mt-10">
              <Link
                href="/catalogo"
                className="inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-full bg-action px-8 text-sm font-semibold text-action-fg shadow-[0_10px_30px_rgba(18,40,60,.18)] transition-all hover:bg-action-hover hover:shadow-[0_14px_36px_rgba(18,40,60,.25)] sm:justify-start"
              >
                Explorar catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              <AccreditationButton className="inline-flex min-h-[50px] w-full items-center justify-center rounded-full border border-content/20 bg-canvas/70 px-8 text-sm font-semibold text-content backdrop-blur-sm transition-colors hover:border-content/45 sm:w-auto">
                {HERO_ACCREDITATION_CTA_LABEL}
              </AccreditationButton>
            </div>
          </div>

          {/* Espaço reservado para visualização da arte dos produtos integrada no fundo */}
          <div aria-hidden="true" className="pointer-events-none min-h-[280px] sm:min-h-[420px] lg:min-h-[580px]" />
        </div>

        <div className="mt-12 border-t border-content/10 pt-6 sm:mt-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content/60">Linhas disponíveis</p>
          <div className="no-scrollbar -mx-[clamp(16px,4vw,48px)] flex gap-2 overflow-x-auto px-[clamp(16px,4vw,48px)] pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {lines.map((line) => (
              <Link
                key={line.slug}
                href={`/linhas/${line.slug}`}
                className="group inline-flex shrink-0 items-center gap-2.5 rounded-full border border-content/12 bg-canvas/70 px-4 py-2.5 backdrop-blur-sm transition-colors hover:border-content/35 hover:bg-canvas"
              >
                <span className="font-display text-sm font-semibold text-content">{line.name}</span>
                <span className="text-xs text-content/60">
                  {line._count.products} produtos{line._count.protocols ? ` · ${line._count.protocols} protocolos` : ""}
                </span>
                <ArrowRight className="h-4 w-4 text-content/50 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
