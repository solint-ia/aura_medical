import { ProductCard } from "@/components/sections/ProductCard";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { PRODUCTS } from "@/data/products";

export function ProductsSection() {
  return (
    <section
      id="produtos"
      aria-labelledby="produtos-title"
      className="relative bg-canvas px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
    >
      <div className="mx-auto max-w-[1280px]">
        <SectionIntro
          titleId="produtos-title"
          eyebrow="pbserum Plus · Linha Professional"
          title="Três enzimas recombinantes. Um mecanismo específico para cada tecido."
          lead="Cada bio-remodelador atua sobre um substrato distinto — gordura, colágeno fibrótico ou polissacarídeos da matriz — e pode ser combinado em protocolo conforme a indicação clínica."
          className="mb-14"
        />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-7">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <p className="mt-7 font-mono text-[11px] text-content/78">
          * Enzima patenteada.
        </p>
      </div>
    </section>
  );
}
