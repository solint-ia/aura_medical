import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";

import { SITE_URL } from "@/data/site";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { NavigationTracker } from "@/components/navigation/NavigationTracker";
import { Suspense } from "react";

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
  title: "Aura Regenera",
  description:
    "Catálogo de biotecnologia regenerativa para profissionais: bioregenerativos PBSerum, protocolos clínicos e dermocosméticos La Cutanée.",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/logos/AR-favicon.png",
    shortcut: "/logos/AR-favicon.png",
    apple: "/logos/AR-favicon.png",
  },
  openGraph: {
    title: "Aura Regenera",
    description:
      "PBSerum e La Cutanée em um catálogo de tecnologias regenerativas para a prática clínica.",
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
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${sora.variable} ${manrope.variable} ${jetbrainsMono.variable} scroll-smooth antialiased`}
    >
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Suspense fallback={null}><NavigationTracker /></Suspense>
              {children}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
