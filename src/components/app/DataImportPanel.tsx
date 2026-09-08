import React, { useState } from "react";
import { Database, Loader2, CheckCircle2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Client, Event, Expense, Guest, Invoice, Task, Vendor } from "@/types";
import { clientMapper, eventMapper, expenseMapper, guestMapper, taskMapper, vendorMapper } from "@/lib/dbMappers";

const db = supabase as unknown as SupabaseClient;

const IMPORT_FLAG = "pgImportCompleted_v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Old browser records used readable ids ("cl-tariro-001"); Postgres needs UUIDs. */
function makeIdMapper() {
  const map = new Map<string, string>();
  return (oldId: string): string => {
    if (!oldId) return "";
    if (UUID_RE.test(oldId)) return oldId;
    const existing = map.get(oldId);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    map.set(oldId, fresh);
    return fresh;
  };
}

interface ImportSummary {
  clients: number;
  events: number;
  vendors: number;
  guests: number;
  expenses: number;
  tasks: number;
  invoices: number;
}

interface Props {
  toast: (msg: string) => void;
  onImported: () => void;
}

export function DataImportPanel({ toast, onImported }: Props) {
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [done, setDone] = useState(() => localStorage.getItem(IMPORT_FLAG) === "true");

  const counts = {
    clients: read<Client>("clients_v5").length,
    events: read<Event>("events_v5").length,
    vendors: read<Vendor>("vendors_v5").length,
    guests: read<Guest>("guests_v5").length,
    expenses: read<Expense>("expenses_v5").length,
    tasks: read<Task>("tasks_v5").length,
    invoices: read<Invoice>("invoices_v5").length,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const runImport = async () => {
    setRunning(true);
    const mapId = makeIdMapper();
    const result: ImportSummary = { clients: 0, events: 0, vendors: 0, guests: 0, expenses: 0, tasks: 0, invoices: 0 };

    const push = async (table: string, rows: Record<string, unknown>[]) => {
      if (!rows.length) return 0;
      const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
      if (error) throw new Error(`${table}: ${error.message}`);
      return rows.length;
    };

    try {
      const clients = read<Client>("clients_v5").map((c) => ({ ...c, id: mapId(c.id) }));
      result.clients = await push("clients", clients.map(clientMapper.toRow));

      const events = read<Event>("events_v5").map((e) => ({ ...e, id: mapId(e.id), clientId: mapId(e.clientId) }));
      result.events = await push("events", events.map(eventMapper.toRow));

      const vendors = read<Vendor>("vendors_v5").map((v) => ({
        ...v,
        id: mapId(v.id),
        eventIds: (v.eventIds ?? []).map(mapId),
      }));
      result.vendors = await push("vendors", vendors.map(vendorMapper.toRow));

      const guests = read<Guest>("guests_v5").map((g) => ({ ...g, id: mapId(g.id), eventId: mapId(g.eventId) }));
      result.guests = await push("guests", guests.map(guestMapper.toRow));

      const expenses = read<Expense>("expenses_v5").map((x) => ({ ...x, id: mapId(x.id), eventId: mapId(x.eventId) }));
      result.expenses = await push("expenses", expenses.map(expenseMapper.toRow));

      const tasks = read<Task>("tasks_v5").map((t) => ({ ...t, id: mapId(t.id), eventId: mapId(t.eventId) }));
      result.tasks = await push("tasks", tasks.map(taskMapper.toRow));

      // Invoices only when the shared list is still empty, so nothing is duplicated.
      const { count } = await db.from("invoices").select("id", { count: "exact", head: true });
      if (!count) {
        const invoices = read<Invoice>("invoices_v5");
        const invoiceRows = invoices.map((inv) => ({
          id: mapId(inv.id),
          client_id: mapId(inv.clientId) || null,
          event_id: mapId(inv.eventId) || null,
          status: inv.status,
          due_date: inv.dueDate,
          due_on: /^\d{4}-\d{2}-\d{2}$/.test(inv.dueDate) ? inv.dueDate : null,
          notes: inv.notes ?? "",
          tax_rate: inv.taxRate ?? 0,
          discount_type: inv.discountType ?? "flat",
          discount_value: inv.discountValue ?? 0,
          discount_amount: inv.discountAmount ?? 0,
          billing_type: inv.billingType ?? "single",
          milestones: inv.milestones ?? [],
          version: inv.version ?? 1,
        }));
        result.invoices = await push("invoices", invoiceRows);

        const lineRows = invoices.flatMap((inv) =>
          (inv.lineItems ?? []).map((li) => ({
            id: crypto.randomUUID(),
            invoice_id: mapId(inv.id),
            description: li.desc,
            quantity: li.qty,
            unit_price: li.unitPrice,
          })),
        );
        await push("line_items", lineRows);
      }

      localStorage.setItem(IMPORT_FLAG, "true");
      setSummary(result);
      setDone(true);
      onImported();
      toast("Browser data imported to the shared database");
    } catch (err) {
      console.error(err);
      toast(err instanceof Error ? err.message : "Import failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <h3 className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-4">Move Data To Shared Database</h3>
      <div className="border border-foreground p-4">
        <div className="text-sm font-sans font-semibold mb-1">Import from this browser</div>
        <div className="text-xs text-muted-foreground font-sans mb-3">
          Copies anything still saved only in this browser — clients, events, vendors, guests, expenses and tasks — into the
          shared database so the whole team sees it. Safe to run once.
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-sans mb-3">
          {Object.entries(counts).map(([label, n]) => (
            <div key={label} className="flex justify-between border-b border-input py-1">
              <span className="capitalize text-muted-foreground">{label}</span>
              <span className="font-semibold">{n}</span>
            </div>
          ))}
        </div>

        {summary && (
          <div className="flex items-start gap-2 text-xs font-sans mb-3">
            <CheckCircle2 size={14} className="mt-0.5" />
            <span>
              Imported {summary.clients} clients, {summary.events} events, {summary.vendors} vendors, {summary.guests} guests,{" "}
              {summary.expenses} expenses, {summary.tasks} tasks{summary.invoices ? `, ${summary.invoices} invoices` : ""}.
            </span>
          </div>
        )}

        <button
          onClick={runImport}
          disabled={running || total === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all duration-200 uppercase tracking-wide"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
          {running ? "Importing…" : done ? "Run Import Again" : "Import Browser Data"}
        </button>
        {total === 0 && (
          <p className="text-xs text-muted-foreground font-sans mt-2 text-center">Nothing left in this browser to import.</p>
        )}
        {done && total > 0 && (
          <p className="text-xs text-muted-foreground font-sans mt-2 text-center">Already imported once on this browser.</p>
        )}
      </div>
    </div>
  );
}
