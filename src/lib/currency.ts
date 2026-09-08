/** Currencies the team quotes and spends in. Rates are stored against USD. */
export const CURRENCIES = ["USD", "ZWG", "ZAR", "GBP", "EUR", "BWP"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const BASE_CURRENCY: CurrencyCode = "USD";

/** Format an amount in its own currency, with tabular figures in mind. */
export function fmtMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Convert a document amount to USD using the rate captured on that document. */
export function toUsd(amount: number, fxRate?: number | null): number {
  return amount * (fxRate == null || fxRate <= 0 ? 1 : fxRate);
}
