import Image from "next/image";
import { AccreditationButton } from "@/components/accreditation/AccreditationButton";

export function SiteFooter() {
  return (
    <footer className="bg-panel px-[clamp(20px,4vw,56px)] pt-10 pb-8 text-on-panel">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-6 border-b border-on-panel/12 pb-8 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
        {/* Logo centralizada em telas mobile */}
        <div className="flex flex-col items-center sm:items-start">
          <Image
            src="/logos/logo-rodapé.png"
            alt="Aura Regenera"
            width={260}
            height={260}
            className="h-28 sm:h-32 md:h-36 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Contato Aura Regenera */}
        <div className="flex flex-col items-center sm:items-end gap-2 text-sm text-on-panel/85">
          <p className="font-mono text-xs font-semibold tracking-wider text-[#C59D3F] uppercase">
            Contato Aura Regenera
          </p>
          <div className="flex flex-col items-center sm:items-end gap-1.5 text-xs sm:text-sm">
            <AccreditationButton className="inline-flex items-center gap-1.5 font-medium text-on-panel transition-colors hover:text-[#C59D3F]">
              <span>WhatsApp:</span>
              <span className="underline underline-offset-4 decoration-[#C59D3F]/50">Atendimento via WhatsApp</span>
            </AccreditationButton>
            <a
              href="mailto:contato@auraregenerative.com.br"
              className="inline-flex items-center gap-1.5 font-medium text-on-panel transition-colors hover:text-[#C59D3F]"
            >
              <span>E-mail:</span>
              <span className="underline underline-offset-4 decoration-[#C59D3F]/50">contato@auraregenerative.com.br</span>
            </a>
          </div>
        </div>
      </div>

      {/* Direitos Autorais no Final */}
      <div className="mx-auto mt-6 max-w-[1280px] text-center">
        <p className="font-mono text-xs text-on-panel/60">
          © 2026 Aura Regenera
        </p>
      </div>
    </footer>
  );
}
