-- ── Roles ─────────────────────────────────────────────
create type public.app_role as enum ('admin', 'planner', 'assistant', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'planner')
$$;

create or replace function public.can_assist()
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_write() or public.has_role(auth.uid(), 'assistant')
$$;

create policy "Users read all profiles" on public.profiles for select to authenticated using (auth.uid() is not null);
create policy "Users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

create policy "Users read roles" on public.user_roles for select to authenticated using (auth.uid() is not null);
create policy "Admins manage roles" on public.user_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create trigger update_profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at_column();

-- new signups get a profile; first ever account becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, case when exists (select 1 from public.user_roles) then 'viewer'::public.app_role else 'admin'::public.app_role end)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- backfill anyone who already signed up
insert into public.profiles (id, full_name, email)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', ''), coalesce(u.email, '')
from auth.users u on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role from auth.users u on conflict do nothing;

-- ── Soft delete ───────────────────────────────────────
alter table public.clients  add column if not exists deleted_at timestamptz;
alter table public.events   add column if not exists deleted_at timestamptz;
alter table public.vendors  add column if not exists deleted_at timestamptz;
alter table public.guests   add column if not exists deleted_at timestamptz;
alter table public.expenses add column if not exists deleted_at timestamptz;
alter table public.tasks    add column if not exists deleted_at timestamptz;
alter table public.invoices add column if not exists deleted_at timestamptz;

create index if not exists idx_clients_deleted_at on public.clients (deleted_at);
create index if not exists idx_events_deleted_at on public.events (deleted_at);
create index if not exists idx_vendors_deleted_at on public.vendors (deleted_at);
create index if not exists idx_guests_deleted_at on public.guests (deleted_at);
create index if not exists idx_expenses_deleted_at on public.expenses (deleted_at);
create index if not exists idx_tasks_deleted_at on public.tasks (deleted_at);
create index if not exists idx_invoices_deleted_at on public.invoices (deleted_at);

-- ── Role-aware write policies ────────────────────────
-- planners+admins: full write. assistants: tasks/guests/expenses. viewers: read only. deletes: admin only.
drop policy if exists "Authenticated users can insert clients" on public.clients;
drop policy if exists "Authenticated users can update clients" on public.clients;
drop policy if exists "Authenticated users can delete clients" on public.clients;
create policy "Writers insert clients" on public.clients for insert to authenticated with check (public.can_write());
create policy "Writers update clients" on public.clients for update to authenticated using (public.can_write()) with check (public.can_write());
create policy "Admins delete clients" on public.clients for delete to authenticated using (public.is_admin());

drop policy if exists "Authenticated users can insert events" on public.events;
drop policy if exists "Authenticated users can update events" on public.events;
drop policy if exists "Authenticated users can delete events" on public.events;
create policy "Writers insert events" on public.events for insert to authenticated with check (public.can_write());
create policy "Writers update events" on public.events for update to authenticated using (public.can_write()) with check (public.can_write());
create policy "Admins delete events" on public.events for delete to authenticated using (public.is_admin());

drop policy if exists "Authenticated users can insert vendors" on public.vendors;
drop policy if exists "Authenticated users can update vendors" on public.vendors;
drop policy if exists "Authenticated users can delete vendors" on public.vendors;
create policy "Writers insert vendors" on public.vendors for insert to authenticated with check (public.can_write());
create policy "Writers update vendors" on public.vendors for update to authenticated using (public.can_write()) with check (public.can_write());
create policy "Admins delete vendors" on public.vendors for delete to authenticated using (public.is_admin());

drop policy if exists "Authenticated users can insert invoices" on public.invoices;
drop policy if exists "Authenticated users can update invoices" on public.invoices;
drop policy if exists "Authenticated users can delete invoices" on public.invoices;
create policy "Writers insert invoices" on public.invoices for insert to authenticated with check (public.can_write());
create policy "Writers update invoices" on public.invoices for update to authenticated using (public.can_write()) with check (public.can_write());
create policy "Admins delete invoices" on public.invoices for delete to authenticated using (public.is_admin());

drop policy if exists "Authenticated users can insert line_items" on public.line_items;
drop policy if exists "Authenticated users can update line_items" on public.line_items;
drop policy if exists "Authenticated users can delete line_items" on public.line_items;
create policy "Writers insert line_items" on public.line_items for insert to authenticated with check (public.can_write());
create policy "Writers update line_items" on public.line_items for update to authenticated using (public.can_write()) with check (public.can_write());
create policy "Writers delete line_items" on public.line_items for delete to authenticated using (public.can_write());

drop policy if exists "Authenticated users can insert guests" on public.guests;
drop policy if exists "Authenticated users can update guests" on public.guests;
drop policy if exists "Authenticated users can delete guests" on public.guests;
create policy "Assistants insert guests" on public.guests for insert to authenticated with check (public.can_assist());
create policy "Assistants update guests" on public.guests for update to authenticated using (public.can_assist()) with check (public.can_assist());
create policy "Admins delete guests" on public.guests for delete to authenticated using (public.is_admin());

drop policy if exists "Authenticated users can insert expenses" on public.expenses;
drop policy if exists "Authenticated users can update expenses" on public.expenses;
drop policy if exists "Authenticated users can delete expenses" on public.expenses;
create policy "Assistants insert expenses" on public.expenses for insert to authenticated with check (public.can_assist());
create policy "Assistants update expenses" on public.expenses for update to authenticated using (public.can_assist()) with check (public.can_assist());
create policy "Admins delete expenses" on public.expenses for delete to authenticated using (public.is_admin());

drop policy if exists "Authenticated users can insert tasks" on public.tasks;
drop policy if exists "Authenticated users can update tasks" on public.tasks;
drop policy if exists "Authenticated users can delete tasks" on public.tasks;
create policy "Assistants insert tasks" on public.tasks for insert to authenticated with check (public.can_assist());
create policy "Assistants update tasks" on public.tasks for update to authenticated using (public.can_assist()) with check (public.can_assist());
create policy "Admins delete tasks" on public.tasks for delete to authenticated using (public.is_admin());

drop policy if exists "Authenticated users can insert brand settings" on public.brand_settings;
drop policy if exists "Authenticated users can update brand settings" on public.brand_settings;
create policy "Writers insert brand settings" on public.brand_settings for insert to authenticated with check (public.can_write());
create policy "Writers update brand settings" on public.brand_settings for update to authenticated using (public.can_write()) with check (public.can_write());

-- ── Portal must not show removed records ─────────────
drop policy if exists "Anon can read portal events" on public.events;
create policy "Anon can read portal events" on public.events for select to anon
using (public.portal_client_access(client_id) and deleted_at is null);

drop policy if exists "Anon can read portal invoices" on public.invoices;
create policy "Anon can read portal invoices" on public.invoices for select to anon
using (public.portal_client_access(client_id) and deleted_at is null);

create or replace function public.portal_invoice_access(_invoice_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.invoices i
    where i.id = _invoice_id and i.deleted_at is null and public.portal_client_access(i.client_id)
  )
$$;