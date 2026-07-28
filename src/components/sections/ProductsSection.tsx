import { ProductCard } from "@/components/sections/ProductCard";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { PRODUCTS } from "@/data/products";

export function ProductsSection() {
  return (
    <section
      id="produtos"
      aria-labelledby="produtos-title"
      className="relative overflow-hidden bg-canvas px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)] text-content transition-colors duration-300"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.12)_0%,transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-[1280px]">
        <SectionIntro
          titleId="produtos-title"
          eyebrow="pbserum Plus · Linha Profissional"
          title="Três enzimas recombinantes. Um mecanismo específico para cada tecido."
          lead="Cada bio-remodelador atua sobre um substrato distinto (gordura, colágeno fibrótico ou polissacarídeos da matriz) e pode ser combinado em protocolo conforme a indicação clínica."
          className="mb-14"
        />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-7">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <p className="mt-7 font-mono text-[11px] text-content/60">
          * Enzima patenteada.
        </p>
      </div>
    </section>
  );
}
