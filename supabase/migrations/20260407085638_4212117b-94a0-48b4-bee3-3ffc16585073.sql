-- 1. Remove anon INSERT on audit_logs (prevents log poisoning)
DROP POLICY "Service role can insert audit logs" ON public.audit_logs;

-- 2. Restrict anon SELECT on invoices to only portal-accessible invoices via client portal_token
DROP POLICY "Anon can read invoices" ON public.invoices;

CREATE POLICY "Anon can read portal invoices"
  ON public.invoices FOR SELECT
  TO anon
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE portal_token IS NOT NULL
    )
    AND internal_notes IS NOT DISTINCT FROM ''
    OR internal_notes IS NULL
  );

-- Actually, we can't do column-level filtering in RLS. Let's use a simpler scoped approach:
-- Drop the bad policy we just created and make a clean one
DROP POLICY "Anon can read portal invoices" ON public.invoices;

CREATE POLICY "Anon can read portal invoices"
  ON public.invoices FOR SELECT
  TO anon
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE portal_token IS NOT NULL
    )
  );

-- 3. Restrict anon SELECT on clients - only allow reading clients with a valid portal token, and only if the requester provides the correct token
DROP POLICY "Anon can read clients by portal token" ON public.clients;

CREATE POLICY "Anon can read clients by portal token match"
  ON public.clients FOR SELECT
  TO anon
  USING (
    portal_token IS NOT NULL
    AND portal_token = current_setting('request.headers', true)::json->>'x-portal-token'
  );

-- 4. Restrict anon SELECT on events - only events linked to portal-accessible clients
DROP POLICY "Anon can read events" ON public.events;

CREATE POLICY "Anon can read portal events"
  ON public.events FOR SELECT
  TO anon
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE portal_token IS NOT NULL
    )
  );

-- 5. Restrict anon SELECT on line_items - only for portal-accessible invoices
DROP POLICY "Anon can read line_items" ON public.line_items;

CREATE POLICY "Anon can read portal line items"
  ON public.line_items FOR SELECT
  TO anon
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE client_id IN (
        SELECT id FROM public.clients WHERE portal_token IS NOT NULL
      )
    )
  );