import React from "react";
import { X, Settings, ToggleLeft, ToggleRight, RotateCcw, Download } from "lucide-react";
import { downloadExport } from "@/lib/dataService";
import { DataImportPanel } from "@/components/app/DataImportPanel";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  sampleDataEnabled: boolean;
  onToggleSampleData: () => void;
  onResetData: () => void;
  onImported: () => void;
  toast: (msg: string) => void;
}

export function SettingsPanel({ open, onClose, sampleDataEnabled, onToggleSampleData, onResetData, onImported, toast }: SettingsPanelProps) {
  if (!open) return null;

  const handleExport = () => {
    downloadExport();
    toast("Data exported successfully");
  };

  return (
    <div className="fixed inset-0 z-[998] flex items-start justify-end bg-foreground/20 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-background border-l border-foreground w-full max-w-sm h-full overflow-y-auto animate-slide-in-right" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-foreground px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings size={18} />
            <h2 className="font-display text-lg">Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Sample Data */}
          <div>
            <h3 className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-4">Sample Data</h3>
            <div className="border border-foreground p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-sans font-semibold">Sample Data</div>
                  <div className="text-xs text-muted-foreground font-sans mt-0.5">Toggle sample data on or off</div>
                </div>
                <button onClick={onToggleSampleData} className="p-1 hover:bg-muted transition-all duration-200 hover:scale-105">
                  {sampleDataEnabled ? <ToggleRight size={32} className="text-foreground" /> : <ToggleLeft size={32} className="text-muted-foreground" />}
                </button>
              </div>
              <div className="border-t border-input pt-4">
                <button onClick={onResetData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans border border-foreground hover:bg-muted transition-all duration-200 uppercase tracking-wide">
                  <RotateCcw size={14} /> Reset Sample Data
                </button>
                <p className="text-xs text-muted-foreground font-sans mt-2 text-center">Restore all data to initial sample values</p>
              </div>
            </div>
          </div>

          {/* Import browser data into Postgres */}
          <DataImportPanel toast={toast} onImported={onImported} />

          {/* Export Data */}
          <div>
            <h3 className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-4">Data Management</h3>
            <div className="border border-foreground p-4">
              <div className="text-sm font-sans font-semibold mb-1">Export All Data</div>
              <div className="text-xs text-muted-foreground font-sans mb-3">Download all events, clients, invoices, guests, expenses, vendors, and team data as JSON.</div>
              <button onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 uppercase tracking-wide">
                <Download size={14} /> Export Data (JSON)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
