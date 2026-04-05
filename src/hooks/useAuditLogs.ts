import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AuditLog } from "@/types";

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (invoiceId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false });

    setLogs((data as AuditLog[]) || []);
    setLoading(false);
  }, []);

  return { logs, loading, fetchLogs };
}
