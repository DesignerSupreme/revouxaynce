import React, { useState } from "react";
import { FileText, Download, CheckCircle, Clock, Send, MessageSquare } from "lucide-react";
import type { Client, Event, Invoice } from "@/types";
import { fmt$, shortDate } from "@/lib/helpers";
import { Badge } from "@/components/app/Badge";
import { generateInvoicePDF } from "@/lib/invoicePdf";

interface InvoiceCardProps {
  inv: Invoice;
  client: Client;
  event?: Event;
  onUpdateStatus: (invoiceId: string, status: string, notes?: string) => Promise<void>;
}

export function PortalInvoiceCard({ inv, client, event, onUpdateStatus }: InvoiceCardProps) {
  const [busy, setBusy] = useState(false);
  const [revising, setRevising] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const showActions = inv.status === "Quotation" || inv.status === "Sent";

  const accept = async () => {
    setBusy(true);
    try {
      await onUpdateStatus(inv.id, "Sent");
    } finally {
      setBusy(false);
    }
  };

  const submitRevision = async () => {
    if (!revisionNotes.trim()) return;
    setBusy(true);
    try {
      await onUpdateStatus(inv.id, "Revision Requested", revisionNotes.trim());
      setRevising(false);
      setRevisionNotes("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-input p-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText size={14} className="text-muted-foreground" />
            <span className="text-sm font-sans font-semibold tabular-nums">{fmt$(inv.amount)}</span>
            <Badge status={inv.status} />
          </div>
          <div className="text-xs text-muted-foreground font-sans mt-0.5">
            Due {shortDate(inv.dueDate)}
            {inv.lineItems.length > 0 && ` · ${inv.lineItems.length} item${inv.lineItems.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={(e) => { e.stopPropagation(); void generateInvoicePDF(inv, client, event); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            <Download size={12} /> PDF
          </button>
        </div>
      </div>

      {showActions && !revising && (
        <div className="mt-3 pt-3 border-t border-input flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={accept}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            <CheckCircle size={12} /> {busy ? "Accepting…" : "Accept quotation"}
          </button>
          <button
            onClick={() => setRevising(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-foreground hover:bg-muted transition-colors"
          >
            <MessageSquare size={12} /> Request changes
          </button>
        </div>
      )}

      {revising && (
        <div className="mt-3 pt-3 border-t border-input space-y-2">
          <label className="text-xs font-sans uppercase tracking-wider text-muted-foreground block">
            What would you like changed?
          </label>
          <textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="Describe the changes you would like."
            className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground transition-colors min-h-[80px]"
          />
          <div className="flex gap-2">
            <button
              disabled={busy || !revisionNotes.trim()}
              onClick={submitRevision}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              <Send size={12} /> {busy ? "Sending…" : "Send request"}
            </button>
            <button
              onClick={() => { setRevising(false); setRevisionNotes(""); }}
              className="px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-input hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {inv.status === "Revision Requested" && (
        <div className="mt-3 pt-3 border-t border-input">
          <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <Clock size={12} /> Changes requested — your planner is updating this.
          </div>
          {inv.notes && <p className="text-xs font-sans text-muted-foreground mt-1 italic">"{inv.notes}"</p>}
        </div>
      )}
    </div>
  );
}

interface PortalInvoiceTableProps {
  invoices: Invoice[];
  events: Event[];
  client: Client;
}

export function PortalInvoiceTable({ invoices, events, client }: PortalInvoiceTableProps) {
  if (invoices.length === 0) return null;
  return (
    <div className="mt-10">
      <h2 className="text-xl mb-4">All invoices</h2>
      <div className="border border-foreground overflow-x-auto">
        <table className="w-full text-sm font-sans min-w-[500px]">
          <thead>
            <tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted">
              <th className="py-2.5 px-4">Event</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Due</th>
              <th className="py-2.5 px-4 w-16" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => {
              const ev = events.find((e) => e.id === inv.eventId);
              return (
                <tr key={inv.id} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                  <td className="py-2.5 px-4">{ev?.name || "—"}</td>
                  <td className="py-2.5 px-4 text-right font-semibold tabular-nums">{fmt$(inv.amount)}</td>
                  <td className="py-2.5 px-4"><Badge status={inv.status} /></td>
                  <td className="py-2.5 px-4 tabular-nums">{shortDate(inv.dueDate)}</td>
                  <td className="py-2.5 px-4">
                    <button
                      onClick={() => void generateInvoicePDF(inv, client, ev)}
                      className="p-1.5 hover:bg-muted transition-colors"
                      title="Download PDF"
                    >
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
