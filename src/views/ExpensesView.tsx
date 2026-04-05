import React, { useState, useRef } from "react";
import {
  Receipt, Plus, Edit, Trash2, Camera, Upload, Download, BarChart3, TrendingUp
} from "lucide-react";
import type { Event, Expense } from "@/types";
import { uid, fmt$, shortDate } from "@/lib/helpers";
import { Modal } from "@/components/app/Modal";
import { FormInput, FormTextArea, FormSelect, FormSelectLabeled, Btn } from "@/components/app/FormElements";
import { Empty } from "@/components/app/Empty";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { FadeInUp } from "@/components/app/FadeInUp";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import { BarChart, HBarChart, LineChart } from "@/components/app/Charts";

interface ExpensesViewProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  events: Event[];
  log: (text: string) => void;
  toast: (msg: string) => void;
}

export function ExpensesView({ expenses, setExpenses, events, log, toast }: ExpensesViewProps) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [scanModal, setScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<Partial<Expense> | null>(null);
  const [scanning, setScanning] = useState(false);
  const [eventFilter, setEventFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Catering", "Florals", "Photography", "AV", "Decor", "Transport", "Entertainment", "Venue", "Supplies", "Travel", "Other"];
  const filtered = expenses.filter(e => {
    if (eventFilter && e.eventId !== eventFilter) return false;
    if (catFilter && e.category !== catFilter) return false;
    return true;
  });
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  const byCat: Record<string, number> = {};
  filtered.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const catChartData = Object.entries(byCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const byEvent: Record<string, number> = {};
  filtered.forEach(e => {
    const ev = events.find(x => x.id === e.eventId);
    const name = ev?.name || "Unassigned";
    byEvent[name] = (byEvent[name] || 0) + e.amount;
  });
  const eventChartData = Object.entries(byEvent).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const byMonth: Record<string, number> = {};
  filtered.forEach(e => { const m = e.date.slice(0, 7); byMonth[m] = (byMonth[m] || 0) + e.amount; });
  const trendData = Object.entries(byMonth).sort().map(([label, value]) => ({
    label: new Date(label + "-01").toLocaleDateString("en-US", { month: "short" }), value
  }));

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    const amount = parseFloat(obj.amount) || 0;
    if (editing) {
      setExpenses(ex => ex.map(x => x.id === editing.id ? { ...x, date: obj.date || "", vendor: obj.vendor || "", category: obj.category || "", amount, eventId: obj.eventId || "", notes: obj.notes || "", receiptUrl: x.receiptUrl } : x));
      toast("Expense updated"); log(`Updated expense: ${obj.vendor} ${fmt$(amount)}`);
    } else {
      setExpenses(ex => [...ex, { id: uid(), date: obj.date || "", vendor: obj.vendor || "", category: obj.category || "", amount, eventId: obj.eventId || "", notes: obj.notes || "", receiptUrl: "" }]);
      toast("Expense added"); log(`Added expense: ${obj.vendor} ${fmt$(amount)}`);
    }
    setModal(false); setEditing(null);
  };

  const remove = (id: string) => {
    const ex = expenses.find(x => x.id === id);
    setExpenses(exs => exs.filter(x => x.id !== id));
    toast("Expense deleted"); log(`Deleted expense: ${ex?.vendor}`);
    setDeleting(null);
  };

  const handleReceiptUpload = async (file: File) => {
    setScanning(true);
    setScanResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const receiptUrl = reader.result as string;
      const today = new Date().toISOString().slice(0, 10);
      const img = new Image();
      img.onload = () => {
        setScanResult({ date: today, vendor: "Scanned Receipt", category: "Other", amount: 0, notes: `Scanned from ${file.name}`, receiptUrl });
        setScanning(false);
      };
      img.onerror = () => {
        setScanResult({ date: today, vendor: "Scanned Receipt", category: "Other", amount: 0, notes: `From ${file.name}`, receiptUrl });
        setScanning(false);
      };
      img.src = receiptUrl;
    };
    reader.readAsDataURL(file);
  };

  const saveScanResult = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    const amount = parseFloat(obj.amount) || 0;
    setExpenses(ex => [...ex, { id: uid(), date: obj.date || "", vendor: obj.vendor || "", category: obj.category || "", amount, eventId: obj.eventId || "", notes: obj.notes || "", receiptUrl: obj.receiptUrl || "" }]);
    toast("Expense from receipt added"); log(`Scanned receipt: ${obj.vendor} ${fmt$(amount)}`);
    setScanModal(false); setScanResult(null);
  };

  const exportCSV = () => {
    const headers = ["Date", "Vendor", "Category", "Amount", "Event", "Notes"];
    const rows = filtered.map(ex => {
      const ev = events.find(e => e.id === ex.eventId);
      return [ex.date, ex.vendor, ex.category, ex.amount.toFixed(2), ev?.name || "", ex.notes];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "revouxaynce-expenses.csv"; a.click();
    URL.revokeObjectURL(url);
    toast("Expenses exported");
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl">Expenses</h1>
        <div className="flex gap-2 flex-wrap">
          <Btn variant="secondary" onClick={() => setScanModal(true)}><Camera size={14} className="inline mr-1" /> Scan Receipt</Btn>
          <Btn variant="secondary" onClick={exportCSV}><Download size={14} className="inline mr-1" /> CSV</Btn>
          <Btn onClick={() => { setEditing(null); setModal(true); }}><Plus size={14} className="inline mr-1" /> Manual Entry</Btn>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="border border-input px-3 py-2 text-sm font-sans bg-background transition-colors focus:border-foreground focus:outline-none">
          <option value="">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-input px-3 py-2 text-sm font-sans bg-background transition-colors focus:border-foreground focus:outline-none">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Total", value: totalFiltered, isMoney: true },
          { label: "Count", value: filtered.length },
          { label: "Avg / Expense", value: filtered.length > 0 ? totalFiltered / filtered.length : 0, isMoney: true },
        ].map((c, i) => (
          <FadeInUp key={c.label} delay={i * 80}>
            <div className="border border-foreground p-3 sm:p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-sans">{c.label}</div>
              <div className="text-xl sm:text-2xl font-display">
                {c.isMoney ? <AnimatedNumber value={c.value} prefix="$" /> : <AnimatedNumber value={c.value} />}
              </div>
            </div>
          </FadeInUp>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <FadeInUp delay={100}>
          <div className="border border-foreground p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">By Category</h3>
            </div>
            <BarChart data={catChartData} />
          </div>
        </FadeInUp>
        <FadeInUp delay={150}>
          <div className="border border-foreground p-4 sm:p-5">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans mb-3">By Event</h3>
            <HBarChart data={eventChartData} />
          </div>
        </FadeInUp>
        <FadeInUp delay={200}>
          <div className="border border-foreground p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Trend</h3>
            </div>
            <LineChart data={trendData} height={150} />
          </div>
        </FadeInUp>
      </div>

      {filtered.length === 0 ? <Empty icon={Receipt} text="No expenses yet." /> : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm font-sans min-w-[640px]">
            <thead><tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4 pl-4 sm:pl-0">Date</th><th className="py-2 pr-4">Vendor</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4 text-right">Amount</th><th className="py-2 pr-4">Event</th><th className="py-2 w-20"></th>
            </tr></thead>
            <tbody>
              {filtered.map((ex, i) => {
                const ev = events.find(e => e.id === ex.eventId);
                return (
                  <tr key={ex.id} className={`hover:bg-muted/30 transition-colors ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="py-2 pr-4 pl-4 sm:pl-0">{shortDate(ex.date)}</td>
                    <td className="py-2 pr-4 font-semibold">{ex.vendor}</td>
                    <td className="py-2 pr-4">{ex.category}</td>
                    <td className="py-2 pr-4 text-right">{fmt$(ex.amount)}</td>
                    <td className="py-2 pr-4">{ev?.name || "—"}</td>
                    <td className="py-2">
                      {deleting === ex.id ? <ConfirmDelete onConfirm={() => remove(ex.id)} onCancel={() => setDeleting(null)} /> : (
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-muted transition-colors" onClick={() => { setEditing(ex); setModal(true); }}><Edit size={14} /></button>
                          <button className="p-1 hover:bg-muted transition-colors" onClick={() => setDeleting(ex.id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Expense" : "New Expense"}>
        <form onSubmit={save}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Date" name="date" type="date" defaultValue={editing?.date || new Date().toISOString().slice(0, 10)} required />
            <FormInput label="Amount" name="amount" type="number" step="0.01" defaultValue={editing?.amount} required />
          </div>
          <FormInput label="Vendor" name="vendor" defaultValue={editing?.vendor} required />
          <FormSelect label="Category" name="category" options={categories} defaultValue={editing?.category} />
          <FormSelectLabeled label="Event" name="eventId" options={events.map(e => ({ value: e.id, label: e.name }))} defaultValue={editing?.eventId} />
          <FormTextArea label="Notes" name="notes" defaultValue={editing?.notes} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>

      <Modal open={scanModal} onClose={() => { setScanModal(false); setScanResult(null); setScanning(false); }} title="Scan Receipt" wide>
        {!scanResult && !scanning && (
          <div className="text-center py-8">
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); }} />
            <div className="border-2 border-dashed border-input p-8 mb-4 cursor-pointer hover:border-foreground transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleReceiptUpload(f); }}>
              <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-sans text-muted-foreground">Drop receipt image or click to upload</p>
            </div>
          </div>
        )}
        {scanning && (
          <div className="text-center py-12 animate-pulse-subtle">
            <Camera size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="font-sans text-sm">Analyzing receipt...</p>
          </div>
        )}
        {scanResult && (
          <div>
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              {scanResult.receiptUrl && (
                <div className="w-full sm:w-32 shrink-0">
                  <img src={scanResult.receiptUrl} alt="Receipt" className="w-full border border-input" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-sans mb-3 uppercase tracking-wider">Review & Edit Details</p>
                <form onSubmit={saveScanResult}>
                  <FormInput label="Date" name="date" type="date" defaultValue={scanResult.date} required />
                  <FormInput label="Vendor" name="vendor" defaultValue={scanResult.vendor} required />
                  <FormSelect label="Category" name="category" options={categories} defaultValue={scanResult.category} />
                  <FormInput label="Amount" name="amount" type="number" step="0.01" defaultValue={scanResult.amount} required />
                  <FormSelectLabeled label="Event" name="eventId" options={events.map(e => ({ value: e.id, label: e.name }))} defaultValue={scanResult.eventId} />
                  <FormTextArea label="Notes" name="notes" defaultValue={scanResult.notes} />
                  <input type="hidden" name="receiptUrl" value={scanResult.receiptUrl || ""} />
                  <div className="flex gap-3 mt-4">
                    <Btn type="submit">Save Expense</Btn>
                    <Btn variant="secondary" type="button" onClick={() => { setScanResult(null); }}>Re-scan</Btn>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
