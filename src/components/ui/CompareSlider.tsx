"use client";

import Image from "next/image";
import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

interface CompareSliderProps {
  before: string;
  after: string;
  /** Who the case belongs to — used to describe both frames. */
  subject: string;
  /** Frame sizing and rounding; supplied by the caller so each page can size it. */
  className?: string;
  sizes?: string;
}

const STEP = 3;

export function CompareSlider({
  before,
  after,
  subject,
  className = "",
  sizes = "(max-width: 1024px) 92vw, 520px",
}: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const bounds = surface.getBoundingClientRect();
    const ratio = ((clientX - bounds.left) / bounds.width) * 100;
    setPosition(Math.min(100, Math.max(0, ratio)));
  }, []);

  // Pointer events cover mouse, touch and pen with one path; capture keeps the
  // drag alive when the finger leaves the frame. Paired with `touch-action:
  // pan-y` on the surface, a horizontal drag never reaches a scroll container
  // underneath — which is what lets this sit inside the cases carousel.
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setFromClientX(event.clientX);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) setFromClientX(event.clientX);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={surfaceRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`compare-surface relative w-full cursor-ew-resize overflow-hidden border select-none border-on-panel/15 bg-navy-deep dark:bg-canvas ${className}`}
    >
      <Image
        src={after}
        alt={`Depois do tratamento — ${subject}`}
        fill
        sizes={sizes}
        className="object-cover"
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={before}
          alt={`Antes do tratamento — ${subject}`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>

      <span
        className={`pointer-events-none absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase backdrop-blur-sm bg-panel/70 font-mono text-on-panel`}
      >
        Antes
      </span>
      <span
        className={`pointer-events-none absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase backdrop-blur-sm bg-panel/70 font-mono text-on-panel`}
      >
        Depois
      </span>

      <div
        aria-hidden="true"
        style={{ left: `${position}%` }}
        className={`pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-on-panel/85`}
      />

      <button
        type="button"
        role="slider"
        aria-label={`Comparar antes e depois — ${subject}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% do antes visível`}
        style={{ left: `${position}%` }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            setPosition((current) => Math.max(0, current - STEP));
          }
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            setPosition((current) => Math.min(100, current + STEP));
          }
          if (event.key === "Home") setPosition(0);
          if (event.key === "End") setPosition(100);
        }}
        className={`absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-panel border-on-panel/40 bg-panel/80 text-on-panel`}
      >
        <span aria-hidden="true" className="text-sm tracking-[-0.1em]">
          ◀▶
        </span>
      </button>
    </div>
  );
}
