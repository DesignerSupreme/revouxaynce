import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/permissions";

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Loads the signed-in user's profile row and their highest role. */
export function useAuthRole(userId: string | null, fallbackEmail: string, fallbackName: string) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setProfile(null); setLoading(false); return; }
    setLoading(true);

    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const order: Role[] = ["admin", "planner", "assistant", "viewer"];
    const held = (roles ?? []).map((r) => r.role as Role);
    const role = order.find((r) => held.includes(r)) ?? "viewer";

    setProfile({
      id: userId,
      name: prof?.full_name || fallbackName,
      email: prof?.email || fallbackEmail,
      role,
    });
    setLoading(false);
  }, [userId, fallbackEmail, fallbackName]);

  useEffect(() => { void load(); }, [load]);

  return { profile, loading, refresh: load };
}
