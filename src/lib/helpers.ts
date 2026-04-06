export const uid = () => crypto.randomUUID();

export const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export const fmtDate = (d: string) => {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

export const shortDate = (d: string) => {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const daysUntil = (dateStr: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export { calcInvoiceTotals } from "@/types";

export function invoicesToCsv(invoices: { id: string; clientName: string; eventName: string; amount: number; status: string; dueDate: string }[]): string {
  const header = "Invoice ID,Client,Event,Amount,Status,Due Date\n";
  const rows = invoices.map((i) =>
    `${i.id.slice(0, 8)},${i.clientName.replace(/,/g, "")},${i.eventName.replace(/,/g, "")},${i.amount},${i.status},${i.dueDate}`
  ).join("\n");
  return header + rows;
}

export function invoiceReportCsv(invoices: {
  id: string; clientName: string; eventName: string; amount: number; status: string;
  dueDate: string; milestoneProgress: string; lastReminder: string;
}[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = "Invoice ID,Client,Event,Status,Total,Due Date,Milestone Progress,Last Reminder\n";
  const rows = invoices.map(i =>
    [i.id.slice(0, 8), esc(i.clientName), esc(i.eventName), i.status, i.amount.toFixed(2), i.dueDate, esc(i.milestoneProgress), i.lastReminder].join(",")
  ).join("\n");
  return header + rows;
}
