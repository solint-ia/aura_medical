"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAuth();
  const router = useRouter();
  useEffect(() => { if (isHydrated && user?.role !== "ADMIN") router.replace("/entrar"); }, [isHydrated, router, user?.role]);
  if (!isHydrated || user?.role !== "ADMIN") return <div className="grid min-h-[40vh] place-items-center text-sm text-content/60">Verificando acesso…</div>;
  return children;
}
