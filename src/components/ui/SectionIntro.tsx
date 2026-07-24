import type { ReactNode } from "react";

export type SectionTone = "light" | "dark";

interface SectionIntroProps {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: SectionTone;
  className?: string;
  /** Id for the heading, so the parent <section> can reference it. */
  titleId?: string;
}

const TONE_CLASSES: Record<
  SectionTone,
  { eyebrow: string; title: string; lead: string }
> = {
  light: {
    eyebrow: "text-accent",
    title: "text-content",
    lead: "text-content/72",
  },
  dark: {
    eyebrow: "text-accent-panel",
    title: "text-on-panel",
    lead: "text-on-panel/78",
  },
};

export function SectionIntro({
  eyebrow,
  title,
  lead,
  tone = "light",
  className = "",
  titleId,
}: SectionIntroProps) {
  const classes = TONE_CLASSES[tone];

  return (
    <div className={`max-w-[680px] ${className}`}>
      <p
        className={`mb-[18px] font-mono text-[12.5px] tracking-[0.14em] uppercase ${classes.eyebrow}`}
      >
        {eyebrow}
      </p>
      <h2
        id={titleId}
        className={`mb-5 font-display text-[clamp(28px,3.4vw,40px)] leading-[1.14] font-bold tracking-[-0.01em] ${classes.title}`}
      >
        {title}
      </h2>
      {lead ? (
        <p className={`text-[16.5px] leading-[1.65] ${classes.lead}`}>{lead}</p>
      ) : null}
    </div>
  );
}
