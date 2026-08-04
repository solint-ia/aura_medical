import Image from "next/image";
import type { CSSProperties } from "react";

import { PRODUCT_IMAGE_SIZE, PRODUCTS } from "@/data/products";

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
      className="relative overflow-hidden bg-canvas px-[clamp(20px,4vw,56px)] pt-[clamp(56px,8vw,96px)] pb-[clamp(28px,3vw,48px)]"
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
            Regenere a arquitetura do tecido, não apenas a superfície da
            pele.
          </h1>
          <p className="order-3 mb-9 animate-fade-up text-[clamp(16px,1.4vw,18.5px)] leading-[1.6] text-content/72 [animation-delay:160ms]">
            Slim+, Smooth+ e Drain+ são três bio-remodeladores enzimáticos
            recombinantes que atuam na matriz extracelular para tratar flacidez,
            gordura localizada, celulite, fibrose e cicatrizes, com a segurança
            e o controle que sua prática clínica exige.
          </p>
          <div className="order-4 mb-8 flex animate-fade-up flex-wrap gap-4 [animation-delay:240ms]">
            <a
              href="#protocolos"
              className="group inline-flex items-center gap-2.5 rounded-lg bg-action px-8 py-4 text-[15.5px] font-semibold text-action-fg transition-all hover:bg-action-hover shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              <span>Ver protocolos</span>
              <svg
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </a>
          </div>
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
