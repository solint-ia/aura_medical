import Image from "next/image";

export function ClinicalMappingSection() {
  return (
    <section
      id="mapeamento"
      aria-labelledby="mapeamento-title"
      className="relative overflow-hidden bg-[#F7F5F0] px-[clamp(20px,4vw,56px)] py-16 md:py-24 text-[#0A1622]"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.1)_0%,transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-[1360px]">
        {/* Section Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <span className="font-mono text-xs font-semibold tracking-[0.18em] text-[#C59D3F] uppercase md:text-sm">
            Mapeamento Clínico Interativo
          </span>
          <h2
            id="mapeamento-title"
            className="mt-3 font-display text-3xl font-bold leading-[1.12] tracking-tight text-[#0A1622] sm:text-4xl md:text-5xl"
          >
            Identifique a indicação ideal para a sua necessidade.
          </h2>
          <p className="mt-4 text-base text-[#0A1622]/75 sm:text-lg leading-relaxed">
            Visualização 3D das zonas de aplicação facial e corporal para bioremodelação tecidual.
          </p>
        </div>

        {/* 2-Column Grid for Facial and Body Mapping */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-14 items-center">
          {/* Left Column: Facial Mapping */}
          <div className="flex flex-col items-center text-center">
            <div className="w-full [perspective:1000px] flex justify-center items-center py-2">
              <Image
                src="/mapeamento-clinico/aplicação-rosto.png"
                alt="Mapeamento Clínico Facial"
                width={900}
                height={900}
                priority
                sizes="(max-width: 768px) 95vw, 750px"
                className="h-auto w-full max-w-2xl lg:max-w-3xl mx-auto object-contain transform transition-all duration-700 ease-out [transform-style:preserve-3d] [transform:rotateY(8deg)] hover:[transform:rotateY(0deg)] hover:scale-105 md:hover:scale-110 drop-shadow-xl hover:drop-shadow-2xl cursor-pointer"
              />
            </div>
            <div className="mt-5 rounded-xl border border-[#0A1622]/12 bg-white px-6 py-3 shadow-xs">
              <span className="font-mono text-xs font-bold tracking-[0.12em] text-[#0A1622] uppercase">
                Mapeamento Facial · Contorno & Reestruturação
              </span>
            </div>
          </div>

          {/* Right Column: Body Mapping */}
          <div className="flex flex-col items-center text-center">
            <div className="w-full [perspective:1000px] flex justify-center items-center py-2">
              <Image
                src="/mapeamento-clinico/aplicação-corpo.png"
                alt="Mapeamento Clínico Corporal"
                width={900}
                height={900}
                priority
                sizes="(max-width: 768px) 95vw, 750px"
                className="h-auto w-full max-w-2xl lg:max-w-3xl mx-auto object-contain transform transition-all duration-700 ease-out [transform-style:preserve-3d] [transform:rotateY(-8deg)] hover:[transform:rotateY(0deg)] hover:scale-105 md:hover:scale-110 drop-shadow-xl hover:drop-shadow-2xl cursor-pointer"
              />
            </div>
            <div className="mt-5 rounded-xl border border-[#0A1622]/12 bg-white px-6 py-3 shadow-xs">
              <span className="font-mono text-xs font-bold tracking-[0.12em] text-[#0A1622] uppercase">
                Mapeamento Corporal · Firmeza, Contorno & Celulite
              </span>
            </div>
          </div>
        </div>

        {/* 3rd Image Block (Técnica de Aplicação) */}
        <div className="w-full max-w-6xl lg:max-w-7xl mx-auto mt-12 md:mt-16 text-center">
          <span className="font-mono text-xs font-semibold tracking-[0.18em] text-[#C59D3F] uppercase md:text-sm">
            Técnica de Aplicação
          </span>
          <h3 className="mt-1.5 font-display text-2xl md:text-3xl font-bold leading-tight text-[#0A1622]">
            Esquema Técnico & Malha de Aplicação
          </h3>

          <div className="w-full mt-3 md:mt-4 flex justify-center">
            <Image
              src="/mapeamento-clinico/tecnica-aplicação.png"
              alt="Técnica de Aplicação das Enzimas Recombinantes"
              width={1400}
              height={800}
              priority
              sizes="(max-width: 1280px) 100vw, 1300px"
              className="h-auto w-full object-contain transform transition-all duration-500 ease-out hover:scale-[1.01] drop-shadow-xl hover:drop-shadow-2xl rounded-xl cursor-pointer"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
