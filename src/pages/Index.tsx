import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, CalendarDays, Users, Store, DollarSign, UserCheck,
  LogOut, Shield, Menu, Receipt, Settings, MoreHorizontal, ClipboardList, Search
} from "lucide-react";
import logo from "@/assets/revouxaynce-logo.svg";
import type { TeamMember, Tab, TimelineBlock, BudgetItem, Activity, Invoice, Milestone } from "@/types";
import { uid } from "@/lib/helpers";
import { buildSeedDataset } from "@/lib/seedData";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuthRole } from "@/hooks/useAuthRole";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { canEdit, canWrite, isAdmin as isAdminRole, ROLE_LABELS, type Role } from "@/lib/permissions";
import { useSupabaseCollection } from "@/hooks/useSupabaseCollection";
import { clientMapper, eventMapper, expenseMapper, guestMapper, taskMapper, vendorMapper } from "@/lib/dbMappers";
import { useInvoices } from "@/hooks/useInvoices";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { ToastProvider, ToastCtx } from "@/components/app/Toast";
import { LoginPage } from "@/components/app/LoginPage";
import { SettingsPanel } from "@/components/app/SettingsPanel";
import { DashboardView } from "@/views/DashboardView";
import { EventsView } from "@/views/EventsView";
import { ClientsView } from "@/views/ClientsView";
import { VendorsView } from "@/views/VendorsView";
import { FinancesView } from "@/views/FinancesView";
import { ExpensesView } from "@/views/ExpensesView";
import { GuestsView } from "@/views/GuestsView";
import { TeamView } from "@/views/TeamView";
import { TasksView } from "@/views/TasksView";
import { DesignView } from "@/views/DesignView";
import { CommandPalette, type Command } from "@/components/app/CommandPalette";

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
const ALL_SECTIONS = ["dashboard", "events", "clients", "vendors", "finances", "expenses", "guests", "team"];

const Revouxaynce = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = () => { void supabase.auth.signOut(); };

  const email = session?.user?.email ?? "";
  const fallbackName = (session?.user?.user_metadata?.full_name as string) || email.split("@")[0];
  const { profile, loading: roleLoading } = useAuthRole(session?.user?.id ?? null, email, fallbackName);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm font-sans text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  if (roleLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm font-sans text-muted-foreground">Preparing your workspace…</p>
      </div>
    );
  }

  const currentUser: TeamMember = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  };

  return <AppShell currentUser={currentUser} onLogout={handleLogout} />;
};

function AppShell({ currentUser, onLogout }: {
  currentUser: TeamMember; onLogout: () => void;
}) {
  const role: Role = currentUser.role;
  const admin = isAdminRole(role);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sampleDataEnabled, setSampleDataEnabled] = useLocalStorage("sampleDataEnabled_v5", () => true);

  const toastRef = React.useRef<(msg: string, action?: { label: string; onClick: () => void }) => void>(() => {});
  const undoOptions = React.useCallback((label: string) => ({
    onDeleted: (count: number, undo: () => Promise<void>) => {
      toastRef.current(`${count} ${label}${count === 1 ? "" : "s"} removed`, { label: "Undo", onClick: () => { void undo(); } });
    },
  }), []);

  // Shared database collections (previously browser-only)
  const clientsCol = useSupabaseCollection(clientMapper, undoOptions("client"));
  const eventsCol = useSupabaseCollection(eventMapper, undoOptions("event"));
  const vendorsCol = useSupabaseCollection(vendorMapper, undoOptions("vendor"));
  const guestsCol = useSupabaseCollection(guestMapper, undoOptions("guest"));
  const expensesCol = useSupabaseCollection(expenseMapper, undoOptions("expense"));
  const tasksCol = useSupabaseCollection(taskMapper, undoOptions("task"));
  const { members: team } = useTeamMembers();

  const { items: clients, setItems: setClients } = clientsCol;
  const { items: events, setItems: setEvents } = eventsCol;
  const { items: vendors, setItems: setVendors } = vendorsCol;
  const { items: guests, setItems: setGuests } = guestsCol;
  const { items: expenses, setItems: setExpenses } = expensesCol;
  const { items: tasks, setItems: setTasks } = tasksCol;

  const { invoices: dbInvoices, fetchInvoices } = useInvoices();
  const invoices: Invoice[] = React.useMemo(
    () =>
      dbInvoices.map((inv) => ({
        id: inv.id,
        clientId: inv.client_id ?? "",
        eventId: inv.event_id ?? "",
        amount: inv.amount,
        status: inv.status,
        dueDate: inv.due_date,
        notes: inv.notes ?? "",
        lineItems: inv.line_items.map((li) => ({
          desc: li.description,
          qty: li.quantity,
          unitPrice: Number(li.unit_price),
          amount: li.quantity * Number(li.unit_price),
        })),
        taxRate: inv.tax_rate == null ? undefined : Number(inv.tax_rate),
        discountType: (inv.discount_type as "percent" | "flat" | null) ?? undefined,
        discountValue: inv.discount_value == null ? undefined : Number(inv.discount_value),
        discountAmount: inv.discount_amount == null ? undefined : Number(inv.discount_amount),
        billingType: (inv.billing_type as "single" | "milestone" | null) ?? undefined,
        milestones: (inv.milestones as unknown as Milestone[] | null) ?? undefined,
        version: inv.version ?? undefined,
        parentId: inv.parent_id ?? null,
      })),
    [dbInvoices],
  );

  const [timelines, setTimelines] = useLocalStorage<TimelineBlock[]>("timelines_v5", () => []);
  const [budgets, setBudgets] = useLocalStorage<BudgetItem[]>("budgets_v5", () => []);
  const [activities, setActivities] = useLocalStorage<Activity[]>("activities_v5", () => []);
  const toast = React.useContext(ToastCtx);
  toastRef.current = toast;

  /** Blocks writes for roles that may not change a section (the database enforces this too). */
  const guard = React.useCallback(
    <T,>(section: string, setter: React.Dispatch<React.SetStateAction<T>>): React.Dispatch<React.SetStateAction<T>> =>
      (canEdit(role, section)
        ? setter
        : (() => {
            toast(`Your ${ROLE_LABELS[role]} access is read-only for ${section}`);
          }) as React.Dispatch<React.SetStateAction<T>>),
    [role, toast],
  );
  const [transitioning, setTransitioning] = useState(false);

  const refreshAll = useCallback(() => {
    void clientsCol.refresh();
    void eventsCol.refresh();
    void vendorsCol.refresh();
    void guestsCol.refresh();
    void expensesCol.refresh();
    void tasksCol.refresh();
    void fetchInvoices();
  }, [clientsCol, eventsCol, vendorsCol, guestsCol, expensesCol, tasksCol, fetchInvoices]);

  const resetAllData = useCallback(() => {
    const seed = buildSeedDataset();
    setClients(seed.clients);
    setEvents(seed.events);
    setVendors(seed.vendors);
    setGuests(seed.guests);
    setExpenses(seed.expenses);
    setTasks(seed.tasks);
    setTimelines([]);
    setBudgets([]);
    setActivities([]);
    setSampleDataEnabled(true);
    toast("Sample data has been reset");
  }, [setClients, setEvents, setVendors, setGuests, setExpenses, setTasks, setTimelines, setBudgets, setActivities, setSampleDataEnabled, toast]);

  const clearAllData = useCallback(() => {
    setGuests([]); setExpenses([]); setTasks([]);
    setVendors([]); setEvents([]); setClients([]);
    setTimelines([]); setBudgets([]); setActivities([]);
    toast("All data cleared");
  }, [setGuests, setExpenses, setTasks, setVendors, setEvents, setClients, setTimelines, setBudgets, setActivities, toast]);

  const toggleSampleData = useCallback(() => {
    if (sampleDataEnabled) { clearAllData(); setSampleDataEnabled(false); }
    else { resetAllData(); }
  }, [sampleDataEnabled, clearAllData, resetAllData, setSampleDataEnabled]);

  const log = useCallback((text: string) => {
    setActivities(a => [{ id: uid(), text, time: new Date().toISOString() }, ...a].slice(0, 20));
  }, [setActivities]);

  const allNavItems: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "events", label: "Events", icon: CalendarDays },
    { key: "tasks", label: "Tasks", icon: ClipboardList },
    { key: "design", label: "Design", icon: Palette },
    { key: "clients", label: "Clients", icon: Users },
    { key: "vendors", label: "Vendors", icon: Store },
    { key: "finances", label: "Finances", icon: DollarSign },
    { key: "expenses", label: "Expenses", icon: Receipt },
    { key: "guests", label: "Guests", icon: UserCheck },
    { key: "team" as Tab, label: "Team", icon: Shield },
  ];

  const navItems = allNavItems;

  const handleNav = (t: Tab) => {
    setTransitioning(true);
    setTimeout(() => {
      setTab(t);
      setSidebarOpen(false);
      setTransitioning(false);
    }, 150);
  };

  const mobileNavVisible = navItems.slice(0, 5);
  const mobileNavOverflow = navItems.slice(5);
  const [mobileOverflowOpen, setMobileOverflowOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands: Command[] = React.useMemo(() => {
    const list: Command[] = navItems.map((n) => ({
      id: `go-${n.key}`,
      label: `Go to ${n.label}`,
      group: "Pages",
      keywords: n.key,
      run: () => handleNav(n.key),
    }));
    list.push({ id: "print", label: "Print this page", group: "Actions", keywords: "paper run sheet", run: () => window.print() });
    if (admin) list.push({ id: "settings", label: "Open settings", group: "Actions", keywords: "sample data import", run: () => setSettingsOpen(true) });
    list.push({ id: "signout", label: "Sign out", group: "Actions", run: onLogout });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems, admin]);

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
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-all duration-200 ${tab === n.key ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}>
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
              <div className="text-[10px] text-sidebar-foreground/50 uppercase">{ROLE_LABELS[role]}</div>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-foreground/30" />
          <aside className="absolute left-0 top-0 h-full w-56 bg-sidebar text-sidebar-foreground animate-slide-in-left" onClick={e => e.stopPropagation()}>
            <SidebarLogo />
            <nav className="py-4">
              {navItems.map(n => (
                <button key={n.key} onClick={() => handleNav(n.key)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-all duration-200 ${tab === n.key ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}>
                  <n.icon size={16} /> {n.label}
                </button>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-sidebar-border">
              <button onClick={onLogout} className="flex items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="md:hidden flex items-center justify-between border-b px-4 py-3">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <img src={logo} alt="Revouxaynce" className="h-8 w-auto" />
          <div className="flex items-center gap-2">
            {admin && (
              <button onClick={() => setSettingsOpen(true)} className="p-1 hover:bg-muted transition-colors"><Settings size={18} /></button>
            )}
            <button onClick={onLogout}><LogOut size={18} /></button>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <div className="hidden md:flex justify-end gap-2 mb-2 print:hidden">
            <button onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 border border-input px-3 py-1.5 text-xs font-sans text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
              aria-label="Open quick search">
              <Search size={14} aria-hidden="true" /> Quick search
              <kbd className="border border-input px-1 text-[10px] uppercase">⌘K</kbd>
            </button>
            {admin && (
              <button onClick={() => setSettingsOpen(true)} className="p-2 hover:bg-muted transition-all duration-200 hover:scale-105" title="Settings" aria-label="Settings">
                <Settings size={18} className="text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            )}
          </div>


          {!canWrite(role) && (
            <div className="mb-4 border border-foreground px-3 py-2 text-xs font-sans">
              <span className="uppercase tracking-wider font-semibold">{ROLE_LABELS[role]}</span>
              <span className="text-muted-foreground"> — {role === "assistant" ? "you can change tasks, guests and expenses only." : "you have read-only access."}</span>
            </div>
          )}

          <div className={`transition-all duration-150 ${transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
            {tab === "dashboard" && <DashboardView events={events} clients={clients} invoices={invoices} guests={guests} expenses={expenses} activities={activities} vendors={vendors} timelines={timelines} budgets={budgets} setTab={handleNav} />}
            {tab === "events" && <EventsView events={events} setEvents={guard("events", setEvents)} clients={clients} vendors={vendors} guests={guests} setGuests={guard("guests", setGuests)} timelines={timelines} setTimelines={guard("events", setTimelines)} budgets={budgets} setBudgets={guard("events", setBudgets)} log={log} toast={toast} />}
            {tab === "tasks" && <TasksView tasks={tasks} setTasks={guard("tasks", setTasks)} events={events} team={team} log={log} toast={toast} />}
            {tab === "clients" && <ClientsView clients={clients} setClients={guard("clients", setClients)} events={events} log={log} toast={toast} />}
            {tab === "vendors" && <VendorsView vendors={vendors} setVendors={guard("vendors", setVendors)} events={events} log={log} toast={toast} />}
            {tab === "finances" && <FinancesView expenses={expenses} budgets={budgets} log={log} toast={toast} />}
            {tab === "expenses" && <ExpensesView expenses={expenses} setExpenses={guard("expenses", setExpenses)} events={events} log={log} toast={toast} />}
            {tab === "guests" && <GuestsView guests={guests} setGuests={guard("guests", setGuests)} events={events} log={log} toast={toast} />}
            {tab === "design" && <DesignView events={events} clients={clients} canEdit={canEdit(role, "events")} toast={toast} />}
            {tab === "team" && <TeamView currentUserId={currentUser.id} currentRole={role} toast={toast} log={log} />}
          </div>
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex z-40">
        {mobileNavVisible.map(n => (
          <button key={n.key} onClick={() => handleNav(n.key)}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] tracking-wide transition-all duration-200 ${tab === n.key ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            <n.icon size={18} className={`transition-transform duration-200 ${tab === n.key ? "scale-110" : ""}`} /> {n.label}
          </button>
        ))}
        {mobileNavOverflow.length > 0 && (
          <div className="relative flex-1">
            <button onClick={() => setMobileOverflowOpen(!mobileOverflowOpen)}
              className="w-full flex flex-col items-center py-2 text-[10px] tracking-wide text-muted-foreground">
              <MoreHorizontal size={18} /> More
            </button>
            {mobileOverflowOpen && (
              <div className="absolute bottom-full right-0 mb-1 bg-background border border-foreground shadow-lg animate-slide-in-up">
                {mobileNavOverflow.map(n => (
                  <button key={n.key} onClick={() => { handleNav(n.key); setMobileOverflowOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-sans hover:bg-muted transition-colors">
                    <n.icon size={16} /> {n.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {admin && (
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)}
          sampleDataEnabled={sampleDataEnabled} onToggleSampleData={toggleSampleData} onResetData={resetAllData}
          onImported={refreshAll} toast={toast} />
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />

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
