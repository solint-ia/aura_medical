import Image from "next/image";
import Link from "next/link";

interface EnzymeCardData {
  id: string;
  name: string;
  slug: string;
  tag: string;
  image: string;
  description: string;
}

const ENZYME_TRIAD: EnzymeCardData[] = [
  {
    id: "slim",
    name: "pbserum Slim",
    slug: "slim-plus",
    tag: "Redução de Adiposidade",
    image: "/frascos/slim.png",
    description:
      "Foco na quebra de gordura localizada e remodelação do contorno corporal.",
  },
  {
    id: "smooth",
    name: "pbserum Smooth",
    slug: "smooth-plus",
    tag: "Firmeza & Cicatrizes",
    image: "/frascos/smooth.png",
    description:
      "Foco na compactação da pele, melhora de fibroses e textura de cicatrizes.",
  },
  {
    id: "drain",
    name: "pbserum Drain",
    slug: "drain-plus",
    tag: "Drenagem & Celulite",
    image: "/frascos/drain.png",
    description:
      "Foco no combate à retenção de líquidos e celulite grau avançado.",
  },
];

export function EnzymeTriadSection() {
  return (
    <section
      id="triade"
      aria-labelledby="triade-title"
      className="relative overflow-hidden bg-[#F7F5F0] px-[clamp(20px,4vw,56px)] py-16 md:py-24 text-[#0A1622]"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.12)_0%,transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-[1280px]">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <span className="font-mono text-xs font-semibold tracking-[0.18em] text-[#C59D3F] uppercase md:text-sm">
            BIOTECNOLOGIA DIRECIONADA
          </span>
          <h2
            id="triade-title"
            className="mt-3 font-display text-3xl font-bold leading-[1.12] tracking-tight text-[#0A1622] sm:text-4xl md:text-5xl"
          >
            A Tríade de Enzimas Recombinantes.
          </h2>
          <p className="mt-4 text-base text-[#0A1622]/75 sm:text-lg leading-relaxed">
            Três ativos de altíssima pureza que atuam em sinergia para remodelar, drenar e firmar os tecidos.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10 max-w-6xl mx-auto items-stretch">
          {ENZYME_TRIAD.map((enzyme) => (
            <article
              key={enzyme.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-[#0A1622]/10 bg-white/90 p-8 text-center shadow-sm backdrop-blur-sm transition-all duration-500 hover:border-[#C59D3F]/50 hover:shadow-xl"
            >
              {/* Radial glow highlight behind vial */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-0 rounded-2xl bg-[radial-gradient(circle_at_center_30%,rgba(197,157,63,0.08)_0%,transparent_65%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />

              <div className="relative z-10 flex flex-col items-center">
                {/* Category Tag */}
                <span className="mb-6 inline-block rounded-full border border-[#C59D3F]/30 bg-[#C59D3F]/10 px-3.5 py-1 font-mono text-[11px] font-semibold text-[#C59D3F] uppercase tracking-wider">
                  {enzyme.tag}
                </span>

                {/* Vial Image */}
                <div className="relative mb-6 flex h-52 w-full items-center justify-center">
                  <Image
                    src={enzyme.image}
                    alt={`Frasco ${enzyme.name}`}
                    width={220}
                    height={320}
                    priority
                    sizes="(max-width: 768px) 80vw, 300px"
                    className="h-auto w-40 max-h-48 object-contain transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:scale-105 group-hover:drop-shadow-[0_20px_35px_rgba(197,157,63,0.35)] drop-shadow-xl cursor-pointer"
                  />
                </div>

                {/* Title */}
                <h3 className="mb-3 font-display text-2xl font-bold text-[#0A1622]">
                  {enzyme.name}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-[#0A1622]/75">
                  {enzyme.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="relative z-10 mt-8 pt-4 border-t border-[#0A1622]/8">
                <Link
                  href={`/enzimas/${enzyme.slug}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#C59D3F]/40 bg-transparent px-5 py-3 font-mono text-xs font-bold tracking-wider text-[#0A1622] uppercase transition-all duration-300 hover:border-[#C59D3F] hover:bg-[#C59D3F] hover:text-[#0D1B2A] shadow-xs"
                >
                  <span>Explorar {enzyme.name.replace("pbserum ", "")}</span>
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-[#C59D3F] group-hover:text-[#0D1B2A] transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
