"use client";

import { useEffect } from "react";
import Image from "next/image";

interface ImageLightboxModalProps {
  isOpen: boolean;
  src?: string | null;
  alt?: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export function ImageLightboxModal({
  isOpen,
  src,
  alt = "Visualização de imagem",
  title,
  subtitle,
  onClose,
}: ImageLightboxModalProps) {
  // Lock body scroll and add Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? alt}
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#07111A]/90 p-4 sm:p-8 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
    >
      {/* Modal Card Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#C59D3F]/30 bg-[#0D1B2A] shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
      >
        {/* Top Header / Bar */}
        <div className="flex items-center justify-between border-b border-[#F6F3EC]/10 px-6 py-4">
          <div>
            {title && (
              <h3 className="font-display text-lg font-bold text-[#F6F3EC]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="font-mono text-xs text-[#C59D3F] uppercase tracking-wider">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar tela cheia"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F6F3EC]/20 text-[#F6F3EC] transition-colors hover:border-[#C59D3F] hover:bg-[#C59D3F]/10 hover:text-[#C59D3F]"
          >
            ✕
          </button>
        </div>

        {/* Content Image Area */}
        <div className="relative flex min-h-[320px] max-h-[72vh] w-full flex-1 items-center justify-center bg-black/40 p-4 sm:p-6">
          {src ? (
            <div className="relative h-full w-full min-h-[280px] max-h-[68vh]">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 1200px) 90vw, 1000px"
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-[#F6F3EC]/60">
              <span className="h-10 w-10 rounded-full border border-[#C59D3F]/40 flex items-center justify-center font-mono text-sm text-[#C59D3F]">
                📷
              </span>
              <p className="font-mono text-xs tracking-wider uppercase">
                Registro fotográfico em breve
              </p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="border-t border-[#F6F3EC]/10 bg-[#0B1D2C] px-6 py-3 text-center">
          <p className="font-mono text-[10px] text-[#F6F3EC]/60 uppercase tracking-widest">
            Aura Regenerative · Documentação Clínica Oficial
          </p>
        </div>
      </div>
    </div>
  );
}
