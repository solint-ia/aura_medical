import type { ReactNode } from "react";

interface TagProps {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "pbserum" | "la-cutanee" | "dark";
}

const tones = {
  neutral: "border-content/12 bg-card/75 text-content/75",
  pbserum: "border-(--line-accent)/20 bg-(--line-surface) text-(--line-ink)",
  "la-cutanee": "border-(--line-accent)/20 bg-(--line-surface) text-(--line-ink)",
  dark: "border-white/12 bg-white/8 text-white/85",
};

export function Tag({ children, className = "", tone = "neutral" }: TagProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
