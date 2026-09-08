import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PortalLinkClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  portal_token: string | null;
  portal_token_rotated_at: string | null;
}

export function usePortalLinks() {
  const [clients, setClients] = useState<PortalLinkClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("id, name, email, phone, portal_token, portal_token_rotated_at")
      .order("name");
    setClients((data ?? []) as PortalLinkClient[]);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchClients(); }, [fetchClients]);

  const rotate = useCallback(async (clientId: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc("rotate_portal_token", { p_client_id: clientId });
    if (error) return null;
    await fetchClients();
    return data as string | null;
  }, [fetchClients]);

  const backfill = useCallback(async (): Promise<number> => {
    const { data, error } = await supabase.rpc("backfill_portal_tokens");
    if (error) return 0;
    await fetchClients();
    return Number(data ?? 0);
  }, [fetchClients]);

  return { clients, loading, fetchClients, rotate, backfill };
}
