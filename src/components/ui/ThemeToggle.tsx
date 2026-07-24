"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Both icons are always in the markup and CSS alone decides which one shows.
 * That is what keeps this free of the usual `next-themes` hydration mismatch:
 * the server and the client render identical HTML, and the inline script
 * `next-themes` injects sets the `.dark` class before first paint, so the
 * right icon is already visible — no `mounted` flag, no flash of the wrong one.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Alternar entre tema claro e escuro"
      title="Alternar entre tema claro e escuro"
      className={`relative flex h-10 w-10 flex-none items-center justify-center rounded-full border border-content/15 text-content transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <Moon
        aria-hidden="true"
        strokeWidth={1.6}
        className="absolute h-[18px] w-[18px] rotate-0 scale-100 opacity-100 transition-[transform,opacity] duration-300 dark:-rotate-90 dark:scale-50 dark:opacity-0"
      />
      <Sun
        aria-hidden="true"
        strokeWidth={1.6}
        className="absolute h-[18px] w-[18px] rotate-90 scale-50 opacity-0 transition-[transform,opacity] duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
    </button>
  );
}
