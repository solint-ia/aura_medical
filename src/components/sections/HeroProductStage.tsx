"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

export interface HeroStageProduct {
  slug: string;
  name: string;
  image: string;
  surface: string;
  surfaceDark: string;
}

interface Slot {
  /** Caixa do produto sobre o palco; o `bottom` maior recua o frasco no plano. */
  product: string;
  /** Deslocamento máximo do parallax, em px: quanto maior, mais perto do observador. */
  depth: number;
  /** Largura da sombra de contato, proporcional à base do frasco. */
  shadow: string;
  sizes: string;
}

// Vitrine: os frascos ficam eretos, apoiados na mesma superfície. O primeiro produto ocupa
// a frente (maior e com mais parallax); os seguintes recuam subindo a base e perdendo escala,
// que é como a perspectiva afasta objetos apoiados em um mesmo plano.
const LAYOUTS: Slot[][] = [
  [],
  [
    { product: "left-[20%] bottom-[2%] h-[92%] w-[60%]", depth: 14, shadow: "inset-x-[16%] h-[6%]", sizes: "(min-width: 1024px) 32vw, 65vw" },
  ],
  [
    { product: "left-[4%] bottom-[2%] h-[86%] w-[48%]", depth: 15, shadow: "inset-x-[18%] h-[5.5%]", sizes: "(min-width: 1024px) 26vw, 52vw" },
    { product: "right-[4%] bottom-[5%] h-[92%] w-[48%]", depth: 8, shadow: "inset-x-[20%] h-[5%]", sizes: "(min-width: 1024px) 24vw, 48vw" },
  ],
  [
    { product: "left-[26%] bottom-[2%] h-[88%] w-[48%]", depth: 16, shadow: "inset-x-[18%] h-[5.5%]", sizes: "(min-width: 1024px) 24vw, 48vw" },
    { product: "left-0 bottom-[6%] h-[76%] w-[38%]", depth: 8, shadow: "inset-x-[20%] h-[4.5%]", sizes: "(min-width: 1024px) 20vw, 40vw" },
    { product: "right-0 bottom-[6%] h-[76%] w-[38%]", depth: 8, shadow: "inset-x-[20%] h-[4.5%]", sizes: "(min-width: 1024px) 20vw, 40vw" },
  ],
];

export function HeroProductStage({ products }: { products: HeroStageProduct[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const layout = LAYOUTS[Math.min(products.length, LAYOUTS.length - 1)];

  useEffect(() => {
    const stage = stageRef.current;
    const area = stage?.closest("section") ?? stage;
    if (!stage || !area) return;
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const move = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        stage.style.setProperty("--px", x.toFixed(3));
        stage.style.setProperty("--py", y.toFixed(3));
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      stage.style.setProperty("--px", "0");
      stage.style.setProperty("--py", "0");
    };

    area.addEventListener("pointermove", move);
    area.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", reset);
    };
  }, []);

  // Desenha do mais distante para o mais próximo, para que a sobreposição acompanhe a profundidade.
  const placed = products
    .slice(0, layout.length)
    .map((product, index) => ({ product, slot: layout[index], index }))
    .sort((a, b) => a.slot.depth - b.slot.depth);

  return (
    <div ref={stageRef} className="relative min-h-[340px] sm:min-h-[440px] lg:min-h-[580px]">
      {/* Halo difuso atrás dos frascos: separa suavemente os rótulos das esferas do fundo. */}
      <div aria-hidden="true" className="hero-backlight pointer-events-none absolute inset-x-[-15%] -bottom-[5%] top-[-10%] opacity-85" />

      {placed.map(({ product, slot, index }) => (
        <div key={product.slug} className={`hero-layer absolute ${slot.product}`} style={{ "--depth": slot.depth } as CSSProperties}>
          <div className="line-product-rise relative h-full w-full" style={{ animationDelay: `${120 + index * 90}ms` }}>
            {/* A sombra de contato realista na base do frasco */}
            <div aria-hidden="true" className={`hero-contact-shadow absolute bottom-[-1.5%] ${slot.shadow}`} />
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes={slot.sizes}
              className="object-contain object-bottom drop-shadow-[0_24px_28px_rgba(10,28,44,.28)] dark:drop-shadow-[0_24px_32px_rgba(0,0,0,.65)]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
