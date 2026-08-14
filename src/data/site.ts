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
  { href: "/", label: "Home" },
  { href: "/#protocolos", label: "Protocolos" },
  { href: "/casos-clinicos", label: "Casos Clínicos" },
  { href: "/enzimas", label: "Bioregenerativos" },
];

export const HEADER_ACCREDITATION_CTA_LABEL = "Fale Conosco";
export const HERO_ACCREDITATION_CTA_LABEL = "Fale Conosco";

export interface FooterColumn {
  label: string;
  lines: string[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    label: "Contato Aura Regenera",
    lines: ["WhatsApp e e-mail de atendimento", SITE_DOMAIN],
  },
  {
    label: "pbserum · Proteos Biotech S.L.",
    lines: ["info@pbserum.com · +34 915 417 001", "proteosbiotech.com"],
  },
];

export const WHATSAPP_NUMBER_DISPLAY = "(79) 9 96809911";
export const WHATSAPP_URL = "https://wa.me/5579996809911";
export const CONTACT_EMAIL = "contato@auraregenera.com";

/** CNPJ da Aura Regenera — fonte: cnpj.biz/68305659000190. */
export const COMPANY_CNPJ = "68.305.659/0001-90";

export const INSTAGRAM_HANDLE = "aura.regenera";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

export const ADVERSE_EVENT_CONTACT = {
  label: "Reportar evento adverso",
  email: "technosurveillance@pbserum.com",
};

export const MEDICAL_INFO_CONTACT = {
  label: "Dúvidas técnicas e de produtos",
  email: "medinfo@proteosbiotech.com",
};
