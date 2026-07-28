import Image from "next/image";
import { type ClinicalCase } from "@/data/cases";

interface ClinicalCaseCardProps {
  clinicalCase: ClinicalCase;
}

export function ClinicalCaseCard({ clinicalCase }: ClinicalCaseCardProps) {
  return (
    <article className="rounded-2xl border border-content/12 bg-card p-5 sm:p-7 shadow-sm transition-all hover:border-[#C59D3F]/40 hover:shadow-md">
      {/* Category Header */}
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold tracking-[0.14em] text-[#C59D3F] uppercase">
          Resultado Clínico
        </span>
        <span className="rounded-full border border-content/15 bg-canvas px-3 py-1 font-mono text-[11px] font-medium text-content/75 uppercase">
          {clinicalCase.categoryName}
        </span>
      </div>

      {/* Paired Before & After Images Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Before Image */}
        <figure className="relative overflow-hidden rounded-xl border border-content/10 bg-[#F7F5F0] dark:bg-[#0A1622] p-2">
          <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden flex items-center justify-center">
            <Image
              src={clinicalCase.beforeImage}
              alt={`Antes - ${clinicalCase.categoryName}`}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-contain p-1 transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>
          {/* Label Badge */}
          <figcaption className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-[#0D1B2A]/85 px-3 py-1 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#F6F3EC] uppercase shadow-md backdrop-blur-xs z-10">
            Antes
          </figcaption>
        </figure>

        {/* After Image */}
        <figure className="relative overflow-hidden rounded-xl border border-[#C59D3F]/40 bg-[#F7F5F0] dark:bg-[#0A1622] p-2">
          <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden flex items-center justify-center">
            <Image
              src={clinicalCase.afterImage}
              alt={`Depois - ${clinicalCase.categoryName}`}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-contain p-1 transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>
          {/* Label Badge */}
          <figcaption className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-[#C59D3F] px-3 py-1 font-mono text-[10.5px] font-bold tracking-[0.12em] text-[#0D1B2A] uppercase shadow-md backdrop-blur-xs z-10">
            Depois
          </figcaption>
        </figure>
      </div>
    </article>
  );
}
