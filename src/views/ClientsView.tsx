import React, { useState } from "react";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import type { Event, Client } from "@/types";
import { uid, shortDate } from "@/lib/helpers";
import { Modal } from "@/components/app/Modal";
import { FormInput, FormSelect, Btn } from "@/components/app/FormElements";
import { Badge } from "@/components/app/Badge";
import { Empty } from "@/components/app/Empty";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { FadeInUp } from "@/components/app/FadeInUp";
import { PortalLinksPanel } from "@/components/app/PortalLinksPanel";

interface ClientsViewProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  events: Event[];
  log: (text: string) => void;
  toast: (msg: string) => void;
}

export function ClientsView({ clients, setClients, events, log, toast }: ClientsViewProps) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "pipeline">("pipeline");
  const [deleting, setDeleting] = useState<string | null>(null);
  const pipeline = ["Inquiry", "Quoted", "Confirmed", "Completed"];

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    if (editing) {
      setClients(cs => cs.map(c => c.id === editing.id ? { ...c, name: obj.name || "", email: obj.email || "", phone: obj.phone || "", eventType: obj.eventType || "", status: obj.status || "", notes: c.notes } : c));
      toast("Client updated"); log(`Updated client: ${obj.name}`);
    } else {
      setClients(cs => [...cs, { id: uid(), name: obj.name || "", email: obj.email || "", phone: obj.phone || "", eventType: obj.eventType || "", status: obj.status || "Inquiry", notes: [] }]);
      toast("Client created"); log(`Created client: ${obj.name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const c = clients.find(x => x.id === id);
    setClients(cs => cs.filter(x => x.id !== id));
    toast("Client deleted"); log(`Deleted client: ${c?.name}`);
    setDeleting(null);
  };

  if (detail) {
    const c = clients.find(x => x.id === detail);
    if (!c) { setDetail(null); return null; }
    const cEvents = events.filter(e => e.clientId === c.id);
    return (
      <div className="animate-fade-in">
        <button onClick={() => setDetail(null)} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground transition-colors">← Back to Clients</button>
        <h1 className="text-3xl mb-2">{c.name}</h1><Badge status={c.status} />
        <div className="mt-6 space-y-2 text-sm font-sans">
          <p><span className="text-muted-foreground">Email:</span> {c.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {c.phone}</p>
          <p><span className="text-muted-foreground">Event Type:</span> {c.eventType}</p>
        </div>
        {cEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Events</h3>
            {cEvents.map(e => (
              <div key={e.id} className="border border-foreground p-3 mb-2 text-sm font-sans hover:bg-muted/30 transition-colors">
                {e.name} — {shortDate(e.date)} <Badge status={e.status} />
              </div>
            ))}
          </div>
        )}
        {c.notes.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Notes</h3>
            {c.notes.map((n, i) => (
              <div key={i} className="border-l-2 border-foreground pl-3 mb-2 text-sm font-sans">
                <p>{n.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{shortDate(n.date)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl">Clients</h1>
        <div className="flex gap-2 flex-wrap">
          <Btn variant="secondary" onClick={() => setView(view === "table" ? "pipeline" : "table")}>{view === "table" ? "Pipeline View" : "Table View"}</Btn>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New</Btn>
        </div>
      </div>
      <PortalLinksPanel toast={toast} />

      {view === "table" ? (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm font-sans min-w-[640px]">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4 pl-4 sm:pl-0">Name</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Status</th><th className="py-2 w-20"></th>
            </tr></thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id} className={`cursor-pointer hover:bg-muted/50 transition-colors ${i % 2 === 1 ? "bg-muted/30" : ""}`} onClick={() => setDetail(c.id)}>
                  <td className="py-2 pr-4 pl-4 sm:pl-0 font-semibold">{c.name}</td><td className="py-2 pr-4">{c.email}</td>
                  <td className="py-2 pr-4">{c.eventType}</td><td className="py-2 pr-4"><Badge status={c.status} /></td>
                  <td className="py-2" onClick={e => e.stopPropagation()}>
                    {deleting === c.id ? <ConfirmDelete onConfirm={() => remove(c.id)} onCancel={() => setDeleting(null)} /> : (
                      <div className="flex gap-1"><button className="p-1 hover:bg-muted transition-colors" onClick={() => { setEditing(c); setModal(true); }}><Edit size={14} /></button><button className="p-1 hover:bg-muted transition-colors" onClick={() => setDeleting(c.id)}><Trash2 size={14} /></button></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipeline.map(stage => (
            <div key={stage} className="border border-foreground" onDragOver={e => e.preventDefault()}
              onDrop={e => { const id = e.dataTransfer.getData("clientId"); setClients(cs => cs.map(c => c.id === id ? { ...c, status: stage } : c)); toast(`Moved to ${stage}`); }}>
              <div className="border-b border-foreground px-4 py-2 text-xs uppercase tracking-wider font-sans bg-muted">{stage}</div>
              <div className="p-3 space-y-2 min-h-[100px]">
                {clients.filter(c => c.status === stage).map(c => (
                  <div key={c.id} draggable onDragStart={e => e.dataTransfer.setData("clientId", c.id)} onClick={() => setDetail(c.id)}
                    className="border border-foreground p-3 cursor-grab hover:bg-muted/50 active:cursor-grabbing transition-colors">
                    <div className="font-semibold text-sm">{c.name}</div><div className="text-xs text-muted-foreground">{c.eventType}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Client" : "New Client"}>
        <form onSubmit={save}>
          <FormInput label="Name" name="name" defaultValue={editing?.name} required />
          <FormInput label="Email" name="email" type="email" defaultValue={editing?.email} />
          <FormInput label="Phone" name="phone" defaultValue={editing?.phone} />
          <FormInput label="Event Type" name="eventType" defaultValue={editing?.eventType} />
          <FormSelect label="Status" name="status" options={pipeline} defaultValue={editing?.status || "Inquiry"} />
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
        </form>
      </Modal>
    </div>
  );
}
