import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ENZYMES, enzymesData } from "@/data/enzymes";
import { PRODUCT_IMAGE_SIZE, type Product } from "@/data/products";

const SPEC_LABEL_CLASSES =
  "mb-1 font-mono text-[10px] tracking-[0.08em] text-[#F6F3EC]/50 uppercase";

export function ProductCard({ product }: { product: Product }) {
  const enzyme = ENZYMES[product.id];
  const slug = `${product.id}-plus`;
  const detail = enzymesData.find((d) => d.slug === slug);
  const activeIngredient = detail?.activeIngredient || product.activeIngredient;

  return (
    <article className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/12 bg-[#162A3D] px-7 py-8 transition duration-250 hover:-translate-y-1 hover:border-[#C59D3F]/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${enzyme.barClass}`}
      />
      {/* The render bleeds past the card edge, as it does on the box mock-ups. */}
      <Image
        src={product.imageSrc}
        alt=""
        aria-hidden="true"
        width={PRODUCT_IMAGE_SIZE.width}
        height={PRODUCT_IMAGE_SIZE.height}
        sizes="126px"
        className="pointer-events-none absolute top-5 -right-3.5 h-auto w-[126px] drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)]"
      />

      <div className="max-w-[65%]">
        <h3
          className={`font-display text-[26px] font-bold tracking-[-0.01em] ${enzyme.headingClass}`}
        >
          {product.name}
        </h3>
        <p className="mt-0.5 font-mono text-[10.5px] tracking-[0.08em] text-[#F6F3EC]/60 uppercase">
          Alta Performance
        </p>
      </div>

      {/* Task 1: Keep ONLY Active Ingredient */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <dt className={SPEC_LABEL_CLASSES}>Ingrediente ativo</dt>
        <dd className="text-[15.5px] font-semibold text-[#F6F3EC]">
          {activeIngredient}
        </dd>
      </div>

      <p className="mt-4 text-sm leading-[1.65] text-[#F6F3EC]/75 flex-1">
        {detail?.shortDescription || product.mechanism}
      </p>

      {/* Indication tags */}
      <ul className="mt-5 flex flex-wrap gap-2">
        {(detail?.indications || product.indications).map((indication) => (
          <li
            key={indication}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] text-[#F6F3EC] uppercase"
          >
            {indication}
          </li>
        ))}
      </ul>

      {/* Presentation Info */}
      <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between font-mono text-[11px] text-[#F6F3EC]/60">
        <span>Apresentação</span>
        <span className="font-semibold text-[#F6F3EC]/85">{detail?.presentation || product.packaging}</span>
      </div>
    </article>
  );
}
