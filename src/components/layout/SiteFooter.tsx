import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AccreditationButton } from "@/components/accreditation/AccreditationButton";
import {
  COMPANY_CNPJ,
  CONTACT_EMAIL,
  INSTAGRAM_URL,
  NAV_LINKS,
  WHATSAPP_NUMBER_DISPLAY,
  WHATSAPP_URL,
} from "@/data/site";

const ICON_CLASSES =
  "flex h-10 w-10 items-center justify-center rounded-full border border-on-panel/20 text-on-panel transition-colors hover:border-[#C59D3F] hover:bg-[#C59D3F] hover:text-[#0D1B2A]";

/** lucide-react desta versão não traz as marcas; os glifos vão inline. */
function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-[18px] w-[18px]"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.98 11.98 0 005.734 1.459h.005c6.582 0 11.94-5.335 11.944-11.893a11.82 11.82 0 00-3.468-8.463" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-panel px-[clamp(20px,4vw,56px)] pt-10 pb-8 text-on-panel">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-8 border-b border-on-panel/12 pb-8 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:text-left">
        {/* Logo centralizada em telas mobile */}
        <div className="flex flex-col items-center sm:items-start">
          <Image
            src="/logos/AR-DARK.png"
            alt="Aura Regenera"
            width={695}
            height={558}
            className="h-24 sm:h-28 md:h-32 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Navegação — mesmos destinos do menu do topo (NAV_LINKS) */}
        <nav aria-label="Navegação do rodapé" className="flex flex-col items-center gap-2">
          <p className="font-mono text-xs font-semibold tracking-wider text-[#C59D3F] uppercase">
            Navegação
          </p>
          <ul className="flex flex-col items-center gap-1.5 text-xs sm:text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium text-on-panel transition-colors hover:text-[#C59D3F]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contato Aura Regenera */}
        <div className="flex flex-col items-center sm:items-end gap-2 text-sm text-on-panel/85">
          <p className="font-mono text-xs font-semibold tracking-wider text-[#C59D3F] uppercase">
            Contato Aura Regenera
          </p>
          <div className="flex flex-col items-center sm:items-end gap-1.5 text-xs sm:text-sm">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-on-panel transition-colors hover:text-[#C59D3F]"
            >
              <span>WhatsApp:</span>
              <span className="underline underline-offset-4 decoration-[#C59D3F]/50">{WHATSAPP_NUMBER_DISPLAY}</span>
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-1.5 font-medium text-on-panel transition-colors hover:text-[#C59D3F]"
            >
              <span>E-mail:</span>
              <span className="underline underline-offset-4 decoration-[#C59D3F]/50">{CONTACT_EMAIL}</span>
            </a>
          </div>

          {/* Atalhos em ícone */}
          <ul className="mt-2 flex items-center gap-3">
            {INSTAGRAM_URL ? (
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram da Aura Regenera"
                  className={ICON_CLASSES}
                >
                  <InstagramIcon />
                </a>
              </li>
            ) : null}
            <li>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp da Aura Regenera: ${WHATSAPP_NUMBER_DISPLAY}`}
                className={ICON_CLASSES}
              >
                <WhatsAppIcon />
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label={`Enviar e-mail para ${CONTACT_EMAIL}`}
                className={ICON_CLASSES}
              >
                <Mail className="h-[18px] w-[18px]" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Direitos Autorais e Links Legais no Final */}
      <div className="mx-auto mt-6 flex max-w-[1280px] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="font-mono text-xs text-on-panel/60">
          © 2026 Aura Regenera · CNPJ {COMPANY_CNPJ}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-on-panel/75">
          <Link
            href="/termos-de-uso"
            className="transition-colors hover:text-[#C59D3F] hover:underline underline-offset-4"
          >
            Termos de Uso
          </Link>
          <span className="text-on-panel/30 hidden sm:inline" aria-hidden="true">·</span>
          <Link
            href="/politica-de-privacidade"
            className="transition-colors hover:text-[#C59D3F] hover:underline underline-offset-4"
          >
            Políticas de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
