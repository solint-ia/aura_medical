import Image from "next/image";

export function MosaicSection() {
  return (
    <section
      id="mosaico"
      aria-label="Mosaico de indicações clínicas"
      className="relative overflow-hidden bg-canvas px-[clamp(20px,4vw,56px)] pt-4 pb-12 md:pt-6 md:pb-16"
    >
      {/* Editorial Typography Anchor */}
      <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
        <span className="font-mono text-xs font-semibold tracking-[0.18em] text-[#C59D3F] uppercase md:text-sm">
          Indicações Clínicas
        </span>
        <h2 className="mt-2.5 font-display text-3xl font-light leading-[1.14] tracking-tight text-content sm:text-4xl md:text-5xl">
          Versatilidade para os principais desafios estéticos.
        </h2>
      </div>

      {/* Hexagonal Mosaic Image Wrapper */}
      <div className="relative mx-auto w-full max-w-7xl">
        {/* Subtle Backdrop Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[75%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.9)_0%,rgba(197,157,63,0.16)_45%,transparent_75%)] blur-3xl opacity-80 dark:bg-[radial-gradient(ellipse_at_center,rgba(197,157,63,0.18)_0%,rgba(17,34,51,0.6)_50%,transparent_75%)]"
        />

        {/* Image with 3D drop shadow matching hexagon contours */}
        <Image
          src="/images/mosaico.png"
          alt="Mosaico de indicações clínicas: Gordura Localizada, Flacidez, Celulite, Fibrose, Cicatrizes, Queixo Duplo (Papada)"
          width={1400}
          height={788}
          priority
          sizes="(max-width: 1280px) 100vw, 1400px"
          className="mx-auto h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(10,22,34,0.16)] transition-transform duration-700 hover:scale-[1.008] dark:drop-shadow-[0_25px_50px_rgba(0,0,0,0.45)]"
        />
      </div>
    </section>
  );
}
