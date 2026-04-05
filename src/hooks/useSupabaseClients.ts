import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbClient = Tables<"clients">;

export function useSupabaseClients() {
  const [clients, setClients] = useState<DbClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("name");
    setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  return { clients, loading, fetchClients };
}
