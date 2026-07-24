export type EnzymeId = "slim" | "smooth" | "drain";

export interface Enzyme {
  id: EnzymeId;
  /** Commercial name, as printed on the box. */
  label: string;
  /** Accent utilities, resolved statically so Tailwind can extract them. */
  dotClass: string;
  barClass: string;
  pillClass: string;
  /** Product name colour on light surfaces — darkened where needed for contrast. */
  headingClass: string;
}

export const ENZYMES: Record<EnzymeId, Enzyme> = {
  slim: {
    id: "slim",
    label: "Slim+",
    dotClass: "bg-gold",
    barClass: "bg-gold",
    pillClass: "bg-gold/15",
    headingClass: "text-gold-deep dark:text-gold",
  },
  smooth: {
    id: "smooth",
    label: "Smooth+",
    dotClass: "bg-bronze",
    barClass: "bg-bronze",
    pillClass: "bg-bronze/15",
    headingClass: "text-bronze",
  },
  drain: {
    id: "drain",
    label: "Drain+",
    dotClass: "bg-mustard",
    barClass: "bg-mustard",
    pillClass: "bg-mustard/15",
    headingClass: "text-mustard",
  },
};

/** Price per lyophilised vial, in BRL. */
export const PRICE_PER_VIAL = 390;
