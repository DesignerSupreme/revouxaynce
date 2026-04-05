import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, CalendarDays, Users, Store, DollarSign, UserCheck,
  LogOut, Shield, Menu, Receipt, Settings, MoreHorizontal, ClipboardList
} from "lucide-react";
import logo from "@/assets/revouxaynce-logo.svg";
import type { TeamMember, Tab, TimelineBlock, BudgetItem, Activity, Task } from "@/types";
import { uid } from "@/lib/helpers";
import { markOverdueInvoices } from "@/lib/dataService";
import {
  seedEvents, seedClients, seedVendors, seedInvoices,
  seedGuests, seedExpenses, seedTeam, seedTasks,
} from "@/lib/seedData";
import { useLocalStorage } from "@/hooks/useLocalStorage";
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

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
const Revouxaynce = () => {
  const [team, setTeam] = useLocalStorage<TeamMember[]>("team_v5", seedTeam);
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

function AppShell({ currentUser, onLogout, team, setTeam }: {
  currentUser: TeamMember; onLogout: () => void;
  team: TeamMember[]; setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;
}) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sampleDataEnabled, setSampleDataEnabled] = useLocalStorage("sampleDataEnabled_v5", () => true);
  const [events, setEvents] = useLocalStorage("events_v5", seedEvents);
  const [clients, setClients] = useLocalStorage("clients_v5", seedClients);
  const [vendors, setVendors] = useLocalStorage("vendors_v5", seedVendors);
  const [invoices, setInvoices] = useLocalStorage("invoices_v5", seedInvoices);
  const [guests, setGuests] = useLocalStorage("guests_v5", seedGuests);
  const [expenses, setExpenses] = useLocalStorage("expenses_v5", seedExpenses);
  const [timelines, setTimelines] = useLocalStorage<TimelineBlock[]>("timelines_v5", () => []);
  const [budgets, setBudgets] = useLocalStorage<BudgetItem[]>("budgets_v5", () => []);
  const [activities, setActivities] = useLocalStorage<Activity[]>("activities_v5", () => []);
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks_v5", seedTasks);
  const toast = React.useContext(ToastCtx);
  const [transitioning, setTransitioning] = useState(false);

  // Auto-mark overdue invoices
  useEffect(() => {
    const updated = markOverdueInvoices(invoices);
    if (JSON.stringify(updated) !== JSON.stringify(invoices)) {
      setInvoices(updated);
    }
  }, [invoices, setInvoices]);

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
    setTasks([]);
    setSampleDataEnabled(true);
    toast("Sample data has been reset");
  }, [setEvents, setClients, setVendors, setInvoices, setGuests, setExpenses, setTimelines, setBudgets, setActivities, setTasks, setSampleDataEnabled, toast]);

  const clearAllData = useCallback(() => {
    setEvents([]); setClients([]); setVendors([]); setInvoices([]);
    setGuests([]); setExpenses([]); setTimelines([]); setBudgets([]);
    setActivities([]); setTasks([]);
    toast("All data cleared");
  }, [setEvents, setClients, setVendors, setInvoices, setGuests, setExpenses, setTimelines, setBudgets, setActivities, setTasks, toast]);

  const toggleSampleData = useCallback(() => {
    if (sampleDataEnabled) { clearAllData(); setSampleDataEnabled(false); }
    else { resetAllData(); }
  }, [sampleDataEnabled, clearAllData, resetAllData, setSampleDataEnabled]);

  const log = useCallback((text: string) => {
    setActivities(a => [{ id: uid(), text, time: new Date().toISOString() }, ...a].slice(0, 20));
  }, [setActivities]);

  // Wire seed data
  useEffect(() => {
    if (events.length > 0 && clients.length > 0 && guests.length > 0 && guests[0]?.eventId === "") {
      const eIds = events.map(e => e.id);
      const cIds = clients.map(c => c.id);
      setEvents(ev => ev.map((e, i) => ({ ...e, clientId: cIds[i % cIds.length] })));
      setGuests(g => g.map((x, i) => ({ ...x, eventId: eIds[i % eIds.length] })));
      setInvoices(inv => inv.map((x, i) => ({ ...x, clientId: cIds[i % cIds.length], eventId: eIds[i % eIds.length] })));
      setVendors(v => v.map((x, i) => ({ ...x, eventIds: [eIds[i % eIds.length]] })));
      setExpenses(ex => ex.map((x, i) => ({ ...x, eventId: eIds[i % eIds.length] })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allNavItems: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "events", label: "Events", icon: CalendarDays },
    { key: "tasks", label: "Tasks", icon: ClipboardList },
    { key: "clients", label: "Clients", icon: Users },
    { key: "vendors", label: "Vendors", icon: Store },
    { key: "finances", label: "Finances", icon: DollarSign },
    { key: "expenses", label: "Expenses", icon: Receipt },
    { key: "guests", label: "Guests", icon: UserCheck },
    ...(currentUser.role === "admin" ? [{ key: "team" as Tab, label: "Team", icon: Shield }] : []),
  ];

  const navItems = allNavItems.filter(n => currentUser.access.includes(n.key) || n.key === "team" || n.key === "tasks");

  const handleNav = (t: Tab) => {
    if (!currentUser.access.includes(t) && t !== "team" && t !== "tasks") {
      toast("You don't have access to this section");
      return;
    }
    setTransitioning(true);
    setTimeout(() => {
      setTab(t);
      setSidebarOpen(false);
      setTransitioning(false);
    }, 150);
  };

  useEffect(() => {
    if (!currentUser.access.includes(tab) && tab !== "team" && tab !== "tasks") {
      const first = navItems[0]?.key || "dashboard";
      setTab(first);
    }
  }, [currentUser, tab, navItems]);

  const mobileNavVisible = navItems.slice(0, 5);
  const mobileNavOverflow = navItems.slice(5);
  const [mobileOverflowOpen, setMobileOverflowOpen] = useState(false);

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
            {currentUser.role === "admin" && (
              <button onClick={() => setSettingsOpen(true)} className="p-1 hover:bg-muted transition-colors"><Settings size={18} /></button>
            )}
            <button onClick={onLogout}><LogOut size={18} /></button>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {currentUser.role === "admin" && (
            <div className="hidden md:flex justify-end mb-2">
              <button onClick={() => setSettingsOpen(true)} className="p-2 hover:bg-muted transition-all duration-200 hover:scale-105" title="Settings">
                <Settings size={18} className="text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          )}

          <div className={`transition-all duration-150 ${transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
            {tab === "dashboard" && <DashboardView events={events} clients={clients} invoices={invoices} guests={guests} expenses={expenses} activities={activities} vendors={vendors} timelines={timelines} budgets={budgets} setTab={handleNav} />}
            {tab === "events" && <EventsView events={events} setEvents={setEvents} clients={clients} vendors={vendors} guests={guests} setGuests={setGuests} timelines={timelines} setTimelines={setTimelines} budgets={budgets} setBudgets={setBudgets} log={log} toast={toast} />}
            {tab === "tasks" && <TasksView tasks={tasks} setTasks={setTasks} events={events} team={team} log={log} toast={toast} />}
            {tab === "clients" && <ClientsView clients={clients} setClients={setClients} events={events} log={log} toast={toast} />}
            {tab === "vendors" && <VendorsView vendors={vendors} setVendors={setVendors} events={events} log={log} toast={toast} />}
            {tab === "finances" && <FinancesView expenses={expenses} budgets={budgets} log={log} toast={toast} />}
            {tab === "expenses" && <ExpensesView expenses={expenses} setExpenses={setExpenses} events={events} log={log} toast={toast} />}
            {tab === "guests" && <GuestsView guests={guests} setGuests={setGuests} events={events} log={log} toast={toast} />}
            {tab === "team" && currentUser.role === "admin" && <TeamView team={team} setTeam={setTeam} currentUser={currentUser} toast={toast} log={log} />}
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

      {currentUser.role === "admin" && (
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)}
          sampleDataEnabled={sampleDataEnabled} onToggleSampleData={toggleSampleData} onResetData={resetAllData} toast={toast} />
      )}
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
