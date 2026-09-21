"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";

export const META_PIXEL_ID = "4532615096961345";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    _fbqLoaded?: boolean;
  }
}

/**
 * Função utilitária para disparar eventos customizados do Meta Pixel
 * (ex.: Lead, ViewContent, AddToCart, Purchase) em qualquer componente cliente.
 */
export function trackFbEvent(eventName: string, options?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    if (options) {
      window.fbq("track", eventName, options);
    } else {
      window.fbq("track", eventName);
    }
  }
}

export function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // Rastreia transições de páginas no Next.js (SPA).
  // A primeira carga já é rastreada pelo script inline de inicialização,
  // portanto o hook dispara nas trocas de rota subsequentes para evitar duplicação.
  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  // Não injetar nem rastrear ações no painel administrativo
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (!window._fbqLoaded) {
              window._fbqLoaded = true;
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f.fbq)f.fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            }
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
