import React from "react";
import { Shield, RefreshCw } from "lucide-react";
import { Empty } from "@/components/app/Empty";
import { FadeInUp } from "@/components/app/FadeInUp";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/lib/permissions";

interface TeamViewProps {
  currentUserId: string;
  currentRole: Role;
  toast: (msg: string) => void;
  log: (text: string) => void;
}

export function TeamView({ currentUserId, currentRole, toast, log }: TeamViewProps) {
  const { members, loading, refresh, setRole } = useTeamMembers();
  const isAdmin = currentRole === "admin";

  const change = async (id: string, name: string, role: Role) => {
    if (id === currentUserId) { toast("You cannot change your own permission level"); return; }
    try {
      await setRole(id, role);
      toast(`${name} is now ${ROLE_LABELS[role]}`);
      log(`Changed ${name}'s permission level to ${ROLE_LABELS[role]}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not change permission level");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl">Team</h1>
        <button onClick={() => void refresh()} className="p-2 border border-foreground hover:bg-muted transition-colors" aria-label="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      <p className="text-sm text-muted-foreground font-sans mb-4">
        Everyone here has a real account. People join by signing up with their work email — an admin then sets their permission level.
      </p>

      <div className="border border-foreground p-4 mb-6 grid gap-2 sm:grid-cols-2">
        {ROLES.map(r => (
          <div key={r} className="text-xs font-sans">
            <span className="uppercase tracking-wider font-semibold">{ROLE_LABELS[r]}</span>
            <span className="text-muted-foreground"> — {ROLE_DESCRIPTIONS[r]}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-sm font-sans text-muted-foreground">Loading accounts…</p>
      ) : members.length === 0 ? (
        <Empty icon={Shield} text="No accounts yet." />
      ) : (
        <div className="space-y-3">
          {members.map((m, i) => (
            <FadeInUp key={m.id} delay={i * 60}>
              <div className="border border-foreground p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold font-sans text-sm truncate">
                      {m.name}{m.id === currentUserId && <span className="text-muted-foreground font-normal"> (You)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground font-sans truncate">{m.email}</div>
                  </div>
                </div>

                {isAdmin && m.id !== currentUserId ? (
                  <select
                    value={m.role}
                    onChange={e => void change(m.id, m.name, e.target.value as Role)}
                    className="border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                ) : (
                  <span className="text-xs font-sans uppercase tracking-wider border border-foreground px-2 py-1 self-start">
                    {ROLE_LABELS[m.role]}
                  </span>
                )}
              </div>
            </FadeInUp>
          ))}
        </div>
      )}
    </div>
  );
}
