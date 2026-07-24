"use client";

import { useEffect, useState } from "react";

/**
 * Tracks a media query on the client.
 *
 * `initial` is what the server renders and what the first client render uses,
 * so hydration always matches; the real value lands on the first effect.
 */
export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const sync = () => setMatches(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, [query]);

  return matches;
}
