"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { AdminAsset } from "./assetUrl";

/** Biblioteca de imagens do admin, com busca por id para renderizar prévias. */
export function useMediaAssets() {
  const { authToken } = useAuth();
  const [assets, setAssets] = useState<AdminAsset[]>([]);

  const reload = useCallback(() => {
    if (!authToken) return;
    void fetch("/api/admin/media", { headers: { Authorization: `Bearer ${authToken}` } })
      .then((response) => response.json())
      .then((data) => setAssets(data.assets ?? []));
  }, [authToken]);

  useEffect(reload, [reload]);

  const byId = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);

  return { assets, byId, reload };
}
