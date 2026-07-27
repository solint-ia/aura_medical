/**
 * Domínio ainda não confirmado pelo cliente. Fica em um lugar só porque é usado
 * no rodapé e em `metadataBase` — trocar aqui atualiza os dois.
 */
export const SITE_DOMAIN = "auraregenerative.com.br";
export const SITE_URL = `https://${SITE_DOMAIN}`;

export interface NavLink {
  href: string;
  label: string;
}

// Root-absolute anchors (`/#id`) so the nav works from the dynamic
// `/protocolos/[slug]` routes too: Next.js goes to the home page first, then
// scrolls to the section.
export const NAV_LINKS: NavLink[] = [
  { href: "/#ciencia", label: "Ciência" },
  { href: "/#produtos", label: "Produtos" },
  { href: "/#indicacoes", label: "Indicações" },
  { href: "/#casos", label: "Casos Clínicos" },
  { href: "/#artigos", label: "Artigos" },
  { href: "/#protocolos", label: "Protocolos" },
  { href: "/#faq", label: "FAQ" },
];

export const HEADER_ACCREDITATION_CTA_LABEL = "Torne-se Parceiro";
export const HERO_ACCREDITATION_CTA_LABEL = "Credencie sua Clínica";

export interface FooterColumn {
  label: string;
  lines: string[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    label: "Contato Aura Regenerative",
    // Awaiting the commercial WhatsApp and e-mail from the client.
    lines: ["WhatsApp e e-mail comercial: em breve", SITE_DOMAIN],
  },
  {
    label: "pbserum · Proteos Biotech S.L.",
    lines: ["info@pbserum.com · +34 915 417 001", "proteosbiotech.com"],
  },
];

export const ADVERSE_EVENT_CONTACT = {
  label: "Reportar evento adverso",
  email: "technosurveillance@pbserum.com",
};

export const MEDICAL_INFO_CONTACT = {
  label: "Dúvidas médicas",
  email: "medinfo@proteosbiotech.com",
};
