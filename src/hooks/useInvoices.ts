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

    await fetchInvoices();
    return inv;
  };

  const updateInvoice = async (
    id: string,
    invoiceData: Partial<TablesInsert<"invoices">>,
    lineItems?: { desc: string; qty: number; unitPrice: number }[]
  ) => {
    const { error: err } = await supabase
      .from("invoices")
      .update(invoiceData)
      .eq("id", id);

    if (err) throw new Error(err.message);

    if (lineItems !== undefined) {
      // Delete existing line items and re-insert
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

    await fetchInvoices();
  };

  const deleteInvoice = async (id: string) => {
    const { error: err } = await supabase.from("invoices").delete().eq("id", id);
    if (err) throw new Error(err.message);
    await fetchInvoices();
  };

  return { invoices, loading, error, fetchInvoices, createInvoice, updateInvoice, deleteInvoice };
}
