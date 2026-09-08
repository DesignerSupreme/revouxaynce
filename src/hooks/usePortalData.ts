import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortalClient } from "@/lib/portalClient";
import type { Client, Event, Invoice, Milestone } from "@/types";

/**
 * Explicit column list. `internal_notes` and `assigned_to` are not granted to
 * anonymous readers in the database and must never be requested here.
 */
const INVOICE_COLUMNS =
  "id, client_id, event_id, status, due_date, notes, tax_rate, discount_type, discount_value, discount_amount, billing_type, milestones, version, parent_id, last_sent_at, created_at, line_items(id, description, quantity, unit_price)";

interface RawLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number | string;
}

export interface PortalData {
  client: Client | null;
  events: Event[];
  invoices: Invoice[];
  loading: boolean;
  denied: boolean;
  refresh: () => Promise<void>;
  updateInvoiceStatus: (invoiceId: string, status: string, notes?: string) => Promise<void>;
}

export function usePortalData(token: string | null): PortalData {
  const supabase = useMemo(() => (token ? createPortalClient(token) : null), [token]);
  const [client, setClient] = useState<Client | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [denied, setDenied] = useState(!token);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setDenied(true);
      return;
    }
    setLoading(true);

    const { data: clientRows } = await supabase.rpc("portal_current_client");
    const row = Array.isArray(clientRows) ? clientRows[0] : null;

    if (!row) {
      setClient(null);
      setEvents([]);
      setInvoices([]);
      setDenied(true);
      setLoading(false);
      return;
    }

    setDenied(false);
    setClient({
      id: row.id,
      name: row.name,
      email: row.email ?? "",
      phone: row.phone ?? "",
      pipelineStage: "Enquiry",
      eventType: "",
      status: "",
      notes: [],
    });

    const [{ data: eventRows }, { data: invoiceRows }] = await Promise.all([
      supabase.from("events").select("*").eq("client_id", row.id).order("date"),
      supabase.from("invoices").select(INVOICE_COLUMNS).eq("client_id", row.id).order("created_at", { ascending: false }),
    ]);

    setEvents(
      (eventRows ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        time: e.time ?? "",
        venue: e.venue ?? "",
        clientId: e.client_id ?? "",
        status: e.status ?? "Planning",
        notes: e.notes ?? "",
      })),
    );

    setInvoices(
      (invoiceRows ?? []).map((inv) => {
        const items = ((inv.line_items ?? []) as RawLineItem[]).map((li) => ({
          desc: li.description,
          qty: li.quantity,
          unitPrice: Number(li.unit_price),
          amount: li.quantity * Number(li.unit_price),
        }));
        return {
          id: inv.id,
          clientId: inv.client_id ?? "",
          eventId: inv.event_id ?? "",
          amount: items.reduce((s, li) => s + li.amount, 0),
          status: inv.status,
          dueDate: inv.due_date,
          notes: inv.notes ?? "",
          lineItems: items,
          taxRate: inv.tax_rate == null ? undefined : Number(inv.tax_rate),
          discountType: (inv.discount_type as "percent" | "flat" | null) ?? undefined,
          discountValue: inv.discount_value == null ? undefined : Number(inv.discount_value),
          discountAmount: inv.discount_amount == null ? undefined : Number(inv.discount_amount),
          lastSentAt: inv.last_sent_at ?? undefined,
          billingType: (inv.billing_type as "single" | "milestone" | null) ?? undefined,
          milestones: (inv.milestones as unknown as Milestone[] | null) ?? undefined,
          version: inv.version ?? undefined,
          parentId: inv.parent_id ?? null,
        } satisfies Invoice;
      }),
    );

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateInvoiceStatus = useCallback(
    async (invoiceId: string, status: string, notes?: string) => {
      if (!supabase) return;
      const payload: { status: string; notes?: string } = { status };
      if (notes !== undefined) payload.notes = notes;
      await supabase.from("invoices").update(payload).eq("id", invoiceId);
      await refresh();
    },
    [supabase, refresh],
  );

  return { client, events, invoices, loading, denied, refresh, updateInvoiceStatus };
}
