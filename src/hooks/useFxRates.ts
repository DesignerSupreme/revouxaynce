import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;

export interface FxRate {
  id: string;
  base_currency: string;
  quote_currency: string;
  rate: number;
  rate_date: string;
  note: string;
}

/** Dated exchange rates against USD. A document keeps the rate that applied on its date. */
export function useFxRates() {
  const [rates, setRates] = useState<FxRate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await db
      .from("fx_rates")
      .select("id, base_currency, quote_currency, rate, rate_date, note")
      .order("rate_date", { ascending: false });
    if (error) console.error("[fx_rates] load failed", error.message);
    setRates(((data ?? []) as FxRate[]).map((r) => ({ ...r, rate: Number(r.rate) })));
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const saveRate = useCallback(
    async (quote_currency: string, rate: number, rate_date: string, note = "") => {
      const { error } = await db
        .from("fx_rates")
        .upsert({ base_currency: "USD", quote_currency, rate, rate_date, note }, { onConflict: "base_currency,quote_currency,rate_date" });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  /** Newest rate on or before a date; 1 for USD or when nothing is recorded yet. */
  const rateOn = useCallback(
    (currency: string, onDate: string): number => {
      if (!currency || currency === "USD") return 1;
      const match = rates
        .filter((r) => r.quote_currency === currency && r.rate_date <= onDate)
        .sort((a, b) => (a.rate_date < b.rate_date ? 1 : -1))[0];
      return match ? match.rate : 1;
    },
    [rates],
  );

  return { rates, loading, refresh, saveRate, rateOn };
}
