import React, { useState, useEffect } from "react";
import { FileText, Plus, Edit, Trash2, BarChart3, TrendingUp, Download, Loader2, Send } from "lucide-react";
import type { Expense, BudgetItem } from "@/types";
import { fmt$, fmtDate, shortDate } from "@/lib/helpers";
import { generateInvoicePDF } from "@/lib/invoicePdf";
import { Modal } from "@/components/app/Modal";
import { FormInput, FormTextArea, FormSelect, FormSelectLabeled, Btn } from "@/components/app/FormElements";
import { Badge } from "@/components/app/Badge";
import { Empty } from "@/components/app/Empty";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { FadeInUp } from "@/components/app/FadeInUp";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import { HBarChart, LineChart } from "@/components/app/Charts";
import { useInvoices, type InvoiceWithLineItems } from "@/hooks/useInvoices";
import { useSupabaseClients, type DbClient } from "@/hooks/useSupabaseClients";
import { useSupabaseEvents, type DbEvent } from "@/hooks/useSupabaseEvents";
import type { Client, Event, Invoice } from "@/types";

interface FinancesViewProps {
  expenses: Expense[];
  budgets: BudgetItem[];
  log: (text: string) => void;
  toast: (msg: string) => void;
}

/** Adapt DB types to legacy types used by PDF generator etc. */
function toClient(c: DbClient): Client {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || "",
    eventType: c.event_type || "",
    status: c.status || "Active",
    notes: Array.isArray(c.notes) ? (c.notes as { text: string; date: string }[]) : [],
    portalToken: c.portal_token || undefined,
  };
}

function toEvent(e: DbEvent): Event {
  return {
    id: e.id,
    name: e.name,
    date: e.date,
    time: e.time || "",
    venue: e.venue || "",
    clientId: e.client_id || "",
    status: e.status || "Planning",
    notes: e.notes || "",
  };
}

function toInvoice(inv: InvoiceWithLineItems): Invoice {
  return {
    id: inv.id,
    clientId: inv.client_id || "",
    eventId: inv.event_id || "",
    amount: inv.amount,
    status: inv.status,
    dueDate: inv.due_date,
    notes: inv.notes || "",
    lineItems: inv.line_items.map((li) => ({
      desc: li.description,
      qty: li.quantity,
      unitPrice: Number(li.unit_price),
      amount: li.quantity * Number(li.unit_price),
    })),
    taxRate: Number(inv.tax_rate) || 0,
    discountAmount: Number(inv.discount_amount) || 0,
    lastSentAt: inv.last_sent_at || undefined,
  };
}

export function FinancesView({ expenses, budgets, log, toast }: FinancesViewProps) {
  const { invoices: dbInvoices, loading, error, createInvoice, updateInvoice, deleteInvoice, sendInvoiceEmail, markOverdue } = useInvoices();
  const { clients: dbClients, loading: clientsLoading } = useSupabaseClients();
  const { events: dbEvents, loading: eventsLoading } = useSupabaseEvents();

  const invoices = dbInvoices.map(toInvoice);
  const clients = dbClients.map(toClient);
  const events = dbEvents.map(toEvent);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<InvoiceWithLineItems | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<{ desc: string; qty: number; unitPrice: number }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (error) toast(`Failed to load invoices: ${error}`);
  }, [error, toast]);

  // Auto-mark overdue invoices on load
  useEffect(() => {
    if (!loading) markOverdue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const outstanding = totalBilled - totalPaid;
  const overdue = invoices.filter(i => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const eventPL: { label: string; revenue: number; cost: number }[] = [];
  events.forEach(ev => {
    const rev = invoices.filter(i => i.eventId === ev.id && i.status === "Paid").reduce((s, i) => s + i.amount, 0);
    const cost = expenses.filter(e => e.eventId === ev.id).reduce((s, e) => s + e.amount, 0) +
                 budgets.filter(b => b.eventId === ev.id).reduce((s, b) => s + Number(b.actual), 0);
    if (rev > 0 || cost > 0) eventPL.push({ label: ev.name, revenue: rev, cost });
  });

  const invByStatus: Record<string, number> = {};
  invoices.forEach(i => { invByStatus[i.status] = (invByStatus[i.status] || 0) + i.amount; });
  const invStatusData = Object.entries(invByStatus).map(([label, value]) => ({ label, value }));

  const monthlyIncome: Record<string, number> = {};
  const monthlyExpense: Record<string, number> = {};
  invoices.filter(i => i.status === "Paid").forEach(i => { const m = i.dueDate.slice(0, 7); monthlyIncome[m] = (monthlyIncome[m] || 0) + i.amount; });
  expenses.forEach(e => { const m = e.date.slice(0, 7); monthlyExpense[m] = (monthlyExpense[m] || 0) + e.amount; });
  const allMonths = [...new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpense)])].sort();
  const cashFlowData = allMonths.map(m => ({
    label: new Date(m + "-01").toLocaleDateString("en-US", { month: "short" }),
    value: (monthlyIncome[m] || 0) - (monthlyExpense[m] || 0)
  }));

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    const items = lineItems.filter(li => li.desc.trim());

    try {
      if (editing) {
        await updateInvoice(editing.id, {
          client_id: obj.clientId || null,
          event_id: obj.eventId || null,
          status: obj.status || "Draft",
          due_date: obj.dueDate || "",
          notes: obj.notes || "",
        }, items);
        toast("Invoice updated");
        log(`Updated invoice`);
      } else {
        await createInvoice({
          client_id: obj.clientId || null,
          event_id: obj.eventId || null,
          status: obj.status || "Draft",
          due_date: obj.dueDate || "",
          notes: obj.notes || "",
        }, items);
        toast("Invoice created");
        log(`Created invoice`);
      }
      setModal(false); setEditing(null); setLineItems([]);
    } catch (err: any) {
      toast(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteInvoice(id);
      toast("Invoice deleted");
      log("Deleted an invoice");
    } catch (err: any) {
      toast(`Error: ${err.message}`);
    }
    setDeleting(null);
  };

  if (loading || clientsLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
        <span className="ml-3 text-sm text-muted-foreground font-sans">Loading finances…</span>
      </div>
    );
  }

  if (detail) {
    const inv = invoices.find(i => i.id === detail);
    if (!inv) { setDetail(null); return null; }
    const client = clients.find(c => c.id === inv.clientId);
    const event = events.find(e => e.id === inv.eventId);
    return (
      <div className="animate-fade-in">
        <button onClick={() => setDetail(null)} className="text-sm text-muted-foreground mb-4 font-sans hover:text-foreground transition-colors">← Back to Finances</button>
        <h1 className="text-3xl mb-2">Invoice</h1><Badge status={inv.status} />
        {inv.status === "Revision Requested" && inv.notes && (
          <div className="mt-2 border border-foreground/30 bg-muted/50 p-3 text-sm font-sans">
            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Client Revision Request</span>
            <p className="italic">"{inv.notes}"</p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => generateInvoicePDF(inv, client, event)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-sans uppercase tracking-wider border border-foreground hover:bg-foreground hover:text-background transition-all">
            <Download size={14} /> Download PDF
          </button>
          {(inv.status === "Sent" || inv.status === "Quotation") && client && (
            <button
              onClick={async () => {
                try {
                  await sendInvoiceEmail(inv.id, client.email, client.name, inv.amount);
                  toast(`Invoice sent to ${client.email}`);
                  log(`Sent invoice to ${client.name}`);
                } catch (err: any) {
                  toast(`Error: ${err.message}`);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-sans uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 transition-all"
            >
              <Send size={14} /> Send to Client
            </button>
          )}
        </div>
        {inv.lastSentAt && (
          <p className="text-xs text-muted-foreground font-sans mt-2">
            Last sent: {new Date(inv.lastSentAt).toLocaleString()}
          </p>
        )}
        <div className="mt-6 space-y-2 text-sm font-sans">
          {client && <p><span className="text-muted-foreground">Client:</span> {client.name}</p>}
          {event && <p><span className="text-muted-foreground">Event:</span> {event.name}</p>}
          <p><span className="text-muted-foreground">Amount:</span> {fmt$(inv.amount)}</p>
          <p><span className="text-muted-foreground">Due Date:</span> {fmtDate(inv.dueDate)}</p>
          {(inv.taxRate ?? 0) > 0 && <p><span className="text-muted-foreground">Tax Rate:</span> {inv.taxRate}%</p>}
          {(inv.discountAmount ?? 0) > 0 && <p><span className="text-muted-foreground">Discount:</span> {fmt$(inv.discountAmount!)}</p>}
          {inv.notes && inv.status !== "Revision Requested" && <p><span className="text-muted-foreground">Notes:</span> {inv.notes}</p>}
        </div>
        {inv.lineItems.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-2">Line Items</h3>
            <table className="w-full text-sm font-sans">
              <thead><tr className="border-b border-foreground text-xs uppercase tracking-wider text-muted-foreground"><th className="py-2 text-left">Description</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit Price</th><th className="py-2 text-right">Total</th></tr></thead>
              <tbody>{inv.lineItems.map((li, i) => (<tr key={i} className={i % 2 === 1 ? "bg-muted/30" : ""}><td className="py-2">{li.desc}</td><td className="py-2 text-right">{li.qty}</td><td className="py-2 text-right">{fmt$(li.unitPrice)}</td><td className="py-2 text-right">{fmt$(li.amount)}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl">Finances</h1>
        <Btn onClick={() => { setEditing(null); setLineItems([{ desc: "", qty: 1, unitPrice: 0 }]); setModal(true); }}><Plus size={14} className="inline mr-1" /> New Invoice</Btn>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {[
          { label: "Total Billed", value: totalBilled },
          { label: "Total Paid", value: totalPaid },
          { label: "Outstanding", value: outstanding },
          { label: "Overdue", value: overdue },
          { label: "Net Profit", value: totalPaid - totalExpenses },
        ].map((c, i) => (
          <FadeInUp key={c.label} delay={i * 60}>
            <div className="border border-foreground p-3 sm:p-4">
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1 font-sans">{c.label}</div>
              <div className="text-lg sm:text-xl font-display"><AnimatedNumber value={c.value} prefix="$" /></div>
            </div>
          </FadeInUp>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <FadeInUp delay={100}>
          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Invoice Status Breakdown</h3>
            </div>
            <HBarChart data={invStatusData} />
          </div>
        </FadeInUp>
        <FadeInUp delay={150}>
          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Monthly Cash Flow</h3>
            </div>
            <LineChart data={cashFlowData} height={180} />
          </div>
        </FadeInUp>
      </div>

      {eventPL.length > 0 && (
        <FadeInUp delay={200}>
          <div className="border border-foreground p-4 sm:p-5 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Per-Event P&L</h3>
            </div>
            <div className="space-y-3">
              {eventPL.map((ep, i) => (
                <div key={i}>
                  <div className="text-xs font-sans font-semibold mb-1">{ep.label}</div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs font-sans">
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">Revenue</span><span>{fmt$(ep.revenue)}</span></div>
                      <div className="w-full bg-muted h-2"><div className="h-2 bg-foreground transition-all duration-700" style={{ width: `${Math.min(100, (ep.revenue / Math.max(ep.revenue, ep.cost, 1)) * 100)}%` }} /></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">Costs</span><span>{fmt$(ep.cost)}</span></div>
                      <div className="w-full bg-muted h-2"><div className="h-2 bg-foreground opacity-40 transition-all duration-700" style={{ width: `${Math.min(100, (ep.cost / Math.max(ep.revenue, ep.cost, 1)) * 100)}%` }} /></div>
                    </div>
                  </div>
                  <div className="text-xs font-sans mt-0.5 text-muted-foreground">
                    Profit: {fmt$(ep.revenue - ep.cost)} ({ep.revenue > 0 ? `${((ep.revenue - ep.cost) / ep.revenue * 100).toFixed(0)}%` : "—"})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeInUp>
      )}

      {invoices.length === 0 ? <Empty icon={FileText} text="No invoices yet." /> : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm font-sans min-w-[640px]">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4 pl-4 sm:pl-0">Client</th><th className="py-2 pr-4">Event</th><th className="py-2 pr-4 text-right">Amount</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Due</th><th className="py-2 w-20"></th>
            </tr></thead>
            <tbody>
              {invoices.map((inv, i) => {
                const client = clients.find(c => c.id === inv.clientId);
                const event = events.find(e => e.id === inv.eventId);
                const dbInv = dbInvoices.find(d => d.id === inv.id);
                return (
                  <tr key={inv.id} className={`cursor-pointer hover:bg-muted/50 transition-colors ${i % 2 === 1 ? "bg-muted/30" : ""}`} onClick={() => setDetail(inv.id)}>
                    <td className="py-2 pr-4 pl-4 sm:pl-0">{client?.name || "—"}</td><td className="py-2 pr-4">{event?.name || "—"}</td>
                    <td className="py-2 pr-4 text-right">{fmt$(inv.amount)}</td><td className="py-2 pr-4"><Badge status={inv.status} /></td>
                    <td className="py-2 pr-4">{shortDate(inv.dueDate)}</td>
                    <td className="py-2" onClick={e => e.stopPropagation()}>
                      {deleting === inv.id ? <ConfirmDelete onConfirm={() => remove(inv.id)} onCancel={() => setDeleting(null)} /> : (
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-muted transition-colors" onClick={() => {
                            if (dbInv) {
                              setEditing(dbInv);
                              setLineItems(dbInv.line_items.map(li => ({ desc: li.description, qty: li.quantity, unitPrice: Number(li.unit_price) })));
                            }
                            setModal(true);
                          }}><Edit size={14} /></button>
                          <button className="p-1 hover:bg-muted transition-colors" onClick={() => setDeleting(inv.id)}><Trash2 size={14} /></button>
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
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); setLineItems([]); }} title={editing ? "Edit Invoice" : "New Invoice"}>
        <form onSubmit={save}>
          <FormSelectLabeled label="Client" name="clientId" options={clients.map(c => ({ value: c.id, label: c.name }))} defaultValue={editing?.client_id || undefined} />
          <FormSelectLabeled label="Event" name="eventId" options={events.map(e => ({ value: e.id, label: e.name }))} defaultValue={editing?.event_id || undefined} />
          <FormSelect label="Status" name="status" options={["Draft", "Quotation", "Sent", "Paid", "Overdue"]} defaultValue={editing?.status || "Draft"} />
          <FormInput label="Due Date" name="dueDate" type="date" defaultValue={editing?.due_date} />

          {/* Line Items */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Line Items</label>
              <button type="button" className="text-xs font-sans underline hover:text-foreground text-muted-foreground" onClick={() => setLineItems(li => [...li, { desc: "", qty: 1, unitPrice: 0 }])}>+ Add Item</button>
            </div>
            {lineItems.length > 0 && (
              <div className="space-y-2">
                {lineItems.map((li, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input className="flex-1 border border-foreground bg-background px-2 py-1.5 text-sm font-sans" placeholder="Description" value={li.desc} onChange={e => { const n = [...lineItems]; n[i] = { ...n[i], desc: e.target.value }; setLineItems(n); }} />
                    <input className="w-16 border border-foreground bg-background px-2 py-1.5 text-sm font-sans text-right" type="number" min="1" placeholder="Qty" value={li.qty} onChange={e => { const n = [...lineItems]; n[i] = { ...n[i], qty: parseInt(e.target.value) || 1 }; setLineItems(n); }} />
                    <input className="w-24 border border-foreground bg-background px-2 py-1.5 text-sm font-sans text-right" type="number" step="0.01" placeholder="Price" value={li.unitPrice || ""} onChange={e => { const n = [...lineItems]; n[i] = { ...n[i], unitPrice: parseFloat(e.target.value) || 0 }; setLineItems(n); }} />
                    <span className="w-24 text-sm font-sans text-right py-1.5 text-muted-foreground">{fmt$(li.qty * li.unitPrice)}</span>
                    <button type="button" className="p-1.5 hover:bg-muted text-muted-foreground" onClick={() => setLineItems(lineItems.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                  </div>
                ))}
                <div className="text-right text-sm font-sans font-semibold border-t border-foreground pt-2">
                  Total: {fmt$(lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0))}
                </div>
              </div>
            )}
            {lineItems.length === 0 && (
              <p className="text-xs text-muted-foreground font-sans">Click "+ Add Item" to add line items.</p>
            )}
          </div>

          <FormTextArea label="Notes" name="notes" defaultValue={editing?.notes || ""} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); setLineItems([]); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
