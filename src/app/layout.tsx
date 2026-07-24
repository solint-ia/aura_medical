import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";

import { SITE_URL } from "@/data/site";

import { ThemeProvider } from "@/components/ThemeProvider";

import "./globals.css";

const sora = Sora({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "pbserum Plus · Aura Medical — Distribuidor Oficial no Brasil",
  description:
    "Slim+, Smooth+ e Drain+: bio-remodeladores enzimáticos recombinantes para flacidez, gordura localizada, celulite, fibrose e cicatrizes. Credenciamento para clínicas e profissionais de saúde.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "pbserum Plus · Aura Medical",
    description:
      "Enzimas recombinantes para bioremodelação da matriz extracelular. Protocolos e credenciamento para clínicas no Brasil.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes writes the theme class onto <html> before React hydrates,
    // so the server markup is expected to differ here.
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${sora.variable} ${manrope.variable} ${jetbrainsMono.variable} scroll-smooth antialiased`}
    >
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
