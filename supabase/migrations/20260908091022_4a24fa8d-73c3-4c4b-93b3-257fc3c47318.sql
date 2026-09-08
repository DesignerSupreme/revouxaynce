-- 1. Dated FX rates (rate = value of 1 unit of quote_currency in base USD)
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL DEFAULT 'USD',
  quote_currency text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  rate_date date NOT NULL DEFAULT CURRENT_DATE,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS fx_rates_unique_day
  ON public.fx_rates (base_currency, quote_currency, rate_date);
CREATE INDEX IF NOT EXISTS fx_rates_lookup
  ON public.fx_rates (quote_currency, rate_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fx_rates TO authenticated;
GRANT ALL ON public.fx_rates TO service_role;

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read fx rates" ON public.fx_rates;
CREATE POLICY "Authenticated users can read fx rates" ON public.fx_rates
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Writers insert fx rates" ON public.fx_rates;
CREATE POLICY "Writers insert fx rates" ON public.fx_rates
  FOR INSERT TO authenticated WITH CHECK (public.can_write());
DROP POLICY IF EXISTS "Writers update fx rates" ON public.fx_rates;
CREATE POLICY "Writers update fx rates" ON public.fx_rates
  FOR UPDATE TO authenticated USING (public.can_write()) WITH CHECK (public.can_write());
DROP POLICY IF EXISTS "Admins delete fx rates" ON public.fx_rates;
CREATE POLICY "Admins delete fx rates" ON public.fx_rates
  FOR DELETE TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS update_fx_rates_updated_at ON public.fx_rates;
CREATE TRIGGER update_fx_rates_updated_at BEFORE UPDATE ON public.fx_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Currency on money-bearing documents
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS fx_rate numeric DEFAULT 1;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS fx_rate numeric DEFAULT 1;

GRANT SELECT (currency, fx_rate) ON public.invoices TO anon;

-- 3. Rate lookup: newest rate on or before a date
CREATE OR REPLACE FUNCTION public.fx_rate_on(_currency text, _on date DEFAULT CURRENT_DATE)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN coalesce(_currency, 'USD') = 'USD' THEN 1
    ELSE coalesce((
      SELECT f.rate FROM public.fx_rates f
      WHERE f.quote_currency = _currency
        AND f.base_currency = 'USD'
        AND f.rate_date <= coalesce(_on, CURRENT_DATE)
      ORDER BY f.rate_date DESC
      LIMIT 1
    ), 1)
  END;
$$;

GRANT EXECUTE ON FUNCTION public.fx_rate_on(text, date) TO authenticated, service_role;

-- 4. Client enquiry pipeline
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'Enquiry';

UPDATE public.clients SET pipeline_stage = CASE
    WHEN status IN ('Inquiry', 'Enquiry', 'Active') THEN 'Enquiry'
    WHEN status = 'Quoted' THEN 'Quoted'
    WHEN status IN ('Confirmed', 'Booked') THEN 'Booked'
    WHEN status IN ('Completed', 'Delivered') THEN 'Delivered'
    WHEN status = 'Archived' THEN 'Archived'
    ELSE 'Enquiry'
  END
WHERE pipeline_stage IS NULL;

CREATE INDEX IF NOT EXISTS clients_pipeline_stage_idx ON public.clients (pipeline_stage);
CREATE INDEX IF NOT EXISTS expenses_vendor_id_idx ON public.expenses (vendor_id);
CREATE INDEX IF NOT EXISTS expenses_event_id_idx ON public.expenses (event_id);

-- 5. Vendor payables (USD)
CREATE OR REPLACE VIEW public.vendor_payables
WITH (security_invoker = true) AS
SELECT
  v.id AS vendor_id,
  v.name AS vendor_name,
  v.category,
  coalesce(sum(x.amount * coalesce(x.fx_rate, 1)), 0) AS billed,
  coalesce(sum(x.amount * coalesce(x.fx_rate, 1)) FILTER (WHERE x.paid), 0) AS settled,
  coalesce(sum(x.amount * coalesce(x.fx_rate, 1)) FILTER (WHERE NOT x.paid), 0) AS outstanding,
  count(x.id) FILTER (WHERE NOT x.paid) AS open_items,
  max(x.spent_on) AS last_activity
FROM public.vendors v
LEFT JOIN public.expenses x
  ON x.deleted_at IS NULL
 AND (x.vendor_id = v.id OR (x.vendor_id IS NULL AND lower(x.vendor) = lower(v.name)))
WHERE v.deleted_at IS NULL
GROUP BY v.id, v.name, v.category;

GRANT SELECT ON public.vendor_payables TO authenticated;

-- 6. Event financials, currency-aware
CREATE OR REPLACE VIEW public.event_financials
WITH (security_invoker = true) AS
SELECT
  e.id AS event_id,
  e.name AS event_name,
  e.client_id,
  coalesce(inv.invoiced, 0) AS invoiced,
  coalesce(inv.paid, 0) AS paid,
  coalesce(exp.spent, 0) AS spent,
  coalesce(inv.invoiced, 0) - coalesce(exp.spent, 0) AS margin,
  CASE WHEN coalesce(inv.invoiced, 0) = 0 THEN 0
       ELSE round(((coalesce(inv.invoiced, 0) - coalesce(exp.spent, 0)) / inv.invoiced) * 100, 2)
  END AS margin_pct
FROM public.events e
LEFT JOIN LATERAL (
  SELECT
    sum(t.grand_total * coalesce(i.fx_rate, 1)) AS invoiced,
    sum(t.grand_total * coalesce(i.fx_rate, 1)) FILTER (WHERE i.status = 'Paid') AS paid
  FROM public.invoices i
  CROSS JOIN LATERAL public.invoice_totals(i.id) t
  WHERE i.event_id = e.id AND i.deleted_at IS NULL AND i.status <> 'Draft'
) inv ON true
LEFT JOIN LATERAL (
  SELECT sum(x.amount * coalesce(x.fx_rate, 1)) AS spent
  FROM public.expenses x
  WHERE x.event_id = e.id AND x.deleted_at IS NULL
) exp ON true
WHERE e.deleted_at IS NULL;

GRANT SELECT ON public.event_financials TO authenticated;