"use client";

import { useState } from "react";

import { ProtocolPanel } from "@/components/sections/ProtocolPanel";
import { ScrollHint } from "@/components/ui/ScrollHint";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { PROTOCOLS } from "@/data/protocols";
import { useScrollHint } from "@/hooks/useScrollHint";
import { formatBRL } from "@/lib/format";

export function ProtocolsSection() {
  const [selectedId, setSelectedId] = useState(PROTOCOLS[0].id);
  const { railRef, hasMore } = useScrollHint<HTMLDivElement>();
  const selectedProtocol =
    PROTOCOLS.find((protocol) => protocol.id === selectedId) ?? PROTOCOLS[0];

  return (
    <section
      id="protocolos"
      aria-labelledby="protocolos-title"
      className="relative overflow-hidden bg-panel px-[clamp(20px,4vw,56px)] py-[clamp(64px,8vw,104px)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-65 -right-50 h-[600px] w-[600px] rounded-full border border-on-panel/6"
      />

      <div className="relative mx-auto max-w-[1280px]">
        <SectionIntro
          tone="dark"
          titleId="protocolos-title"
          eyebrow="Protocolos · Configurador Interativo"
          title="Seis protocolos prontos. A proporção enzimática certa para cada indicação."
          lead="Selecione um protocolo ao lado para ver a composição exata e o investimento."
          className="mb-14"
        />

        <div className="grid grid-cols-1 items-start gap-6 wide:grid-cols-[minmax(300px,380px)_1fr] wide:gap-12">
          {/* Narrow viewports: the same list as a scrollable pill row. */}
          <div className="relative wide:hidden">
            <div
              ref={railRef}
              className="no-scrollbar flex gap-2.5 overflow-x-auto px-0.5 pt-0.5 pb-3"
            >
              {PROTOCOLS.map((protocol) => {
                const isSelected = protocol.id === selectedId;

                return (
                  <button
                    key={protocol.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(protocol.id)}
                    className={`flex-none rounded-full border px-5 py-3 text-[13.5px] font-semibold whitespace-nowrap ${
                      isSelected
                        ? "border-gold bg-gold text-navy"
                        : "border-on-panel/24 text-on-panel/78"
                    }`}
                  >
                    {protocol.name}
                  </button>
                );
              })}
            </div>
            <ScrollHint visible={hasMore} />
          </div>

          {/* Wide viewports: a priced index, so the range is readable at a glance. */}
          <div className="hidden flex-col gap-0.5 wide:flex">
            {PROTOCOLS.map((protocol, index) => {
              const isSelected = protocol.id === selectedId;

              return (
                <button
                  key={protocol.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(protocol.id)}
                  className={`flex w-full items-center justify-between gap-3.5 rounded-r-xl border-l-[3px] px-[22px] py-[19px] text-left transition-colors ${
                    isSelected
                      ? "border-l-gold bg-on-panel/7"
                      : "border-l-transparent hover:bg-on-panel/5"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3.5">
                    <span
                      className={`flex-none font-mono text-[11px] ${
                        isSelected ? "text-accent-panel" : "text-on-panel/35"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`truncate text-[16.5px] font-semibold ${
                        isSelected ? "text-on-panel" : "text-on-panel/55"
                      }`}
                    >
                      {protocol.name}
                    </span>
                  </span>
                  <span
                    className={`flex-none font-mono text-xs whitespace-nowrap ${
                      isSelected ? "text-accent-panel" : "text-on-panel/35"
                    }`}
                  >
                    {formatBRL(protocol.totalPrice)}
                  </span>
                </button>
              );
            })}
          </div>

          <ProtocolPanel protocol={selectedProtocol} />
        </div>
      </div>
    </section>
  );
}
