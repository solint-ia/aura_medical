import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { REGULATORY_DISCLAIMER, SAFETY_NOTES } from "@/data/safety";

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
          <dl className="flex flex-col gap-5">
            {SAFETY_NOTES.map((note) => (
              <div key={note.label}>
                <dt className="mb-2 font-mono text-[11px] tracking-[0.06em] text-content/65 uppercase">
                  {note.label}
                </dt>
                <dd className="text-[14.5px] leading-[1.6] text-content/78">
                  {note.body}
                </dd>
              </div>
            ))}
          </dl>

          <FaqAccordion />
        </div>

        <p className="max-w-[900px] border-t border-content/10 pt-6 text-[12.5px] leading-[1.6] text-content/65">
          {REGULATORY_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}
