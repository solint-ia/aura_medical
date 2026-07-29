"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ENZYMES } from "@/data/enzymes";
import { countVials, PRICE_PER_VIAL, type Protocol } from "@/data/protocols";
import { formatBRL } from "@/lib/format";

const BLOCK_LABEL_CLASSES =
  "font-mono text-[11px] tracking-[0.08em] text-content/55 uppercase";

const VIAL_IMAGE_MAP: Record<string, string> = {
  slim: "/frascos/slim.png",
  smooth: "/frascos/smooth.png",
  drain: "/frascos/drain.png",
};

export function ProtocolPanel({ protocol }: { protocol: Protocol }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const totalVials = countVials(protocol);

  const handleBuyNow = () => {
    addToCart(protocol);
    router.push("/carrinho");
  };

  return (
    <div
      // Re-keying on the protocol replays the entry animation on every switch.
      key={protocol.id}
      className="flex animate-fade-up flex-col gap-7 rounded-[20px] bg-canvas dark:bg-card p-[clamp(32px,4vw,48px)] shadow-[0_30px_80px_rgba(4,12,20,0.4)] [animation-duration:280ms]"
    >
      <div className="flex items-center gap-5 sm:gap-6">
        {protocol.image ? (
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 shrink-0 overflow-hidden rounded-full border-[3px] border-[#C59D3F]/50 shadow-lg ring-4 ring-[#C59D3F]/15 transition-transform duration-300">
            <Image
              src={protocol.image}
              alt={`Ilustração do protocolo ${protocol.name}`}
              fill
              sizes="(max-width: 768px) 96px, 112px"
              priority
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="flex flex-col">
          <p className={`mb-1 ${BLOCK_LABEL_CLASSES}`}>Protocolo Selecionado</p>
          <h3 className="font-display text-[clamp(26px,2.6vw,36px)] font-bold tracking-[-0.01em] text-content leading-tight">
            {protocol.name}
          </h3>
        </div>
      </div>

      <hr className="border-content/10" />

      <div>
        <p className={`mb-3.5 ${BLOCK_LABEL_CLASSES}`}>Composição do Kit</p>

        <ul className="flex flex-wrap gap-3">
          {protocol.composition.map((item) => {
            const enzyme = ENZYMES[item.enzyme];
            const vialImg = VIAL_IMAGE_MAP[item.enzyme];

            return (
              <li
                key={item.enzyme}
                className="flex items-center gap-3 rounded-2xl border border-content/10 bg-card dark:bg-canvas px-4 py-2.5 text-[14px] text-content shadow-xs"
              >
                {vialImg ? (
                  <Image
                    src={vialImg}
                    alt={`Frasco ${enzyme.label}`}
                    width={50}
                    height={70}
                    className="h-12 w-auto object-contain shrink-0 drop-shadow-sm"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className={`inline-block h-[9px] w-[9px] rounded-full ${enzyme.dotClass}`}
                  />
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-content">{enzyme.label}</span>
                  <span className="font-mono text-xs font-bold text-[#C59D3F]">
                    {item.vials}x frasco{item.vials > 1 ? "s" : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-3.5 font-mono text-[10.5px] tracking-[0.05em] text-content/55 uppercase">
          {totalVials} frascos ao todo
        </p>
      </div>

      <hr className="border-content/10" />

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-display text-[clamp(36px,4vw,46px)] leading-none font-bold tracking-[-0.01em] text-content">
            {formatBRL(protocol.totalPrice)}
          </p>
          <p className="mt-2 font-mono text-[11.5px] text-content/55">
            {totalVials} × {formatBRL(PRICE_PER_VIAL)} / frasco
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBuyNow}
            className="group inline-flex items-center justify-center gap-2.5 rounded-[9px] bg-[#C59D3F] px-7 py-[17px] text-[15.5px] font-semibold whitespace-nowrap text-[#0D1B2A] shadow-[0_10px_30px_rgba(197,157,63,0.28)] transition-all hover:bg-[#d4ac4c] active:scale-[0.99]"
          >
            Comprar Agora
          </button>
          <Link
            href={`/protocolos/${protocol.id}`}
            className="group inline-flex items-center justify-center gap-2.5 rounded-[9px] bg-action px-7 py-[17px] text-[15.5px] font-semibold whitespace-nowrap text-action-fg transition-all hover:bg-action-hover shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            <span>Ver Protocolo Completo</span>
            <svg
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

