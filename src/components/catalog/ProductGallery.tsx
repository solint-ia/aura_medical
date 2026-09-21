"use client";

import Image from "next/image";
import { FramedImage } from "@/components/ui/FramedImage";
import { useRef, useState } from "react";
import type { CatalogImage, CatalogItem } from "@/data/catalog";
import { useVariant } from "./VariantContext";

export function ProductGallery({ images, name, cover, kind }: { images?: CatalogImage[]; name: string; cover: string; kind: CatalogItem["kind"] }) {
  const variant = useVariant();
  const entries = images?.filter((image) => image.src) ?? [];
  const base = entries.length ? entries : [{ src: cover, alt: name }];
  // A foto da variação escolhida entra na galeria quando não é uma das já cadastradas.
  const gallery =
    variant?.image && !base.some((image) => image.src === variant.image)
      ? [{ src: variant.image, alt: name }, ...base]
      : base;
  const isProtocol = kind === "protocol";
  const [active, setActive] = useState(0);
  // Trocar de variação traz a foto dela para a frente, sem impedir que se
  // continue navegando pelas outras depois.
  const [shownVariant, setShownVariant] = useState(variant?.image);
  if (shownVariant !== variant?.image) {
    setShownVariant(variant?.image);
    const index = gallery.findIndex((image) => image.src === variant?.image);
    if (index >= 0) setActive(index);
  }
  const touchStart = useRef<number | null>(null);
  const select = (index: number) => setActive(Math.max(0, Math.min(gallery.length - 1, index)));

  return <div className={`grid min-h-[420px] gap-3 md:min-h-[600px] ${gallery.length > 1 ? "md:grid-cols-[5rem_1fr]" : ""}`}>
    {gallery.length > 1 ? <div className="no-scrollbar order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col" aria-label="Miniaturas da galeria">
      {gallery.map((image, index) => <button key={`${image.src}-${index}`} type="button" onClick={() => select(index)} aria-label={`Ver imagem ${index + 1} de ${gallery.length}`} aria-current={index === active} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-card ${index === active ? "border-(--line-accent)" : "border-content/12"}`}><FramedImage src={image.src} alt="" framing={image.framing} fill sizes="64px" className={isProtocol ? "object-cover" : "object-contain p-1"} /></button>)}
    </div> : null}
    <figure className="relative order-1 min-h-[390px] overflow-hidden rounded-[32px] product-halo md:order-2 md:min-h-[600px]" tabIndex={0}
      onKeyDown={(event) => { if (event.key === "ArrowRight") select((active + 1) % gallery.length); if (event.key === "ArrowLeft") select((active - 1 + gallery.length) % gallery.length); }}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => { if (touchStart.current === null) return; const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(delta) > 45) select(delta < 0 ? (active + 1) % gallery.length : (active - 1 + gallery.length) % gallery.length); touchStart.current = null; }}>
      <div className={isProtocol ? "absolute inset-0" : "absolute inset-[10%]"}><FramedImage key={gallery[active].src} src={gallery[active].src} framing={gallery[active].framing} alt={gallery[active].alt || name} fill priority={active === 0} sizes="(max-width: 1024px) 92vw, 42vw" className={isProtocol ? "object-cover motion-safe:animate-[fadeIn_.2s_ease-out]" : "object-contain drop-shadow-[0_18px_20px_rgba(10,22,34,.2)] motion-safe:animate-[fadeIn_.2s_ease-out]"} /></div>
      {gallery[active].caption ? <figcaption className="absolute inset-x-5 bottom-5 rounded-xl bg-card/90 px-4 py-2 text-sm backdrop-blur">{gallery[active].caption}</figcaption> : null}
    </figure>
  </div>;
}
