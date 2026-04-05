// ─── Core Data Types ──────────────────────────────────────────────

export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  clientId: string;
  status: string;
  notes: string;
}

export interface TimelineBlock {
  id: string;
  eventId: string;
  time: string;
  activity: string;
  person: string;
  notes: string;
  order: number;
}

export interface BudgetItem {
  id: string;
  eventId: string;
  item: string;
  category: string;
  estimated: number;
  actual: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  status: string;
  notes: { text: string; date: string }[];
  portalToken?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  rating: number;
  notes: string;
  eventIds: string[];
}

export interface Invoice {
  id: string;
  clientId: string;
  eventId: string;
  amount: number;
  status: string;
  dueDate: string;
  notes: string;
  lineItems: { desc: string; amount: number }[];
}

export interface Guest {
  id: string;
  name: string;
  eventId: string;
  email: string;
  phone: string;
  rsvp: string;
  dietary: string;
  tableGroup: string;
}

export interface Expense {
  id: string;
  date: string;
  vendor: string;
  category: string;
  amount: number;
  eventId: string;
  notes: string;
  receiptUrl: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "member";
  access: string[];
}

export interface Activity {
  id: string;
  text: string;
  time: string;
}

// ─── Task System ──────────────────────────────────────────────────
export type TaskStage = "Planning" | "Vendor Coordination" | "Setup & Logistics" | "Event Execution" | "Post-Event";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
  id: string;
  title: string;
  eventId: string;
  assigneeId: string;
  stage: TaskStage;
  priority: TaskPriority;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export type Tab = "dashboard" | "events" | "clients" | "vendors" | "finances" | "guests" | "expenses" | "team" | "tasks";
