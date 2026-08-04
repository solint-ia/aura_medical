import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { SAFETY_NOTES } from "@/data/safety";

export function SafetyFaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative bg-canvas px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
    >
      <div className="mx-auto max-w-[1120px]">
        <SectionIntro
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
                className="rounded-2xl border border-content/12 border-l-4 border-l-[#C59D3F] bg-card p-5 shadow-sm sm:p-6"
              >
                <dt className="mb-2 font-mono text-[14px] font-bold tracking-[0.06em] text-[#C59D3F] uppercase">
                  {note.label}
                </dt>
                <dd className="text-[17.5px] leading-[1.6] font-medium text-content">
                  {note.body}
                </dd>
              </div>
            ))}
          </dl>

          <FaqAccordion />
        </div>
      </div>
    </section>
  );
}
