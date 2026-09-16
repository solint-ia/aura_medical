import type { CSSProperties, ReactNode } from "react";

interface LineScopeProps {
  colors: { surface: string; surfaceDark: string; accent: string; accentDark: string; foreground: string; foregroundDark: string };
  children: ReactNode;
  className?: string;
}

export function LineScope({ colors, children, className = "" }: LineScopeProps) {
  const style = {
    "--line-surface-light": colors.surface,
    "--line-surface-dark": colors.surfaceDark,
    "--line-accent-light": colors.accent,
    "--line-accent-dark": colors.accentDark,
    "--line-ink-light": colors.foreground,
    "--line-ink-dark": colors.foregroundDark,
  } as CSSProperties;
  return <div style={style} className={`line-scope ${className}`}>{children}</div>;
}
