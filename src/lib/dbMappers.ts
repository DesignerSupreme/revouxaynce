import type { Client, Event, Expense, Guest, Task, TaskPriority, TaskStage, Vendor } from "@/types";

export type Row = Record<string, unknown>;

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0): number => (v == null ? fallback : Number(v));
const bool = (v: unknown): boolean => v === true;

const isoDate = (v: string): string | null => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const isoTime = (v: string): string | null => (/^\d{1,2}:\d{2}(:\d{2})?$/.test(v) ? v : null);

export interface Mapper<T> {
  table: string;
  orderBy: string;
  fromRow: (r: Row) => T;
  toRow: (item: T) => Row;
}

export const clientMapper: Mapper<Client> = {
  table: "clients",
  orderBy: "name",
  fromRow: (r) => ({
    id: str(r.id),
    name: str(r.name),
    email: str(r.email),
    phone: str(r.phone),
    eventType: str(r.event_type),
    status: str(r.status, "Active"),
    pipelineStage: (str(r.pipeline_stage, "Enquiry") as Client["pipelineStage"]),
    notes: Array.isArray(r.notes) ? (r.notes as { text: string; date: string }[]) : [],
    portalToken: typeof r.portal_token === "string" ? r.portal_token : undefined,
  }),
  toRow: (c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    event_type: c.eventType,
    status: c.status,
    pipeline_stage: c.pipelineStage || "Enquiry",
    notes: c.notes ?? [],
  }),
};

export const eventMapper: Mapper<Event> = {
  table: "events",
  orderBy: "date",
  fromRow: (r) => ({
    id: str(r.id),
    name: str(r.name),
    date: str(r.event_date) || str(r.date),
    time: (str(r.event_time) || str(r.time)).slice(0, 5),
    venue: str(r.venue),
    clientId: str(r.client_id),
    status: str(r.status, "Planning"),
    notes: str(r.notes),
  }),
  toRow: (e) => ({
    id: e.id,
    name: e.name,
    date: e.date,
    event_date: isoDate(e.date),
    time: e.time,
    event_time: isoTime(e.time),
    venue: e.venue,
    client_id: e.clientId || null,
    status: e.status,
    notes: e.notes,
  }),
};

export const vendorMapper: Mapper<Vendor> = {
  table: "vendors",
  orderBy: "name",
  fromRow: (r) => ({
    id: str(r.id),
    name: str(r.name),
    category: str(r.category),
    contact: str(r.contact),
    rating: num(r.rating),
    notes: str(r.notes),
    eventIds: Array.isArray(r.event_ids) ? (r.event_ids as string[]) : [],
  }),
  toRow: (v) => ({
    id: v.id,
    name: v.name,
    category: v.category,
    contact: v.contact,
    rating: v.rating,
    notes: v.notes,
    event_ids: v.eventIds ?? [],
  }),
};

export const guestMapper: Mapper<Guest> = {
  table: "guests",
  orderBy: "name",
  fromRow: (r) => ({
    id: str(r.id),
    name: str(r.name),
    eventId: str(r.event_id),
    email: str(r.email),
    phone: str(r.phone),
    rsvp: str(r.rsvp, "Pending"),
    dietary: str(r.dietary),
    tableGroup: str(r.table_group),
  }),
  toRow: (g) => ({
    id: g.id,
    name: g.name,
    event_id: g.eventId || null,
    email: g.email,
    phone: g.phone,
    rsvp: g.rsvp,
    dietary: g.dietary,
    table_group: g.tableGroup,
  }),
};

export const expenseMapper: Mapper<Expense> = {
  table: "expenses",
  orderBy: "spent_on",
  fromRow: (r) => ({
    id: str(r.id),
    date: str(r.spent_on),
    vendor: str(r.vendor),
    vendorId: typeof r.vendor_id === "string" ? r.vendor_id : undefined,
    category: str(r.category),
    amount: num(r.amount),
    currency: str(r.currency, "USD"),
    fxRate: num(r.fx_rate, 1) || 1,
    paid: bool(r.paid),
    eventId: str(r.event_id),
    notes: str(r.notes),
    receiptUrl: str(r.receipt_url),
  }),
  toRow: (e) => ({
    id: e.id,
    spent_on: isoDate(e.date) ?? new Date().toISOString().slice(0, 10),
    vendor: e.vendor,
    vendor_id: e.vendorId || null,
    category: e.category,
    amount: e.amount,
    currency: e.currency || "USD",
    fx_rate: e.fxRate || 1,
    paid: e.paid ?? false,
    event_id: e.eventId || null,
    notes: e.notes,
    receipt_url: e.receiptUrl,
  }),
};

export const taskMapper: Mapper<Task> = {
  table: "tasks",
  orderBy: "created_at",
  fromRow: (r) => ({
    id: str(r.id),
    title: str(r.title),
    eventId: str(r.event_id),
    assigneeId: str(r.assignee_id),
    stage: str(r.stage, "Planning") as TaskStage,
    priority: str(r.priority, "Medium") as TaskPriority,
    dueDate: str(r.due_on),
    completed: bool(r.completed),
    createdAt: str(r.created_at),
  }),
  toRow: (t) => ({
    id: t.id,
    title: t.title,
    event_id: t.eventId || null,
    assignee_id: t.assigneeId,
    stage: t.stage,
    priority: t.priority,
    due_on: isoDate(t.dueDate),
    completed: t.completed,
  }),
};
