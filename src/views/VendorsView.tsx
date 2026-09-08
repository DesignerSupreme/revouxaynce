import React, { useState } from "react";
import { Store, Plus, Edit, Trash2 } from "lucide-react";
import type { Event, Vendor } from "@/types";
import { uid, shortDate } from "@/lib/helpers";
import { Modal } from "@/components/app/Modal";
import { FormInput, FormSelect, FormTextArea, Btn } from "@/components/app/FormElements";
import { Badge } from "@/components/app/Badge";
import { Empty } from "@/components/app/Empty";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { StarRating } from "@/components/app/StarRating";
import { FadeInUp } from "@/components/app/FadeInUp";
import { VendorPayables } from "@/components/app/VendorPayables";

interface VendorsViewProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  events: Event[];
  log: (text: string) => void;
  toast: (msg: string) => void;
}

export function VendorsView({ vendors, setVendors, events, log, toast }: VendorsViewProps) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const categories = ["Catering", "Florals", "Photography", "AV", "Decor", "Transport", "Entertainment", "Other"];
  const filtered = filter ? vendors.filter(v => v.category === filter) : vendors;

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    const rating = parseInt(obj.rating) || 3;
    if (editing) {
      setVendors(v => v.map(x => x.id === editing.id ? { ...x, name: obj.name || "", category: obj.category || "", contact: obj.contact || "", rating, notes: obj.notes || "", eventIds: x.eventIds } : x));
      toast("Vendor updated"); log(`Updated vendor: ${obj.name}`);
    } else {
      setVendors(v => [...v, { id: uid(), name: obj.name || "", category: obj.category || "", contact: obj.contact || "", rating, notes: obj.notes || "", eventIds: [] }]);
      toast("Vendor created"); log(`Created vendor: ${obj.name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const v = vendors.find(x => x.id === id);
    setVendors(vs => vs.filter(x => x.id !== id));
    toast("Vendor deleted"); log(`Deleted vendor: ${v?.name}`);
    setDeleting(null);
  };

  if (detail) {
    const v = vendors.find(x => x.id === detail);
    if (!v) { setDetail(null); return null; }
    const linkedEvents = events.filter(e => v.eventIds?.includes(e.id));
    return (
      <div className="animate-fade-in">
        <button onClick={() => setDetail(null)} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground transition-colors">← Back to Vendors</button>
        <h1 className="text-3xl mb-2">{v.name}</h1>
        <div className="flex items-center gap-3 mb-6"><Badge status={v.category} /><StarRating value={v.rating} /></div>
        <div className="space-y-2 text-sm font-sans">
          <p><span className="text-muted-foreground">Contact:</span> {v.contact}</p>
          {v.notes && <p><span className="text-muted-foreground">Notes:</span> {v.notes}</p>}
        </div>
        {linkedEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Assigned Events</h3>
            {linkedEvents.map(e => (
              <div key={e.id} className="border border-foreground p-3 mb-2 text-sm font-sans hover:bg-muted/30 transition-colors">{e.name} — {shortDate(e.date)}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl">Vendors</h1>
        <div className="flex gap-2 flex-wrap">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-input px-3 py-2 text-sm font-sans bg-background transition-colors focus:border-foreground focus:outline-none">
            <option value="">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New</Btn>
        </div>
      </div>
      <VendorPayables />
      {filtered.length === 0 ? <Empty icon={Store} text="No vendors yet."
        hint="Keep caterers, venues, decorators and their contacts in one place, ready to attach to an event." /> : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {filtered.map((v, i) => (
            <FadeInUp key={v.id} delay={i * 60}>
              <div className="border border-foreground p-4 sm:p-5 cursor-pointer hover:bg-muted/50 transition-all duration-200" onClick={() => setDetail(v.id)}>
                <div className="flex items-start justify-between">
                  <div><div className="font-display text-lg">{v.name}</div><div className="text-xs text-muted-foreground font-sans mt-1">{v.category} · {v.contact}</div></div>
                  <StarRating value={v.rating} />
                </div>
                {v.notes && <p className="text-sm text-muted-foreground font-sans mt-2">{v.notes}</p>}
                <div className="flex gap-1 mt-3" onClick={e => e.stopPropagation()}>
                  {deleting === v.id ? <ConfirmDelete onConfirm={() => remove(v.id)} onCancel={() => setDeleting(null)} /> : (
                    <><button className="p-1 hover:bg-muted transition-colors" onClick={() => { setEditing(v); setModal(true); }}><Edit size={14} /></button><button className="p-1 hover:bg-muted transition-colors" onClick={() => setDeleting(v.id)}><Trash2 size={14} /></button></>
                  )}
                </div>
              </div>
            </FadeInUp>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Vendor" : "New Vendor"}>
        <form onSubmit={save}>
          <FormInput label="Name" name="name" defaultValue={editing?.name} required />
          <FormSelect label="Category" name="category" options={categories} defaultValue={editing?.category} />
          <FormInput label="Contact" name="contact" defaultValue={editing?.contact} />
          <FormSelect label="Rating" name="rating" options={["1","2","3","4","5"]} defaultValue={String(editing?.rating || 3)} />
          <FormTextArea label="Notes" name="notes" defaultValue={editing?.notes} />
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
        </form>
      </Modal>
    </div>
  );
}
