import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calcBudgetTotals, type Budget, type BudgetLine } from "@/types";

export interface BudgetWithLines extends Budget {
  lines: BudgetLine[];
}

/** Budgets and their lines for one event, plus revisions and invoice conversion. */
export function useBudgets(eventId: string | null) {
  const [budgets, setBudgets] = useState<BudgetWithLines[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!eventId) { setBudgets([]); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from("budgets")
      .select("*, budget_lines(*)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    const mapped = (data ?? []).map((b) => {
      const { budget_lines, ...budget } = b as typeof b & { budget_lines: BudgetLine[] };
      const lines = [...(budget_lines ?? [])].sort((a, z) => a.position - z.position);
      return { ...(budget as unknown as Budget), lines };
    });
    setBudgets(mapped);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const createBudget = useCallback(async (title: string, conceptId?: string | null) => {
    if (!eventId) throw new Error("No event selected");
    const { data, error: err } = await supabase.from("budgets")
      .insert({ event_id: eventId, title, concept_id: conceptId ?? null })
      .select().single();
    if (err) throw new Error(err.message);
    await refetch();
    return data as unknown as Budget;
  }, [eventId, refetch]);

  const updateBudget = useCallback(async (id: string, patch: Partial<Budget>) => {
    const { error: err } = await supabase.from("budgets").update(patch).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const deleteBudget = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("budgets").delete().eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const shareBudget = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("budgets")
      .update({ shared_at: new Date().toISOString(), status: "Shared" }).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const unshareBudget = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("budgets")
      .update({ shared_at: null, status: "Draft" }).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const addLine = useCallback(async (budgetId: string, line: Partial<BudgetLine> & { description: string }) => {
    const budget = budgets.find(b => b.id === budgetId);
    const position = budget ? budget.lines.length : 0;
    const { error: err } = await supabase.from("budget_lines")
      .insert({ ...line, budget_id: budgetId, position });
    if (err) throw new Error(err.message);
    await refetch();
  }, [budgets, refetch]);

  const updateLine = useCallback(async (id: string, patch: Partial<BudgetLine>) => {
    const { error: err } = await supabase.from("budget_lines").update(patch).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const deleteLine = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("budget_lines").delete().eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  /** A revision keeps the original as the root and copies its lines. */
  const createRevision = useCallback(async (budgetId: string) => {
    const source = budgets.find(b => b.id === budgetId);
    if (!source) throw new Error("Budget not found");
    const rootId = source.parent_id ?? source.id;
    const siblings = budgets.filter(b => b.id === rootId || b.parent_id === rootId);
    const nextVersion = Math.max(...siblings.map(b => b.version)) + 1;

    const { data: copy, error: err } = await supabase.from("budgets").insert({
      event_id: source.event_id,
      concept_id: null,
      title: source.title,
      currency: source.currency,
      contingency_type: source.contingency_type,
      contingency_value: source.contingency_value,
      notes: source.notes,
      internal_notes: source.internal_notes ?? null,
      version: nextVersion,
      parent_id: rootId,
    }).select().single();
    if (err || !copy) throw new Error(err?.message || "Could not create revision");

    if (source.lines.length > 0) {
      const { error: lineErr } = await supabase.from("budget_lines").insert(
        source.lines.map(l => ({
          budget_id: copy.id,
          category: l.category,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          vendor_name: l.vendor_name,
          vendor_id: l.vendor_id,
          status: l.status,
          position: l.position,
        })),
      );
      if (lineErr) throw new Error(lineErr.message);
    }
    await refetch();
    return copy.id as string;
  }, [budgets, refetch]);

  /**
   * The only point where budget figures enter billing. Lines are copied across;
   * no total is ever written, invoice maths stays with calcInvoiceTotals.
   */
  const convertToInvoice = useCallback(async (budgetId: string, includeContingency = false) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) throw new Error("Budget not found");

    const { data: event, error: evErr } = await supabase
      .from("events").select("id, client_id").eq("id", budget.event_id).maybeSingle();
    if (evErr) throw new Error(evErr.message);

    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const { data: invoice, error: invErr } = await supabase.from("invoices").insert({
      client_id: event?.client_id ?? null,
      event_id: budget.event_id,
      status: "Draft",
      billing_type: "single",
      currency: budget.currency,
      due_date: dueDate,
      due_on: dueDate,
      tax_rate: 0,
      discount_value: 0,
      discount_amount: 0,
    }).select().single();
    if (invErr || !invoice) throw new Error(invErr?.message || "Could not create invoice");

    const items = budget.lines.map(l => ({
      invoice_id: invoice.id,
      description: [l.category, l.vendor_name, l.description].filter(Boolean).join(" — "),
      quantity: Math.max(1, Math.round(Number(l.quantity) || 1)),
      unit_price: Number(l.unit_price) || 0,
    }));

    if (includeContingency) {
      const { contingency } = calcBudgetTotals(budget, budget.lines);
      if (contingency > 0) {
        items.push({ invoice_id: invoice.id, description: "Contingency", quantity: 1, unit_price: contingency });
      }
    }

    if (items.length > 0) {
      const { error: liErr } = await supabase.from("line_items").insert(items);
      if (liErr) throw new Error(liErr.message);
    }

    await supabase.from("audit_logs").insert({
      invoice_id: invoice.id,
      action: "Created from Budget",
      details: `Budget ${budget.id} version ${budget.version}`,
    });

    return invoice.id as string;
  }, [budgets]);

  return { budgets, loading, error, refetch, createBudget, updateBudget, deleteBudget, shareBudget, unshareBudget, addLine, updateLine, deleteLine, createRevision, convertToInvoice };
}
