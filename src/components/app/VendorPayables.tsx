import React from "react";
import { fmtMoney } from "@/lib/currency";
import { useVendorPayables } from "@/hooks/useVendorPayables";

/** Money owed to vendors, drawn from expenses marked paid or unpaid. */
export function VendorPayables() {
  const { payables, loading } = useVendorPayables();
  const active = payables.filter((p) => p.billed > 0);

  if (loading || active.length === 0) return null;

  const owed = active.reduce((s, p) => s + p.outstanding, 0);
  const settled = active.reduce((s, p) => s + p.settled, 0);

  return (
    <div className="border border-foreground mb-6">
      <div className="border-b border-foreground px-4 py-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-sans">Payables</span>
        <span className="text-xs font-sans text-muted-foreground tabular-nums">
          {fmtMoney(owed)} still owed · {fmtMoney(settled)} settled
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-sans min-w-[560px]">
          <thead>
            <tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted">
              <th className="py-2 px-4">Vendor</th>
              <th className="py-2 px-4 text-right">Billed</th>
              <th className="py-2 px-4 text-right">Settled</th>
              <th className="py-2 px-4 text-right">Owed</th>
              <th className="py-2 px-4 text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {active.map((p) => (
              <tr key={p.vendor_id} className="border-b border-input last:border-0">
                <td className="py-2 px-4 font-semibold">{p.vendor_name}</td>
                <td className="py-2 px-4 text-right tabular-nums">{fmtMoney(p.billed)}</td>
                <td className="py-2 px-4 text-right tabular-nums text-muted-foreground">{fmtMoney(p.settled)}</td>
                <td className="py-2 px-4 text-right tabular-nums font-semibold">{fmtMoney(p.outstanding)}</td>
                <td className="py-2 px-4 text-right tabular-nums text-muted-foreground">{p.open_items}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
