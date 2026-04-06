import React, { useState, useMemo } from "react";
import { TrendingUp, BarChart3, AlertTriangle, Target, Download, Filter, Calendar } from "lucide-react";
import { FadeInUp } from "@/components/app/FadeInUp";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import { HBarChart, LineChart } from "@/components/app/Charts";
import { fmt$, shortDate } from "@/lib/helpers";
import { calcInvoiceTotals } from "@/types";
import type { Invoice, Client, Event, Milestone } from "@/types";

interface AnalyticsDashboardProps {
  invoices: Invoice[];
  clients: Client[];
  events: Event[];
  onExport: (filtered: Invoice[]) => void;
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function AnalyticsDashboard({ invoices, clients, events, onExport }: AnalyticsDashboardProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (dateFrom) list = list.filter(i => i.dueDate >= dateFrom);
    if (dateTo) list = list.filter(i => i.dueDate <= dateTo);
    if (filterClient) list = list.filter(i => i.clientId === filterClient);
    if (filterStatus) list = list.filter(i => i.status === filterStatus);
    return list;
  }, [invoices, dateFrom, dateTo, filterClient, filterStatus]);

  // ─── Metric: Pipeline ────────────────────────────────
  const pipeline = useMemo(() => {
    return filtered
      .filter(i => i.status === "Quotation" || i.status === "Sent")
      .reduce((s, i) => s + i.amount, 0);
  }, [filtered]);

  // ─── Metric: Approved/Active ─────────────────────────
  const approvedActive = useMemo(() => {
    let total = 0;
    for (const inv of filtered) {
      if (inv.status === "Approved") { total += inv.amount; continue; }
      if (inv.billingType === "milestone" && inv.milestones) {
        const totals = calcInvoiceTotals(
          inv.lineItems.map(li => ({ qty: li.qty, unitPrice: li.unitPrice })),
          inv.discountType, inv.discountValue, inv.taxRate,
        );
        for (const ms of inv.milestones) {
          if (ms.status === "Invoiced") total += totals.grandTotal * (ms.percentage / 100);
        }
      }
    }
    return total;
  }, [filtered]);

  // ─── Metric: Overdue Aging ───────────────────────────
  const overdueAging = useMemo(() => {
    const overdue = filtered.filter(i => i.status === "Overdue");
    const buckets = { over7: { count: 0, value: 0 }, over30: { count: 0, value: 0 }, over60: { count: 0, value: 0 } };
    for (const inv of overdue) {
      const days = daysSince(inv.dueDate);
      if (days > 60) { buckets.over60.count++; buckets.over60.value += inv.amount; }
      else if (days > 30) { buckets.over30.count++; buckets.over30.value += inv.amount; }
      else if (days > 7) { buckets.over7.count++; buckets.over7.value += inv.amount; }
    }
    return { total: overdue.length, totalValue: overdue.reduce((s, i) => s + i.amount, 0), buckets };
  }, [filtered]);

  // ─── Metric: Quote-to-Close ──────────────────────────
  const quoteToClose = useMemo(() => {
    const quotations = filtered.filter(i => i.status === "Quotation" || i.status === "Sent" || i.status === "Paid");
    const closed = quotations.filter(i => i.status === "Sent" || i.status === "Paid");
    return quotations.length > 0 ? Math.round((closed.length / quotations.length) * 100) : 0;
  }, [filtered]);

  // ─── Chart: Monthly Revenue ──────────────────────────
  const monthlyRevenue = useMemo(() => {
    const months: Record<string, number> = {};
    for (const inv of filtered) {
      if (inv.status !== "Paid") continue;
      const m = inv.dueDate?.slice(0, 7);
      if (m) months[m] = (months[m] || 0) + inv.amount;
    }
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, v]) => ({ label: new Date(m + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }), value: v }));
  }, [filtered]);

  // ─── Chart: Top 5 Clients ───────────────────────────
  const topClients = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const inv of filtered) {
      if (inv.clientId) totals[inv.clientId] = (totals[inv.clientId] || 0) + inv.amount;
    }
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, value]) => ({ label: clients.find(c => c.id === id)?.name || "Unknown", value }));
  }, [filtered, clients]);

  const STATUSES = ["Draft", "Quotation", "Sent", "Paid", "Overdue", "Revision Requested", "Approved"];

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <FadeInUp>
        <div className="border border-foreground p-4 flex flex-wrap items-end gap-3">
          <Filter size={14} className="text-muted-foreground self-center" />
          <div>
            <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-foreground bg-background px-2 py-1 text-xs font-sans" />
          </div>
          <div>
            <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-foreground bg-background px-2 py-1 text-xs font-sans" />
          </div>
          <div>
            <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">Client</label>
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="border border-foreground bg-background px-2 py-1 text-xs font-sans">
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground block mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-foreground bg-background px-2 py-1 text-xs font-sans">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); setFilterClient(""); setFilterStatus(""); }}
            className="text-xs font-sans text-muted-foreground hover:text-foreground underline self-center"
          >Clear</button>
          <button
            onClick={() => onExport(filtered)}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-xs font-sans uppercase tracking-wider border border-foreground hover:bg-foreground hover:text-background transition-all"
          ><Download size={14} /> Export Report</button>
        </div>
      </FadeInUp>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FadeInUp delay={0}>
          <div className="border border-foreground p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-muted-foreground" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-sans">Total Pipeline</span>
            </div>
            <div className="text-xl font-display"><AnimatedNumber value={pipeline} prefix="$" /></div>
            <p className="text-[10px] font-sans text-muted-foreground mt-1">Quotation + Sent invoices</p>
          </div>
        </FadeInUp>

        <FadeInUp delay={60}>
          <div className="border border-foreground p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-muted-foreground" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-sans">Approved / Active</span>
            </div>
            <div className="text-xl font-display"><AnimatedNumber value={approvedActive} prefix="$" /></div>
            <p className="text-[10px] font-sans text-muted-foreground mt-1">Approved + invoiced milestones</p>
          </div>
        </FadeInUp>

        <FadeInUp delay={120}>
          <div className="border border-foreground p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-muted-foreground" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-sans">Overdue Aging</span>
            </div>
            <div className="text-xl font-display"><AnimatedNumber value={overdueAging.totalValue} prefix="$" /></div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {overdueAging.buckets.over7.count > 0 && <span className="text-[10px] font-sans text-muted-foreground">&gt;7d: {overdueAging.buckets.over7.count} ({fmt$(overdueAging.buckets.over7.value)})</span>}
              {overdueAging.buckets.over30.count > 0 && <span className="text-[10px] font-sans text-muted-foreground">&gt;30d: {overdueAging.buckets.over30.count} ({fmt$(overdueAging.buckets.over30.value)})</span>}
              {overdueAging.buckets.over60.count > 0 && <span className="text-[10px] font-sans text-muted-foreground">&gt;60d: {overdueAging.buckets.over60.count} ({fmt$(overdueAging.buckets.over60.value)})</span>}
              {overdueAging.total === 0 && <span className="text-[10px] font-sans text-muted-foreground">No overdue invoices</span>}
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={180}>
          <div className="border border-foreground p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-muted-foreground" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-sans">Quote-to-Close</span>
            </div>
            <div className="text-xl font-display"><AnimatedNumber value={quoteToClose} suffix="%" /></div>
            <p className="text-[10px] font-sans text-muted-foreground mt-1">Quotations → Sent/Paid</p>
          </div>
        </FadeInUp>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FadeInUp delay={200}>
          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Monthly Revenue Trend</h3>
            </div>
            {monthlyRevenue.length >= 2 ? <LineChart data={monthlyRevenue} height={200} /> : <p className="text-xs text-muted-foreground font-sans">Need at least 2 months of paid invoices for trend chart.</p>}
          </div>
        </FadeInUp>

        <FadeInUp delay={250}>
          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Top 5 Clients by Value</h3>
            </div>
            {topClients.length > 0 ? <HBarChart data={topClients} /> : <p className="text-xs text-muted-foreground font-sans">No client data to display.</p>}
          </div>
        </FadeInUp>
      </div>
    </div>
  );
}
