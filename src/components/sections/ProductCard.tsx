import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ENZYMES, enzymesData } from "@/data/enzymes";
import { PRODUCT_IMAGE_SIZE, type Product } from "@/data/products";

const SPEC_LABEL_CLASSES =
  "mb-1 font-mono text-[10.5px] tracking-[0.08em] text-content/60 uppercase";

const VIAL_IMAGE_MAP: Record<string, string> = {
  slim: "/frascos/slim.png",
  smooth: "/frascos/smooth.png",
  drain: "/frascos/drain.png",
};

export function ProductCard({ product }: { product: Product }) {
  const enzyme = ENZYMES[product.id];
  const slug = `${product.id}-plus`;
  const detail = enzymesData.find((d) => d.slug === slug);
  const activeIngredient = detail?.activeIngredient || product.activeIngredient;
  const vialImage = VIAL_IMAGE_MAP[product.id];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-content/12 bg-card px-7 py-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C59D3F]/50 hover:shadow-xl">
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1.5 ${enzyme.barClass}`}
      />

      {/* Vial and Box Product Assets Render */}
      <div className="pointer-events-none absolute top-4 -right-1 flex items-center justify-end">
        {vialImage ? (
          <Image
            src={vialImage}
            alt={`Ampola ${product.name}`}
            width={140}
            height={190}
            aria-hidden="true"
            className="h-auto w-[76px] sm:w-[84px] object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.3)] z-10"
          />
        ) : null}
        <Image
          src={product.imageSrc}
          alt=""
          aria-hidden="true"
          width={PRODUCT_IMAGE_SIZE.width}
          height={PRODUCT_IMAGE_SIZE.height}
          sizes="105px"
          className="h-auto w-[105px] -ml-6 drop-shadow-[0_8px_14px_rgba(0,0,0,0.25)] opacity-95"
        />
      </div>

      <div className="max-w-[58%]">
        <h3 className="font-display text-[26px] font-bold tracking-[-0.01em] text-content">
          {product.name}
        </h3>
        <p className="mt-0.5 font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[#C59D3F] uppercase">
          Alta Performance
        </p>
      </div>

      {/* Active Ingredient */}
      <div className="mt-6 border-t border-content/10 pt-4">
        <dt className={SPEC_LABEL_CLASSES}>Ingrediente ativo</dt>
        <dd className="text-[15.5px] font-semibold text-content">
          {activeIngredient}
        </dd>
      </div>

      <p className="mt-4 text-sm leading-[1.65] text-content/75 flex-1">
        {detail?.shortDescription || product.mechanism}
      </p>

      {/* Indication tags */}
      <ul className="mt-5 flex flex-wrap gap-2">
        {(detail?.indications || product.indications).map((indication) => (
          <li
            key={indication}
            className="rounded-full border border-[#C59D3F]/30 bg-[#C59D3F]/10 px-3 py-1 font-mono text-[11px] font-semibold text-[#C59D3F] uppercase tracking-[0.04em]"
          >
            {indication}
          </li>
        ))}
      </ul>

      {/* Presentation Info & Link to Individual Enzyme Page */}
      <div className="mt-6 border-t border-content/10 pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between font-mono text-[11px] text-content/60">
          <span>Apresentação</span>
          <span className="font-semibold text-content/85">{detail?.presentation || product.packaging}</span>
        </div>
        <Link
          href={`/enzimas/${slug}`}
          className="group/btn flex w-full items-center justify-center gap-2 rounded-xl border border-[#C59D3F]/40 bg-transparent py-3 px-4 font-mono text-xs font-bold text-content uppercase transition-all duration-300 hover:border-[#C59D3F] hover:bg-[#C59D3F] hover:text-[#0D1B2A] shadow-xs active:scale-[0.99]"
        >
          <span>Explorar {product.name}</span>
          <ArrowRight className="h-4 w-4 text-[#C59D3F] group-hover/btn:text-[#0D1B2A] transition-all group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
