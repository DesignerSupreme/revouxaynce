alter table public.clients
  add column if not exists portal_token_rotated_at timestamptz default now(),
  add column if not exists portal_token_expires_at timestamptz;

create index if not exists clients_portal_token_idx on public.clients (portal_token);

create or replace function public.rotate_portal_token(p_client_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'Not authorised';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  update public.clients
     set portal_token = v_token,
         portal_token_rotated_at = now(),
         portal_token_expires_at = null
   where id = p_client_id;

  return v_token;
end;
$$;

grant execute on function public.rotate_portal_token(uuid) to authenticated;

create or replace function public.backfill_portal_tokens()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authorised';
  end if;

  update public.clients
     set portal_token = encode(gen_random_bytes(32), 'hex'),
         portal_token_rotated_at = now(),
         portal_token_expires_at = null
   where portal_token is null or length(portal_token) < 32;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.backfill_portal_tokens() to authenticated;

create or replace function public.portal_client_access(_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = _client_id
      AND c.portal_token IS NOT NULL
      AND c.portal_token = public.current_portal_token()
      AND (c.portal_token_expires_at IS NULL OR c.portal_token_expires_at > now())
  )
$$;

create or replace function public.portal_invoice_access(_invoice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invoices i
    WHERE i.id = _invoice_id
      AND public.portal_client_access(i.client_id)
  )
$$;

create or replace function public.portal_current_client()
returns table (id uuid, name text, email text, phone text)
language sql
stable
security definer
set search_path = public
as $$
  SELECT c.id, c.name, c.email, c.phone
  FROM public.clients c
  WHERE c.portal_token IS NOT NULL
    AND c.portal_token = public.current_portal_token()
    AND (c.portal_token_expires_at IS NULL OR c.portal_token_expires_at > now())
  LIMIT 1
$$;

grant execute on function public.portal_current_client() to anon, authenticated;

revoke select on public.invoices from anon;
grant select (
  id, client_id, event_id, status, due_date, notes,
  tax_rate, discount_type, discount_value, discount_amount,
  billing_type, milestones, version, parent_id, last_sent_at, created_at
) on public.invoices to anon;