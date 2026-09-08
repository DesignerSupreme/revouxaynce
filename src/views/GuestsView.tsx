import React, { useState } from "react";
import { UserCheck, Plus, Edit, Trash2, Download } from "lucide-react";
import type { Event, Guest } from "@/types";
import { uid } from "@/lib/helpers";
import { Modal } from "@/components/app/Modal";
import { FormInput, FormSelect, FormSelectLabeled, Btn } from "@/components/app/FormElements";
import { Badge } from "@/components/app/Badge";
import { Empty } from "@/components/app/Empty";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { FadeInUp } from "@/components/app/FadeInUp";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import { DonutChart, HBarChart } from "@/components/app/Charts";

interface GuestsViewProps {
  guests: Guest[];
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  events: Event[];
  log: (text: string) => void;
  toast: (msg: string) => void;
}

export function GuestsView({ guests, setGuests, events, log, toast }: GuestsViewProps) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [eventFilter, setEventFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const filtered = eventFilter ? guests.filter(g => g.eventId === eventFilter) : guests;
  const attending = filtered.filter(g => g.rsvp === "Attending").length;
  const declined = filtered.filter(g => g.rsvp === "Declined").length;
  const pending = filtered.filter(g => g.rsvp === "Pending").length;

  const rsvpData = [
    { label: "Attending", value: attending },
    { label: "Pending", value: pending },
    { label: "Declined", value: declined },
  ].filter(d => d.value > 0);

  const dietaryCounts: Record<string, number> = {};
  filtered.forEach(g => {
    const d = g.dietary || "None specified";
    dietaryCounts[d] = (dietaryCounts[d] || 0) + 1;
  });
  const dietaryData = Object.entries(dietaryCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    if (editing) {
      setGuests(g => g.map(x => x.id === editing.id ? { ...x, name: obj.name || "", eventId: obj.eventId || "", email: obj.email || "", phone: obj.phone || "", rsvp: obj.rsvp || "", dietary: obj.dietary || "", tableGroup: obj.tableGroup || "" } : x));
      toast("Guest updated"); log(`Updated guest: ${obj.name}`);
    } else {
      setGuests(g => [...g, { id: uid(), name: obj.name || "", eventId: obj.eventId || "", email: obj.email || "", phone: obj.phone || "", rsvp: obj.rsvp || "Pending", dietary: obj.dietary || "", tableGroup: obj.tableGroup || "" }]);
      toast("Guest added"); log(`Added guest: ${obj.name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const g = guests.find(x => x.id === id);
    setGuests(gs => gs.filter(x => x.id !== id));
    toast("Guest removed"); log(`Removed guest: ${g?.name}`);
    setDeleting(null);
  };

  const exportCSV = () => {
    const headers = ["Name", "Event", "Email", "Phone", "RSVP", "Dietary", "Table/Group"];
    const rows = filtered.map(g => { const ev = events.find(e => e.id === g.eventId); return [g.name, ev?.name || "", g.email, g.phone, g.rsvp, g.dietary, g.tableGroup]; });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "revouxaynce-guests.csv"; a.click(); URL.revokeObjectURL(url); toast("CSV exported");
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl">Guests</h1>
        <div className="flex gap-2 flex-wrap print:hidden">
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} aria-label="Filter by event" className="border border-input px-3 py-2 text-sm font-sans bg-background transition-colors focus:border-foreground focus:outline-none">
            <option value="">All Events</option>{events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <Btn variant="secondary" onClick={() => window.print()}><Printer size={14} className="inline mr-1" /> Print</Btn>
          <Btn variant="secondary" onClick={exportCSV}><Download size={14} className="inline mr-1" /> CSV</Btn>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New</Btn>
        </div>

      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Attending", value: attending },
          { label: "Declined", value: declined },
          { label: "Pending", value: pending },
        ].map((s, i) => (
          <FadeInUp key={s.label} delay={i * 60}>
            <div className="border border-foreground p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-display"><AnimatedNumber value={s.value} /></div>
              <div className="text-xs text-muted-foreground font-sans uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          </FadeInUp>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <FadeInUp delay={100}>
          <div className="border border-foreground p-4 sm:p-5">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-4">RSVP Status</h3>
            <DonutChart data={rsvpData} size={130} />
          </div>
        </FadeInUp>
        <FadeInUp delay={150}>
          <div className="border border-foreground p-4 sm:p-5">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-4">Dietary Requirements</h3>
            <HBarChart data={dietaryData.map(d => ({ label: d.label, value: d.value }))} />
          </div>
        </FadeInUp>
      </div>

      {filtered.length === 0 ? <Empty icon={UserCheck} text="No guests yet."
        hint="Add the people invited to this event, then track who has replied and any dietary needs."
        actionLabel="Add the first guest" onAction={() => { setEditing(null); setModal(true); }} /> : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm font-sans min-w-[640px]">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4 pl-4 sm:pl-0">Name</th><th className="py-2 pr-4">Event</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">RSVP</th><th className="py-2 pr-4">Dietary</th><th className="py-2 pr-4">Table</th><th className="py-2 w-20"></th>
            </tr></thead>
            <tbody>
              {filtered.map((g, i) => {
                const ev = events.find(e => e.id === g.eventId);
                return (
                  <tr key={g.id} className={`transition-colors hover:bg-muted/30 ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="py-2 pr-4 pl-4 sm:pl-0 font-semibold">{g.name}</td><td className="py-2 pr-4">{ev?.name || "—"}</td><td className="py-2 pr-4">{g.email}</td>
                    <td className="py-2 pr-4"><Badge status={g.rsvp} /></td><td className="py-2 pr-4">{g.dietary || "—"}</td><td className="py-2 pr-4">{g.tableGroup || "—"}</td>
                    <td className="py-2">
                      {deleting === g.id ? <ConfirmDelete onConfirm={() => remove(g.id)} onCancel={() => setDeleting(null)} /> : (
                        <div className="flex gap-1"><button className="p-1 hover:bg-muted transition-colors" onClick={() => { setEditing(g); setModal(true); }}><Edit size={14} /></button><button className="p-1 hover:bg-muted transition-colors" onClick={() => setDeleting(g.id)}><Trash2 size={14} /></button></div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Guest" : "Add Guest"}>
        <form onSubmit={save}>
          <FormInput label="Name" name="name" defaultValue={editing?.name} required />
          <FormSelectLabeled label="Event" name="eventId" options={events.map(e => ({ value: e.id, label: e.name }))} defaultValue={editing?.eventId} />
          <FormInput label="Email" name="email" type="email" defaultValue={editing?.email} />
          <FormInput label="Phone" name="phone" defaultValue={editing?.phone} />
          <FormSelect label="RSVP Status" name="rsvp" options={["Attending", "Declined", "Pending"]} defaultValue={editing?.rsvp || "Pending"} />
          <FormInput label="Dietary Notes" name="dietary" defaultValue={editing?.dietary} />
          <FormInput label="Table / Group" name="tableGroup" defaultValue={editing?.tableGroup} />
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
        </form>
      </Modal>
    </div>
  );
}
