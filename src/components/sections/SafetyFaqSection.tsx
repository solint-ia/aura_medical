import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { SAFETY_NOTES } from "@/data/safety";

export function SafetyFaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-panel px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)] text-on-panel"
    >
      {/* Background ambient accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-10 -z-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(197,157,63,0.08)_0%,transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-[1120px]">
        <SectionIntro
          tone="dark"
          titleId="faq-title"
          eyebrow="Informações Importantes"
          title="Segurança, uso responsável e perguntas frequentes."
          className="mb-12"
        />

        <div className="mb-14 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-10">
          <dl className="flex flex-col gap-4">
            {SAFETY_NOTES.map((note) => (
              <div
                key={note.label}
                className="rounded-2xl border border-white/10 border-l-4 border-l-[#C59D3F] bg-[#162A3D]/70 p-5 shadow-lg sm:p-6 backdrop-blur-sm transition-all hover:border-white/20"
              >
                <dt className="mb-2 font-mono text-[14px] font-bold tracking-[0.06em] text-[#C59D3F] uppercase">
                  {note.label}
                </dt>
                <dd className="text-[17px] leading-[1.6] font-normal text-[#F6F3EC]/90">
                  {note.body}
                </dd>
              </div>
            ))}
          </dl>

          <FaqAccordion tone="dark" />
        </div>
      </div>
    </section>
  );
}
