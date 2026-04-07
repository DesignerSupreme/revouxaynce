CREATE OR REPLACE FUNCTION public.current_portal_token()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT nullif((coalesce(current_setting('request.headers', true), '{}'))::jsonb ->> 'x-portal-token', '')
$$;

CREATE OR REPLACE FUNCTION public.portal_client_access(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = _client_id
      AND c.portal_token IS NOT NULL
      AND c.portal_token = public.current_portal_token()
  )
$$;

CREATE OR REPLACE FUNCTION public.portal_invoice_access(_invoice_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invoices i
    WHERE i.id = _invoice_id
      AND public.portal_client_access(i.client_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.stamp_audit_log_actor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.performed_by := COALESCE(auth.uid()::text, 'system');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_stamp_actor ON public.audit_logs;
CREATE TRIGGER audit_logs_stamp_actor
BEFORE INSERT ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.stamp_audit_log_actor();

DROP POLICY IF EXISTS "Anon can read clients by portal token match" ON public.clients;

DROP POLICY IF EXISTS "Anon can read portal events" ON public.events;
CREATE POLICY "Anon can read portal events"
ON public.events
FOR SELECT
TO anon
USING (public.portal_client_access(client_id));

DROP POLICY IF EXISTS "Anon can read portal invoices" ON public.invoices;
CREATE POLICY "Anon can read portal invoices"
ON public.invoices
FOR SELECT
TO anon
USING (public.portal_client_access(client_id));

DROP POLICY IF EXISTS "Anon can read portal line items" ON public.line_items;
CREATE POLICY "Anon can read portal line items"
ON public.line_items
FOR SELECT
TO anon
USING (public.portal_invoice_access(invoice_id));

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can read audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert brand settings" ON public.brand_settings;
CREATE POLICY "Authenticated users can insert brand settings"
ON public.brand_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read brand settings" ON public.brand_settings;
CREATE POLICY "Authenticated users can read brand settings"
ON public.brand_settings
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update brand settings" ON public.brand_settings;
CREATE POLICY "Authenticated users can update brand settings"
ON public.brand_settings
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;
CREATE POLICY "Authenticated users can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
CREATE POLICY "Authenticated users can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
CREATE POLICY "Authenticated users can read clients"
ON public.clients
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
CREATE POLICY "Authenticated users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;
CREATE POLICY "Authenticated users can delete events"
ON public.events
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
CREATE POLICY "Authenticated users can insert events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read events" ON public.events;
CREATE POLICY "Authenticated users can read events"
ON public.events
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
CREATE POLICY "Authenticated users can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete comments" ON public.invoice_comments;
CREATE POLICY "Authenticated users can delete comments"
ON public.invoice_comments
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.invoice_comments;
CREATE POLICY "Authenticated users can insert comments"
ON public.invoice_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read comments" ON public.invoice_comments;
CREATE POLICY "Authenticated users can read comments"
ON public.invoice_comments
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON public.invoices;
CREATE POLICY "Authenticated users can delete invoices"
ON public.invoices
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
CREATE POLICY "Authenticated users can insert invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read invoices" ON public.invoices;
CREATE POLICY "Authenticated users can read invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
CREATE POLICY "Authenticated users can update invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete line_items" ON public.line_items;
CREATE POLICY "Authenticated users can delete line_items"
ON public.line_items
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert line_items" ON public.line_items;
CREATE POLICY "Authenticated users can insert line_items"
ON public.line_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read line_items" ON public.line_items;
CREATE POLICY "Authenticated users can read line_items"
ON public.line_items
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update line_items" ON public.line_items;
CREATE POLICY "Authenticated users can update line_items"
ON public.line_items
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);