import Image from "next/image";

export function ClinicalMappingSection() {
  return (
    <section
      id="mapeamento"
      aria-labelledby="mapeamento-title"
      className="relative overflow-hidden bg-[#0A1622] px-[clamp(20px,4vw,56px)] py-16 md:py-24 text-[#F6F3EC]"
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
            Mapeamento Clínico Interativo
          </span>
          <h2
            id="mapeamento-title"
            className="mt-3 font-display text-3xl font-bold leading-[1.12] tracking-tight text-[#F6F3EC] sm:text-4xl md:text-5xl"
          >
            Identifique a indicação ideal para a sua necessidade.
          </h2>
          <p className="mt-4 text-base text-[#F6F3EC]/75 sm:text-lg leading-relaxed">
            Visualização 3D das zonas de aplicação facial e corporal para bioremodelação tecidual.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:gap-16 items-center">
          {/* Left Column: Facial Mapping */}
          <div className="flex flex-col items-center text-center">
            <div className="w-full [perspective:1000px] flex justify-center items-center py-4">
              <Image
                src="/mapeamento-clinico/aplicação-rosto.png"
                alt="Mapeamento Clínico Facial"
                width={700}
                height={700}
                priority
                sizes="(max-width: 768px) 90vw, 550px"
                className="h-auto w-full max-w-[460px] object-contain transform transition-all duration-700 ease-out [transform-style:preserve-3d] [transform:rotateY(15deg)] hover:[transform:rotateY(0deg)] hover:scale-105 drop-shadow-[0_30px_60px_rgba(0,0,0,0.65)] cursor-pointer"
              />
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md">
              <span className="font-mono text-xs font-semibold tracking-[0.12em] text-[#C59D3F] uppercase">
                Mapeamento Facial · Contorno & Reestruturação
              </span>
            </div>
          </div>

          {/* Right Column: Body Mapping */}
          <div className="flex flex-col items-center text-center">
            <div className="w-full [perspective:1000px] flex justify-center items-center py-4">
              <Image
                src="/mapeamento-clinico/aplicação-corpo.png"
                alt="Mapeamento Clínico Corporal"
                width={700}
                height={700}
                priority
                sizes="(max-width: 768px) 90vw, 550px"
                className="h-auto w-full max-w-[460px] object-contain transform transition-all duration-700 ease-out [transform-style:preserve-3d] [transform:rotateY(-15deg)] hover:[transform:rotateY(0deg)] hover:scale-105 drop-shadow-[0_30px_60px_rgba(0,0,0,0.65)] cursor-pointer"
              />
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md">
              <span className="font-mono text-xs font-semibold tracking-[0.12em] text-[#C59D3F] uppercase">
                Mapeamento Corporal · Firmeza, Contorno & Celulite
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
