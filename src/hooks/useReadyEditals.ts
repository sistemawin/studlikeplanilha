"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReadyEdital } from "@/lib/readyEditals";
import { getSupabaseBrowserClient } from "@/services/supabase/client";
import { listReadyEditals } from "@/services/supabase/readyEditals";

export function useReadyEditals(enabled: boolean) {
  const [data, setData] = useState<ReadyEdital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      setData(await listReadyEditals(supabase));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o catálogo oficial.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    readyEditals: data,
    readyEditalsLoading: loading,
    readyEditalsError: error,
    reloadReadyEditals: reload,
  };
}
