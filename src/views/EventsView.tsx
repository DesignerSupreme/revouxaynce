import React, { useState } from "react";
import {
  CalendarDays, Plus, Edit, Trash2, ChevronRight, Clock,
  ArrowUpDown, DollarSign, Store, UserCheck, Copy
} from "lucide-react";
import type { Event, Client, Vendor, Guest, TimelineBlock, BudgetItem } from "@/types";
import { uid, fmt$, fmtDate, shortDate, daysUntil } from "@/lib/helpers";
import { Modal } from "@/components/app/Modal";
import { FormInput, FormTextArea, FormSelect, FormSelectLabeled, Btn } from "@/components/app/FormElements";
import { Badge } from "@/components/app/Badge";
import { Empty } from "@/components/app/Empty";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { StarRating } from "@/components/app/StarRating";
import { FadeInUp } from "@/components/app/FadeInUp";

interface EventsViewProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  clients: Client[];
  vendors: Vendor[];
  guests: Guest[];
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  timelines: TimelineBlock[];
  setTimelines: React.Dispatch<React.SetStateAction<TimelineBlock[]>>;
  budgets: BudgetItem[];
  setBudgets: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  log: (text: string) => void;
  toast: (msg: string) => void;
}

export function EventsView({ events, setEvents, clients, vendors, guests, setGuests, timelines, setTimelines, budgets, setBudgets, log, toast }: EventsViewProps) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    if (editing) {
      setEvents(ev => ev.map(x => x.id === editing.id ? { ...x, ...obj } : x));
      toast("Event updated"); log(`Updated event: ${obj.name}`);
    } else {
      setEvents(ev => [...ev, { id: uid(), name: obj.name || "", date: obj.date || "", time: obj.time || "", venue: obj.venue || "", clientId: obj.clientId || "", status: obj.status || "Planning", notes: obj.notes || "" }]);
      toast("Event created"); log(`Created event: ${obj.name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const ev = events.find(e => e.id === id);
    setEvents(ev2 => ev2.filter(x => x.id !== id));
    setTimelines(t => t.filter(x => x.eventId !== id));
    setBudgets(b => b.filter(x => x.eventId !== id));
    toast("Event deleted"); log(`Deleted event: ${ev?.name}`);
    setDeleting(null);
  };

  const duplicateEvent = (id: string) => {
    const source = events.find(e => e.id === id);
    if (!source) return;
    const copy: Event = { ...source, id: uid(), name: `${source.name} (Copy)`, status: "Planning" };
    setEvents(ev => [...ev, copy]);
    toast("Event duplicated"); log(`Duplicated event: ${source.name}`);
  };

  if (detail) {
    const ev = events.find(e => e.id === detail);
    if (!ev) { setDetail(null); return null; }
    return <EventDetail event={ev} clients={clients} vendors={vendors} guests={guests} setGuests={setGuests} timelines={timelines} setTimelines={setTimelines} budgets={budgets} setBudgets={setBudgets} onBack={() => setDetail(null)} toast={toast} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl">Events</h1>
        <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New Event</Btn>
      </div>

      {events.length === 0 ? <Empty icon={CalendarDays} text="No events yet. Create your first Revouxaynce event." /> : (
        <div className="grid gap-4">
          {events.map((ev, i) => {
            const client = clients.find(c => c.id === ev.clientId);
            const days = daysUntil(ev.date);
            return (
              <FadeInUp key={ev.id} delay={i * 60}>
                <div className="border border-foreground p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-muted/50 transition-all duration-200" onClick={() => setDetail(ev.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg">{ev.name}</div>
                    <div className="text-sm text-muted-foreground font-sans mt-1">
                      {fmtDate(ev.date)} · {ev.venue}
                      {days >= 0 && ev.status !== "Wrapped" && <span className="ml-2 text-xs border border-input px-1.5 py-0.5">{days}d left</span>}
                    </div>
                    {client && <div className="text-xs text-muted-foreground font-sans mt-1">Client: {client.name}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={ev.status} />
                    {deleting === ev.id ? (
                      <ConfirmDelete onConfirm={() => remove(ev.id)} onCancel={() => setDeleting(null)} />
                    ) : (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button className="p-1.5 hover:bg-muted transition-colors" title="Duplicate" onClick={() => duplicateEvent(ev.id)}><Copy size={14} /></button>
                        <button className="p-1.5 hover:bg-muted transition-colors" onClick={() => { setEditing(ev); setModal(true); }}><Edit size={14} /></button>
                        <button className="p-1.5 hover:bg-muted transition-colors" onClick={() => setDeleting(ev.id)}><Trash2 size={14} /></button>
                      </div>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
              </FadeInUp>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Event" : "New Event"}>
        <form onSubmit={save}>
          <FormInput label="Event Name" name="name" defaultValue={editing?.name} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Date" name="date" type="date" defaultValue={editing?.date} required />
            <FormInput label="Time" name="time" type="time" defaultValue={editing?.time} />
          </div>
          <FormInput label="Venue" name="venue" defaultValue={editing?.venue} />
          <FormSelectLabeled label="Client" name="clientId" options={clients.map(c => ({ value: c.id, label: c.name }))} defaultValue={editing?.clientId} />
          <FormSelect label="Status" name="status" options={["Planning", "Confirmed", "Day-Of", "Wrapped"]} defaultValue={editing?.status || "Planning"} />
          <FormTextArea label="Notes" name="notes" defaultValue={editing?.notes} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Event Detail ─────────────────────────────────────────────────
function EventDetail({ event, clients, vendors, guests, setGuests, timelines, setTimelines, budgets, setBudgets, onBack, toast }: {
  event: Event; clients: Client[]; vendors: Vendor[]; guests: Guest[];
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  timelines: TimelineBlock[]; setTimelines: React.Dispatch<React.SetStateAction<TimelineBlock[]>>;
  budgets: BudgetItem[]; setBudgets: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  onBack: () => void; toast: (msg: string) => void;
}) {
  const [subTab, setSubTab] = useState<"overview" | "timeline" | "budget" | "vendors" | "guests">("overview");
  const client = clients.find(c => c.id === event.clientId);
  const evTimeline = timelines.filter(t => t.eventId === event.id).sort((a, b) => a.order - b.order);
  const evBudget = budgets.filter(b => b.eventId === event.id);
  const evVendors = vendors.filter(v => v.eventIds?.includes(event.id));
  const evGuests = guests.filter(g => g.eventId === event.id);
  const tabs = ["overview", "timeline", "budget", "vendors", "guests"] as const;
  const days = daysUntil(event.date);

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground transition-colors">← Back to Events</button>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
        <h1 className="text-3xl">{event.name}</h1>
        <Badge status={event.status} />
        {days >= 0 && event.status !== "Wrapped" && (
          <span className="text-xs font-sans border border-input px-2 py-1">{days} day{days !== 1 ? "s" : ""} left</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground font-sans mb-6">{fmtDate(event.date)} · {event.time} · {event.venue}</p>
      <div className="flex gap-1 border-b border-foreground mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-sm font-sans capitalize tracking-wide transition-all duration-200 ${subTab === t ? "border-b-2 border-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>
      {subTab === "overview" && (
        <div className="space-y-3 font-sans text-sm animate-fade-in">
          {client && <p><span className="text-muted-foreground">Client:</span> {client.name}</p>}
          <p><span className="text-muted-foreground">Date:</span> {fmtDate(event.date)}</p>
          <p><span className="text-muted-foreground">Time:</span> {event.time}</p>
          <p><span className="text-muted-foreground">Venue:</span> {event.venue}</p>
          {event.notes && <p><span className="text-muted-foreground">Notes:</span> {event.notes}</p>}
        </div>
      )}
      {subTab === "timeline" && <TimelineTab eventId={event.id} timeline={evTimeline} setTimelines={setTimelines} toast={toast} />}
      {subTab === "budget" && <BudgetTab eventId={event.id} budget={evBudget} setBudgets={setBudgets} toast={toast} />}
      {subTab === "vendors" && (
        <div className="animate-fade-in">
          {evVendors.length === 0 ? <Empty icon={Store} text="No vendors assigned to this event." /> : (
            <div className="space-y-2">
              {evVendors.map(v => (
                <div key={v.id} className="border border-foreground p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div><div className="font-semibold">{v.name}</div><div className="text-xs text-muted-foreground">{v.category}</div></div>
                  <StarRating value={v.rating} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {subTab === "guests" && (
        <div className="animate-fade-in">
          {evGuests.length === 0 ? <Empty icon={UserCheck} text="No guests for this event yet." /> : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm font-sans min-w-[480px]">
                <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 pl-4 sm:pl-0">Name</th><th className="py-2 pr-4">RSVP</th><th className="py-2 pr-4">Dietary</th><th className="py-2">Table</th>
                </tr></thead>
                <tbody>
                  {evGuests.map((g, i) => (
                    <tr key={g.id} className={`transition-colors ${i % 2 === 1 ? "bg-muted/50" : ""}`}>
                      <td className="py-2 pr-4 pl-4 sm:pl-0">{g.name}</td><td className="py-2 pr-4"><Badge status={g.rsvp} /></td>
                      <td className="py-2 pr-4">{g.dietary || "—"}</td><td className="py-2">{g.tableGroup || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Timeline Tab ─────────────────────────────────────────────────
function TimelineTab({ eventId, timeline, setTimelines, toast }: {
  eventId: string; timeline: TimelineBlock[];
  setTimelines: React.Dispatch<React.SetStateAction<TimelineBlock[]>>;
  toast: (msg: string) => void;
}) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TimelineBlock | null>(null);
  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    if (editing) {
      setTimelines(t => t.map(x => x.id === editing.id ? { ...x, time: obj.time || "", activity: obj.activity || "", person: obj.person || "", notes: obj.notes || "" } : x));
      toast("Block updated");
    } else {
      setTimelines(t => [...t, { id: uid(), eventId, time: obj.time || "", activity: obj.activity || "", person: obj.person || "", notes: obj.notes || "", order: timeline.length }]);
      toast("Block added");
    }
    setModal(false); setEditing(null);
  };
  const remove = (id: string) => { setTimelines(t => t.filter(x => x.id !== id)); toast("Block removed"); };
  const moveBlock = (idx: number, dir: number) => {
    const sorted = [...timeline]; const [item] = sorted.splice(idx, 1); sorted.splice(idx + dir, 0, item);
    const ids = sorted.map(s => s.id);
    setTimelines(t => t.map(x => { const i = ids.indexOf(x.id); return i >= 0 ? { ...x, order: i } : x; }));
  };
  return (
    <div className="animate-fade-in">
      <div className="flex justify-end mb-4"><Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> Add Block</Btn></div>
      {timeline.length === 0 ? <Empty icon={Clock} text="No timeline blocks yet." /> : (
        <div className="space-y-2">
          {timeline.map((b, i) => (
            <div key={b.id} className="border border-foreground p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col gap-1">{i > 0 && <button onClick={() => moveBlock(i, -1)} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowUpDown size={12} /></button>}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3"><span className="font-semibold text-sm">{b.time}</span><span className="text-sm">{b.activity}</span></div>
                {b.person && <div className="text-xs text-muted-foreground mt-1">Responsible: {b.person}</div>}
                {b.notes && <div className="text-xs text-muted-foreground mt-1">{b.notes}</div>}
              </div>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-muted transition-colors" onClick={() => { setEditing(b); setModal(true); }}><Edit size={14} /></button>
                <button className="p-1 hover:bg-muted transition-colors" onClick={() => remove(b.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Block" : "Add Block"}>
        <form onSubmit={save}>
          <FormInput label="Time" name="time" defaultValue={editing?.time} required placeholder="e.g. 18:00" />
          <FormInput label="Activity" name="activity" defaultValue={editing?.activity} required />
          <FormInput label="Person Responsible" name="person" defaultValue={editing?.person} />
          <FormTextArea label="Notes" name="notes" defaultValue={editing?.notes} />
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Budget Tab ───────────────────────────────────────────────────
function BudgetTab({ eventId, budget, setBudgets, toast }: {
  eventId: string; budget: BudgetItem[];
  setBudgets: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  toast: (msg: string) => void;
}) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const totalEst = budget.reduce((s, b) => s + Number(b.estimated), 0);
  const totalAct = budget.reduce((s, b) => s + Number(b.actual), 0);
  const variance = totalEst - totalAct;
  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    const estimated = parseFloat(obj.estimated) || 0;
    const actual = parseFloat(obj.actual) || 0;
    if (editing) {
      setBudgets(b => b.map(x => x.id === editing.id ? { ...x, item: obj.item || "", category: obj.category || "", estimated, actual } : x));
      toast("Budget item updated");
    } else {
      setBudgets(b => [...b, { id: uid(), eventId, item: obj.item || "", category: obj.category || "", estimated, actual }]);
      toast("Budget item added");
    }
    setModal(false); setEditing(null);
  };
  return (
    <div className="animate-fade-in">
      <div className="flex justify-end mb-4"><Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> Add Item</Btn></div>
      {budget.length === 0 ? <Empty icon={DollarSign} text="No budget items yet." /> : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm font-sans min-w-[480px]">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4 pl-4 sm:pl-0">Item</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4 text-right">Estimated</th><th className="py-2 pr-4 text-right">Actual</th><th className="py-2 w-16"></th>
            </tr></thead>
            <tbody>
              {budget.map((b, i) => (
                <tr key={b.id} className={`transition-colors ${i % 2 === 1 ? "bg-muted/50" : ""}`}>
                  <td className="py-2 pr-4 pl-4 sm:pl-0">{b.item}</td><td className="py-2 pr-4">{b.category}</td>
                  <td className="py-2 pr-4 text-right">{fmt$(b.estimated)}</td><td className="py-2 pr-4 text-right">{fmt$(b.actual)}</td>
                  <td className="py-2 flex gap-1">
                    <button className="p-1 hover:bg-muted transition-colors" onClick={() => { setEditing(b); setModal(true); }}><Edit size={14} /></button>
                    <button className="p-1 hover:bg-muted transition-colors" onClick={() => { setBudgets(bs => bs.filter(x => x.id !== b.id)); toast("Removed"); }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-foreground font-semibold">
                <td className="py-2 pr-4 pl-4 sm:pl-0" colSpan={2}>Totals</td>
                <td className="py-2 pr-4 text-right">{fmt$(totalEst)}</td>
                <td className="py-2 pr-4 text-right">{fmt$(totalAct)}</td>
                <td></td>
              </tr>
              <tr><td className="py-1 pl-4 sm:pl-0 text-xs text-muted-foreground" colSpan={5}>Variance: {fmt$(variance)} {variance >= 0 ? "(under budget)" : "(over budget)"}</td></tr>
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Budget Item" : "Add Budget Item"}>
        <form onSubmit={save}>
          <FormInput label="Item" name="item" defaultValue={editing?.item} required />
          <FormInput label="Category" name="category" defaultValue={editing?.category} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Estimated" name="estimated" type="number" step="0.01" defaultValue={editing?.estimated} />
            <FormInput label="Actual" name="actual" type="number" step="0.01" defaultValue={editing?.actual} />
          </div>
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
        </form>
      </Modal>
    </div>
  );
}
