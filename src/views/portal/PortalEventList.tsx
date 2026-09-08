import React, { useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { Client, Event, Invoice } from "@/types";
import { fmtDate, daysUntil } from "@/lib/helpers";
import { Badge } from "@/components/app/Badge";
import { PortalInvoiceCard } from "./PortalInvoices";

interface PortalEventListProps {
  events: Event[];
  invoices: Invoice[];
  client: Client;
  onUpdateStatus: (invoiceId: string, status: string, notes?: string) => Promise<void>;
}

export function PortalEventList({ events, invoices, client, onUpdateStatus }: PortalEventListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <div className="border border-input p-12 text-center">
        <CalendarDays size={32} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-sans text-muted-foreground">No events yet. Your planner will add them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((ev) => {
        const days = daysUntil(ev.date);
        const evInvoices = invoices.filter((inv) => inv.eventId === ev.id);
        const isExpanded = expanded === ev.id;

        return (
          <div key={ev.id} className="border border-foreground">
            <div
              className="p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : ev.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-lg">{ev.name}</span>
                    <Badge status={ev.status} />
                  </div>
                  <div className="text-sm text-muted-foreground font-sans mt-1">
                    {fmtDate(ev.date)}{ev.time ? ` · ${ev.time}` : ""}{ev.venue ? ` · ${ev.venue}` : ""}
                  </div>
                  {days >= 0 && ev.status !== "Wrapped" && (
                    <div className="text-xs font-sans text-muted-foreground mt-1">
                      {days === 0 ? "Today" : `${days} day${days !== 1 ? "s" : ""} away`}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-input px-4 sm:px-5 py-4">
                <div className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-3">Invoices</div>
                {evInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-sans">Nothing to review for this event yet.</p>
                ) : (
                  <div className="space-y-3">
                    {evInvoices.map((inv) => (
                      <PortalInvoiceCard key={inv.id} inv={inv} client={client} event={ev} onUpdateStatus={onUpdateStatus} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
