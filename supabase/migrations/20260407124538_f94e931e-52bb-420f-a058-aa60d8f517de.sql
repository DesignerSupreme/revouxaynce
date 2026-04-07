
-- Fix events anon policy to validate portal token
DROP POLICY IF EXISTS "Anon can read portal events" ON public.events;
CREATE POLICY "Anon can read portal events"
  ON public.events FOR SELECT TO anon
  USING (
    client_id IN (
      SELECT id FROM public.clients
      WHERE portal_token IS NOT NULL
        AND portal_token = (current_setting('request.headers', true)::json ->> 'x-portal-token')
    )
  );

-- Fix invoices anon policy to validate portal token
DROP POLICY IF EXISTS "Anon can read portal invoices" ON public.invoices;
CREATE POLICY "Anon can read portal invoices"
  ON public.invoices FOR SELECT TO anon
  USING (
    client_id IN (
      SELECT id FROM public.clients
      WHERE portal_token IS NOT NULL
        AND portal_token = (current_setting('request.headers', true)::json ->> 'x-portal-token')
    )
  );

-- Fix line_items anon policy to validate portal token
DROP POLICY IF EXISTS "Anon can read portal line items" ON public.line_items;
CREATE POLICY "Anon can read portal line items"
  ON public.line_items FOR SELECT TO anon
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE client_id IN (
        SELECT id FROM public.clients
        WHERE portal_token IS NOT NULL
          AND portal_token = (current_setting('request.headers', true)::json ->> 'x-portal-token')
      )
    )
  );
