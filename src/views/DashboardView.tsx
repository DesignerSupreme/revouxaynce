import React from "react";
import {
  CalendarDays, AlertCircle, Plus, Clock, BarChart3, TrendingUp, Users, DollarSign, UserCheck
} from "lucide-react";
import type { Event, Client, Invoice, Guest, Expense, Activity, Tab, Vendor, TimelineBlock, BudgetItem } from "@/types";
import { fmt$, shortDate, daysUntil } from "@/lib/helpers";
import { FadeInUp } from "@/components/app/FadeInUp";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import { Badge } from "@/components/app/Badge";
import { Btn } from "@/components/app/FormElements";
import { BarChart, HBarChart, DonutChart, LineChart } from "@/components/app/Charts";

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

  // ─── TODAY + UPCOMING (next 3 days) ─────────────────────────────
  const upcomingEvents = events
    .filter(e => {
      const days = daysUntil(e.date);
      return days >= 0 && days <= 3 && e.status !== "Wrapped";
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayEvents = upcomingEvents.filter(e => e.date === todayStr);
  const soonEvents = upcomingEvents.filter(e => e.date !== todayStr);

  // ─── ATTENTION REQUIRED ─────────────────────────────────────────
  const overdueInvoices = invoices.filter(i => i.status === "Overdue");
  const dueSoonInvoices = invoices.filter(i => {
    if (i.status === "Paid" || i.status === "Overdue") return false;
    const days = daysUntil(i.dueDate);
    return days >= 0 && days <= 3;
  });
  const eventsMissingVendors = events.filter(e => e.status !== "Wrapped" && !vendors.some(v => v.eventIds?.includes(e.id)));
  const eventsMissingTimeline = events.filter(e => e.status !== "Wrapped" && !timelines.some(t => t.eventId === e.id));
  const eventsMissingBudget = events.filter(e => e.status !== "Wrapped" && !budgets.some(b => b.eventId === e.id));
  const hasAttentionItems = overdueInvoices.length > 0 || dueSoonInvoices.length > 0 || eventsMissingVendors.length > 0 || eventsMissingTimeline.length > 0 || eventsMissingBudget.length > 0;

  // ─── ACTIVE EVENTS ─────────────────────────────────────────────
  const activeEvents = events
    .filter(e => e.status !== "Wrapped")
    .sort((a, b) => a.date.localeCompare(b.date));

  // ─── ANALYTICS DATA ─────────────────────────────────────────────
  const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const expByCat: Record<string, number> = {};
  expenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount; });
  const expChartData = Object.entries(expByCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const rsvpData = [
    { label: "Attending", value: guests.filter(g => g.rsvp === "Attending").length },
    { label: "Pending", value: guests.filter(g => g.rsvp === "Pending").length },
    { label: "Declined", value: guests.filter(g => g.rsvp === "Declined").length },
  ].filter(d => d.value > 0);

  const statusCounts: Record<string, number> = {};
  events.forEach(e => { statusCounts[e.status] = (statusCounts[e.status] || 0) + 1; });
  const eventStatusData = Object.entries(statusCounts).map(([label, value]) => ({ label, value }));

  const monthlyRev: Record<string, number> = {};
  invoices.filter(i => i.status === "Paid").forEach(i => {
    const m = i.dueDate.slice(0, 7);
    monthlyRev[m] = (monthlyRev[m] || 0) + i.amount;
  });
  const revTrend = Object.entries(monthlyRev).sort().map(([label, value]) => ({
    label: new Date(label + "-01").toLocaleDateString("en-US", { month: "short" }), value
  }));

  return (
    <div>
      <h1 className="text-3xl mb-6">Dashboard</h1>

      {/* ═══ TODAY SECTION ═══ */}
      <FadeInUp>
        <div className="border border-foreground mb-6">
          <div className="border-b border-foreground px-4 sm:px-5 py-3 bg-muted flex items-center gap-2">
            <CalendarDays size={16} />
            <span className="text-sm font-sans font-semibold uppercase tracking-wider">Today & Upcoming</span>
          </div>
          {todayEvents.length === 0 && soonEvents.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground font-sans">
              No events today or in the next 3 days — enjoy the calm.
            </div>
          ) : (
            <div className="divide-y divide-input">
              {todayEvents.length > 0 && (
                <div className="px-4 sm:px-5 py-3">
                  <div className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-2">Today</div>
                  <div className="space-y-2">
                    {todayEvents.map(ev => {
                      const client = clients.find(c => c.id === ev.clientId);
                      return (
                        <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border border-foreground bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => setTab("events")}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display text-base">{ev.name}</span>
                              <Badge status={ev.status} />
                            </div>
                            <div className="text-xs text-muted-foreground font-sans mt-1">
                              {ev.time} · {ev.venue}{client ? ` · ${client.name}` : ""}
                            </div>
                          </div>
                          <div className="text-xs font-sans font-semibold bg-foreground text-background px-2 py-1 self-start">NOW</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {soonEvents.length > 0 && (
                <div className="px-4 sm:px-5 py-3">
                  <div className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-2">Coming Up</div>
                  <div className="space-y-2">
                    {soonEvents.map(ev => {
                      const client = clients.find(c => c.id === ev.clientId);
                      const days = daysUntil(ev.date);
                      return (
                        <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border border-input cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("events")}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display text-base">{ev.name}</span>
                              <Badge status={ev.status} />
                            </div>
                            <div className="text-xs text-muted-foreground font-sans mt-1">
                              {ev.time} · {ev.venue}{client ? ` · ${client.name}` : ""}
                            </div>
                          </div>
                          <div className="text-xs font-sans text-muted-foreground border border-input px-2 py-1 self-start">
                            {days} day{days !== 1 ? "s" : ""} left
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </FadeInUp>

      {/* ═══ ATTENTION REQUIRED ═══ */}
      {hasAttentionItems && (
        <FadeInUp delay={80}>
          <div className="border border-foreground mb-6">
            <div className="border-b border-foreground px-4 sm:px-5 py-3 bg-muted flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm font-sans font-semibold uppercase tracking-wider">Attention Required</span>
            </div>
            <div className="divide-y divide-input">
              {overdueInvoices.map(inv => {
                const client = clients.find(c => c.id === inv.clientId);
                const overdueDays = Math.abs(daysUntil(inv.dueDate));
                return (
                  <div key={inv.id} className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("finances")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DollarSign size={14} className="text-foreground" />
                        <span className="text-sm font-sans font-semibold">Overdue Invoice — {client?.name || "Unknown"}</span>
                        <Badge status="Overdue" />
                      </div>
                      <div className="text-xs text-muted-foreground font-sans mt-0.5">{fmt$(inv.amount)} · {overdueDays} days overdue</div>
                    </div>
                  </div>
                );
              })}
              {dueSoonInvoices.map(inv => {
                const client = clients.find(c => c.id === inv.clientId);
                const days = daysUntil(inv.dueDate);
                return (
                  <div key={inv.id} className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("finances")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Clock size={14} className="text-muted-foreground" />
                        <span className="text-sm font-sans">Invoice due in {days} day{days !== 1 ? "s" : ""} — {client?.name || "Unknown"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-sans mt-0.5">{fmt$(inv.amount)} · Due {shortDate(inv.dueDate)}</div>
                    </div>
                  </div>
                );
              })}
              {eventsMissingVendors.slice(0, 3).map(ev => (
                <div key={`v-${ev.id}`} className="px-4 sm:px-5 py-3 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("events")}>
                  <AlertCircle size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-sans"><span className="font-semibold">{ev.name}</span> — no vendors assigned</span>
                </div>
              ))}
              {eventsMissingTimeline.slice(0, 3).map(ev => (
                <div key={`t-${ev.id}`} className="px-4 sm:px-5 py-3 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("events")}>
                  <Clock size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-sans"><span className="font-semibold">{ev.name}</span> — no timeline set</span>
                </div>
              ))}
              {eventsMissingBudget.slice(0, 3).map(ev => (
                <div key={`b-${ev.id}`} className="px-4 sm:px-5 py-3 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("events")}>
                  <DollarSign size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-sans"><span className="font-semibold">{ev.name}</span> — no budget items</span>
                </div>
              ))}
            </div>
          </div>
        </FadeInUp>
      )}

      {/* ═══ QUICK ACTIONS ═══ */}
      <FadeInUp delay={120}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "New Event", tab: "events" as Tab, icon: CalendarDays },
            { label: "New Client", tab: "clients" as Tab, icon: Users },
            { label: "Create Invoice", tab: "finances" as Tab, icon: DollarSign },
            { label: "Add Expense", tab: "expenses" as Tab, icon: Plus },
          ].map(action => (
            <button key={action.label} onClick={() => setTab(action.tab)}
              className="border border-foreground p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              <action.icon size={20} />
              <span className="text-xs font-sans uppercase tracking-wider">{action.label}</span>
            </button>
          ))}
        </div>
      </FadeInUp>

      {/* ═══ ACTIVE EVENTS OVERVIEW ═══ */}
      <FadeInUp delay={160}>
        <div className="border border-foreground mb-6">
          <div className="border-b border-foreground px-4 sm:px-5 py-3 bg-muted flex items-center justify-between">
            <span className="text-sm font-sans font-semibold uppercase tracking-wider">Active Events</span>
            <span className="text-xs text-muted-foreground font-sans">{activeEvents.length} event{activeEvents.length !== 1 ? "s" : ""}</span>
          </div>
          {activeEvents.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground font-sans">No active events.</div>
          ) : (
            <div className="divide-y divide-input">
              {activeEvents.map(ev => {
                const client = clients.find(c => c.id === ev.clientId);
                const days = daysUntil(ev.date);
                const evGuests = guests.filter(g => g.eventId === ev.id);
                const attending = evGuests.filter(g => g.rsvp === "Attending").length;
                return (
                  <div key={ev.id} className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setTab("events")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-base">{ev.name}</span>
                        <Badge status={ev.status} />
                      </div>
                      <div className="text-xs text-muted-foreground font-sans mt-0.5">
                        {shortDate(ev.date)} · {ev.venue}
                        {client ? ` · ${client.name}` : ""}
                        {evGuests.length > 0 ? ` · ${attending}/${evGuests.length} attending` : ""}
                      </div>
                    </div>
                    <div className="text-xs font-sans text-muted-foreground self-start">
                      {days >= 0 ? `${days}d left` : "Past"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FadeInUp>

      {/* ═══ INSIGHTS / ANALYTICS ═══ */}
      <FadeInUp delay={200}>
        <div className="mb-4">
          <h2 className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-4">Insights & Performance</h2>
        </div>
      </FadeInUp>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Revenue", value: totalRevenue, isMoney: true },
          { label: "Expenses", value: totalExpenses, isMoney: true },
          { label: "Net Profit", value: totalRevenue - totalExpenses, isMoney: true },
          { label: "Total Guests", value: guests.length },
        ].map((c, i) => (
          <FadeInUp key={c.label} delay={220 + i * 60}>
            <div className="border border-foreground p-3 sm:p-4">
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1 font-sans">{c.label}</div>
              <div className="text-xl sm:text-2xl font-display">
                {c.isMoney ? <AnimatedNumber value={c.value} prefix="$" /> : <AnimatedNumber value={c.value} />}
              </div>
            </div>
          </FadeInUp>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <FadeInUp delay={300}>
          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} className="text-muted-foreground" />
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-sans">Expenses by Category</h3>
            </div>
            <BarChart data={expChartData} />
          </div>
        </FadeInUp>
        <FadeInUp delay={350}>
          <div className="border border-foreground p-4 sm:p-5">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-sans mb-4">RSVP Breakdown</h3>
            <DonutChart data={rsvpData} size={140} />
          </div>
        </FadeInUp>
        <FadeInUp delay={400}>
          <div className="border border-foreground p-4 sm:p-5">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-sans mb-4">Event Status</h3>
            <DonutChart data={eventStatusData} size={140} />
          </div>
        </FadeInUp>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <FadeInUp delay={450}>
          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-muted-foreground" />
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-sans">Revenue Trend</h3>
            </div>
            <LineChart data={revTrend} height={150} />
          </div>
        </FadeInUp>

        {/* Recent Activity */}
        <FadeInUp delay={500}>
          <div className="border border-foreground p-4 sm:p-5">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4 font-sans">Recent Activity</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground font-sans">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-sm font-sans">
                    <Clock size={12} className="mt-1 text-muted-foreground shrink-0" />
                    <span>{a.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeInUp>
      </div>
    </div>
  );
}
