"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackLink({ fallbackHref, children = "Voltar" }: { fallbackHref: string; children?: React.ReactNode }) {
  const router = useRouter();
  return <button type="button" onClick={() => { const previous = sessionStorage.getItem("aura_previous_path"); if (previous?.startsWith("/")) router.back(); else router.push(fallbackHref); }} className="inline-flex items-center gap-2 text-sm font-semibold text-content/65 hover:text-content"><ArrowLeft className="h-4 w-4" />{children}</button>;
}
