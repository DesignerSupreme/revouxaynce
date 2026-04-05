import { uid } from "./helpers";
import type {
  Event, Client, Vendor, Invoice, Guest, Expense,
  TeamMember, TimelineBlock, BudgetItem, Activity,
} from "@/types";
import {
  seedEvents, seedClients, seedVendors, seedInvoices,
  seedGuests, seedExpenses, seedTeam,
} from "./seedData";

// ─── Storage Keys ─────────────────────────────────────────────────
const KEYS = {
  events: "events_v3",
  clients: "clients_v3",
  vendors: "vendors_v3",
  invoices: "invoices_v3",
  guests: "guests_v3",
  expenses: "expenses_v3",
  team: "team_v3",
  timelines: "timelines_v3",
  budgets: "budgets_v3",
  activities: "activities_v3",
  sampleDataEnabled: "sampleDataEnabled_v3",
  currentUser: "currentUser",
} as const;

export { KEYS };

// ─── Generic Storage Helpers ──────────────────────────────────────
function getItem<T>(key: string, fallback: () => T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback();
  } catch {
    return fallback();
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Events ───────────────────────────────────────────────────────
export const getEvents = (): Event[] => getItem(KEYS.events, seedEvents);
export const setEvents = (events: Event[]): void => setItem(KEYS.events, events);
export const createEvent = (data: Omit<Event, "id">): Event => {
  const event: Event = { id: uid(), ...data };
  const events = getEvents();
  setEvents([...events, event]);
  return event;
};
export const updateEvent = (id: string, data: Partial<Event>): void => {
  setEvents(getEvents().map(e => e.id === id ? { ...e, ...data } : e));
};
export const deleteEvent = (id: string): void => {
  setEvents(getEvents().filter(e => e.id !== id));
};
export const duplicateEvent = (id: string): Event | null => {
  const events = getEvents();
  const source = events.find(e => e.id === id);
  if (!source) return null;
  const copy: Event = { ...source, id: uid(), name: `${source.name} (Copy)`, status: "Planning" };
  setEvents([...events, copy]);
  return copy;
};

// ─── Clients ──────────────────────────────────────────────────────
export const getClients = (): Client[] => getItem(KEYS.clients, seedClients);
export const setClients = (clients: Client[]): void => setItem(KEYS.clients, clients);
export const createClient = (data: Omit<Client, "id">): Client => {
  const client: Client = { id: uid(), ...data };
  setClients([...getClients(), client]);
  return client;
};
export const updateClient = (id: string, data: Partial<Client>): void => {
  setClients(getClients().map(c => c.id === id ? { ...c, ...data } : c));
};
export const deleteClient = (id: string): void => {
  setClients(getClients().filter(c => c.id !== id));
};

// ─── Vendors ──────────────────────────────────────────────────────
export const getVendors = (): Vendor[] => getItem(KEYS.vendors, seedVendors);
export const setVendors = (vendors: Vendor[]): void => setItem(KEYS.vendors, vendors);
export const createVendor = (data: Omit<Vendor, "id">): Vendor => {
  const vendor: Vendor = { id: uid(), ...data };
  setVendors([...getVendors(), vendor]);
  return vendor;
};
export const updateVendor = (id: string, data: Partial<Vendor>): void => {
  setVendors(getVendors().map(v => v.id === id ? { ...v, ...data } : v));
};
export const deleteVendor = (id: string): void => {
  setVendors(getVendors().filter(v => v.id !== id));
};

// ─── Invoices ─────────────────────────────────────────────────────
export const getInvoices = (): Invoice[] => getItem(KEYS.invoices, seedInvoices);
export const setInvoices = (invoices: Invoice[]): void => setItem(KEYS.invoices, invoices);
export const createInvoice = (data: Omit<Invoice, "id">): Invoice => {
  const invoice: Invoice = { id: uid(), ...data };
  setInvoices([...getInvoices(), invoice]);
  return invoice;
};
export const updateInvoice = (id: string, data: Partial<Invoice>): void => {
  setInvoices(getInvoices().map(i => i.id === id ? { ...i, ...data } : i));
};
export const deleteInvoice = (id: string): void => {
  setInvoices(getInvoices().filter(i => i.id !== id));
};

// ─── Guests ───────────────────────────────────────────────────────
export const getGuests = (): Guest[] => getItem(KEYS.guests, seedGuests);
export const setGuestsStorage = (guests: Guest[]): void => setItem(KEYS.guests, guests);
export const createGuest = (data: Omit<Guest, "id">): Guest => {
  const guest: Guest = { id: uid(), ...data };
  setGuestsStorage([...getGuests(), guest]);
  return guest;
};
export const updateGuest = (id: string, data: Partial<Guest>): void => {
  setGuestsStorage(getGuests().map(g => g.id === id ? { ...g, ...data } : g));
};
export const deleteGuest = (id: string): void => {
  setGuestsStorage(getGuests().filter(g => g.id !== id));
};

// ─── Expenses ─────────────────────────────────────────────────────
export const getExpenses = (): Expense[] => getItem(KEYS.expenses, seedExpenses);
export const setExpensesStorage = (expenses: Expense[]): void => setItem(KEYS.expenses, expenses);
export const createExpense = (data: Omit<Expense, "id">): Expense => {
  const expense: Expense = { id: uid(), ...data };
  setExpensesStorage([...getExpenses(), expense]);
  return expense;
};
export const updateExpense = (id: string, data: Partial<Expense>): void => {
  setExpensesStorage(getExpenses().map(e => e.id === id ? { ...e, ...data } : e));
};
export const deleteExpense = (id: string): void => {
  setExpensesStorage(getExpenses().filter(e => e.id !== id));
};

// ─── Team ─────────────────────────────────────────────────────────
export const getTeam = (): TeamMember[] => getItem(KEYS.team, seedTeam);
export const setTeamStorage = (team: TeamMember[]): void => setItem(KEYS.team, team);

// ─── Timelines & Budgets ──────────────────────────────────────────
export const getTimelines = (): TimelineBlock[] => getItem(KEYS.timelines, () => []);
export const setTimelinesStorage = (t: TimelineBlock[]): void => setItem(KEYS.timelines, t);
export const getBudgets = (): BudgetItem[] => getItem(KEYS.budgets, () => []);
export const setBudgetsStorage = (b: BudgetItem[]): void => setItem(KEYS.budgets, b);

// ─── Activities ───────────────────────────────────────────────────
export const getActivities = (): Activity[] => getItem(KEYS.activities, () => []);
export const setActivitiesStorage = (a: Activity[]): void => setItem(KEYS.activities, a);

// ─── Sample Data Toggle ──────────────────────────────────────────
export const getSampleDataEnabled = (): boolean => getItem(KEYS.sampleDataEnabled, () => true);
export const setSampleDataEnabled = (v: boolean): void => setItem(KEYS.sampleDataEnabled, v);

// ─── Current User ─────────────────────────────────────────────────
export const getCurrentUser = (): TeamMember | null => getItem(KEYS.currentUser, () => null);
export const setCurrentUserStorage = (u: TeamMember | null): void => {
  if (u) setItem(KEYS.currentUser, u);
  else localStorage.removeItem(KEYS.currentUser);
};

// ─── Auto-Overdue Logic ──────────────────────────────────────────
export const markOverdueInvoices = (invoices: Invoice[]): Invoice[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return invoices.map(inv => {
    if (inv.status === "Sent" && new Date(inv.dueDate + "T00:00:00") < now) {
      return { ...inv, status: "Overdue" };
    }
    return inv;
  });
};

// ─── Export All Data ──────────────────────────────────────────────
export const exportAllData = (): string => {
  const data = {
    events: getEvents(),
    clients: getClients(),
    vendors: getVendors(),
    invoices: getInvoices(),
    guests: getGuests(),
    expenses: getExpenses(),
    team: getTeam(),
    timelines: getTimelines(),
    budgets: getBudgets(),
    activities: getActivities(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

export const downloadExport = (): void => {
  const json = exportAllData();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `revouxaynce-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
