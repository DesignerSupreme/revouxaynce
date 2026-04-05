import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard, CalendarDays, Users, Store, DollarSign, UserCheck,
  Plus, Trash2, Edit, X, ChevronRight, Star, Download, Clock,
  FileText, AlertCircle, Menu, ArrowUpDown, Receipt, Camera, Upload,
  Lock, LogOut, Shield, Eye, EyeOff, BarChart3, TrendingUp, RotateCcw
} from "lucide-react";
import logo from "@/assets/revouxaynce-logo.svg";

// ─── Types ────────────────────────────────────────────────────────
interface Event { id: string; name: string; date: string; time: string; venue: string; clientId: string; status: string; notes: string; }
interface TimelineBlock { id: string; eventId: string; time: string; activity: string; person: string; notes: string; order: number; }
interface BudgetItem { id: string; eventId: string; item: string; category: string; estimated: number; actual: number; }
interface Client { id: string; name: string; email: string; phone: string; eventType: string; status: string; notes: { text: string; date: string }[]; }
interface Vendor { id: string; name: string; category: string; contact: string; rating: number; notes: string; eventIds: string[]; }
interface Invoice { id: string; clientId: string; eventId: string; amount: number; status: string; dueDate: string; notes: string; lineItems: { desc: string; amount: number }[]; }
interface Guest { id: string; name: string; eventId: string; email: string; phone: string; rsvp: string; dietary: string; tableGroup: string; }
interface Expense { id: string; date: string; vendor: string; category: string; amount: number; eventId: string; notes: string; receiptUrl: string; }
interface TeamMember { id: string; name: string; email: string; password: string; role: "admin" | "member"; access: string[]; }
type Tab = "dashboard" | "events" | "clients" | "vendors" | "finances" | "guests" | "expenses" | "team";

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
  { id: uid(), name: "The Moyo Gala", date: "2026-06-14", time: "18:00", venue: "Rainbow Towers, Harare", clientId: "", status: "Confirmed", notes: "Black-tie, 200 guests" },
  { id: uid(), name: "Noir Fashion Show", date: "2026-07-22", time: "20:00", venue: "Meikles Hotel Rooftop", clientId: "", status: "Planning", notes: "Runway + after-party" },
  { id: uid(), name: "Chigumba Wedding", date: "2026-08-30", time: "16:00", venue: "Bvumba Botanical Gardens", clientId: "", status: "Planning", notes: "Intimate ceremony, 80 guests" },
  { id: uid(), name: "Annual Charity Auction", date: "2026-05-10", time: "19:00", venue: "Borrowdale Brooke, Harare", clientId: "", status: "Wrapped", notes: "Raised $450k" },
];
const seedClients = (): Client[] => [
  { id: uid(), name: "Tariro Moyo", email: "tariro@moyo.co.zw", phone: "+263 77 200 1001", eventType: "Gala", status: "Confirmed", notes: [{ text: "Prefers monochrome florals", date: "2026-04-01" }] },
  { id: uid(), name: "James Whitmore", email: "james@whitmore.co.uk", phone: "+44 7700 900202", eventType: "Wedding", status: "Quoted", notes: [] },
  { id: uid(), name: "Rutendo Chigumba", email: "rutendo@chigumba.co.zw", phone: "+263 71 300 0303", eventType: "Corporate", status: "Inquiry", notes: [] },
];
const seedVendors = (): Vendor[] => [
  { id: uid(), name: "Ruva Florals", category: "Florals", contact: "hello@ruvaflorals.co.zw", rating: 5, notes: "Premium installations", eventIds: [] },
  { id: uid(), name: "Kudza Catering", category: "Catering", contact: "book@kudzacatering.co.zw", rating: 4, notes: "Pan-African cuisine specialist", eventIds: [] },
  { id: uid(), name: "Lux AV Systems", category: "AV", contact: "info@luxav.com", rating: 4, notes: "Full production capability", eventIds: [] },
  { id: uid(), name: "Capture Studio", category: "Photography", contact: "hi@capturestudio.co.zw", rating: 5, notes: "Editorial style", eventIds: [] },
];
const seedInvoices = (): Invoice[] => [
  { id: uid(), clientId: "", eventId: "", amount: 45000, status: "Sent", dueDate: "2026-05-01", notes: "", lineItems: [{ desc: "Event planning fee", amount: 25000 }, { desc: "Vendor coordination", amount: 20000 }] },
  { id: uid(), clientId: "", eventId: "", amount: 12000, status: "Paid", dueDate: "2026-04-15", notes: "", lineItems: [{ desc: "Consultation package", amount: 12000 }] },
  { id: uid(), clientId: "", eventId: "", amount: 8500, status: "Draft", dueDate: "2026-06-01", notes: "", lineItems: [{ desc: "Day-of coordination", amount: 8500 }] },
  { id: uid(), clientId: "", eventId: "", amount: 3200, status: "Overdue", dueDate: "2026-03-15", notes: "Follow up needed", lineItems: [{ desc: "Venue scouting", amount: 3200 }] },
];
const seedGuests = (): Guest[] => [
  { id: uid(), name: "Tatenda Mapfumo", eventId: "", email: "tatenda@mapfumo.co.zw", phone: "+263 77 400 1001", rsvp: "Attending", dietary: "Vegetarian", tableGroup: "Table 1" },
  { id: uid(), name: "Emily Harlow", eventId: "", email: "emily@harlow.co.uk", phone: "+44 7700 901002", rsvp: "Pending", dietary: "", tableGroup: "Table 2" },
  { id: uid(), name: "Ruvimbo Nyathi", eventId: "", email: "ruvimbo@nyathi.co.zw", phone: "+263 71 500 1003", rsvp: "Attending", dietary: "Gluten-free", tableGroup: "Table 1" },
  { id: uid(), name: "David Thompson", eventId: "", email: "david@thompson.co.uk", phone: "+44 7911 123456", rsvp: "Declined", dietary: "", tableGroup: "" },
];
const seedExpenses = (): Expense[] => [
  { id: uid(), date: "2026-04-02", vendor: "Ruva Florals", category: "Florals", amount: 3200, eventId: "", notes: "Centerpiece arrangements", receiptUrl: "" },
  { id: uid(), date: "2026-04-03", vendor: "Kudza Catering", category: "Catering", amount: 8500, eventId: "", notes: "Tasting session deposit", receiptUrl: "" },
  { id: uid(), date: "2026-03-28", vendor: "Harare Office Supplies", category: "Supplies", amount: 145.50, eventId: "", notes: "Printing & stationery", receiptUrl: "" },
];
const seedTeam = (): TeamMember[] => [
  { id: uid(), name: "Chido Nyakanda", email: "nyakandachido@gmail.com", password: "m@n@n@5", role: "admin", access: ["dashboard","events","clients","vendors","finances","expenses","guests","team"] },
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
function SelectLabeled({ label, options, ...props }: { label: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      <select {...props} className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground">
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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

// ─── SVG Bar Chart ────────────────────────────────────────────────
function BarChart({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground font-sans">No data</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(40, Math.floor(300 / data.length));
  const chartW = data.length * (barW + 12) + 20;
  const chartH = height;
  const barArea = chartH - 40;

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: height }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={0} x2={chartW} y1={barArea - barArea * p} y2={barArea - barArea * p}
          stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} />
      ))}
      {data.map((d, i) => {
        const barH = (d.value / max) * barArea;
        const x = i * (barW + 12) + 10;
        const y = barArea - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill="currentColor" opacity={0.85} />
            <text x={x + barW / 2} y={barArea + 14} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.5}
              className="font-sans">{d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={7} fill="currentColor" opacity={0.6}
              className="font-sans">{d.value >= 1000 ? `$${(d.value / 1000).toFixed(1)}k` : `$${d.value}`}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────
function HBarChart({ data }: { data: { label: string; value: number; fill?: string }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs font-sans mb-1">
            <span>{d.label}</span>
            <span className="font-semibold">{fmt$(d.value)}</span>
          </div>
          <div className="w-full bg-muted h-3">
            <div className="h-3 bg-foreground transition-all" style={{ width: `${(d.value / max) * 100}%`, opacity: d.fill === "light" ? 0.3 : 0.85 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════
function LoginPage({ onLogin, team }: { onLogin: (member: TeamMember) => void; team: TeamMember[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const member = team.find(m => m.email.toLowerCase() === email.toLowerCase() && m.password === password);
    if (member) {
      onLogin(member);
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <img src={logo} alt="Revouxaynce" className="h-16 w-auto" />
        </div>
        <div className="border border-foreground p-8">
          <h1 className="font-display text-2xl text-center mb-1">Welcome Back</h1>
          <p className="text-xs text-muted-foreground font-sans text-center mb-8 uppercase tracking-wider">Sign in to continue</p>
          <form onSubmit={handleSubmit}>
            <label className="block mb-4">
              <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-input bg-background px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-foreground"
                placeholder="you@example.com" required />
            </label>
            <label className="block mb-6">
              <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">Password</span>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-input bg-background px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-foreground pr-10"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {error && <p className="text-sm font-sans mb-4 text-foreground bg-muted px-3 py-2 border border-foreground">{error}</p>}
            <button type="submit" className="w-full bg-foreground text-background py-2.5 text-sm font-sans uppercase tracking-wider hover:bg-foreground/90 transition-colors">
              Sign In
            </button>
          </form>
        </div>
        <p className="text-xs text-muted-foreground font-sans text-center mt-6">© Revouxaynce 2026</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
const Revouxaynce = () => {
  const [team, setTeam] = useLocalStorage<TeamMember[]>("team_v2", seedTeam);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
    try { const s = localStorage.getItem("currentUser"); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  const handleLogin = (member: TeamMember) => {
    setCurrentUser(member);
    localStorage.setItem("currentUser", JSON.stringify(member));
  };
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  // Keep currentUser in sync with team updates
  useEffect(() => {
    if (currentUser) {
      const updated = team.find(m => m.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
        localStorage.setItem("currentUser", JSON.stringify(updated));
      }
    }
  }, [team, currentUser]);

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} team={team} />;
  }

  return <AppShell currentUser={currentUser} onLogout={handleLogout} team={team} setTeam={setTeam} />;
};

function AppShell({ currentUser, onLogout, team, setTeam }: { currentUser: TeamMember; onLogout: () => void; team: TeamMember[]; setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>> }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useLocalStorage("events_v2", seedEvents);
  const [clients, setClients] = useLocalStorage("clients_v2", seedClients);
  const [vendors, setVendors] = useLocalStorage("vendors_v2", seedVendors);
  const [invoices, setInvoices] = useLocalStorage("invoices_v2", seedInvoices);
  const [guests, setGuests] = useLocalStorage("guests_v2", seedGuests);
  const [expenses, setExpenses] = useLocalStorage("expenses_v2", seedExpenses);
  const [timelines, setTimelines] = useLocalStorage<TimelineBlock[]>("timelines_v2", () => []);
  const [budgets, setBudgets] = useLocalStorage<BudgetItem[]>("budgets_v2", () => []);
  const [activities, setActivities] = useLocalStorage<Activity[]>("activities_v2", () => []);
  const toast = React.useContext(ToastCtx);

  const resetAllData = useCallback(() => {
    setEvents(seedEvents());
    setClients(seedClients());
    setVendors(seedVendors());
    setInvoices(seedInvoices());
    setGuests(seedGuests());
    setExpenses(seedExpenses());
    setTimelines([]);
    setBudgets([]);
    setActivities([]);
    toast("Sample data has been reset");
  }, [setEvents, setClients, setVendors, setInvoices, setGuests, setExpenses, setTimelines, setBudgets, setActivities, toast]);

  const log = useCallback((text: string) => {
    setActivities(a => [{ id: uid(), text, time: new Date().toISOString() }, ...a].slice(0, 20));
  }, [setActivities]);

  // Wire seed data
  useEffect(() => {
    if (events.length > 0 && clients.length > 0 && guests[0]?.eventId === "") {
      const eIds = events.map(e => e.id);
      const cIds = clients.map(c => c.id);
      setEvents(ev => ev.map((e, i) => ({ ...e, clientId: cIds[i % cIds.length] })));
      setGuests(g => g.map((x, i) => ({ ...x, eventId: eIds[i % eIds.length] })));
      setInvoices(inv => inv.map((x, i) => ({ ...x, clientId: cIds[i % cIds.length], eventId: eIds[i % eIds.length] })));
      setVendors(v => v.map(x => ({ ...x, eventIds: [eIds[0]] })));
      setExpenses(ex => ex.map((x, i) => ({ ...x, eventId: eIds[i % eIds.length] })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allNavItems: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "events", label: "Events", icon: CalendarDays },
    { key: "clients", label: "Clients", icon: Users },
    { key: "vendors", label: "Vendors", icon: Store },
    { key: "finances", label: "Finances", icon: DollarSign },
    { key: "expenses", label: "Expenses", icon: Receipt },
    { key: "guests", label: "Guests", icon: UserCheck },
    ...(currentUser.role === "admin" ? [{ key: "team" as Tab, label: "Team", icon: Shield }] : []),
  ];

  const navItems = allNavItems.filter(n => currentUser.access.includes(n.key) || n.key === "team");

  const handleNav = (t: Tab) => {
    if (!currentUser.access.includes(t) && t !== "team") {
      toast("You don't have access to this section");
      return;
    }
    setTab(t); setSidebarOpen(false);
  };

  // If current tab not accessible, go to first available
  useEffect(() => {
    if (!currentUser.access.includes(tab) && tab !== "team") {
      const first = navItems[0]?.key || "dashboard";
      setTab(first);
    }
  }, [currentUser, tab, navItems]);

  const SidebarLogo = () => (
    <div className="px-4 py-6 border-b border-sidebar-border flex justify-center">
      <img src={logo} alt="Revouxaynce" className="h-14 w-auto invert brightness-200" />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
        <SidebarLogo />
        <nav className="flex-1 py-4">
          {navItems.map(n => (
            <button key={n.key} onClick={() => handleNav(n.key)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-colors ${tab === n.key ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}>
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-sidebar-accent rounded-full flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{currentUser.name}</div>
              <div className="text-[10px] text-sidebar-foreground/50 uppercase">{currentUser.role}</div>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-foreground/30" />
          <aside className="absolute left-0 top-0 h-full w-56 bg-sidebar text-sidebar-foreground" onClick={e => e.stopPropagation()}>
            <SidebarLogo />
            <nav className="py-4">
              {navItems.map(n => (
                <button key={n.key} onClick={() => handleNav(n.key)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-colors ${tab === n.key ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}>
                  <n.icon size={16} /> {n.label}
                </button>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-sidebar-border">
              <button onClick={onLogout} className="flex items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground">
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between border-b px-4 py-3">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <img src={logo} alt="Revouxaynce" className="h-8 w-auto" />
          <button onClick={onLogout}><LogOut size={18} /></button>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {tab === "dashboard" && <DashboardView events={events} clients={clients} invoices={invoices} guests={guests} expenses={expenses} activities={activities} setTab={setTab} />}
          {tab === "events" && <EventsView events={events} setEvents={setEvents} clients={clients} vendors={vendors} guests={guests} setGuests={setGuests} timelines={timelines} setTimelines={setTimelines} budgets={budgets} setBudgets={setBudgets} log={log} toast={toast} />}
          {tab === "clients" && <ClientsView clients={clients} setClients={setClients} events={events} log={log} toast={toast} />}
          {tab === "vendors" && <VendorsView vendors={vendors} setVendors={setVendors} events={events} log={log} toast={toast} />}
          {tab === "finances" && <FinancesView invoices={invoices} setInvoices={setInvoices} clients={clients} events={events} expenses={expenses} budgets={budgets} log={log} toast={toast} />}
          {tab === "expenses" && <ExpensesView expenses={expenses} setExpenses={setExpenses} events={events} log={log} toast={toast} />}
          {tab === "guests" && <GuestsView guests={guests} setGuests={setGuests} events={events} log={log} toast={toast} />}
          {tab === "team" && currentUser.role === "admin" && <TeamView team={team} setTeam={setTeam} currentUser={currentUser} toast={toast} log={log} />}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex z-40">
        {navItems.slice(0, 6).map(n => (
          <button key={n.key} onClick={() => handleNav(n.key)}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] tracking-wide ${tab === n.key ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            <n.icon size={18} /> {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD — WITH GRAPHS
// ═══════════════════════════════════════════════════════════════════
function DashboardView({ events, clients, invoices, guests, expenses, activities, setTab }: any) {
  const upcoming = events.filter((e: Event) => new Date(e.date) >= new Date() && e.status !== "Wrapped").length;
  const activeClients = clients.filter((c: Client) => c.status === "Confirmed").length;
  const unpaid = invoices.filter((i: Invoice) => i.status !== "Paid");
  const unpaidTotal = unpaid.reduce((s: number, i: Invoice) => s + i.amount, 0);
  const overdue = invoices.filter((i: Invoice) => i.status === "Overdue");
  const overdueTotal = overdue.reduce((s: number, i: Invoice) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s: number, e: Expense) => s + e.amount, 0);
  const totalRevenue = invoices.filter((i: Invoice) => i.status === "Paid").reduce((s: number, i: Invoice) => s + i.amount, 0);
  const now = new Date();

  // Mini calendar
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventDates = new Set(events.filter((e: Event) => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; }).map((e: Event) => new Date(e.date).getDate()));

  // Expense by category chart data
  const expByCat: Record<string, number> = {};
  expenses.forEach((e: Expense) => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount; });
  const expChartData = Object.entries(expByCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  // Invoice status chart data
  const invByStatus: Record<string, number> = {};
  invoices.forEach((i: Invoice) => { invByStatus[i.status] = (invByStatus[i.status] || 0) + i.amount; });
  const invChartData = Object.entries(invByStatus).map(([label, value]) => ({ label, value }));

  return (
    <div>
      <h1 className="text-3xl mb-8">Dashboard</h1>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="border border-foreground p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-sans">Upcoming Events</div>
          <div className="text-3xl font-display">{upcoming}</div>
          <div className="text-xs text-muted-foreground mt-1 font-sans">{events.filter((e: Event) => e.status === "Confirmed").length} confirmed</div>
        </div>
        <div className="border border-foreground p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-sans">Active Clients</div>
          <div className="text-3xl font-display">{activeClients}</div>
          <div className="text-xs text-muted-foreground mt-1 font-sans">{clients.length} total</div>
        </div>
        <div className="border border-foreground p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-sans">Revenue</div>
          <div className="text-3xl font-display">{fmt$(totalRevenue)}</div>
          <div className="text-xs text-muted-foreground mt-1 font-sans">collected</div>
        </div>
        <div className="border border-foreground p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-sans">Total Expenses</div>
          <div className="text-3xl font-display">{fmt$(totalExpenses)}</div>
          <div className="text-xs text-muted-foreground mt-1 font-sans">{expenses.length} recorded</div>
        </div>
        <div className="border border-foreground p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-sans">Net Profit</div>
          <div className="text-3xl font-display">{fmt$(totalRevenue - totalExpenses)}</div>
          <div className="text-xs text-muted-foreground mt-1 font-sans">{totalRevenue > 0 ? `${((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(0)}% margin` : "—"}</div>
        </div>
      </div>

      {/* Unpaid Invoices — Detailed Section */}
      <div className="border border-foreground mb-8">
        <div className="border-b border-foreground px-5 py-3 flex items-center justify-between bg-muted">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="text-sm font-sans font-semibold uppercase tracking-wider">Unpaid Invoices</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-sans">
            <span>{unpaid.length} invoice{unpaid.length !== 1 ? "s" : ""} · {fmt$(unpaidTotal)}</span>
            {overdue.length > 0 && (
              <span className="bg-foreground text-background px-2 py-0.5 text-xs uppercase tracking-wide">{overdue.length} Overdue · {fmt$(overdueTotal)}</span>
            )}
          </div>
        </div>
        {unpaid.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground font-sans">All invoices are paid — you're all caught up.</div>
        ) : (
          <div className="divide-y divide-input">
            {unpaid.map((inv: Invoice) => {
              const client = clients.find((c: Client) => c.id === inv.clientId);
              const event = events.find((e: Event) => e.id === inv.eventId);
              const isOverdue = inv.status === "Overdue";
              const daysUntilDue = Math.ceil((new Date(inv.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={inv.id} className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isOverdue ? "bg-muted/60" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm font-sans">{client?.name || "Unknown"}</span>
                      <Badge status={inv.status} />
                    </div>
                    <div className="text-xs text-muted-foreground font-sans mt-1">
                      {event?.name || "—"} · Due {shortDate(inv.dueDate)}
                      {daysUntilDue < 0 && <span className="ml-2 font-semibold">{Math.abs(daysUntilDue)} days overdue</span>}
                      {daysUntilDue >= 0 && daysUntilDue <= 7 && <span className="ml-2">Due in {daysUntilDue} day{daysUntilDue !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-display">{fmt$(inv.amount)}</div>
                    {inv.lineItems.length > 0 && (
                      <div className="text-xs text-muted-foreground font-sans">{inv.lineItems.length} line item{inv.lineItems.length !== 1 ? "s" : ""}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {unpaid.length > 0 && (
          <div className="border-t border-foreground px-5 py-3 flex justify-between items-center">
            <button onClick={() => setTab("finances")} className="text-xs font-sans uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">View all invoices →</button>
            <div className="font-display text-lg">{fmt$(unpaidTotal)}</div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="border border-foreground p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-muted-foreground" />
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-sans">Expenses by Category</h3>
          </div>
          <BarChart data={expChartData} />
        </div>
        <div className="border border-foreground p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-muted-foreground" />
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-sans">Invoices by Status</h3>
          </div>
          <HBarChart data={invChartData} />
        </div>
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

      {/* Recent Expenses */}
      {expenses.length > 0 && (
        <div className="border border-foreground mb-8">
          <div className="border-b border-foreground px-5 py-3 bg-muted flex items-center justify-between">
            <span className="text-sm font-sans font-semibold uppercase tracking-wider">Recent Expenses</span>
            <button onClick={() => setTab("expenses")} className="text-xs font-sans text-muted-foreground hover:text-foreground">View all →</button>
          </div>
          <div className="divide-y divide-input">
            {expenses.slice(0, 3).map((ex: Expense) => (
              <div key={ex.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold font-sans">{ex.vendor}</div>
                  <div className="text-xs text-muted-foreground font-sans">{ex.category} · {shortDate(ex.date)}</div>
                </div>
                <div className="font-display text-lg">{fmt$(ex.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Btn onClick={() => setTab("events")}><Plus size={14} className="inline mr-1" /> New Event</Btn>
        <Btn onClick={() => setTab("expenses")} variant="secondary"><Plus size={14} className="inline mr-1" /> Log Expense</Btn>
        <Btn onClick={() => setTab("clients")} variant="secondary"><Plus size={14} className="inline mr-1" /> New Client</Btn>
        <Btn onClick={() => setTab("vendors")} variant="secondary"><Plus size={14} className="inline mr-1" /> New Vendor</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXPENSES — WITH CHARTS
// ═══════════════════════════════════════════════════════════════════
function ExpensesView({ expenses, setExpenses, events, log, toast }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [scanModal, setScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<Partial<Expense> | null>(null);
  const [scanning, setScanning] = useState(false);
  const [eventFilter, setEventFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Catering", "Florals", "Photography", "AV", "Decor", "Transport", "Entertainment", "Venue", "Supplies", "Travel", "Other"];
  const filtered = expenses.filter((e: Expense) => {
    if (eventFilter && e.eventId !== eventFilter) return false;
    if (catFilter && e.category !== catFilter) return false;
    return true;
  });
  const totalFiltered = filtered.reduce((s: number, e: Expense) => s + e.amount, 0);

  // Chart data - expenses by category
  const byCat: Record<string, number> = {};
  filtered.forEach((e: Expense) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const catChartData = Object.entries(byCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  // Chart data - expenses by event
  const byEvent: Record<string, number> = {};
  filtered.forEach((e: Expense) => {
    const ev = events.find((x: Event) => x.id === e.eventId);
    const name = ev?.name || "Unassigned";
    byEvent[name] = (byEvent[name] || 0) + e.amount;
  });
  const eventChartData = Object.entries(byEvent).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: any = Object.fromEntries(fd.entries());
    obj.amount = parseFloat(obj.amount) || 0;
    if (editing) {
      setExpenses((ex: Expense[]) => ex.map(x => x.id === editing.id ? { ...x, ...obj } : x));
      toast("Expense updated"); log(`Updated expense: ${obj.vendor} ${fmt$(obj.amount)}`);
    } else {
      setExpenses((ex: Expense[]) => [...ex, { id: uid(), ...obj, receiptUrl: obj.receiptUrl || "" }]);
      toast("Expense added"); log(`Added expense: ${obj.vendor} ${fmt$(obj.amount)}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const ex = expenses.find((x: Expense) => x.id === id);
    setExpenses((exs: Expense[]) => exs.filter(x => x.id !== id));
    toast("Expense deleted"); log(`Deleted expense: ${ex?.vendor}`);
    setDeleting(null);
  };

  const handleReceiptUpload = async (file: File) => {
    setScanning(true);
    setScanResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const receiptUrl = reader.result as string;
      const fileName = file.name.toLowerCase();
      let vendor = "";
      let amount = 0;
      let category = "Other";
      const today = new Date().toISOString().slice(0, 10);
      if (fileName.includes("receipt") || fileName.includes("invoice")) {
        const amountMatch = fileName.match(/(\d+[.,]\d{2})/);
        if (amountMatch) amount = parseFloat(amountMatch[1].replace(",", "."));
      }
      const img = new Image();
      img.onload = () => {
        setScanResult({ date: today, vendor: vendor || "Scanned Receipt", category, amount, notes: `Scanned from ${file.name}`, receiptUrl });
        setScanning(false);
      };
      img.onerror = () => {
        setScanResult({ date: today, vendor: "Scanned Receipt", category: "Other", amount: 0, notes: `From ${file.name}`, receiptUrl });
        setScanning(false);
      };
      img.src = receiptUrl;
    };
    reader.readAsDataURL(file);
  };

  const saveScanResult = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: any = Object.fromEntries(fd.entries());
    obj.amount = parseFloat(obj.amount) || 0;
    setExpenses((ex: Expense[]) => [...ex, { id: uid(), ...obj }]);
    toast("Expense from receipt added"); log(`Scanned receipt: ${obj.vendor} ${fmt$(obj.amount)}`);
    setScanModal(false); setScanResult(null);
  };

  const exportCSV = () => {
    const headers = ["Date", "Vendor", "Category", "Amount", "Event", "Notes"];
    const rows = filtered.map((ex: Expense) => {
      const ev = events.find((e: Event) => e.id === ex.eventId);
      return [ex.date, ex.vendor, ex.category, ex.amount.toFixed(2), ev?.name || "", ex.notes];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "revouxaynce-expenses.csv"; a.click();
    URL.revokeObjectURL(url);
    toast("Expenses exported");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl">Expenses</h1>
        <div className="flex gap-2 flex-wrap">
          <Btn variant="secondary" onClick={() => setScanModal(true)}><Camera size={14} className="inline mr-1" /> Scan Receipt</Btn>
          <Btn variant="secondary" onClick={exportCSV}><Download size={14} className="inline mr-1" /> CSV</Btn>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> Manual Entry</Btn>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="border border-input px-3 py-2 text-sm font-sans bg-background">
          <option value="">All Events</option>
          {events.map((ev: Event) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-input px-3 py-2 text-sm font-sans bg-background">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="border border-foreground p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-sans">Total</div>
          <div className="text-2xl font-display">{fmt$(totalFiltered)}</div>
        </div>
        <div className="border border-foreground p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-sans">Count</div>
          <div className="text-2xl font-display">{filtered.length}</div>
        </div>
        <div className="border border-foreground p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-sans">Avg / Expense</div>
          <div className="text-2xl font-display">{filtered.length > 0 ? fmt$(totalFiltered / filtered.length) : "$0.00"}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="border border-foreground p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-muted-foreground" />
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">By Category</h3>
          </div>
          <BarChart data={catChartData} height={180} />
        </div>
        <div className="border border-foreground p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-muted-foreground" />
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">By Event</h3>
          </div>
          <HBarChart data={eventChartData} />
        </div>
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? <Empty icon={Receipt} text="No expenses found. Log your first expense or scan a receipt." /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Vendor</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4">Event</th><th className="py-2 pr-4 text-right">Amount</th><th className="py-2 pr-4">Receipt</th><th className="py-2 w-20"></th>
            </tr></thead>
            <tbody>
              {filtered.map((ex: Expense, i: number) => {
                const ev = events.find((e: Event) => e.id === ex.eventId);
                return (
                  <tr key={ex.id} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                    <td className="py-2 pr-4">{shortDate(ex.date)}</td>
                    <td className="py-2 pr-4 font-semibold">{ex.vendor}</td>
                    <td className="py-2 pr-4"><Badge status={ex.category} /></td>
                    <td className="py-2 pr-4">{ev?.name || "—"}</td>
                    <td className="py-2 pr-4 text-right font-semibold">{fmt$(ex.amount)}</td>
                    <td className="py-2 pr-4">
                      {ex.receiptUrl ? (
                        <button onClick={() => { const w = window.open(); if (w) { w.document.write(`<img src="${ex.receiptUrl}" style="max-width:100%"/>`); } }}
                          className="text-xs text-muted-foreground hover:text-foreground underline">View</button>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2">
                      {deleting === ex.id ? (
                        <ConfirmDelete onConfirm={() => remove(ex.id)} onCancel={() => setDeleting(null)} />
                      ) : (
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-muted" onClick={() => { setEditing(ex); setModal(true); }}><Edit size={14} /></button>
                          <button className="p-1 hover:bg-muted" onClick={() => setDeleting(ex.id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-foreground font-semibold">
                <td className="py-2 pr-4" colSpan={4}>Total</td>
                <td className="py-2 pr-4 text-right">{fmt$(totalFiltered)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Manual entry modal */}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Expense" : "Log Expense"}>
        <form onSubmit={save}>
          <Input label="Date" name="date" type="date" defaultValue={editing?.date || new Date().toISOString().slice(0, 10)} required />
          <Input label="Vendor / Payee" name="vendor" defaultValue={editing?.vendor} required />
          <Select label="Category" name="category" options={categories} defaultValue={editing?.category} />
          <Input label="Amount" name="amount" type="number" step="0.01" defaultValue={editing?.amount} required />
          <SelectLabeled label="Event" name="eventId" options={events.map((e: Event) => ({ value: e.id, label: e.name }))} defaultValue={editing?.eventId} />
          <TextArea label="Notes" name="notes" defaultValue={editing?.notes} />
          <input type="hidden" name="receiptUrl" value={editing?.receiptUrl || ""} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>

      {/* Scan receipt modal */}
      <Modal open={scanModal} onClose={() => { setScanModal(false); setScanResult(null); setScanning(false); }} title="Scan Receipt" wide>
        {!scanResult && !scanning && (
          <div className="text-center py-8">
            <div className="border-2 border-dashed border-input p-10 mb-4 cursor-pointer hover:border-foreground transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files[0]; if (file) handleReceiptUpload(file); }}>
              <Upload size={40} className="mx-auto mb-4 text-muted-foreground" strokeWidth={1} />
              <p className="font-sans text-sm text-muted-foreground mb-2">Drop a receipt image here or click to upload</p>
              <p className="font-sans text-xs text-muted-foreground">Supports JPG, PNG, PDF</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleReceiptUpload(file); }} />
          </div>
        )}
        {scanning && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-sans text-sm">Analyzing receipt...</p>
          </div>
        )}
        {scanResult && (
          <div>
            <div className="flex gap-6 mb-6">
              {scanResult.receiptUrl && (
                <div className="w-32 shrink-0">
                  <img src={scanResult.receiptUrl} alt="Receipt" className="w-full border border-input" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-sans mb-3 uppercase tracking-wider">Review & Edit Details</p>
                <form onSubmit={saveScanResult}>
                  <Input label="Date" name="date" type="date" defaultValue={scanResult.date} required />
                  <Input label="Vendor" name="vendor" defaultValue={scanResult.vendor} required />
                  <Select label="Category" name="category" options={categories} defaultValue={scanResult.category} />
                  <Input label="Amount" name="amount" type="number" step="0.01" defaultValue={scanResult.amount} required />
                  <SelectLabeled label="Event" name="eventId" options={events.map((e: Event) => ({ value: e.id, label: e.name }))} defaultValue={scanResult.eventId} />
                  <TextArea label="Notes" name="notes" defaultValue={scanResult.notes} />
                  <input type="hidden" name="receiptUrl" value={scanResult.receiptUrl || ""} />
                  <div className="flex gap-3 mt-4">
                    <Btn type="submit">Save Expense</Btn>
                    <Btn variant="secondary" type="button" onClick={() => { setScanResult(null); }}>Re-scan</Btn>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </Modal>
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
      setEvents((ev: Event[]) => [...ev, { id: uid(), ...obj }]);
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
          <SelectLabeled label="Client" name="clientId" options={clients.map((c: Client) => ({ value: c.id, label: c.name }))} defaultValue={editing?.clientId} />
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
                  <div><div className="font-semibold">{v.name}</div><div className="text-xs text-muted-foreground">{v.category}</div></div>
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
                      <td className="py-2 pr-4">{g.name}</td><td className="py-2 pr-4"><Badge status={g.rsvp} /></td>
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
  const remove = (id: string) => { setTimelines((t: TimelineBlock[]) => t.filter(x => x.id !== id)); toast("Block removed"); };
  const moveBlock = (idx: number, dir: number) => {
    const sorted = [...timeline]; const [item] = sorted.splice(idx, 1); sorted.splice(idx + dir, 0, item);
    const ids = sorted.map((s: TimelineBlock) => s.id);
    setTimelines((t: TimelineBlock[]) => t.map(x => { const i = ids.indexOf(x.id); return i >= 0 ? { ...x, order: i } : x; }));
  };
  return (
    <div>
      <div className="flex justify-end mb-4"><Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> Add Block</Btn></div>
      {timeline.length === 0 ? <Empty icon={Clock} text="No timeline blocks yet." /> : (
        <div className="space-y-2">
          {timeline.map((b: TimelineBlock, i: number) => (
            <div key={b.id} className="border border-foreground p-4 flex items-start gap-3">
              <div className="flex flex-col gap-1">{i > 0 && <button onClick={() => moveBlock(i, -1)} className="text-muted-foreground hover:text-foreground"><ArrowUpDown size={12} /></button>}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3"><span className="font-semibold text-sm">{b.time}</span><span className="text-sm">{b.activity}</span></div>
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
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
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
    obj.estimated = parseFloat(obj.estimated) || 0; obj.actual = parseFloat(obj.actual) || 0;
    if (editing) { setBudgets((b: BudgetItem[]) => b.map(x => x.id === editing.id ? { ...x, ...obj } : x)); toast("Budget item updated"); }
    else { setBudgets((b: BudgetItem[]) => [...b, { id: uid(), eventId, ...obj }]); toast("Budget item added"); }
    setModal(false); setEditing(null);
  };
  return (
    <div>
      <div className="flex justify-end mb-4"><Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> Add Item</Btn></div>
      {budget.length === 0 ? <Empty icon={DollarSign} text="No budget items yet." /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4">Item</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4 text-right">Estimated</th><th className="py-2 pr-4 text-right">Actual</th><th className="py-2 w-16"></th>
            </tr></thead>
            <tbody>
              {budget.map((b: BudgetItem, i: number) => (
                <tr key={b.id} className={i % 2 === 1 ? "bg-muted/50" : ""}>
                  <td className="py-2 pr-4">{b.item}</td><td className="py-2 pr-4">{b.category}</td>
                  <td className="py-2 pr-4 text-right">{fmt$(b.estimated)}</td><td className="py-2 pr-4 text-right">{fmt$(b.actual)}</td>
                  <td className="py-2 flex gap-1">
                    <button className="p-1 hover:bg-muted" onClick={() => { setEditing(b); setModal(true); }}><Edit size={14} /></button>
                    <button className="p-1 hover:bg-muted" onClick={() => { setBudgets((bs: BudgetItem[]) => bs.filter(x => x.id !== b.id)); toast("Removed"); }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-foreground font-semibold"><td className="py-2 pr-4" colSpan={2}>Totals</td><td className="py-2 pr-4 text-right">{fmt$(totalEst)}</td><td className="py-2 pr-4 text-right">{fmt$(totalAct)}</td><td></td></tr>
              <tr><td className="py-1 text-xs text-muted-foreground" colSpan={5}>Variance: {fmt$(Math.abs(variance))} {variance >= 0 ? "under" : "over"} budget</td></tr>
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
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
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
    const fd = new FormData(e.currentTarget); const obj: any = Object.fromEntries(fd.entries());
    if (editing) { setClients((c: Client[]) => c.map(x => x.id === editing.id ? { ...x, ...obj, notes: x.notes } : x)); toast("Client updated"); log(`Updated client: ${obj.name}`); }
    else { setClients((c: Client[]) => [...c, { id: uid(), ...obj, notes: [] }]); toast("Client created"); log(`Created client: ${obj.name}`); }
    setModal(false); setEditing(null);
  };
  const remove = (id: string) => { const cl = clients.find((c: Client) => c.id === id); setClients((c: Client[]) => c.filter(x => x.id !== id)); toast("Client deleted"); log(`Deleted client: ${cl?.name}`); setDeleting(null); };

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
            {linkedEvents.map((e: Event) => (<div key={e.id} className="border border-foreground p-3 mb-2 text-sm font-sans">{e.name} — {shortDate(e.date)}</div>))}
          </div>
        )}
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Notes</h3>
          {cl.notes.map((n: { text: string; date: string }, i: number) => (
            <div key={i} className="border-l-2 border-foreground pl-3 mb-2 text-sm font-sans"><p>{n.text}</p><p className="text-xs text-muted-foreground">{shortDate(n.date)}</p></div>
          ))}
          <form onSubmit={e => {
            e.preventDefault(); const fd = new FormData(e.currentTarget); const text = fd.get("note") as string; if (!text.trim()) return;
            setClients((cs: Client[]) => cs.map(c => c.id === cl.id ? { ...c, notes: [...c.notes, { text, date: new Date().toISOString().slice(0, 10) }] } : c));
            (e.currentTarget as HTMLFormElement).reset(); toast("Note added");
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
                  <td className="py-2 pr-4 font-semibold">{c.name}</td><td className="py-2 pr-4">{c.email}</td><td className="py-2 pr-4">{c.phone}</td>
                  <td className="py-2 pr-4">{c.eventType}</td><td className="py-2 pr-4"><Badge status={c.status} /></td>
                  <td className="py-2" onClick={e => e.stopPropagation()}>
                    {deleting === c.id ? <ConfirmDelete onConfirm={() => remove(c.id)} onCancel={() => setDeleting(null)} /> : (
                      <div className="flex gap-1"><button className="p-1 hover:bg-muted" onClick={() => { setEditing(c); setModal(true); }}><Edit size={14} /></button><button className="p-1 hover:bg-muted" onClick={() => setDeleting(c.id)}><Trash2 size={14} /></button></div>
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
              onDrop={e => { const id = e.dataTransfer.getData("clientId"); setClients((cs: Client[]) => cs.map(c => c.id === id ? { ...c, status: stage } : c)); toast(`Moved to ${stage}`); }}>
              <div className="border-b border-foreground px-4 py-2 text-xs uppercase tracking-wider font-sans bg-muted">{stage}</div>
              <div className="p-3 space-y-2 min-h-[100px]">
                {clients.filter((c: Client) => c.status === stage).map((c: Client) => (
                  <div key={c.id} draggable onDragStart={e => e.dataTransfer.setData("clientId", c.id)} onClick={() => setDetail(c.id)}
                    className="border border-foreground p-3 cursor-grab hover:bg-muted/50 active:cursor-grabbing">
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
          <Input label="Name" name="name" defaultValue={editing?.name} required />
          <Input label="Email" name="email" type="email" defaultValue={editing?.email} />
          <Input label="Phone" name="phone" defaultValue={editing?.phone} />
          <Input label="Event Type" name="eventType" defaultValue={editing?.eventType} />
          <Select label="Status" name="status" options={pipeline} defaultValue={editing?.status || "Inquiry"} />
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
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
    e.preventDefault(); const fd = new FormData(e.currentTarget); const obj: any = Object.fromEntries(fd.entries()); obj.rating = parseInt(obj.rating) || 3;
    if (editing) { setVendors((v: Vendor[]) => v.map(x => x.id === editing.id ? { ...x, ...obj, eventIds: x.eventIds } : x)); toast("Vendor updated"); log(`Updated vendor: ${obj.name}`); }
    else { setVendors((v: Vendor[]) => [...v, { id: uid(), ...obj, eventIds: [] }]); toast("Vendor created"); log(`Created vendor: ${obj.name}`); }
    setModal(false); setEditing(null);
  };
  const remove = (id: string) => { const v = vendors.find((x: Vendor) => x.id === id); setVendors((vs: Vendor[]) => vs.filter(x => x.id !== id)); toast("Vendor deleted"); log(`Deleted vendor: ${v?.name}`); setDeleting(null); };

  if (detail) {
    const v = vendors.find((x: Vendor) => x.id === detail);
    if (!v) { setDetail(null); return null; }
    const linkedEvents = events.filter((e: Event) => v.eventIds?.includes(e.id));
    return (
      <div>
        <button onClick={() => setDetail(null)} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground">← Back to Vendors</button>
        <h1 className="text-3xl mb-2">{v.name}</h1>
        <div className="flex items-center gap-3 mb-6"><Badge status={v.category} /><StarRating value={v.rating} /></div>
        <div className="space-y-2 text-sm font-sans">
          <p><span className="text-muted-foreground">Contact:</span> {v.contact}</p>
          {v.notes && <p><span className="text-muted-foreground">Notes:</span> {v.notes}</p>}
        </div>
        {linkedEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Assigned Events</h3>
            {linkedEvents.map((e: Event) => (<div key={e.id} className="border border-foreground p-3 mb-2 text-sm font-sans">{e.name} — {shortDate(e.date)}</div>))}
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
            <option value="">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New</Btn>
        </div>
      </div>
      {filtered.length === 0 ? <Empty icon={Store} text="No vendors found." /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((v: Vendor) => (
            <div key={v.id} className="border border-foreground p-5 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setDetail(v.id)}>
              <div className="flex items-start justify-between">
                <div><div className="font-display text-lg">{v.name}</div><div className="text-xs text-muted-foreground font-sans mt-1">{v.category} · {v.contact}</div></div>
                <StarRating value={v.rating} />
              </div>
              {v.notes && <p className="text-sm text-muted-foreground font-sans mt-2">{v.notes}</p>}
              <div className="flex gap-1 mt-3" onClick={e => e.stopPropagation()}>
                {deleting === v.id ? <ConfirmDelete onConfirm={() => remove(v.id)} onCancel={() => setDeleting(null)} /> : (
                  <><button className="p-1 hover:bg-muted" onClick={() => { setEditing(v); setModal(true); }}><Edit size={14} /></button><button className="p-1 hover:bg-muted" onClick={() => setDeleting(v.id)}><Trash2 size={14} /></button></>
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
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FINANCES — WITH CHARTS
// ═══════════════════════════════════════════════════════════════════
function FinancesView({ invoices, setInvoices, clients, events, expenses, budgets, log, toast }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const totalBilled = invoices.reduce((s: number, i: Invoice) => s + i.amount, 0);
  const totalPaid = invoices.filter((i: Invoice) => i.status === "Paid").reduce((s: number, i: Invoice) => s + i.amount, 0);
  const outstanding = totalBilled - totalPaid;
  const overdue = invoices.filter((i: Invoice) => i.status === "Overdue").reduce((s: number, i: Invoice) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s: number, e: Expense) => s + e.amount, 0);

  // Revenue vs Expenses chart per event
  const eventPL: { label: string; revenue: number; cost: number }[] = [];
  events.forEach((ev: Event) => {
    const rev = invoices.filter((i: Invoice) => i.eventId === ev.id && i.status === "Paid").reduce((s: number, i: Invoice) => s + i.amount, 0);
    const cost = expenses.filter((e: Expense) => e.eventId === ev.id).reduce((s: number, e: Expense) => s + e.amount, 0) +
                 budgets.filter((b: BudgetItem) => b.eventId === ev.id).reduce((s: number, b: BudgetItem) => s + Number(b.actual), 0);
    if (rev > 0 || cost > 0) eventPL.push({ label: ev.name, revenue: rev, cost });
  });

  // Invoice status breakdown chart
  const invByStatus: Record<string, number> = {};
  invoices.forEach((i: Invoice) => { invByStatus[i.status] = (invByStatus[i.status] || 0) + i.amount; });
  const invStatusData = Object.entries(invByStatus).map(([label, value]) => ({ label, value }));

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const obj: any = Object.fromEntries(fd.entries()); obj.amount = parseFloat(obj.amount) || 0;
    if (editing) { setInvoices((inv: Invoice[]) => inv.map(x => x.id === editing.id ? { ...x, ...obj, lineItems: x.lineItems } : x)); toast("Invoice updated"); log(`Updated invoice for ${fmt$(obj.amount)}`); }
    else { setInvoices((inv: Invoice[]) => [...inv, { id: uid(), ...obj, lineItems: [] }]); toast("Invoice created"); log(`Created invoice for ${fmt$(obj.amount)}`); }
    setModal(false); setEditing(null);
  };
  const remove = (id: string) => { setInvoices((inv: Invoice[]) => inv.filter(x => x.id !== id)); toast("Invoice deleted"); log("Deleted an invoice"); setDeleting(null); };

  if (detail) {
    const inv = invoices.find((i: Invoice) => i.id === detail);
    if (!inv) { setDetail(null); return null; }
    const client = clients.find((c: Client) => c.id === inv.clientId);
    const event = events.find((e: Event) => e.id === inv.eventId);
    return (
      <div>
        <button onClick={() => setDetail(null)} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground">← Back to Finances</button>
        <h1 className="text-3xl mb-2">Invoice</h1><Badge status={inv.status} />
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
              <thead><tr className="border-b border-foreground text-xs uppercase tracking-wider text-muted-foreground"><th className="py-2 text-left">Description</th><th className="py-2 text-right">Amount</th></tr></thead>
              <tbody>{inv.lineItems.map((li: { desc: string; amount: number }, i: number) => (<tr key={i} className={i % 2 === 1 ? "bg-muted/30" : ""}><td className="py-2">{li.desc}</td><td className="py-2 text-right">{fmt$(li.amount)}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="text-3xl">Finances</h1><Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New Invoice</Btn></div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Billed", value: fmt$(totalBilled) },
          { label: "Total Paid", value: fmt$(totalPaid) },
          { label: "Outstanding", value: fmt$(outstanding) },
          { label: "Overdue", value: fmt$(overdue) },
          { label: "Net Profit", value: fmt$(totalPaid - totalExpenses) },
        ].map(c => (
          <div key={c.label} className="border border-foreground p-4"><div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-sans">{c.label}</div><div className="text-xl font-display">{c.value}</div></div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="border border-foreground p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-muted-foreground" />
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Invoice Status Breakdown</h3>
          </div>
          <HBarChart data={invStatusData} />
        </div>
        <div className="border border-foreground p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-muted-foreground" />
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Per-Event P&L</h3>
          </div>
          {eventPL.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No event P&L data yet.</p>
          ) : (
            <div className="space-y-3">
              {eventPL.map((ep, i) => (
                <div key={i}>
                  <div className="text-xs font-sans font-semibold mb-1">{ep.label}</div>
                  <div className="flex gap-4 text-xs font-sans">
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">Revenue</span><span>{fmt$(ep.revenue)}</span></div>
                      <div className="w-full bg-muted h-2"><div className="h-2 bg-foreground" style={{ width: `${Math.min(100, (ep.revenue / Math.max(ep.revenue, ep.cost, 1)) * 100)}%` }} /></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">Costs</span><span>{fmt$(ep.cost)}</span></div>
                      <div className="w-full bg-muted h-2"><div className="h-2 bg-foreground opacity-40" style={{ width: `${Math.min(100, (ep.cost / Math.max(ep.revenue, ep.cost, 1)) * 100)}%` }} /></div>
                    </div>
                  </div>
                  <div className="text-xs font-sans mt-0.5 text-muted-foreground">
                    Profit: {fmt$(ep.revenue - ep.cost)} ({ep.revenue > 0 ? `${((ep.revenue - ep.cost) / ep.revenue * 100).toFixed(0)}%` : "—"})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                    <td className="py-2 pr-4">{client?.name || "—"}</td><td className="py-2 pr-4">{event?.name || "—"}</td>
                    <td className="py-2 pr-4 text-right">{fmt$(inv.amount)}</td><td className="py-2 pr-4"><Badge status={inv.status} /></td>
                    <td className="py-2 pr-4">{shortDate(inv.dueDate)}</td>
                    <td className="py-2" onClick={e => e.stopPropagation()}>
                      {deleting === inv.id ? <ConfirmDelete onConfirm={() => remove(inv.id)} onCancel={() => setDeleting(null)} /> : (
                        <div className="flex gap-1"><button className="p-1 hover:bg-muted" onClick={() => { setEditing(inv); setModal(true); }}><Edit size={14} /></button><button className="p-1 hover:bg-muted" onClick={() => setDeleting(inv.id)}><Trash2 size={14} /></button></div>
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
          <SelectLabeled label="Client" name="clientId" options={clients.map((c: Client) => ({ value: c.id, label: c.name }))} defaultValue={editing?.clientId} />
          <SelectLabeled label="Event" name="eventId" options={events.map((e: Event) => ({ value: e.id, label: e.name }))} defaultValue={editing?.eventId} />
          <Input label="Amount" name="amount" type="number" step="0.01" defaultValue={editing?.amount} required />
          <Select label="Status" name="status" options={["Draft", "Sent", "Paid", "Overdue"]} defaultValue={editing?.status || "Draft"} />
          <Input label="Due Date" name="dueDate" type="date" defaultValue={editing?.dueDate} />
          <TextArea label="Notes" name="notes" defaultValue={editing?.notes} />
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
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
    e.preventDefault(); const fd = new FormData(e.currentTarget); const obj: any = Object.fromEntries(fd.entries());
    if (editing) { setGuests((g: Guest[]) => g.map(x => x.id === editing.id ? { ...x, ...obj } : x)); toast("Guest updated"); log(`Updated guest: ${obj.name}`); }
    else { setGuests((g: Guest[]) => [...g, { id: uid(), ...obj }]); toast("Guest added"); log(`Added guest: ${obj.name}`); }
    setModal(false); setEditing(null);
  };
  const remove = (id: string) => { const g = guests.find((x: Guest) => x.id === id); setGuests((gs: Guest[]) => gs.filter(x => x.id !== id)); toast("Guest removed"); log(`Removed guest: ${g?.name}`); setDeleting(null); };
  const exportCSV = () => {
    const headers = ["Name", "Event", "Email", "Phone", "RSVP", "Dietary", "Table/Group"];
    const rows = filtered.map((g: Guest) => { const ev = events.find((e: Event) => e.id === g.eventId); return [g.name, ev?.name || "", g.email, g.phone, g.rsvp, g.dietary, g.tableGroup]; });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "revouxaynce-guests.csv"; a.click(); URL.revokeObjectURL(url); toast("CSV exported");
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl">Guests</h1>
        <div className="flex gap-2 flex-wrap">
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="border border-input px-3 py-2 text-sm font-sans bg-background">
            <option value="">All Events</option>{events.map((ev: Event) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <Btn variant="secondary" onClick={exportCSV}><Download size={14} className="inline mr-1" /> CSV</Btn>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> New</Btn>
        </div>
      </div>
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
                    <td className="py-2 pr-4 font-semibold">{g.name}</td><td className="py-2 pr-4">{ev?.name || "—"}</td><td className="py-2 pr-4">{g.email}</td>
                    <td className="py-2 pr-4"><Badge status={g.rsvp} /></td><td className="py-2 pr-4">{g.dietary || "—"}</td><td className="py-2 pr-4">{g.tableGroup || "—"}</td>
                    <td className="py-2">
                      {deleting === g.id ? <ConfirmDelete onConfirm={() => remove(g.id)} onCancel={() => setDeleting(null)} /> : (
                        <div className="flex gap-1"><button className="p-1 hover:bg-muted" onClick={() => { setEditing(g); setModal(true); }}><Edit size={14} /></button><button className="p-1 hover:bg-muted" onClick={() => setDeleting(g.id)}><Trash2 size={14} /></button></div>
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
          <SelectLabeled label="Event" name="eventId" options={events.map((e: Event) => ({ value: e.id, label: e.name }))} defaultValue={editing?.eventId} />
          <Input label="Email" name="email" type="email" defaultValue={editing?.email} />
          <Input label="Phone" name="phone" defaultValue={editing?.phone} />
          <Select label="RSVP Status" name="rsvp" options={["Attending", "Declined", "Pending"]} defaultValue={editing?.rsvp || "Pending"} />
          <Input label="Dietary Notes" name="dietary" defaultValue={editing?.dietary} />
          <Input label="Table / Group" name="tableGroup" defaultValue={editing?.tableGroup} />
          <div className="flex gap-3 mt-4"><Btn type="submit">Save</Btn><Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn></div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TEAM MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
function TeamView({ team, setTeam, currentUser, toast, log }: any) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const allSections = ["dashboard", "events", "clients", "vendors", "finances", "expenses", "guests"];

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    const role = fd.get("role") as "admin" | "member";
    const access = allSections.filter(s => fd.get(`access_${s}`) === "on");

    if (role === "admin") {
      // Admins get all access
      access.length = 0;
      access.push(...allSections, "team");
    }

    if (editing) {
      setTeam((t: TeamMember[]) => t.map(m => m.id === editing.id ? { ...m, name, email, password: password || m.password, role, access } : m));
      toast("Team member updated"); log(`Updated team member: ${name}`);
    } else {
      if (!password) { toast("Password is required"); return; }
      setTeam((t: TeamMember[]) => [...t, { id: uid(), name, email, password, role, access }]);
      toast("Team member added"); log(`Added team member: ${name}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    if (id === currentUser.id) { toast("Cannot delete your own account"); return; }
    const m = team.find((x: TeamMember) => x.id === id);
    setTeam((t: TeamMember[]) => t.filter(x => x.id !== id));
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
          {team.map((m: TeamMember) => (
            <div key={m.id} className="border border-foreground p-5">
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
                      <button className="p-1.5 hover:bg-muted" onClick={() => { setEditing(m); setModal(true); }}><Edit size={14} /></button>
                      {m.id !== currentUser.id && <button className="p-1.5 hover:bg-muted" onClick={() => setDeleting(m.id)}><Trash2 size={14} /></button>}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Team Member" : "Add Team Member"}>
        <form onSubmit={save}>
          <Input label="Full Name" name="name" defaultValue={editing?.name} required />
          <Input label="Email" name="email" type="email" defaultValue={editing?.email} required />
          <Input label={editing ? "Password (leave blank to keep)" : "Password"} name="password" type="password" defaultValue="" required={!editing} />
          <Select label="Role" name="role" options={["admin", "member"]} defaultValue={editing?.role || "member"} />

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

// ═══════════════════════════════════════════════════════════════════
// ROOT WRAPPER
// ═══════════════════════════════════════════════════════════════════
const Index = () => (
  <ToastProvider>
    <Revouxaynce />
  </ToastProvider>
);

export default Index;
