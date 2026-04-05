import React, { useState, useMemo } from "react";
import { CalendarDays, FileText, Download, CheckCircle, Clock, AlertCircle, ChevronRight, Send, MessageSquare } from "lucide-react";
import type { Client, Event, Invoice, Task, TaskStage } from "@/types";
import { fmt$, fmtDate, shortDate, daysUntil } from "@/lib/helpers";
import { Badge } from "@/components/app/Badge";
import { FadeInUp } from "@/components/app/FadeInUp";
import { generateInvoicePDF } from "@/lib/invoicePdf";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/revouxaynce-logo.svg";

const STAGES: TaskStage[] = ["Planning", "Vendor Coordination", "Setup & Logistics", "Event Execution", "Post-Event"];

interface ClientPortalViewProps {
  client: Client;
  events: Event[];
  invoices: Invoice[];
  tasks: Task[];
  onLogout: () => void;
  onInvoiceUpdate?: () => void;
}

export function ClientPortalView({ client, events, invoices, tasks, onLogout, onInvoiceUpdate }: ClientPortalViewProps) {
  const clientEvents = useMemo(() => events.filter(e => e.clientId === client.id), [events, client.id]);
  const clientInvoices = useMemo(() => invoices.filter(i => i.clientId === client.id), [invoices, client.id]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [revisionInvoiceId, setRevisionInvoiceId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAcceptQuotation = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      await supabase.from("invoices").update({ status: "Sent" }).eq("id", invoiceId);
      onInvoiceUpdate?.();
    } catch (err) {
      console.error("Failed to accept quotation:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = async (invoiceId: string) => {
    if (!revisionNotes.trim()) return;
    setActionLoading(invoiceId);
    try {
      await supabase
        .from("invoices")
        .update({ status: "Revision Requested", notes: revisionNotes.trim() })
        .eq("id", invoiceId);
      setRevisionInvoiceId(null);
      setRevisionNotes("");
      onInvoiceUpdate?.();
    } catch (err) {
      console.error("Failed to request revision:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="Revouxaynce" className="h-8 w-auto" />
          <div className="flex items-center gap-4">
            <span className="text-sm font-sans text-muted-foreground hidden sm:inline">Welcome, {client.name}</span>
            <button onClick={onLogout} className="text-xs font-sans uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl mb-1">Your Events</h1>
        <p className="text-sm text-muted-foreground font-sans mb-8">View your events, track progress, and manage invoices.</p>

        {clientEvents.length === 0 ? (
          <div className="border border-input p-12 text-center">
            <CalendarDays size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-sans text-muted-foreground">No events found for your account.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientEvents.map((ev, i) => {
              const days = daysUntil(ev.date);
              const evInvoices = clientInvoices.filter(inv => inv.eventId === ev.id);
              const evTasks = tasks.filter(t => t.eventId === ev.id);
              const isExpanded = selectedEvent === ev.id;

              const completedStages = new Set(evTasks.filter(t => t.completed).map(t => t.stage));
              const currentStageIdx = STAGES.findIndex(s => !completedStages.has(s));
              const progressPct = evTasks.length > 0
                ? Math.round((evTasks.filter(t => t.completed).length / evTasks.length) * 100)
                : (currentStageIdx > 0 ? Math.round((currentStageIdx / STAGES.length) * 100) : 0);

              return (
                <FadeInUp key={ev.id} delay={i * 60}>
                  <div className="border border-foreground">
                    <div
                      className="p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedEvent(isExpanded ? null : ev.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display text-lg">{ev.name}</span>
                            <Badge status={ev.status} />
                          </div>
                          <div className="text-sm text-muted-foreground font-sans mt-1">
                            {fmtDate(ev.date)} · {ev.time} · {ev.venue}
                          </div>
                          {days >= 0 && ev.status !== "Wrapped" && (
                            <div className="text-xs font-sans text-muted-foreground mt-1">
                              {days === 0 ? "Today!" : `${days} day${days !== 1 ? "s" : ""} away`}
                            </div>
                          )}
                        </div>
                        <ChevronRight size={16} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>

                      {ev.status !== "Wrapped" && evTasks.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">Progress</span>
                            <span className="text-[10px] font-sans text-muted-foreground">{progressPct}%</span>
                          </div>
                          <div className="w-full bg-muted h-1.5">
                            <div className="h-1.5 bg-foreground transition-all duration-700" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-input animate-fade-in">
                        {evTasks.length > 0 && (
                          <div className="px-4 sm:px-5 py-4 border-b border-input">
                            <div className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-3">Event Stages</div>
                            <div className="flex gap-1">
                              {STAGES.map((stage) => {
                                const stageTasks = evTasks.filter(t => t.stage === stage);
                                const allDone = stageTasks.length > 0 && stageTasks.every(t => t.completed);
                                const hasActive = stageTasks.some(t => !t.completed);
                                return (
                                  <div key={stage} className="flex-1 text-center">
                                    <div className={`h-2 mb-1.5 ${allDone ? "bg-foreground" : hasActive ? "bg-foreground/40" : "bg-muted"}`} />
                                    <div className={`text-[9px] font-sans uppercase tracking-wider ${allDone ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                                      {stage.replace("& ", "&\n")}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="px-4 sm:px-5 py-4">
                          <div className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-3">Invoices</div>
                          {evInvoices.length === 0 ? (
                            <p className="text-sm text-muted-foreground font-sans">No invoices for this event.</p>
                          ) : (
                            <div className="space-y-3">
                              {evInvoices.map(inv => (
                                <InvoiceCard
                                  key={inv.id}
                                  inv={inv}
                                  client={client}
                                  event={ev}
                                  actionLoading={actionLoading}
                                  revisionInvoiceId={revisionInvoiceId}
                                  revisionNotes={revisionNotes}
                                  onAccept={handleAcceptQuotation}
                                  onRequestRevision={() => setRevisionInvoiceId(inv.id)}
                                  onSubmitRevision={() => handleRequestRevision(inv.id)}
                                  onCancelRevision={() => { setRevisionInvoiceId(null); setRevisionNotes(""); }}
                                  onRevisionNotesChange={setRevisionNotes}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </FadeInUp>
              );
            })}
          </div>
        )}

        {/* All Invoices Section */}
        {clientInvoices.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl mb-4">All Invoices</h2>
            <div className="border border-foreground">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans min-w-[500px]">
                  <thead>
                    <tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted">
                      <th className="py-2.5 px-4">Event</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Due</th>
                      <th className="py-2.5 px-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientInvoices.map((inv, i) => {
                      const ev = events.find(e => e.id === inv.eventId);
                      return (
                        <tr key={inv.id} className={`transition-colors ${i % 2 === 1 ? "bg-muted/30" : ""}`}>
                          <td className="py-2.5 px-4">{ev?.name || "—"}</td>
                          <td className="py-2.5 px-4 text-right font-semibold">{fmt$(inv.amount)}</td>
                          <td className="py-2.5 px-4"><Badge status={inv.status} /></td>
                          <td className="py-2.5 px-4">{shortDate(inv.dueDate)}</td>
                          <td className="py-2.5 px-4">
                            <button
                              onClick={() => generateInvoicePDF(inv, client, ev)}
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
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-input text-center">
          <p className="text-xs text-muted-foreground font-sans">
            Powered by Revouxaynce · Premium Event Management
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Card with Actions ────────────────────────────────────
interface InvoiceCardProps {
  inv: Invoice;
  client: Client;
  event: Event;
  actionLoading: string | null;
  revisionInvoiceId: string | null;
  revisionNotes: string;
  onAccept: (id: string) => void;
  onRequestRevision: () => void;
  onSubmitRevision: () => void;
  onCancelRevision: () => void;
  onRevisionNotesChange: (notes: string) => void;
}

function InvoiceCard({
  inv, client, event, actionLoading, revisionInvoiceId, revisionNotes,
  onAccept, onRequestRevision, onSubmitRevision, onCancelRevision, onRevisionNotesChange,
}: InvoiceCardProps) {
  const isLoading = actionLoading === inv.id;
  const showActions = inv.status === "Quotation" || inv.status === "Sent";
  const isRevising = revisionInvoiceId === inv.id;

  return (
    <div className="border border-input p-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText size={14} className="text-muted-foreground" />
            <span className="text-sm font-sans font-semibold">{fmt$(inv.amount)}</span>
            <Badge status={inv.status} />
          </div>
          <div className="text-xs text-muted-foreground font-sans mt-0.5">
            Due {shortDate(inv.dueDate)}
            {inv.lineItems.length > 0 && ` · ${inv.lineItems.length} item${inv.lineItems.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={(e) => { e.stopPropagation(); generateInvoicePDF(inv, client, event); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-foreground hover:bg-foreground hover:text-background transition-all"
          >
            <Download size={12} /> PDF
          </button>
        </div>
      </div>

      {/* Client Actions */}
      {showActions && !isRevising && (
        <div className="mt-3 pt-3 border-t border-input flex flex-wrap gap-2">
          <button
            disabled={isLoading}
            onClick={() => onAccept(inv.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 transition-all disabled:opacity-50"
          >
            <CheckCircle size={12} /> {isLoading ? "Processing…" : "Accept Quotation"}
          </button>
          <button
            onClick={onRequestRevision}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-foreground hover:bg-muted transition-all"
          >
            <MessageSquare size={12} /> Request Revision
          </button>
        </div>
      )}

      {/* Revision Form */}
      {isRevising && (
        <div className="mt-3 pt-3 border-t border-input space-y-2">
          <label className="text-xs font-sans uppercase tracking-wider text-muted-foreground block">
            What changes would you like?
          </label>
          <textarea
            value={revisionNotes}
            onChange={(e) => onRevisionNotesChange(e.target.value)}
            placeholder="Describe the changes you'd like to the quotation..."
            className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground transition-colors min-h-[80px]"
          />
          <div className="flex gap-2">
            <button
              disabled={isLoading || !revisionNotes.trim()}
              onClick={onSubmitRevision}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 transition-all disabled:opacity-50"
            >
              <Send size={12} /> {isLoading ? "Sending…" : "Submit Request"}
            </button>
            <button
              onClick={onCancelRevision}
              className="px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-input hover:bg-muted transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Revision Requested indicator */}
      {inv.status === "Revision Requested" && (
        <div className="mt-3 pt-3 border-t border-input">
          <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <Clock size={12} /> Revision requested — awaiting update from the team.
          </div>
          {inv.notes && (
            <p className="text-xs font-sans text-muted-foreground mt-1 italic">"{inv.notes}"</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Portal Login ─────────────────────────────────────────────────
interface PortalLoginProps {
  clients: Client[];
  onLogin: (client: Client) => void;
}

export function PortalLogin({ clients, onLogin }: PortalLoginProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (client) {
      onLogin(client);
      setError("");
    } else {
      setError("No account found with that email.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logo} alt="Revouxaynce" className="h-10 w-auto mx-auto mb-4" />
          <h1 className="text-2xl mb-1">Client Portal</h1>
          <p className="text-sm text-muted-foreground font-sans">Enter your email to view your events and invoices.</p>
        </div>
        <form onSubmit={handleSubmit} className="border border-foreground p-6">
          <label className="block mb-3">
            <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground transition-colors"
              placeholder="your@email.com"
              required
            />
          </label>
          {error && <p className="text-xs font-sans text-foreground mb-3 border border-foreground px-2 py-1.5 bg-muted">{error}</p>}
          <button type="submit" className="w-full bg-foreground text-background py-2.5 text-sm font-sans uppercase tracking-wider hover:bg-foreground/90 transition-colors">
            Access Portal
          </button>
        </form>
      </div>
    </div>
  );
}
