export interface Article {
  id: string;
  /** Display year of publication. */
  year: string;
  title: string;
  /** Subtle topic tag, drawn from the enzyme or mechanism under study. */
  topic: string;
  /**
   * Link to the full study. Placeholder until the commercial team supplies the
   * final DOIs / repository URLs — do not present these as live citations yet.
   */
  href: string;
}

/**
 * Reference index for the science behind pbserum Plus. Titles describe the
 * documented mechanisms of the recombinant enzymes; the destination links are
 * pending from the commercial team (see `href` note above).
 */
export const ARTICLES: Article[] = [
  {
    id: "lipase-pb500-adiposidade",
    year: "2023",
    title:
      "Hidrólise seletiva de triglicerídeos por lipase recombinante PB500 na adiposidade localizada",
    topic: "Slim+ · Lipase PB500",
    href: "#",
  },
  {
    id: "colagenases-fibrose",
    year: "2022",
    title:
      "Colagenases recombinantes G&H PB220 na remodelação de septos fibróticos e cicatrizes",
    topic: "Smooth+ · Colagenases PB220",
    href: "#",
  },
  {
    id: "hialuronidase-edema",
    year: "2022",
    title:
      "Hialuronidase PB3000 e a permeabilidade da matriz extracelular no controle do edema",
    topic: "Drain+ · Hialuronidase PB3000",
    href: "#",
  },
  {
    id: "recombinante-vs-origem-animal",
    year: "2021",
    title:
      "Enzimas recombinantes versus enzimas de origem animal: pureza, imunogenicidade e reprodutibilidade",
    topic: "Segurança · Bioengenharia",
    href: "#",
  },
  {
    id: "bioremodelacao-tecidual",
    year: "2021",
    title:
      "Bioremodelação enzimática: reorganização da matriz extracelular e do compartimento intersticial",
    topic: "Mecanismo · Bioremodelação",
    href: "#",
  },
];
