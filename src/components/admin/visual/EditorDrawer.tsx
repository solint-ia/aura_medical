"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/** Painel lateral para o que não cabe na prévia: preços, casos, ficha técnica. */
export function EditorDrawer({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-panel/50 backdrop-blur-sm" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-content/12 bg-card shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-content/10 p-5">
          <div>
            <h2 className="font-display text-2xl font-semibold">{title}</h2>
            {description ? <p className="mt-1 max-w-md text-sm text-content/60">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
