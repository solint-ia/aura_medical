"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ENZYMES } from "@/data/enzymes";
import { countVials, PRICE_PER_VIAL, type Protocol } from "@/data/protocols";
import { formatBRL } from "@/lib/format";

const BLOCK_LABEL_CLASSES =
  "font-mono text-[11px] tracking-[0.08em] text-content/55 uppercase";

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
      <div>
        <p className={`mb-2.5 ${BLOCK_LABEL_CLASSES}`}>Protocolo Selecionado</p>
        <h3 className="mb-2 font-display text-[clamp(26px,2.6vw,34px)] font-bold tracking-[-0.01em] text-content">
          {protocol.name}
        </h3>
        <p className="text-[15px] text-content/70">{protocol.sessions}</p>
      </div>

      <hr className="border-content/10" />

      <div>
        <p className={`mb-3.5 ${BLOCK_LABEL_CLASSES}`}>Composição do Kit</p>

        <div
          aria-hidden="true"
          className="mb-4 flex h-1.5 overflow-hidden rounded"
        >
          {protocol.composition.map((item) => (
            <div
              key={item.enzyme}
              style={{ flexGrow: item.vials }}
              className={`basis-0 ${ENZYMES[item.enzyme].barClass}`}
            />
          ))}
        </div>

        <ul className="flex flex-wrap gap-2.5">
          {protocol.composition.map((item) => {
            const enzyme = ENZYMES[item.enzyme];

            return (
              <li
                key={item.enzyme}
                className="flex items-center gap-2 rounded-full border border-content/8 bg-card dark:bg-canvas px-4 py-[9px] text-[13.5px] text-content"
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-[9px] w-[9px] rounded-full ${enzyme.dotClass}`}
                />
                <span className="font-semibold">{enzyme.label}</span>
                <span className="text-content/55">× {item.vials}</span>
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

