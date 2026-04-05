import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  LayoutDashboard, CalendarDays, Users, Store, DollarSign, UserCheck,
  Plus, Trash2, Edit, X, ChevronRight, Star, Download, Clock,
  FileText, AlertCircle, CheckCircle, Menu, Search, GripVertical,
  ArrowUpDown, Filter
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
interface Event { id: string; name: string; date: string; time: string; venue: string; clientId: string; status: string; notes: string; }
interface TimelineBlock { id: string; eventId: string; time: string; activity: string; person: string; notes: string; order: number; }
interface BudgetItem { id: string; eventId: string; item: string; category: string; estimated: number; actual: number; }
interface Client { id: string; name: string; email: string; phone: string; eventType: string; status: string; notes: { text: string; date: string }[]; }
interface Vendor { id: string; name: string; category: string; contact: string; rating: number; notes: string; eventIds: string[]; }
interface Invoice { id: string; clientId: string; eventId: string; amount: number; status: string; dueDate: string; notes: string; lineItems: { desc: string; amount: number }[]; }
interface Guest { id: string; name: string; eventId: string; email: string; phone: string; rsvp: string; dietary: string; tableGroup: string; }
type Tab = "dashboard" | "events" | "clients" | "vendors" | "finances" | "guests";

// ─── Helpers ──────────────────────────────────────────────────────
const uid = () => crypto.randomUUID();
const fmt$ = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d: string) => {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
const shortDate = (d: string) => {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function useLocalStorage<T>(key: string, seed: () => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : seed(); }
    catch { return seed(); }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [key, val]);
  return [val, setVal];
}

// ─── Seed data ────────────────────────────────────────────────────
const seedEvents = (): Event[] => [
  { id: uid(), name: "The Laurent Gala", date: "2026-06-14", time: "18:00", venue: "The Grand Ballroom, NYC", clientId: "", status: "Confirmed", notes: "Black-tie, 200 guests" },
  { id: uid(), name: "Noir Fashion Show", date: "2026-07-22", time: "20:00", venue: "Pier 17 Rooftop", clientId: "", status: "Planning", notes: "Runway + after-party" },
  { id: uid(), name: "Whitmore Wedding", date: "2026-08-30", time: "16:00", venue: "Château de Lumière", clientId: "", status: "Planning", notes: "Intimate ceremony, 80 guests" },
  { id: uid(), name: "Annual Charity Auction", date: "2026-05-10", time: "19:00", venue: "Metropolitan Club", clientId: "", status: "Wrapped", notes: "Raised $450k" },
];
const seedClients = (): Client[] => [
  { id: uid(), name: "Isabelle Laurent", email: "isabelle@laurent.com", phone: "+1 212-555-0101", eventType: "Gala", status: "Confirmed", notes: [{ text: "Prefers monochrome florals", date: "2026-04-01" }] },
  { id: uid(), name: "Marcus Whitmore", email: "marcus@whitmore.co", phone: "+1 310-555-0202", eventType: "Wedding", status: "Quoted", notes: [] },
  { id: uid(), name: "Ava Chen", email: "ava@chen.design", phone: "+1 415-555-0303", eventType: "Corporate", status: "Inquiry", notes: [] },
];
const seedVendors = (): Vendor[] => [
  { id: uid(), name: "Maison Fleur", category: "Florals", contact: "hello@maisonfleur.com", rating: 5, notes: "Premium installations", eventIds: [] },
  { id: uid(), name: "Noir Catering Co.", category: "Catering", contact: "book@noircatering.com", rating: 4, notes: "French cuisine specialist", eventIds: [] },
  { id: uid(), name: "Lux AV Systems", category: "AV", contact: "info@luxav.com", rating: 4, notes: "Full production capability", eventIds: [] },
  { id: uid(), name: "Capture Studio", category: "Photography", contact: "hi@capturestudio.com", rating: 5, notes: "Editorial style", eventIds: [] },
];
const seedInvoices = (): Invoice[] => [
  { id: uid(), clientId: "", eventId: "", amount: 45000, status: "Sent", dueDate: "2026-05-01", notes: "", lineItems: [{ desc: "Event planning fee", amount: 25000 }, { desc: "Vendor coordination", amount: 20000 }] },
  { id: uid(), clientId: "", eventId: "", amount: 12000, status: "Paid", dueDate: "2026-04-15", notes: "", lineItems: [{ desc: "Consultation package", amount: 12000 }] },
  { id: uid(), clientId: "", eventId: "", amount: 8500, status: "Draft", dueDate: "2026-06-01", notes: "", lineItems: [{ desc: "Day-of coordination", amount: 8500 }] },
];
const seedGuests = (): Guest[] => [
  { id: uid(), name: "Eleanor Voss", eventId: "", email: "eleanor@voss.com", phone: "+1 212-555-1001", rsvp: "Attending", dietary: "Vegetarian", tableGroup: "Table 1" },
  { id: uid(), name: "James Harlow", eventId: "", email: "james@harlow.net", phone: "+1 310-555-1002", rsvp: "Pending", dietary: "", tableGroup: "Table 2" },
  { id: uid(), name: "Sofia Reyes", eventId: "", email: "sofia@reyes.co", phone: "+1 415-555-1003", rsvp: "Attending", dietary: "Gluten-free", tableGroup: "Table 1" },
  { id: uid(), name: "David Kim", eventId: "", email: "david@kim.io", phone: "+1 646-555-1004", rsvp: "Declined", dietary: "", tableGroup: "" },
];

// ─── Activity log ─────────────────────────────────────────────────
interface Activity { id: string; text: string; time: string; }

// ─── Toast ────────────────────────────────────────────────────────
const ToastCtx = React.createContext<(msg: string) => void>(() => {});
function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);
  const show = useCallback((msg: string) => {
    const id = uid();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="bg-foreground text-background px-4 py-2 font-sans text-sm shadow-lg animate-in slide-in-from-right">{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Modal ────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-background border border-foreground w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-foreground px-6 py-4">
          <h2 className="font-display text-xl">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────
function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>Delete?</span>
      <button onClick={onConfirm} className="bg-foreground text-background px-2 py-0.5 text-xs font-sans">Yes</button>
      <button onClick={onCancel} className="border border-foreground px-2 py-0.5 text-xs font-sans">No</button>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const active = ["Confirmed", "Paid", "Attending", "Day-Of"].includes(status);
  const inactive = ["Wrapped", "Completed", "Declined"].includes(status);
  return (
    <span className={`inline-block px-3 py-0.5 text-xs font-sans tracking-wide uppercase ${active ? "bg-foreground text-background" : inactive ? "bg-muted text-muted-foreground" : "border border-muted-foreground text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} className={`${i <= value ? "fill-foreground" : "fill-none"} ${onChange ? "cursor-pointer" : ""}`}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
}

// ─── Form elements ────────────────────────────────────────────────
function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      <input {...props} className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground" />
    </label>
  );
}
function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      <textarea {...props} className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground" rows={3} />
    </label>
  );
}
function Select({ label, options, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      <select {...props} className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground">
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function Btn({ children, variant = "primary", ...props }: { variant?: "primary" | "secondary"; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`px-4 py-2 text-sm font-sans tracking-wide uppercase transition-colors ${variant === "primary" ? "bg-foreground text-background hover:bg-foreground/90" : "bg-background text-foreground border border-foreground hover:bg-muted"} ${props.className || ""}`}>
      {children}
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Icon size={40} strokeWidth={1} className="mb-4" />
      <p className="font-sans text-sm">{text}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
const Revouxaynce = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useLocalStorage("events", seedEvents);
  const [clients, setClients] = useLocalStorage("clients", seedClients);
  const [vendors, setVendors] = useLocalStorage("vendors", seedVendors);
  const [invoices, setInvoices] = useLocalStorage("invoices", seedInvoices);
  const [guests, setGuests] = useLocalStorage("guests", seedGuests);
  const [timelines, setTimelines] = useLocalStorage<TimelineBlock[]>("timelines", () => []);
  const [budgets, setBudgets] = useLocalStorage<BudgetItem[]>("budgets", () => []);
  const [activities, setActivities] = useLocalStorage<Activity[]>("activities", () => []);
  const toast = React.useContext(ToastCtx);

  const log = useCallback((text: string) => {
    setActivities(a => [{ id: uid(), text, time: new Date().toISOString() }, ...a].slice(0, 20));
  }, [setActivities]);

  // Wire seed data: link clients to events, guests, invoices
  useEffect(() => {
    if (events.length > 0 && clients.length > 0 && guests[0]?.eventId === "") {
      const eIds = events.map(e => e.id);
      const cIds = clients.map(c => c.id);
      setEvents(ev => ev.map((e, i) => ({ ...e, clientId: cIds[i % cIds.length] })));
      setGuests(g => g.map((x, i) => ({ ...x, eventId: eIds[i % eIds.length] })));
      setInvoices(inv => inv.map((x, i) => ({ ...x, clientId: cIds[i % cIds.length], eventId: eIds[i % eIds.length] })));
      setVendors(v => v.map(x => ({ ...x, eventIds: [eIds[0]] })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "events", label: "Events", icon: CalendarDays },
    { key: "clients", label: "Clients", icon: Users },
    { key: "vendors", label: "Vendors", icon: Store },
    { key: "finances", label: "Finances", icon: DollarSign },
    { key: "guests", label: "Guests", icon: UserCheck },
  ];

  const handleNav = (t: Tab) => { setTab(t); setSidebarOpen(false); };

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
        <div className="px-6 py-8 border-b border-sidebar-border">
          <h1 className="font-display italic text-2xl tracking-[0.15em] text-sidebar-primary">Revouxaynce</h1>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(n => (
            <button key={n.key} onClick={() => handleNav(n.key)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-colors ${tab === n.key ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}>
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50">© Revouxaynce 2026</div>
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-foreground/30" />
          <aside className="absolute left-0 top-0 h-full w-56 bg-sidebar text-sidebar-foreground" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-8 border-b border-sidebar-border">
              <h1 className="font-display italic text-2xl tracking-[0.15em] text-sidebar-primary">Revouxaynce</h1>
            </div>
            <nav className="py-4">
              {navItems.map(n => (
                <button key={n.key} onClick={() => handleNav(n.key)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-colors ${tab === n.key ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}>
                  <n.icon size={16} /> {n.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between border-b px-4 py-3">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <span className="font-display italic text-lg tracking-widest">Revouxaynce</span>
          <div className="w-5" />
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {tab === "dashboard" && <DashboardView events={events} clients={clients} invoices={invoices} guests={guests} activities={activities} setTab={setTab} />}
          {tab === "events" && <EventsView events={events} setEvents={setEvents} clients={clients} vendors={vendors} guests={guests} setGuests={setGuests} timelines={timelines} setTimelines={setTimelines} budgets={budgets} setBudgets={setBudgets} log={log} toast={toast} />}
          {tab === "clients" && <ClientsView clients={clients} setClients={setClients} events={events} log={log} toast={toast} />}
          {tab === "vendors" && <VendorsView vendors={vendors} setVendors={setVendors} events={events} log={log} toast={toast} />}
          {tab === "finances" && <FinancesView invoices={invoices} setInvoices={setInvoices} clients={clients} events={events} budgets={budgets} log={log} toast={toast} />}
          {tab === "guests" && <GuestsView guests={guests} setGuests={setGuests} events={events} log={log} toast={toast} />}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex z-40">
        {navItems.map(n => (
          <button key={n.key} onClick={() => handleNav(n.key)}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] tracking-wide ${tab === n.key ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            <n.icon size={18} /> {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function DashboardView({ events, clients, invoices, guests, activities, setTab }: any) {
  const upcoming = events.filter((e: Event) => new Date(e.date) >= new Date() && e.status !== "Wrapped").length;
  const activeClients = clients.filter((c: Client) => c.status === "Confirmed").length;
  const unpaid = invoices.filter((i: Invoice) => i.status !== "Paid");
  const unpaidTotal = unpaid.reduce((s: number, i: Invoice) => s + i.amount, 0);
  const now = new Date();
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);

  const cards = [
    { label: "Upcoming Events", value: upcoming },
    { label: "Active Clients", value: activeClients },
    { label: "Unpaid Invoices", value: `${unpaid.length} · ${fmt$(unpaidTotal)}` },
    { label: "Total Guests", value: guests.length },
  ];

  // Mini calendar
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventDates = new Set(events.filter((e: Event) => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; }).map((e: Event) => new Date(e.date).getDate()));

  return (
    <div>
      <h1 className="text-3xl mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="border border-foreground p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-sans">{c.label}</div>
            <div className="text-2xl font-display">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Mini Calendar */}
        <div className="border border-foreground p-5">
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4 font-sans">
            {new Date(year, month).toLocaleString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-sans">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} className="text-muted-foreground py-1">{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate();
              const hasEvent = eventDates.has(day);
              return (
                <div key={day} className={`py-1 relative ${isToday ? "font-bold" : ""}`}>
                  {day}
                  {hasEvent && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-foreground rounded-full" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-foreground p-5">
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4 font-sans">Recent Activity</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 5).map((a: Activity) => (
                <div key={a.id} className="flex items-start gap-2 text-sm font-sans">
                  <Clock size={12} className="mt-1 text-muted-foreground shrink-0" />
                  <span>{a.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Btn onClick={() => setTab("events")}><Plus size={14} className="inline mr-1" /> New Event</Btn>
        <Btn onClick={() => setTab("clients")} variant="secondary"><Plus size={14} className="inline mr-1" /> New Client</Btn>
        <Btn onClick={() => setTab("vendors")} variant="secondary"><Plus size={14} className="inline mr-1" /> New Vendor</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════
function EventsView({ events, setEvents, clients, vendors, guests, setGuests, timelines, setTimelines, budgets, setBudgets, log, toast }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: any = Object.fromEntries(fd.entries());
    if (editing) {
      setEvents((ev: Event[]) => ev.map(x => x.id === editing.id ? { ...x, ...obj } : x));
      toast("Event updated"); log(`Updated event: ${obj.name}`);
    } else {
      const ne = { id: uid(), ...obj };
      setEvents((ev: Event[]) => [...ev, ne]);
      toast("Event created"); log(`Created event: ${obj.name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const ev = events.find((e: Event) => e.id === id);
    setEvents((ev: Event[]) => ev.filter(x => x.id !== id));
    setTimelines((t: TimelineBlock[]) => t.filter(x => x.eventId !== id));
    setBudgets((b: BudgetItem[]) => b.filter(x => x.eventId !== id));
    toast("Event deleted"); log(`Deleted event: ${ev?.name}`);
    setDeleting(null);
  };

  if (detail) {
    const ev = events.find((e: Event) => e.id === detail);
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
          {events.map((ev: Event) => {
            const client = clients.find((c: Client) => c.id === ev.clientId);
            return (
              <div key={ev.id} className="border border-foreground p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setDetail(ev.id)}>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg">{ev.name}</div>
                  <div className="text-sm text-muted-foreground font-sans mt-1">{fmtDate(ev.date)} · {ev.venue}</div>
                  {client && <div className="text-xs text-muted-foreground font-sans mt-1">Client: {client.name}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={ev.status} />
                  {deleting === ev.id ? (
                    <ConfirmDelete onConfirm={() => remove(ev.id)} onCancel={() => setDeleting(null)} />
                  ) : (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button className="p-1.5 hover:bg-muted" onClick={() => { setEditing(ev); setModal(true); }}><Edit size={14} /></button>
                      <button className="p-1.5 hover:bg-muted" onClick={() => setDeleting(ev.id)}><Trash2 size={14} /></button>
                    </div>
                  )}
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Event" : "New Event"}>
        <form onSubmit={save}>
          <Input label="Event Name" name="name" defaultValue={editing?.name} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" name="date" type="date" defaultValue={editing?.date} required />
            <Input label="Time" name="time" type="time" defaultValue={editing?.time} />
          </div>
          <Input label="Venue" name="venue" defaultValue={editing?.venue} />
          <Select label="Client" name="clientId" options={clients.map((c: Client) => c.id)} defaultValue={editing?.clientId}>
            {/* We'll show names via a workaround */}
          </Select>
          <Select label="Status" name="status" options={["Planning", "Confirmed", "Day-Of", "Wrapped"]} defaultValue={editing?.status || "Planning"} />
          <TextArea label="Notes" name="notes" defaultValue={editing?.notes} />
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
function EventDetail({ event, clients, vendors, guests, setGuests, timelines, setTimelines, budgets, setBudgets, onBack, toast }: any) {
  const [subTab, setSubTab] = useState<"overview" | "timeline" | "budget" | "vendors" | "guests">("overview");
  const client = clients.find((c: Client) => c.id === event.clientId);
  const evTimeline = timelines.filter((t: TimelineBlock) => t.eventId === event.id).sort((a: TimelineBlock, b: TimelineBlock) => a.order - b.order);
  const evBudget = budgets.filter((b: BudgetItem) => b.eventId === event.id);
  const evVendors = vendors.filter((v: Vendor) => v.eventIds?.includes(event.id));
  const evGuests = guests.filter((g: Guest) => g.eventId === event.id);

  const tabs = ["overview", "timeline", "budget", "vendors", "guests"] as const;

  return (
    <div>
      <button onClick={onBack} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground">← Back to Events</button>
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl">{event.name}</h1>
        <Badge status={event.status} />
      </div>
      <p className="text-sm text-muted-foreground font-sans mb-6">{fmtDate(event.date)} · {event.time} · {event.venue}</p>

      <div className="flex gap-1 border-b border-foreground mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-sm font-sans capitalize tracking-wide ${subTab === t ? "border-b-2 border-foreground font-semibold" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {subTab === "overview" && (
        <div className="space-y-3 font-sans text-sm">
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
        <div>
          {evVendors.length === 0 ? <Empty icon={Store} text="No vendors assigned to this event." /> : (
            <div className="space-y-2">
              {evVendors.map((v: Vendor) => (
                <div key={v.id} className="border border-foreground p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.category}</div>
                  </div>
                  <StarRating value={v.rating} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {subTab === "guests" && (
        <div>
          {evGuests.length === 0 ? <Empty icon={UserCheck} text="No guests for this event yet." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Name</th><th className="py-2 pr-4">RSVP</th><th className="py-2 pr-4">Dietary</th><th className="py-2">Table</th>
                </tr></thead>
                <tbody>
                  {evGuests.map((g: Guest, i: number) => (
                    <tr key={g.id} className={i % 2 === 1 ? "bg-muted/50" : ""}>
                      <td className="py-2 pr-4">{g.name}</td>
                      <td className="py-2 pr-4"><Badge status={g.rsvp} /></td>
                      <td className="py-2 pr-4">{g.dietary || "—"}</td>
                      <td className="py-2">{g.tableGroup || "—"}</td>
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
function TimelineTab({ eventId, timeline, setTimelines, toast }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TimelineBlock | null>(null);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: any = Object.fromEntries(fd.entries());
    if (editing) {
      setTimelines((t: TimelineBlock[]) => t.map(x => x.id === editing.id ? { ...x, ...obj } : x));
      toast("Block updated");
    } else {
      setTimelines((t: TimelineBlock[]) => [...t, { id: uid(), eventId, ...obj, order: timeline.length }]);
      toast("Block added");
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    setTimelines((t: TimelineBlock[]) => t.filter(x => x.id !== id));
    toast("Block removed");
  };

  const moveBlock = (idx: number, dir: number) => {
    const sorted = [...timeline];
    const [item] = sorted.splice(idx, 1);
    sorted.splice(idx + dir, 0, item);
    const ids = sorted.map((s: TimelineBlock) => s.id);
    setTimelines((t: TimelineBlock[]) => t.map(x => {
      const i = ids.indexOf(x.id);
      return i >= 0 ? { ...x, order: i } : x;
    }));
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> Add Block</Btn>
      </div>
      {timeline.length === 0 ? <Empty icon={Clock} text="No timeline blocks yet." /> : (
        <div className="space-y-2">
          {timeline.map((b: TimelineBlock, i: number) => (
            <div key={b.id} className="border border-foreground p-4 flex items-start gap-3">
              <div className="flex flex-col gap-1">
                {i > 0 && <button onClick={() => moveBlock(i, -1)} className="text-muted-foreground hover:text-foreground"><ArrowUpDown size={12} /></button>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">{b.time}</span>
                  <span className="text-sm">{b.activity}</span>
                </div>
                {b.person && <div className="text-xs text-muted-foreground mt-1">Responsible: {b.person}</div>}
                {b.notes && <div className="text-xs text-muted-foreground mt-1">{b.notes}</div>}
              </div>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-muted" onClick={() => { setEditing(b); setModal(true); }}><Edit size={14} /></button>
                <button className="p-1 hover:bg-muted" onClick={() => remove(b.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Block" : "Add Block"}>
        <form onSubmit={save}>
          <Input label="Time" name="time" defaultValue={editing?.time} required placeholder="e.g. 18:00" />
          <Input label="Activity" name="activity" defaultValue={editing?.activity} required />
          <Input label="Person Responsible" name="person" defaultValue={editing?.person} />
          <TextArea label="Notes" name="notes" defaultValue={editing?.notes} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Budget Tab ───────────────────────────────────────────────────
function BudgetTab({ eventId, budget, setBudgets, toast }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);

  const totalEst = budget.reduce((s: number, b: BudgetItem) => s + Number(b.estimated), 0);
  const totalAct = budget.reduce((s: number, b: BudgetItem) => s + Number(b.actual), 0);
  const variance = totalEst - totalAct;

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: any = Object.fromEntries(fd.entries());
    obj.estimated = parseFloat(obj.estimated) || 0;
    obj.actual = parseFloat(obj.actual) || 0;
    if (editing) {
      setBudgets((b: BudgetItem[]) => b.map(x => x.id === editing.id ? { ...x, ...obj } : x));
      toast("Budget item updated");
    } else {
      setBudgets((b: BudgetItem[]) => [...b, { id: uid(), eventId, ...obj }]);
      toast("Budget item added");
    }
    setModal(false); setEditing(null);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> Add Item</Btn>
      </div>
      {budget.length === 0 ? <Empty icon={DollarSign} text="No budget items yet." /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4">Item</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4 text-right">Estimated</th><th className="py-2 pr-4 text-right">Actual</th><th className="py-2 w-16"></th>
            </tr></thead>
            <tbody>
              {budget.map((b: BudgetItem, i: number) => (
                <tr key={b.id} className={i % 2 === 1 ? "bg-muted/50" : ""}>
                  <td className="py-2 pr-4">{b.item}</td>
                  <td className="py-2 pr-4">{b.category}</td>
                  <td className="py-2 pr-4 text-right">{fmt$(b.estimated)}</td>
                  <td className="py-2 pr-4 text-right">{fmt$(b.actual)}</td>
                  <td className="py-2 flex gap-1">
                    <button className="p-1 hover:bg-muted" onClick={() => { setEditing(b); setModal(true); }}><Edit size={14} /></button>
                    <button className="p-1 hover:bg-muted" onClick={() => { setBudgets((bs: BudgetItem[]) => bs.filter(x => x.id !== b.id)); toast("Removed"); }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-foreground font-semibold">
                <td className="py-2 pr-4" colSpan={2}>Totals</td>
                <td className="py-2 pr-4 text-right">{fmt$(totalEst)}</td>
                <td className="py-2 pr-4 text-right">{fmt$(totalAct)}</td>
                <td></td>
              </tr>
              <tr>
                <td className="py-1 text-xs text-muted-foreground" colSpan={5}>
                  Variance: {fmt$(Math.abs(variance))} {variance >= 0 ? "under" : "over"} budget
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Budget Item" : "Add Budget Item"}>
        <form onSubmit={save}>
          <Input label="Item" name="item" defaultValue={editing?.item} required />
          <Input label="Category" name="category" defaultValue={editing?.category} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Estimated Cost" name="estimated" type="number" step="0.01" defaultValue={editing?.estimated} />
            <Input label="Actual Cost" name="actual" type="number" step="0.01" defaultValue={editing?.actual} />
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

// ═══════════════════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════════════════
function ClientsView({ clients, setClients, events, log, toast }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [detail, setDetail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const pipeline = ["Inquiry", "Quoted", "Confirmed", "Completed"];

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: any = Object.fromEntries(fd.entries());
    if (editing) {
      setClients((c: Client[]) => c.map(x => x.id === editing.id ? { ...x, ...obj, notes: x.notes } : x));
      toast("Client updated"); log(`Updated client: ${obj.name}`);
    } else {
      setClients((c: Client[]) => [...c, { id: uid(), ...obj, notes: [] }]);
      toast("Client created"); log(`Created client: ${obj.name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const cl = clients.find((c: Client) => c.id === id);
    setClients((c: Client[]) => c.filter(x => x.id !== id));
    toast("Client deleted"); log(`Deleted client: ${cl?.name}`);
    setDeleting(null);
  };

  if (detail) {
    const cl = clients.find((c: Client) => c.id === detail);
    if (!cl) { setDetail(null); return null; }
    const linkedEvents = events.filter((e: Event) => e.clientId === cl.id);
    return (
      <div>
        <button onClick={() => setDetail(null)} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground">← Back to Clients</button>
        <h1 className="text-3xl mb-2">{cl.name}</h1>
        <Badge status={cl.status} />
        <div className="mt-6 space-y-2 text-sm font-sans">
          <p><span className="text-muted-foreground">Email:</span> {cl.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {cl.phone}</p>
          <p><span className="text-muted-foreground">Event Type:</span> {cl.eventType}</p>
        </div>
        {linkedEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Linked Events</h3>
            {linkedEvents.map((e: Event) => (
              <div key={e.id} className="border border-foreground p-3 mb-2 text-sm font-sans">{e.name} — {shortDate(e.date)}</div>
            ))}
          </div>
        )}
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Notes</h3>
          {cl.notes.map((n: { text: string; date: string }, i: number) => (
            <div key={i} className="border-l-2 border-foreground pl-3 mb-2 text-sm font-sans">
              <p>{n.text}</p>
              <p className="text-xs text-muted-foreground">{shortDate(n.date)}</p>
            </div>
          ))}
          <form onSubmit={e => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const text = fd.get("note") as string;
            if (!text.trim()) return;
            setClients((cs: Client[]) => cs.map(c => c.id === cl.id ? { ...c, notes: [...c.notes, { text, date: new Date().toISOString().slice(0, 10) }] } : c));
            (e.currentTarget as HTMLFormElement).reset();
            toast("Note added");
          }} className="flex gap-2 mt-3">
            <input name="note" placeholder="Add a note..." className="flex-1 border border-input px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground" />
            <Btn type="submit">Add</Btn>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Clients</h1>
        <div className="flex gap-2">
          <Btn variant={view === "list" ? "primary" : "secondary"} onClick={() => setView("list")}>List</Btn>
          <Btn variant={view === "kanban" ? "primary" : "secondary"} onClick={() => setView("kanban")}>Pipeline</Btn>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New</Btn>
        </div>
      </div>

      {clients.length === 0 ? <Empty icon={Users} text="No clients yet. Add your first client to Revouxaynce." /> : view === "list" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Phone</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Status</th><th className="py-2 w-20"></th>
            </tr></thead>
            <tbody>
              {clients.map((c: Client, i: number) => (
                <tr key={c.id} className={`cursor-pointer hover:bg-muted/50 ${i % 2 === 1 ? "bg-muted/30" : ""}`} onClick={() => setDetail(c.id)}>
                  <td className="py-2 pr-4 font-semibold">{c.name}</td>
                  <td className="py-2 pr-4">{c.email}</td>
                  <td className="py-2 pr-4">{c.phone}</td>
                  <td className="py-2 pr-4">{c.eventType}</td>
                  <td className="py-2 pr-4"><Badge status={c.status} /></td>
                  <td className="py-2" onClick={e => e.stopPropagation()}>
                    {deleting === c.id ? (
                      <ConfirmDelete onConfirm={() => remove(c.id)} onCancel={() => setDeleting(null)} />
                    ) : (
                      <div className="flex gap-1">
                        <button className="p-1 hover:bg-muted" onClick={() => { setEditing(c); setModal(true); }}><Edit size={14} /></button>
                        <button className="p-1 hover:bg-muted" onClick={() => setDeleting(c.id)}><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipeline.map(stage => (
            <div key={stage} className="border border-foreground"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                const id = e.dataTransfer.getData("clientId");
                setClients((cs: Client[]) => cs.map(c => c.id === id ? { ...c, status: stage } : c));
                toast(`Moved to ${stage}`);
              }}>
              <div className="border-b border-foreground px-4 py-2 text-xs uppercase tracking-wider font-sans bg-muted">{stage}</div>
              <div className="p-3 space-y-2 min-h-[100px]">
                {clients.filter((c: Client) => c.status === stage).map((c: Client) => (
                  <div key={c.id} draggable onDragStart={e => e.dataTransfer.setData("clientId", c.id)}
                    onClick={() => setDetail(c.id)}
                    className="border border-foreground p-3 cursor-grab hover:bg-muted/50 active:cursor-grabbing">
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.eventType}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Client" : "New Client"}>
        <form onSubmit={save}>
          <Input label="Name" name="name" defaultValue={editing?.name} required />
          <Input label="Email" name="email" type="email" defaultValue={editing?.email} />
          <Input label="Phone" name="phone" defaultValue={editing?.phone} />
          <Input label="Event Type" name="eventType" defaultValue={editing?.eventType} />
          <Select label="Status" name="status" options={pipeline} defaultValue={editing?.status || "Inquiry"} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VENDORS
// ═══════════════════════════════════════════════════════════════════
function VendorsView({ vendors, setVendors, events, log, toast }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const categories = ["Catering", "Florals", "Photography", "AV", "Decor", "Transport", "Entertainment", "Other"];
  const filtered = filter ? vendors.filter((v: Vendor) => v.category === filter) : vendors;

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: any = Object.fromEntries(fd.entries());
    obj.rating = parseInt(obj.rating) || 3;
    if (editing) {
      setVendors((v: Vendor[]) => v.map(x => x.id === editing.id ? { ...x, ...obj, eventIds: x.eventIds } : x));
      toast("Vendor updated"); log(`Updated vendor: ${obj.name}`);
    } else {
      setVendors((v: Vendor[]) => [...v, { id: uid(), ...obj, eventIds: [] }]);
      toast("Vendor created"); log(`Created vendor: ${obj.name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const v = vendors.find((x: Vendor) => x.id === id);
    setVendors((vs: Vendor[]) => vs.filter(x => x.id !== id));
    toast("Vendor deleted"); log(`Deleted vendor: ${v?.name}`);
    setDeleting(null);
  };

  if (detail) {
    const v = vendors.find((x: Vendor) => x.id === detail);
    if (!v) { setDetail(null); return null; }
    const linkedEvents = events.filter((e: Event) => v.eventIds?.includes(e.id));
    return (
      <div>
        <button onClick={() => setDetail(null)} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground">← Back to Vendors</button>
        <h1 className="text-3xl mb-2">{v.name}</h1>
        <div className="flex items-center gap-3 mb-6">
          <Badge status={v.category} />
          <StarRating value={v.rating} />
        </div>
        <div className="space-y-2 text-sm font-sans">
          <p><span className="text-muted-foreground">Contact:</span> {v.contact}</p>
          {v.notes && <p><span className="text-muted-foreground">Notes:</span> {v.notes}</p>}
        </div>
        {linkedEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Assigned Events</h3>
            {linkedEvents.map((e: Event) => (
              <div key={e.id} className="border border-foreground p-3 mb-2 text-sm font-sans">{e.name} — {shortDate(e.date)}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl">Vendors</h1>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-input px-3 py-2 text-sm font-sans bg-background">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New</Btn>
        </div>
      </div>

      {filtered.length === 0 ? <Empty icon={Store} text="No vendors found." /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((v: Vendor) => (
            <div key={v.id} className="border border-foreground p-5 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setDetail(v.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-lg">{v.name}</div>
                  <div className="text-xs text-muted-foreground font-sans mt-1">{v.category} · {v.contact}</div>
                </div>
                <StarRating value={v.rating} />
              </div>
              {v.notes && <p className="text-sm text-muted-foreground font-sans mt-2">{v.notes}</p>}
              <div className="flex gap-1 mt-3" onClick={e => e.stopPropagation()}>
                {deleting === v.id ? (
                  <ConfirmDelete onConfirm={() => remove(v.id)} onCancel={() => setDeleting(null)} />
                ) : (
                  <>
                    <button className="p-1 hover:bg-muted" onClick={() => { setEditing(v); setModal(true); }}><Edit size={14} /></button>
                    <button className="p-1 hover:bg-muted" onClick={() => setDeleting(v.id)}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Vendor" : "New Vendor"}>
        <form onSubmit={save}>
          <Input label="Name" name="name" defaultValue={editing?.name} required />
          <Select label="Category" name="category" options={categories} defaultValue={editing?.category} />
          <Input label="Contact" name="contact" defaultValue={editing?.contact} />
          <Select label="Rating" name="rating" options={["1","2","3","4","5"]} defaultValue={String(editing?.rating || 3)} />
          <TextArea label="Notes" name="notes" defaultValue={editing?.notes} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FINANCES
// ═══════════════════════════════════════════════════════════════════
function FinancesView({ invoices, setInvoices, clients, events, budgets, log, toast }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalBilled = invoices.reduce((s: number, i: Invoice) => s + i.amount, 0);
  const totalPaid = invoices.filter((i: Invoice) => i.status === "Paid").reduce((s: number, i: Invoice) => s + i.amount, 0);
  const outstanding = totalBilled - totalPaid;
  const overdue = invoices.filter((i: Invoice) => i.status === "Overdue").reduce((s: number, i: Invoice) => s + i.amount, 0);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: any = Object.fromEntries(fd.entries());
    obj.amount = parseFloat(obj.amount) || 0;
    if (editing) {
      setInvoices((inv: Invoice[]) => inv.map(x => x.id === editing.id ? { ...x, ...obj, lineItems: x.lineItems } : x));
      toast("Invoice updated"); log(`Updated invoice for ${fmt$(obj.amount)}`);
    } else {
      setInvoices((inv: Invoice[]) => [...inv, { id: uid(), ...obj, lineItems: [] }]);
      toast("Invoice created"); log(`Created invoice for ${fmt$(obj.amount)}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    setInvoices((inv: Invoice[]) => inv.filter(x => x.id !== id));
    toast("Invoice deleted"); log("Deleted an invoice");
    setDeleting(null);
  };

  if (detail) {
    const inv = invoices.find((i: Invoice) => i.id === detail);
    if (!inv) { setDetail(null); return null; }
    const client = clients.find((c: Client) => c.id === inv.clientId);
    const event = events.find((e: Event) => e.id === inv.eventId);
    return (
      <div>
        <button onClick={() => setDetail(null)} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground">← Back to Finances</button>
        <h1 className="text-3xl mb-2">Invoice</h1>
        <Badge status={inv.status} />
        <div className="mt-6 space-y-2 text-sm font-sans">
          {client && <p><span className="text-muted-foreground">Client:</span> {client.name}</p>}
          {event && <p><span className="text-muted-foreground">Event:</span> {event.name}</p>}
          <p><span className="text-muted-foreground">Amount:</span> {fmt$(inv.amount)}</p>
          <p><span className="text-muted-foreground">Due Date:</span> {fmtDate(inv.dueDate)}</p>
          {inv.notes && <p><span className="text-muted-foreground">Notes:</span> {inv.notes}</p>}
        </div>
        {inv.lineItems.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Line Items</h3>
            <table className="w-full text-sm font-sans">
              <thead><tr className="border-b border-foreground text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 text-left">Description</th><th className="py-2 text-right">Amount</th>
              </tr></thead>
              <tbody>
                {inv.lineItems.map((li: { desc: string; amount: number }, i: number) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-muted/30" : ""}><td className="py-2">{li.desc}</td><td className="py-2 text-right">{fmt$(li.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Finances</h1>
        <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New Invoice</Btn>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Billed", value: fmt$(totalBilled) },
          { label: "Total Paid", value: fmt$(totalPaid) },
          { label: "Outstanding", value: fmt$(outstanding) },
          { label: "Overdue", value: fmt$(overdue) },
        ].map(c => (
          <div key={c.label} className="border border-foreground p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-sans">{c.label}</div>
            <div className="text-xl font-display">{c.value}</div>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? <Empty icon={FileText} text="No invoices yet." /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4">Client</th><th className="py-2 pr-4">Event</th><th className="py-2 pr-4 text-right">Amount</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Due</th><th className="py-2 w-20"></th>
            </tr></thead>
            <tbody>
              {invoices.map((inv: Invoice, i: number) => {
                const client = clients.find((c: Client) => c.id === inv.clientId);
                const event = events.find((e: Event) => e.id === inv.eventId);
                return (
                  <tr key={inv.id} className={`cursor-pointer hover:bg-muted/50 ${i % 2 === 1 ? "bg-muted/30" : ""}`} onClick={() => setDetail(inv.id)}>
                    <td className="py-2 pr-4">{client?.name || "—"}</td>
                    <td className="py-2 pr-4">{event?.name || "—"}</td>
                    <td className="py-2 pr-4 text-right">{fmt$(inv.amount)}</td>
                    <td className="py-2 pr-4"><Badge status={inv.status} /></td>
                    <td className="py-2 pr-4">{shortDate(inv.dueDate)}</td>
                    <td className="py-2" onClick={e => e.stopPropagation()}>
                      {deleting === inv.id ? (
                        <ConfirmDelete onConfirm={() => remove(inv.id)} onCancel={() => setDeleting(null)} />
                      ) : (
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-muted" onClick={() => { setEditing(inv); setModal(true); }}><Edit size={14} /></button>
                          <button className="p-1 hover:bg-muted" onClick={() => setDeleting(inv.id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Invoice" : "New Invoice"}>
        <form onSubmit={save}>
          <Select label="Client" name="clientId" options={clients.map((c: Client) => c.id)} defaultValue={editing?.clientId} />
          <Select label="Event" name="eventId" options={events.map((e: Event) => e.id)} defaultValue={editing?.eventId} />
          <Input label="Amount" name="amount" type="number" step="0.01" defaultValue={editing?.amount} required />
          <Select label="Status" name="status" options={["Draft", "Sent", "Paid", "Overdue"]} defaultValue={editing?.status || "Draft"} />
          <Input label="Due Date" name="dueDate" type="date" defaultValue={editing?.dueDate} />
          <TextArea label="Notes" name="notes" defaultValue={editing?.notes} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GUESTS
// ═══════════════════════════════════════════════════════════════════
function GuestsView({ guests, setGuests, events, log, toast }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [eventFilter, setEventFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = eventFilter ? guests.filter((g: Guest) => g.eventId === eventFilter) : guests;
  const attending = filtered.filter((g: Guest) => g.rsvp === "Attending").length;
  const declined = filtered.filter((g: Guest) => g.rsvp === "Declined").length;
  const pending = filtered.filter((g: Guest) => g.rsvp === "Pending").length;

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: any = Object.fromEntries(fd.entries());
    if (editing) {
      setGuests((g: Guest[]) => g.map(x => x.id === editing.id ? { ...x, ...obj } : x));
      toast("Guest updated"); log(`Updated guest: ${obj.name}`);
    } else {
      setGuests((g: Guest[]) => [...g, { id: uid(), ...obj }]);
      toast("Guest added"); log(`Added guest: ${obj.name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const g = guests.find((x: Guest) => x.id === id);
    setGuests((gs: Guest[]) => gs.filter(x => x.id !== id));
    toast("Guest removed"); log(`Removed guest: ${g?.name}`);
    setDeleting(null);
  };

  const exportCSV = () => {
    const headers = ["Name", "Event", "Email", "Phone", "RSVP", "Dietary", "Table/Group"];
    const rows = filtered.map((g: Guest) => {
      const ev = events.find((e: Event) => e.id === g.eventId);
      return [g.name, ev?.name || "", g.email, g.phone, g.rsvp, g.dietary, g.tableGroup];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "revouxaynce-guests.csv"; a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl">Guests</h1>
        <div className="flex gap-2 flex-wrap">
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="border border-input px-3 py-2 text-sm font-sans bg-background">
            <option value="">All Events</option>
            {events.map((ev: Event) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <Btn variant="secondary" onClick={exportCSV}><Download size={14} className="inline mr-1" /> CSV</Btn>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New</Btn>
        </div>
      </div>

      {/* RSVP Bar */}
      <div className="flex gap-6 mb-6 text-sm font-sans">
        <span><span className="font-semibold">{attending}</span> Attending</span>
        <span><span className="font-semibold">{declined}</span> Declined</span>
        <span><span className="font-semibold">{pending}</span> Pending</span>
      </div>

      {filtered.length === 0 ? <Empty icon={UserCheck} text="No guests yet. Add your first guest to Revouxaynce." /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Event</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">RSVP</th><th className="py-2 pr-4">Dietary</th><th className="py-2 pr-4">Table</th><th className="py-2 w-20"></th>
            </tr></thead>
            <tbody>
              {filtered.map((g: Guest, i: number) => {
                const ev = events.find((e: Event) => e.id === g.eventId);
                return (
                  <tr key={g.id} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                    <td className="py-2 pr-4 font-semibold">{g.name}</td>
                    <td className="py-2 pr-4">{ev?.name || "—"}</td>
                    <td className="py-2 pr-4">{g.email}</td>
                    <td className="py-2 pr-4"><Badge status={g.rsvp} /></td>
                    <td className="py-2 pr-4">{g.dietary || "—"}</td>
                    <td className="py-2 pr-4">{g.tableGroup || "—"}</td>
                    <td className="py-2">
                      {deleting === g.id ? (
                        <ConfirmDelete onConfirm={() => remove(g.id)} onCancel={() => setDeleting(null)} />
                      ) : (
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-muted" onClick={() => { setEditing(g); setModal(true); }}><Edit size={14} /></button>
                          <button className="p-1 hover:bg-muted" onClick={() => setDeleting(g.id)}><Trash2 size={14} /></button>
                        </div>
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
          <Input label="Name" name="name" defaultValue={editing?.name} required />
          <Select label="Event" name="eventId" options={events.map((e: Event) => e.id)} defaultValue={editing?.eventId} />
          <Input label="Email" name="email" type="email" defaultValue={editing?.email} />
          <Input label="Phone" name="phone" defaultValue={editing?.phone} />
          <Select label="RSVP Status" name="rsvp" options={["Attending", "Declined", "Pending"]} defaultValue={editing?.rsvp || "Pending"} />
          <Input label="Dietary Notes" name="dietary" defaultValue={editing?.dietary} />
          <Input label="Table / Group" name="tableGroup" defaultValue={editing?.tableGroup} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT WRAPPER
// ═══════════════════════════════════════════════════════════════════
const Index = () => (
  <ToastProvider>
    <Revouxaynce />
  </ToastProvider>
);

export default Index;
