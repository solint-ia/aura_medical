"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether a horizontal rail still has content past its right edge, so a
 * scroll hint can be shown only while it is actually true — and never on
 * desktop, where the rail wraps instead of scrolling.
 */
export function useScrollHint<T extends HTMLElement>() {
  const railRef = useRef<T>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const sync = () => {
      // A few pixels of tolerance: sub-pixel widths would otherwise leave the
      // hint on after the rail has already reached its end.
      setHasMore(rail.scrollWidth - rail.scrollLeft - rail.clientWidth > 8);
    };

    sync();
    rail.addEventListener("scroll", sync, { passive: true });

    // Covers the breakpoint change too: once the rail wraps, or is hidden,
    // there is no overflow left and the hint turns itself off.
    const observer = new ResizeObserver(sync);
    observer.observe(rail);

    return () => {
      rail.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, []);

  return { railRef, hasMore };
}
