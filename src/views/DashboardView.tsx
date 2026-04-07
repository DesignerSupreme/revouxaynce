import React from "react";
import {
  CalendarDays, AlertCircle, Plus, Clock, BarChart3, TrendingUp, Users, DollarSign, UserCheck, Briefcase, Target
} from "lucide-react";
import type { Event, Client, Invoice, Guest, Expense, Activity, Tab, Vendor, TimelineBlock, BudgetItem } from "@/types";
import { fmt$, shortDate, daysUntil } from "@/lib/helpers";
import { FadeInUp } from "@/components/app/FadeInUp";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import { Badge } from "@/components/app/Badge";
import { DonutChart, HBarChart, LineChart } from "@/components/app/Charts";

interface DashboardViewProps {
  events: Event[];
  clients: Client[];
  invoices: Invoice[];
  guests: Guest[];
  expenses: Expense[];
  activities: Activity[];
  vendors: Vendor[];
  timelines: TimelineBlock[];
  budgets: BudgetItem[];
  setTab: (tab: Tab) => void;
}

export function DashboardView({ events, clients, invoices, guests, expenses, activities, vendors, timelines, budgets, setTab }: DashboardViewProps) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // ─── Data ───────────────────────────────────────────────────────
  const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const activeEvents = events.filter(e => e.status !== "Wrapped");
  const overdueInvoices = invoices.filter(i => i.status === "Overdue");
  const pipeline = invoices.filter(i => i.status === "Quotation" || i.status === "Sent").reduce((s, i) => s + i.amount, 0);

  // Upcoming
  const upcomingEvents = events
    .filter(e => { const d = daysUntil(e.date); return d >= 0 && d <= 3 && e.status !== "Wrapped"; })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Attention items
  const dueSoonInvoices = invoices.filter(i => {
    if (i.status === "Paid" || i.status === "Overdue") return false;
    const d = daysUntil(i.dueDate);
    return d >= 0 && d <= 3;
  });
  const eventsMissingVendors = events.filter(e => e.status !== "Wrapped" && !vendors.some(v => v.eventIds?.includes(e.id)));
  const hasAttentionItems = overdueInvoices.length > 0 || dueSoonInvoices.length > 0 || eventsMissingVendors.length > 0;

  // Charts
  const expByCat: Record<string, number> = {};
  expenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount; });
  const expChartData = Object.entries(expByCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const rsvpData = [
    { label: "Attending", value: guests.filter(g => g.rsvp === "Attending").length },
    { label: "Pending", value: guests.filter(g => g.rsvp === "Pending").length },
    { label: "Declined", value: guests.filter(g => g.rsvp === "Declined").length },
  ].filter(d => d.value > 0);

  const monthlyRev: Record<string, number> = {};
  invoices.filter(i => i.status === "Paid").forEach(i => {
    const m = i.dueDate.slice(0, 7);
    monthlyRev[m] = (monthlyRev[m] || 0) + i.amount;
  });
  const revTrend = Object.entries(monthlyRev).sort().map(([label, value]) => ({
    label: new Date(label + "-01").toLocaleDateString("en-US", { month: "short" }), value
  }));

  // Invoice status breakdown
  const invByStatus: Record<string, { count: number; value: number }> = {};
  invoices.forEach(i => {
    if (!invByStatus[i.status]) invByStatus[i.status] = { count: 0, value: 0 };
    invByStatus[i.status].count++;
    invByStatus[i.status].value += i.amount;
  });

  return (
    <div>
      <h1 className="text-3xl mb-6">Dashboard</h1>

      {/* ═══ ROW 1: Hero Net Worth style + stat cards ═══ */}
      <FadeInUp>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          {/* Hero card — Net Profit with donut */}
          <div className="lg:row-span-2 border border-foreground bg-muted/30 p-6 flex flex-col items-center justify-center min-h-[240px]">
            <div className="relative w-[160px] h-[160px] mb-4">
              <svg viewBox="0 0 160 160" className="w-full h-full">
                {/* Background ring */}
                <circle cx="80" cy="80" r="60" fill="none" stroke="currentColor" strokeWidth="18" strokeOpacity={0.08} />
                {/* Revenue ring */}
                {totalRevenue > 0 && (
                  <circle cx="80" cy="80" r="60" fill="none" stroke="currentColor" strokeWidth="18" strokeOpacity={0.85}
                    strokeDasharray={`${(totalRevenue / (totalRevenue + totalExpenses || 1)) * 377} 377`}
                    strokeLinecap="butt" transform="rotate(-90 80 80)"
                    style={{ transition: "stroke-dasharray 1s ease" }} />
                )}
                {/* Expense ring */}
                {totalExpenses > 0 && (
                  <circle cx="80" cy="80" r="60" fill="none" stroke="currentColor" strokeWidth="18" strokeOpacity={0.25}
                    strokeDasharray={`${(totalExpenses / (totalRevenue + totalExpenses || 1)) * 377} 377`}
                    strokeDashoffset={`${-(totalRevenue / (totalRevenue + totalExpenses || 1)) * 377}`}
                    strokeLinecap="butt" transform="rotate(-90 80 80)"
                    style={{ transition: "stroke-dasharray 1s ease" }} />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">Net Profit</span>
                <span className="text-2xl font-display">{fmt$(netProfit)}</span>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-sans text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-foreground opacity-85" />
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-foreground opacity-25" />
                <span>Expenses</span>
              </div>
            </div>
          </div>

          {/* Top-right stat cards */}
          <StatCard
            icon={<DollarSign size={16} />}
            label="Total Revenue"
            sublabel={`${invoices.filter(i => i.status === "Paid").length} paid invoices`}
            value={totalRevenue}
            isMoney
            onClick={() => setTab("finances")}
            delay={60}
          />
          <StatCard
            icon={<Target size={16} />}
            label="Pipeline"
            sublabel="Quotation + Sent"
            value={pipeline}
            isMoney
            onClick={() => setTab("finances")}
            delay={80}
          />
          <StatCard
            icon={<CalendarDays size={16} />}
            label="Active Events"
            sublabel={`${events.length} total`}
            value={activeEvents.length}
            onClick={() => setTab("events")}
            delay={100}
          />
          <StatCard
            icon={<Users size={16} />}
            label="Clients"
            sublabel={`${clients.filter(c => c.status === "Active").length} active`}
            value={clients.length}
            onClick={() => setTab("clients")}
            delay={120}
          />
        </div>
      </FadeInUp>

      {/* ═══ ROW 2: Revenue + Expenses + Guests breakdown ═══ */}
      <FadeInUp delay={140}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {/* Revenue breakdown */}
          <BreakdownCard
            icon={<DollarSign size={16} />}
            title="Revenue"
            subtitle="By invoice status"
            total={totalRevenue}
            highlight
            items={Object.entries(invByStatus)
              .filter(([s]) => s === "Paid")
              .map(([status, d]) => ({ label: status, value: d.value }))}
          />

          {/* Expenses breakdown */}
          <BreakdownCard
            icon={<BarChart3 size={16} />}
            title="Expenses"
            subtitle="By category"
            total={totalExpenses}
            highlight
            items={expChartData.slice(0, 4)}
          />

          {/* Guests */}
          <BreakdownCard
            icon={<UserCheck size={16} />}
            title="Guests"
            subtitle="RSVP overview"
            total={guests.length}
            items={[
              { label: "Attending", value: guests.filter(g => g.rsvp === "Attending").length },
              { label: "Pending", value: guests.filter(g => g.rsvp === "Pending").length },
              { label: "Declined", value: guests.filter(g => g.rsvp === "Declined").length },
            ].filter(d => d.value > 0)}
          />
        </div>
      </FadeInUp>

      {/* ═══ ROW 3: Overdue + Upcoming ═══ */}
      {(hasAttentionItems || upcomingEvents.length > 0) && (
        <FadeInUp delay={180}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            {/* Attention */}
            {hasAttentionItems && (
              <div className="border border-foreground">
                <div className="border-b border-foreground px-4 py-3 bg-muted flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span className="text-xs font-sans font-semibold uppercase tracking-wider">Attention Required</span>
                </div>
                <div className="divide-y divide-input max-h-[240px] overflow-y-auto">
                  {overdueInvoices.map(inv => {
                    const client = clients.find(c => c.id === inv.clientId);
                    return (
                      <div key={inv.id} className="px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("finances")}>
                        <DollarSign size={14} className="shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-sans font-semibold">Overdue — {client?.name || "Unknown"}</span>
                          <div className="text-[10px] text-muted-foreground font-sans">{fmt$(inv.amount)} · {Math.abs(daysUntil(inv.dueDate))}d overdue</div>
                        </div>
                        <Badge status="Overdue" />
                      </div>
                    );
                  })}
                  {dueSoonInvoices.map(inv => {
                    const client = clients.find(c => c.id === inv.clientId);
                    return (
                      <div key={inv.id} className="px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("finances")}>
                        <Clock size={14} className="shrink-0 text-muted-foreground" />
                        <span className="text-sm font-sans flex-1">{client?.name || "Unknown"} · due in {daysUntil(inv.dueDate)}d</span>
                      </div>
                    );
                  })}
                  {eventsMissingVendors.slice(0, 3).map(ev => (
                    <div key={ev.id} className="px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("events")}>
                      <Briefcase size={14} className="shrink-0 text-muted-foreground" />
                      <span className="text-sm font-sans">{ev.name} — no vendors</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="border border-foreground">
                <div className="border-b border-foreground px-4 py-3 bg-muted flex items-center gap-2">
                  <CalendarDays size={14} />
                  <span className="text-xs font-sans font-semibold uppercase tracking-wider">Upcoming Events</span>
                </div>
                <div className="divide-y divide-input">
                  {upcomingEvents.map(ev => {
                    const client = clients.find(c => c.id === ev.clientId);
                    const days = daysUntil(ev.date);
                    return (
                      <div key={ev.id} className="px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("events")}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display text-sm">{ev.name}</span>
                            <Badge status={ev.status} />
                          </div>
                          <div className="text-[10px] text-muted-foreground font-sans mt-0.5">
                            {ev.time} · {ev.venue}{client ? ` · ${client.name}` : ""}
                          </div>
                        </div>
                        <div className="text-xs font-sans font-semibold bg-foreground text-background px-2 py-0.5 shrink-0">
                          {days === 0 ? "TODAY" : `${days}d`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </FadeInUp>
      )}

      {/* ═══ ROW 4: Charts ═══ */}
      <FadeInUp delay={220}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Revenue Trend</h3>
            </div>
            {revTrend.length >= 2 ? <LineChart data={revTrend} height={160} /> : <p className="text-xs text-muted-foreground font-sans py-8 text-center">Need 2+ months of paid invoices.</p>}
          </div>

          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">RSVP Breakdown</h3>
            </div>
            {rsvpData.length > 0 ? <DonutChart data={rsvpData} size={140} /> : <p className="text-xs text-muted-foreground font-sans py-8 text-center">No guest data yet.</p>}
          </div>
        </div>
      </FadeInUp>

      {/* ═══ ROW 5: Expense bars + Recent Activity ═══ */}
      <FadeInUp delay={260}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Top Expenses</h3>
            </div>
            {expChartData.length > 0 ? <HBarChart data={expChartData.slice(0, 5)} /> : <p className="text-xs text-muted-foreground font-sans py-8 text-center">No expenses recorded.</p>}
          </div>

          <div className="border border-foreground p-4 sm:p-5">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-3">Recent Activity</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground font-sans py-8 text-center">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 6).map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-sm font-sans">
                    <Clock size={12} className="mt-1 text-muted-foreground shrink-0" />
                    <span>{a.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeInUp>

      {/* ═══ Quick Actions ═══ */}
      <FadeInUp delay={300}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {([
            { label: "New Event", tab: "events" as Tab, icon: CalendarDays },
            { label: "New Client", tab: "clients" as Tab, icon: Users },
            { label: "Create Invoice", tab: "finances" as Tab, icon: DollarSign },
            { label: "Add Expense", tab: "expenses" as Tab, icon: Plus },
          ]).map(action => (
            <button key={action.label} onClick={() => setTab(action.tab)}
              className="border border-foreground p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              <action.icon size={20} />
              <span className="text-xs font-sans uppercase tracking-wider">{action.label}</span>
            </button>
          ))}
        </div>
      </FadeInUp>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════ */

function StatCard({ icon, label, sublabel, value, isMoney, onClick, delay = 0 }: {
  icon: React.ReactNode; label: string; sublabel: string; value: number; isMoney?: boolean; onClick?: () => void; delay?: number;
}) {
  return (
    <FadeInUp delay={delay}>
      <div className="border border-foreground p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={onClick}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <div className="text-2xl font-display">
          {isMoney ? <AnimatedNumber value={value} prefix="$" /> : <AnimatedNumber value={value} />}
        </div>
        <p className="text-[10px] font-sans text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
    </FadeInUp>
  );
}

function BreakdownCard({ icon, title, subtitle, total, items, highlight }: {
  icon: React.ReactNode; title: string; subtitle: string; total: number; items: { label: string; value: number }[]; highlight?: boolean;
}) {
  return (
    <div className={`border border-foreground p-4 ${highlight ? "bg-muted/20" : ""}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-sans font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-[10px] font-sans text-muted-foreground mb-2">{subtitle}</p>
      <div className="text-3xl font-display mb-3">
        {title === "Guests" ? <AnimatedNumber value={total} /> : <AnimatedNumber value={total} prefix="$" />}
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-xs font-sans">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold">{title === "Guests" ? item.value : fmt$(item.value)}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-[10px] text-muted-foreground font-sans">No data yet</p>}
      </div>
    </div>
  );
}
