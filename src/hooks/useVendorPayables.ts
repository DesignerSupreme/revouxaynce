import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;

export interface VendorPayable {
  vendor_id: string;
  vendor_name: string;
  category: string;
  billed: number;
  settled: number;
  outstanding: number;
  open_items: number;
  last_activity: string | null;
}

/** What each vendor has been billed, settled and is still owed, in USD. */
export function useVendorPayables() {
  const [payables, setPayables] = useState<VendorPayable[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await db.from("vendor_payables").select("*").order("outstanding", { ascending: false });
    if (error) console.error("[vendor_payables] load failed", error.message);
    setPayables(
      ((data ?? []) as VendorPayable[]).map((p) => ({
        ...p,
        billed: Number(p.billed),
        settled: Number(p.settled),
        outstanding: Number(p.outstanding),
        open_items: Number(p.open_items),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { payables, loading, refresh };
}
