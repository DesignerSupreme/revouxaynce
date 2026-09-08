import React, { useState } from "react";
import { Btn, FormInput, FormSelect } from "@/components/app/FormElements";
import { CURRENCIES } from "@/lib/currency";
import { useFxRates } from "@/hooks/useFxRates";

interface Props {
  toast: (msg: string) => void;
  canWrite?: boolean;
}

/** Dated exchange rates against USD, so historical documents keep their own rate. */
export function FxRatesPanel({ toast, canWrite = true }: Props) {
  const { rates, saveRate } = useFxRates();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const currency = String(fd.get("currency") || "");
    const rate = parseFloat(String(fd.get("rate") || "0"));
    const date = String(fd.get("date") || "");
    if (!currency || currency === "USD" || !rate || !date) { toast("Pick a currency, rate and date"); return; }
    setBusy(true);
    try {
      await saveRate(currency, rate, date);
      toast(`Rate saved for ${currency}`);
      e.currentTarget.reset();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save the rate");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-foreground mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs uppercase tracking-wider font-sans hover:bg-muted transition-colors"
      >
        <span>Exchange rates</span>
        <span className="text-muted-foreground normal-case tracking-normal">
          {rates.length ? `${rates.length} recorded` : "None recorded"}
        </span>
      </button>

      {open && (
        <div className="border-t border-foreground p-4">
          <p className="text-sm text-muted-foreground font-sans mb-4">
            One rate is how much a single unit is worth in US dollars on that day. Documents keep the rate that applied when they were created.
          </p>

          {canWrite && (
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end mb-4">
              <FormSelect label="Currency" name="currency" options={CURRENCIES.filter((c) => c !== "USD") as unknown as string[]} />
              <FormInput label="Worth in USD" name="rate" type="number" step="0.0001" placeholder="0.0550" />
              <FormInput label="Date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              <div className="mb-3"><Btn type="submit" disabled={busy}>{busy ? "Saving" : "Save rate"}</Btn></div>
            </form>
          )}

          {rates.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4">Currency</th>
                    <th className="py-2 pr-4 text-right tabular-nums">Worth in USD</th>
                    <th className="py-2 pr-4">From</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.slice(0, 12).map((r) => (
                    <tr key={r.id} className="border-b border-input last:border-0">
                      <td className="py-2 pr-4 font-semibold">{r.quote_currency}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{r.rate}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{r.rate_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
