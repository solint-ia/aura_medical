import Image from "next/image";

import { ENZYMES } from "@/data/enzymes";
import { PRODUCT_IMAGE_SIZE, type Product } from "@/data/products";

interface ProductSpec {
  label: string;
  value: string;
  /** The active ingredient is the headline spec, so it carries more weight. */
  emphasised?: boolean;
}

const SPEC_LABEL_CLASSES =
  "mb-1 font-mono text-[10px] tracking-[0.08em] text-[#F6F3EC]/50 uppercase";

export function ProductCard({ product }: { product: Product }) {
  const enzyme = ENZYMES[product.id];

  const specs: ProductSpec[] = [
    {
      label: "Ingrediente ativo",
      value: product.activeIngredient,
      emphasised: true,
    },
    { label: "Origem", value: product.origin },
    { label: "Substrato-alvo", value: product.substrate },
  ];

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
          Profissional
        </p>
      </div>

      <dl className="mt-7 flex flex-col gap-3.5 border-t border-white/10 pt-5">
        {specs.map((spec) => (
          <div key={spec.label}>
            <dt className={SPEC_LABEL_CLASSES}>{spec.label}</dt>
            <dd
              className={
                spec.emphasised
                  ? "text-[15px] font-semibold text-[#F6F3EC]"
                  : "text-[14.5px] text-[#F6F3EC]/85"
              }
            >
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-sm leading-[1.65] text-[#F6F3EC]/75">
        {product.mechanism}
      </p>

      <ul className="mt-6 flex flex-wrap gap-2">
        {product.indications.map((indication) => (
          <li
            key={indication}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] text-[#F6F3EC] uppercase"
          >
            {indication}
          </li>
        ))}
      </ul>

      <p className="mt-5 border-t border-white/10 pt-4 font-mono text-[10.5px] tracking-[0.04em] text-[#F6F3EC]/50">
        {product.packaging}
      </p>
    </article>
  );
}
