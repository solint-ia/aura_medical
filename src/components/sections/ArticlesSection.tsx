import { SectionIntro } from "@/components/ui/SectionIntro";
import { ARTICLES } from "@/data/articles";

export function ArticlesSection() {
  return (
    <section
      id="artigos"
      aria-labelledby="artigos-title"
      className="bg-canvas px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
    >
      <div className="mx-auto max-w-[1280px]">
        <SectionIntro
          tone="light"
          titleId="artigos-title"
          eyebrow="Artigos Científicos · Evidência"
          title="A base científica das enzimas recombinantes pbserum."
          lead="Índice de referência sobre os mecanismos das enzimas Slim+, Smooth+ e Drain+. Os links para os estudos completos serão disponibilizados em breve."
          className="mb-11"
        />

        <ul className="mx-auto max-w-[880px] border-t border-content/12">
          {ARTICLES.map((article) => (
            <li key={article.id} className="border-b border-content/12">
              <a
                href={article.href}
                className="group flex flex-col items-start justify-between gap-4 py-6 transition-colors sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <span className="block font-display text-[17px] leading-snug font-semibold text-content transition-colors group-hover:text-accent sm:text-[19px]">
                    {article.title}
                  </span>
                  <span className="mt-1.5 block font-mono text-[11px] tracking-[0.04em] text-content/45 uppercase">
                    {article.topic}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1.5 font-mono text-[12px] tracking-[0.04em] text-accent uppercase shrink-0">
                  Ler Estudo
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
