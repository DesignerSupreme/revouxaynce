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

// ─── Milestone Billing ────────────────────────────────────────────
export type MilestoneStatus = "Pending" | "Approved" | "Invoiced" | "Overdue";

export interface Milestone {
  label: string;
  percentage: number;
  dueDate: string;
  status: MilestoneStatus;
  notes: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  eventId: string;
  amount: number;
  status: string;
  dueDate: string;
  notes: string;
  lineItems: { desc: string; qty: number; unitPrice: number; amount: number }[];
  taxRate?: number;
  discountType?: "percent" | "flat";
  discountValue?: number;
  discountAmount?: number;
  lastSentAt?: string;
  billingType?: "single" | "milestone";
  milestones?: Milestone[];
  version?: number;
  parentId?: string | null;
  internalNotes?: string;
  assignedTo?: string;
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

export type { Role } from "@/lib/permissions";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: import("@/lib/permissions").Role;
  access?: string[];
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

// ─── Audit & Branding ────────────────────────────────────────────
export interface AuditLog {
  id: string;
  invoice_id: string | null;
  action: string;
  performed_by: string | null;
  details: string | null;
  created_at: string;
}

export interface BrandSettings {
  id: string;
  accent_color: string;
  footer_text: string;
  terms_and_conditions: string;
}

export type Tab = "dashboard" | "events" | "clients" | "vendors" | "finances" | "guests" | "expenses" | "team" | "tasks";

// ─── Calculation Helpers ──────────────────────────────────────────
export function calcInvoiceTotals(
  lineItems: { qty: number; unitPrice: number }[],
  discountType: "percent" | "flat" = "flat",
  discountValue: number = 0,
  taxRate: number = 0,
) {
  const subtotal = lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
  const discount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = afterDiscount * (taxRate / 100);
  const grandTotal = afterDiscount + tax;
  return { subtotal, discount, afterDiscount, tax, grandTotal };
}

export function calcMilestoneAmount(grandTotal: number, milestone: Milestone): number {
  return grandTotal * (milestone.percentage / 100);
}
