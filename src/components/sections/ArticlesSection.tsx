import { FileText, ExternalLink } from "lucide-react";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { scientificArticles } from "@/data/articles";

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
          title="A base científica dos bioregenerativos recombinantes pbserum."
          lead="Índice de referência com publicação de estudos científicos, ensaios clínicos e avaliações de eficácia e segurança no uso dermatológico de bioregenerativos recombinantes."
          className="mb-11"
        />

        <ul className="mx-auto max-w-[920px] border-t border-content/12 divide-y divide-content/12">
          {scientificArticles.map((article, index) => (
            <li key={index} className="group">
              <a
                href={article.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-start justify-between gap-4 py-5 px-3 transition-colors rounded-xl hover:bg-card/60 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#C59D3F]/12 text-[#C59D3F]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-display text-[16px] leading-snug font-semibold text-content transition-colors group-hover:text-accent sm:text-[18px]">
                      {article.title}
                    </span>
                    {article.category ? (
                      <span className="mt-1 block font-mono text-[11px] tracking-[0.05em] text-content/50 uppercase">
                        {article.category} · PDF
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#C59D3F]/30 bg-[#C59D3F]/10 px-3.5 py-2 font-mono text-[12px] font-semibold tracking-[0.04em] text-[#C59D3F] transition-all group-hover:bg-[#C59D3F] group-hover:text-[#0D1B2A] shrink-0 self-end sm:self-auto">
                  <span>Visualizar PDF</span>
                  <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
