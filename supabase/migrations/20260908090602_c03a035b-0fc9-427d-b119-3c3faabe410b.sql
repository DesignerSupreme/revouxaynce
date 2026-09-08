-- Pure calculator: subtotal -> discount -> tax -> grand total
CREATE OR REPLACE FUNCTION public.calc_invoice_totals(
  _subtotal numeric,
  _discount_type text,
  _discount_value numeric,
  _tax_rate numeric
)
RETURNS TABLE(subtotal numeric, discount numeric, after_discount numeric, tax numeric, grand_total numeric)
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      round(coalesce(_subtotal, 0), 2) AS sub,
      CASE WHEN coalesce(_discount_type, 'flat') = 'percent'
           THEN round(coalesce(_subtotal, 0) * coalesce(_discount_value, 0) / 100.0, 2)
           ELSE round(coalesce(_discount_value, 0), 2)
      END AS disc
  ), capped AS (
    SELECT sub, least(disc, sub) AS disc, greatest(sub - disc, 0) AS after_disc FROM base
  )
  SELECT sub,
         disc,
         after_disc,
         round(after_disc * coalesce(_tax_rate, 0) / 100.0, 2) AS tax,
         after_disc + round(after_disc * coalesce(_tax_rate, 0) / 100.0, 2) AS grand_total
  FROM capped;
$$;

-- Totals for a stored invoice
CREATE OR REPLACE FUNCTION public.invoice_totals(_invoice_id uuid)
RETURNS TABLE(subtotal numeric, discount numeric, after_discount numeric, tax numeric, grand_total numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT t.*
  FROM public.invoices i
  CROSS JOIN LATERAL (
    SELECT coalesce(sum(li.quantity * li.unit_price), 0) AS sub
    FROM public.line_items li
    WHERE li.invoice_id = i.id
  ) s
  CROSS JOIN LATERAL public.calc_invoice_totals(
    s.sub,
    coalesce(i.discount_type, 'flat'),
    coalesce(nullif(i.discount_value, 0), i.discount_amount, 0),
    coalesce(i.tax_rate, 0)
  ) t
  WHERE i.id = _invoice_id;
$$;

GRANT EXECUTE ON FUNCTION public.calc_invoice_totals(numeric, text, numeric, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.invoice_totals(uuid) TO authenticated, service_role;

-- Self-test for the calculator
CREATE OR REPLACE FUNCTION public.test_invoice_totals()
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE r record; failures text[] := '{}';
BEGIN
  SELECT * INTO r FROM public.calc_invoice_totals(1000, 'flat', 0, 0);
  IF r.grand_total <> 1000 THEN failures := failures || 'plain subtotal'; END IF;

  SELECT * INTO r FROM public.calc_invoice_totals(1000, 'percent', 10, 0);
  IF r.discount <> 100 OR r.grand_total <> 900 THEN failures := failures || 'percent discount'; END IF;

  SELECT * INTO r FROM public.calc_invoice_totals(1000, 'flat', 250, 0);
  IF r.after_discount <> 750 THEN failures := failures || 'flat discount'; END IF;

  SELECT * INTO r FROM public.calc_invoice_totals(1000, 'flat', 0, 15);
  IF r.tax <> 150 OR r.grand_total <> 1150 THEN failures := failures || 'tax only'; END IF;

  SELECT * INTO r FROM public.calc_invoice_totals(1000, 'percent', 10, 15);
  IF r.tax <> 135 OR r.grand_total <> 1035 THEN failures := failures || 'discount then tax'; END IF;

  SELECT * INTO r FROM public.calc_invoice_totals(500, 'flat', 900, 10);
  IF r.discount <> 500 OR r.after_discount <> 0 OR r.grand_total <> 0 THEN failures := failures || 'discount capped at subtotal'; END IF;

  SELECT * INTO r FROM public.calc_invoice_totals(NULL, NULL, NULL, NULL);
  IF r.grand_total <> 0 THEN failures := failures || 'null safety'; END IF;

  IF array_length(failures, 1) IS NULL THEN
    RETURN 'PASS: 7/7 invoice total checks';
  END IF;
  RAISE EXCEPTION 'FAIL: %', array_to_string(failures, ', ');
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_invoice_totals() TO authenticated, service_role;

-- Per-event financial summary
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
    sum(t.grand_total) AS invoiced,
    sum(t.grand_total) FILTER (WHERE i.status = 'Paid') AS paid
  FROM public.invoices i
  CROSS JOIN LATERAL public.invoice_totals(i.id) t
  WHERE i.event_id = e.id AND i.deleted_at IS NULL AND i.status <> 'Draft'
) inv ON true
LEFT JOIN LATERAL (
  SELECT sum(x.amount) AS spent
  FROM public.expenses x
  WHERE x.event_id = e.id AND x.deleted_at IS NULL
) exp ON true
WHERE e.deleted_at IS NULL;

GRANT SELECT ON public.event_financials TO authenticated;