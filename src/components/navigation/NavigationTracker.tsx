"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const current = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
    const last = sessionStorage.getItem("aura_current_path");
    if (last && last !== current) sessionStorage.setItem("aura_previous_path", last);
    sessionStorage.setItem("aura_current_path", current);
  }, [pathname, searchParams]);
  return null;
}
