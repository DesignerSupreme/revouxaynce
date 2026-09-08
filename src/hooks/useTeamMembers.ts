import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/permissions";

export interface TeamAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Real accounts: profiles joined with their assigned role. */
export function useTeamMembers() {
  const [members, setMembers] = useState<TeamAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").order("created_at", { ascending: true }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr || rErr) { setError(pErr?.message ?? rErr?.message ?? null); setLoading(false); return; }

    const order: Role[] = ["admin", "planner", "assistant", "viewer"];
    const byUser = new Map<string, Role[]>();
    for (const r of roles ?? []) {
      const list = byUser.get(r.user_id) ?? [];
      list.push(r.role as Role);
      byUser.set(r.user_id, list);
    }

    setMembers(
      (profiles ?? []).map((p) => {
        const held = byUser.get(p.id) ?? [];
        return {
          id: p.id,
          name: p.full_name || p.email.split("@")[0],
          email: p.email,
          role: order.find((r) => held.includes(r)) ?? "viewer",
        };
      }),
    );
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  /** Admin only — replaces a member's role. */
  const setRole = useCallback(async (userId: string, role: Role) => {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) throw new Error(delErr.message);
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (insErr) throw new Error(insErr.message);
    await refresh();
  }, [refresh]);

  return { members, loading, error, refresh, setRole };
}
