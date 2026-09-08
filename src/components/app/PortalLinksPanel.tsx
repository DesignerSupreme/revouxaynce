import React, { useState } from "react";
import { Link2, RefreshCw, Copy, MessageCircle } from "lucide-react";
import { usePortalLinks } from "@/hooks/usePortalLinks";
import { portalUrlFor } from "@/lib/portalClient";

export function PortalLinksPanel({ toast }: { toast: (msg: string) => void }) {
  const { clients, loading, rotate, backfill } = usePortalLinks();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch {
      toast("Could not copy the link");
    }
  };

  const handleReset = async (id: string) => {
    setBusy(id);
    const token = await rotate(id);
    setBusy(null);
    if (!token) { toast("Could not reset the link"); return; }
    await copy(portalUrlFor(token), "New link copied. The old link no longer works.");
  };

  const handleBackfill = async () => {
    setBusy("all");
    const count = await backfill();
    setBusy(null);
    toast(count > 0 ? `Created links for ${count} client${count !== 1 ? "s" : ""}` : "Every client already has a link");
  };

  return (
    <div className="border border-foreground mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-sans uppercase tracking-wider">
          <Link2 size={14} /> Client portal links
        </span>
        <span className="text-xs font-sans text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t border-input">
          <div className="px-4 py-3 border-b border-input flex flex-wrap items-center gap-3">
            <p className="text-xs font-sans text-muted-foreground flex-1 min-w-[200px]">
              Each client gets one private link. Resetting a link immediately stops the old one working.
            </p>
            <button
              onClick={handleBackfill}
              disabled={busy === "all"}
              className="px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
            >
              {busy === "all" ? "Working…" : "Create missing links"}
            </button>
          </div>

          {loading ? (
            <p className="px-4 py-6 text-sm font-sans text-muted-foreground">Loading clients…</p>
          ) : clients.length === 0 ? (
            <p className="px-4 py-6 text-sm font-sans text-muted-foreground">
              No clients in the shared database yet.
            </p>
          ) : (
            <ul>
              {clients.map((c, i) => {
                const url = c.portal_token ? portalUrlFor(c.portal_token) : null;
                return (
                  <li key={c.id} className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 ${i % 2 === 1 ? "bg-muted/30" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-sans font-semibold truncate">{c.name}</div>
                      <div className="text-xs font-sans text-muted-foreground truncate">
                        {url ? url : "No link yet"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {url && (
                        <>
                          <button
                            onClick={() => copy(url, "Link copied")}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sans uppercase tracking-wider border border-input hover:bg-muted transition-colors"
                          >
                            <Copy size={12} /> Copy
                          </button>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Hi ${c.name}, here is your private Revouxaynce portal link: ${url}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sans uppercase tracking-wider border border-input hover:bg-muted transition-colors"
                          >
                            <MessageCircle size={12} /> WhatsApp
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => handleReset(c.id)}
                        disabled={busy === c.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sans uppercase tracking-wider border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={12} /> {busy === c.id ? "Resetting…" : "Reset link"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
