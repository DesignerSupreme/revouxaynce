import React, { useState } from "react";
import { Shield, Plus, Edit, Trash2 } from "lucide-react";
import type { TeamMember } from "@/types";
import { uid } from "@/lib/helpers";
import { Modal } from "@/components/app/Modal";
import { FormInput, FormSelect, Btn } from "@/components/app/FormElements";
import { Badge } from "@/components/app/Badge";
import { Empty } from "@/components/app/Empty";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { FadeInUp } from "@/components/app/FadeInUp";

interface TeamViewProps {
  team: TeamMember[];
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  currentUser: TeamMember;
  toast: (msg: string) => void;
  log: (text: string) => void;
}

export function TeamView({ team, setTeam, currentUser, toast, log }: TeamViewProps) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const allSections = ["dashboard", "events", "clients", "vendors", "finances", "expenses", "guests"];

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    
    const role = fd.get("role") as "admin" | "member";
    const access = allSections.filter(s => fd.get(`access_${s}`) === "on");

    if (role === "admin") {
      access.length = 0;
      access.push(...allSections, "team");
    }

    if (editing) {
      setTeam(t => t.map(m => m.id === editing.id ? { ...m, name, email, role, access } : m));
      toast("Team member updated"); log(`Updated team member: ${name}`);
    } else {
      setTeam(t => [...t, { id: uid(), name, email, role, access }]);
      toast("Team member added"); log(`Added team member: ${name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    if (id === currentUser.id) { toast("Cannot delete your own account"); return; }
    const m = team.find(x => x.id === id);
    setTeam(t => t.filter(x => x.id !== id));
    toast("Team member removed"); log(`Removed team member: ${m?.name}`);
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Team</h1>
        <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> Add Member</Btn>
      </div>

      <p className="text-sm text-muted-foreground font-sans mb-6">Manage team members and control which sections they can access.</p>

      {team.length === 0 ? <Empty icon={Shield} text="No team members." /> : (
        <div className="space-y-3">
          {team.map((m, i) => (
            <FadeInUp key={m.id} delay={i * 60}>
              <div className="border border-foreground p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-semibold">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold font-sans text-sm">{m.name}</div>
                        <div className="text-xs text-muted-foreground font-sans">{m.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge status={m.role === "admin" ? "Admin" : "Member"} />
                      {m.id === currentUser.id && <span className="text-xs text-muted-foreground font-sans">(You)</span>}
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground font-sans uppercase tracking-wider mb-1">Access</div>
                      <div className="flex flex-wrap gap-1">
                        {m.access.filter(a => a !== "team").map(a => (
                          <span key={a} className="text-xs border border-input px-2 py-0.5 font-sans capitalize">{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {deleting === m.id ? (
                      <ConfirmDelete onConfirm={() => remove(m.id)} onCancel={() => setDeleting(null)} />
                    ) : (
                      <>
                        <button className="p-1.5 hover:bg-muted transition-colors" onClick={() => { setEditing(m); setModal(true); }}><Edit size={14} /></button>
                        {m.id !== currentUser.id && <button className="p-1.5 hover:bg-muted transition-colors" onClick={() => setDeleting(m.id)}><Trash2 size={14} /></button>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </FadeInUp>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Team Member" : "Add Team Member"}>
        <form onSubmit={save}>
          <FormInput label="Full Name" name="name" defaultValue={editing?.name} required />
          <FormInput label="Email" name="email" type="email" defaultValue={editing?.email} required />
          <p className="text-xs text-muted-foreground font-sans mb-3">Sign-in details are managed by the account system. Ask the person to sign up with this email address.</p>
          <FormSelect label="Role" name="role" options={["admin", "member"]} defaultValue={editing?.role || "member"} />

          <div className="mb-3">
            <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-2 block">Section Access</span>
            <p className="text-xs text-muted-foreground font-sans mb-2">Admins automatically get full access. For members, select which sections they can see.</p>
            <div className="grid grid-cols-2 gap-2">
              {allSections.map(s => (
                <label key={s} className="flex items-center gap-2 text-sm font-sans cursor-pointer">
                  <input type="checkbox" name={`access_${s}`} defaultChecked={editing ? editing.access.includes(s) : true} className="accent-foreground" />
                  <span className="capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
