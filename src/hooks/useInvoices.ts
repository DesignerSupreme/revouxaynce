import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DbInvoice = Tables<"invoices">;
export type DbLineItem = Tables<"line_items">;

export interface InvoiceWithLineItems extends DbInvoice {
  line_items: DbLineItem[];
  /** Computed total from line items */
  amount: number;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceWithLineItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("invoices")
      .select("*, line_items(*)")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const mapped: InvoiceWithLineItems[] = (data || []).map((inv) => {
      const items = (inv.line_items || []) as DbLineItem[];
      const amount = items.reduce((s, li) => s + li.quantity * Number(li.unit_price), 0);
      return { ...inv, line_items: items, amount };
    });

    setInvoices(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const logAudit = async (invoiceId: string, action: string, details?: string) => {
    await supabase.from("audit_logs").insert({
      invoice_id: invoiceId,
      action,
      performed_by: "admin",
      details: details || "",
    });
  };

  const createInvoice = async (
    invoiceData: Omit<TablesInsert<"invoices">, "id">,
    lineItems: { desc: string; qty: number; unitPrice: number }[]
  ) => {
    const { data: inv, error: err } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (err || !inv) throw new Error(err?.message || "Failed to create invoice");

    if (lineItems.length > 0) {
      const items = lineItems
        .filter((li) => li.desc.trim())
        .map((li) => ({
          invoice_id: inv.id,
          description: li.desc,
          quantity: li.qty,
          unit_price: li.unitPrice,
        }));

      if (items.length > 0) {
        const { error: liErr } = await supabase.from("line_items").insert(items);
        if (liErr) throw new Error(liErr.message);
      }
    }

    await logAudit(inv.id, "Created", `Invoice created with status ${inv.status}`);
    await fetchInvoices();
    return inv;
  };

  const updateInvoice = async (
    id: string,
    invoiceData: Partial<TablesInsert<"invoices">>,
    lineItems?: { desc: string; qty: number; unitPrice: number }[]
  ) => {
    // Grab old status for audit
    const old = invoices.find((i) => i.id === id);
    const { error: err } = await supabase
      .from("invoices")
      .update(invoiceData)
      .eq("id", id);

    if (err) throw new Error(err.message);

    if (lineItems !== undefined) {
      await supabase.from("line_items").delete().eq("invoice_id", id);
      const items = lineItems
        .filter((li) => li.desc.trim())
        .map((li) => ({
          invoice_id: id,
          description: li.desc,
          quantity: li.qty,
          unit_price: li.unitPrice,
        }));
      if (items.length > 0) {
        const { error: liErr } = await supabase.from("line_items").insert(items);
        if (liErr) throw new Error(liErr.message);
      }
    }

    if (old && invoiceData.status && invoiceData.status !== old.status) {
      await logAudit(id, "Status Changed", `${old.status} → ${invoiceData.status}`);
    } else {
      await logAudit(id, "Edited", "Invoice details updated");
    }

    await fetchInvoices();
  };

  const deleteInvoice = async (id: string) => {
    const { error: err } = await supabase.from("invoices").delete().eq("id", id);
    if (err) throw new Error(err.message);
    await fetchInvoices();
  };

  const duplicateInvoice = async (id: string) => {
    const source = invoices.find((i) => i.id === id);
    if (!source) throw new Error("Invoice not found");

    const { data: inv, error: err } = await supabase
      .from("invoices")
      .insert({
        client_id: source.client_id,
        event_id: source.event_id,
        status: "Draft",
        due_date: "",
        notes: source.notes || "",
        tax_rate: source.tax_rate,
        discount_amount: source.discount_amount,
        discount_type: source.discount_type,
        discount_value: source.discount_value,
      })
      .select()
      .single();

    if (err || !inv) throw new Error(err?.message || "Failed to duplicate");

    if (source.line_items.length > 0) {
      const items = source.line_items.map((li) => ({
        invoice_id: inv.id,
        description: li.description,
        quantity: li.quantity,
        unit_price: Number(li.unit_price),
      }));
      await supabase.from("line_items").insert(items);
    }

    await logAudit(inv.id, "Duplicated", `Cloned from invoice ${id.slice(0, 8)}`);
    await fetchInvoices();
    return inv;
  };

  const sendInvoiceEmail = async (invoiceId: string, clientEmail: string, clientName: string, amount: number) => {
    const portalUrl = `${window.location.origin}/portal/invoice/${invoiceId}`;
    const { data, error: err } = await supabase.functions.invoke("send-invoice-email", {
      body: { invoiceId, clientEmail, clientName, invoiceAmount: amount, portalUrl },
    });
    if (err) throw new Error(err.message);
    await logAudit(invoiceId, "Sent", `Emailed to ${clientEmail}`);
    await fetchInvoices();
    return data;
  };

  const markOverdue = async () => {
    const { error: err } = await supabase.rpc("mark_overdue_invoices");
    if (err) console.error("Failed to mark overdue:", err.message);
    else await fetchInvoices();
  };

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const old = invoices.find((i) => i.id === id);
    const updateData: Record<string, unknown> = { status };
    if (notes !== undefined) updateData.notes = notes;
    const { error: err } = await supabase.from("invoices").update(updateData).eq("id", id);
    if (err) throw new Error(err.message);
    await logAudit(id, "Status Changed", `${old?.status || "?"} → ${status}`);
    await fetchInvoices();
  };

  const bulkUpdateStatus = async (ids: string[], status: string) => {
    const { error: err } = await supabase.from("invoices").update({ status }).in("id", ids);
    if (err) throw new Error(err.message);
    for (const id of ids) {
      await logAudit(id, "Status Changed", `Bulk update to ${status}`);
    }
    await fetchInvoices();
  };

  const bulkDelete = async (ids: string[]) => {
    const { error: err } = await supabase.from("invoices").delete().in("id", ids);
    if (err) throw new Error(err.message);
    await fetchInvoices();
  };

  return {
    invoices, loading, error, fetchInvoices,
    createInvoice, updateInvoice, deleteInvoice, duplicateInvoice,
    sendInvoiceEmail, markOverdue, updateStatus,
    bulkUpdateStatus, bulkDelete, logAudit,
  };
}
