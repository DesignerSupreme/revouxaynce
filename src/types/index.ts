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

export const CLIENT_PIPELINE = ["Enquiry", "Quoted", "Booked", "Delivered", "Archived"] as const;
export type PipelineStage = (typeof CLIENT_PIPELINE)[number];

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  status: string;
  pipelineStage: PipelineStage;
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
  vendorId?: string;
  category: string;
  amount: number;
  currency: string;
  fxRate: number;
  paid: boolean;
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

export type Tab = "dashboard" | "events" | "clients" | "vendors" | "finances" | "guests" | "expenses" | "team" | "tasks" | "design";

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

// ─── Client Review Modules (Phase 6) ──────────────────────────────
export type BudgetLine = {
  id: string;
  budget_id: string;
  category: string;
  description: string;
  quantity: number;
  unit_price: number;
  vendor_name: string | null;
  vendor_id: string | null;
  status: "Estimated" | "Confirmed";
  position: number;
};

export type Concept = {
  id: string;
  event_id: string;
  name: string;
  summary: string | null;
  position: number;
  status: "Draft" | "Shared" | "Chosen" | "Not chosen" | "Changes Requested";
  shared_at: string | null;
};

export type Budget = {
  id: string;
  event_id: string;
  concept_id: string | null;
  title: string;
  currency: string;
  status: "Draft" | "Shared" | "Approved" | "Changes Requested";
  contingency_type: "percent" | "flat";
  contingency_value: number;
  notes: string | null;
  internal_notes?: string | null; // never populated on the portal
  version: number;
  parent_id: string | null;
  shared_at: string | null;
};

export type InspirationBoard = {
  id: string;
  event_id: string;
  concept_id: string | null;
  title: string;
  description: string | null;
  status: "Draft" | "Shared" | "Approved" | "Changes Requested";
  cover_item_id: string | null;
  shared_at: string | null;
};

export type InspirationItem = {
  id: string;
  board_id: string;
  storage_path: string;
  caption: string | null;
  category: string | null;
  source_url: string | null;
  position: number;
};

export type VendorOption = {
  id: string;
  event_id: string;
  concept_id: string | null;
  title: string;
  category: string | null;
  description: string | null;
  selection_mode: "single" | "multiple";
  status: "Draft" | "Shared" | "Decided" | "Changes Requested";
  shared_at: string | null;
};

export type VendorOptionItem = {
  id: string;
  option_id: string;
  vendor_name: string;
  vendor_id: string | null;
  headline: string | null;
  description: string | null;
  price: number | null;
  image_path: string | null;
  link_url: string | null;
  position: number;
};

export type PortalSubjectType =
  | "concept"
  | "inspiration_board"
  | "inspiration_item"
  | "budget"
  | "budget_line"
  | "vendor_option"
  | "vendor_option_item";

export type PortalResponseAction =
  | "approved"
  | "changes_requested"
  | "favourited"
  | "unfavourited"
  | "selected"
  | "deselected"
  | "commented";

export type PortalResponse = {
  id: string;
  client_id: string;
  event_id: string | null;
  subject_type: PortalSubjectType;
  subject_id: string;
  action: PortalResponseAction;
  body: string | null;
  created_at: string;
};

export const BUDGET_CATEGORIES = [
  "Venue", "Catering", "Décor & Florals", "Photography & Video",
  "Entertainment", "Stationery", "Attire & Beauty", "Transport",
  "Staffing", "Other",
] as const;

/** Single source of truth for every budget figure shown anywhere. */
export function calcBudgetTotals(
  budget: Pick<Budget, "contingency_type" | "contingency_value">,
  lines: BudgetLine[],
) {
  const lineTotals = lines.map(l => ({
    ...l,
    total: (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
  }));

  const subtotal = lineTotals.reduce((s, l) => s + l.total, 0);

  const byCategory = BUDGET_CATEGORIES
    .map(category => {
      const total = lineTotals.filter(l => l.category === category).reduce((s, l) => s + l.total, 0);
      return { category, total, share: subtotal > 0 ? total / subtotal : 0 };
    })
    .filter(c => c.total > 0);

  const contingency = budget.contingency_type === "percent"
    ? subtotal * (Number(budget.contingency_value) || 0) / 100
    : (Number(budget.contingency_value) || 0);

  const confirmed = lineTotals
    .filter(l => l.status === "Confirmed")
    .reduce((s, l) => s + l.total, 0);

  return {
    lineTotals,
    byCategory,
    subtotal,
    contingency,
    grandTotal: subtotal + contingency,
    confirmed,
    confirmedShare: subtotal > 0 ? confirmed / subtotal : 0,
  };
}
