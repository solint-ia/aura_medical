/**
 * Domínio ainda não confirmado pelo cliente. Fica em um lugar só porque é usado
 * no rodapé e em `metadataBase` — trocar aqui atualiza os dois.
 */
export const SITE_DOMAIN = "auramedical.com.br";
export const SITE_URL = `https://${SITE_DOMAIN}`;

export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "#ciencia", label: "Ciência" },
  { href: "#produtos", label: "Produtos" },
  { href: "#protocolos", label: "Protocolos" },
  { href: "#casos", label: "Casos Clínicos" },
  { href: "#indicacoes", label: "Indicações" },
  { href: "#faq", label: "FAQ" },
];

export const ACCREDITATION_CTA_LABEL = "Seja uma Clínica Credenciada";

export interface FooterColumn {
  label: string;
  lines: string[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    label: "Contato Aura Medical",
    // Awaiting the commercial WhatsApp and e-mail from the client.
    lines: ["[ WhatsApp e e-mail comercial — em breve ]", SITE_DOMAIN],
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
