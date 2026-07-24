import Image from "next/image";
import type { CSSProperties } from "react";

import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import { PRODUCT_IMAGE_SIZE, PRODUCTS } from "@/data/products";
import { ACCREDITATION_CTA_LABEL } from "@/data/site";

/** Stacked arrangement of the three boxes, mirroring the printed catalogue. */
const HERO_STACK = [
  {
    productId: "smooth",
    className: "left-0 top-[2%] w-[58%] z-1",
    tilt: "-7deg",
    delay: "100ms",
  },
  {
    productId: "drain",
    className: "left-[20%] top-[28%] w-[60%] z-2",
    tilt: "4deg",
    delay: "220ms",
  },
  {
    productId: "slim",
    className: "left-[32%] top-[52%] w-[62%] z-3",
    tilt: "-3deg",
    delay: "340ms",
  },
] as const;

export function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-canvas px-[clamp(20px,4vw,56px)] pt-[clamp(56px,8vw,96px)] pb-[clamp(64px,8vw,120px)]"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-0 hero:grid-cols-2 hero:gap-[clamp(40px,6vw,72px)]">
        {/* Below `hero` the wrapper dissolves into the grid, so the render can
            sit between the headline and the supporting copy. Above it, the
            wrapper reforms and the copy stacks in its own column. */}
        <div className="contents hero:block hero:max-w-[560px]">
          <p className="order-1 mb-5 animate-fade-up font-mono text-[12.5px] tracking-[0.14em] text-accent uppercase">
            pbserum Plus · Enzimas Recombinantes
          </p>
          <h1
            id="hero-title"
            className="order-1 mb-[22px] animate-fade-up font-display text-[clamp(34px,4.6vw,58px)] leading-[1.06] font-bold tracking-[-0.015em] text-content [animation-delay:80ms]"
          >
            Reorganize a arquitetura do tecido — não apenas a superfície da
            pele.
          </h1>
          <p className="order-3 mb-9 animate-fade-up text-[clamp(16px,1.4vw,18.5px)] leading-[1.6] text-content/72 [animation-delay:160ms]">
            Slim+, Smooth+ e Drain+ são três bio-remodeladores enzimáticos
            recombinantes que atuam na matriz extracelular para tratar flacidez,
            gordura localizada, celulite, fibrose e cicatrizes — com a segurança
            e o controle que sua prática clínica exige.
          </p>
          <div className="order-4 mb-8 flex animate-fade-up flex-wrap gap-4 [animation-delay:240ms]">
            <AccreditationButton className="rounded-lg bg-action px-[30px] py-4 text-[15.5px] font-semibold text-action-fg transition-colors hover:bg-action-hover">
              {ACCREDITATION_CTA_LABEL}
            </AccreditationButton>
            <a
              href="#protocolos"
              className="flex items-center gap-2 px-1.5 py-4 text-[15.5px] font-semibold text-content transition-colors hover:text-accent"
            >
              Ver protocolos e preços ↓
            </a>
          </div>
          <p className="order-5 flex animate-fade-up flex-wrap gap-x-5 gap-y-2.5 font-mono text-[11px] tracking-[0.04em] text-content/80 uppercase [animation-delay:320ms]">
            <span>Uso exclusivo para profissionais de saúde</span>
            <span aria-hidden="true">·</span>
            <span>PB500 · PB220 · PB3000</span>
          </p>
        </div>

        <div className="relative order-2 mt-4 mb-10 ml-auto aspect-[1/0.88] w-full max-w-[560px] hero:order-none hero:my-0">
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 h-[82%] w-[82%] rounded-full bg-[radial-gradient(circle_at_32%_28%,#FBF9F4_0%,#EFE7D6_55%,rgba(239,231,214,0)_100%)] dark:bg-[radial-gradient(circle_at_32%_28%,#1B3247_0%,#112233_55%,rgba(17,34,51,0)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute top-[4%] right-[6%] h-[30%] w-[30%] rounded-full bg-[radial-gradient(circle_at_38%_32%,#E9CB84_0%,#C9A63E_60%,rgba(201,166,62,0)_100%)] opacity-90"
          />
          {HERO_STACK.map((item) => {
            const product = PRODUCTS.find(
              (candidate) => candidate.id === item.productId,
            );
            if (!product) return null;

            return (
              <Image
                key={product.id}
                src={product.imageSrc}
                alt={product.imageAlt}
                width={PRODUCT_IMAGE_SIZE.width}
                height={PRODUCT_IMAGE_SIZE.height}
                priority
                sizes="(max-width: 760px) 60vw, 350px"
                style={
                  {
                    "--tilt": item.tilt,
                    animationDelay: item.delay,
                  } as CSSProperties
                }
                className={`absolute h-auto animate-rise-in drop-shadow-[0_20px_34px_rgba(18,40,60,0.22)] ${item.className}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
