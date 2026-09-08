-- ── Vendors ───────────────────────────────────────────────────────
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  contact text not null default '',
  rating integer not null default 0,
  notes text not null default '',
  event_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.vendors to authenticated;
grant all on public.vendors to service_role;

alter table public.vendors enable row level security;

drop policy if exists "Authenticated users can read vendors" on public.vendors;
create policy "Authenticated users can read vendors" on public.vendors
  for select to authenticated using (auth.uid() is not null);
drop policy if exists "Authenticated users can insert vendors" on public.vendors;
create policy "Authenticated users can insert vendors" on public.vendors
  for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "Authenticated users can update vendors" on public.vendors;
create policy "Authenticated users can update vendors" on public.vendors
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "Authenticated users can delete vendors" on public.vendors;
create policy "Authenticated users can delete vendors" on public.vendors
  for delete to authenticated using (auth.uid() is not null);

drop trigger if exists update_vendors_updated_at on public.vendors;
create trigger update_vendors_updated_at before update on public.vendors
  for each row execute function public.update_updated_at_column();

-- ── Guests ────────────────────────────────────────────────────────
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  rsvp text not null default 'Pending',
  dietary text not null default '',
  table_group text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.guests to authenticated;
grant all on public.guests to service_role;

alter table public.guests enable row level security;

drop policy if exists "Authenticated users can read guests" on public.guests;
create policy "Authenticated users can read guests" on public.guests
  for select to authenticated using (auth.uid() is not null);
drop policy if exists "Authenticated users can insert guests" on public.guests;
create policy "Authenticated users can insert guests" on public.guests
  for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "Authenticated users can update guests" on public.guests;
create policy "Authenticated users can update guests" on public.guests
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "Authenticated users can delete guests" on public.guests;
create policy "Authenticated users can delete guests" on public.guests
  for delete to authenticated using (auth.uid() is not null);

drop trigger if exists update_guests_updated_at on public.guests;
create trigger update_guests_updated_at before update on public.guests
  for each row execute function public.update_updated_at_column();

create index if not exists guests_event_id_idx on public.guests (event_id);
create index if not exists guests_rsvp_idx on public.guests (rsvp);

-- ── Expenses ──────────────────────────────────────────────────────
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  spent_on date not null default current_date,
  vendor text not null default '',
  category text not null default '',
  amount numeric not null default 0,
  notes text not null default '',
  receipt_url text not null default '',
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;

alter table public.expenses enable row level security;

drop policy if exists "Authenticated users can read expenses" on public.expenses;
create policy "Authenticated users can read expenses" on public.expenses
  for select to authenticated using (auth.uid() is not null);
drop policy if exists "Authenticated users can insert expenses" on public.expenses;
create policy "Authenticated users can insert expenses" on public.expenses
  for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "Authenticated users can update expenses" on public.expenses;
create policy "Authenticated users can update expenses" on public.expenses
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "Authenticated users can delete expenses" on public.expenses;
create policy "Authenticated users can delete expenses" on public.expenses
  for delete to authenticated using (auth.uid() is not null);

drop trigger if exists update_expenses_updated_at on public.expenses;
create trigger update_expenses_updated_at before update on public.expenses
  for each row execute function public.update_updated_at_column();

create index if not exists expenses_event_id_idx on public.expenses (event_id);
create index if not exists expenses_vendor_id_idx on public.expenses (vendor_id);
create index if not exists expenses_spent_on_idx on public.expenses (spent_on);

-- ── Tasks ─────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  assignee_id text not null default '',
  stage text not null default 'Planning',
  priority text not null default 'Medium',
  due_on date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;

alter table public.tasks enable row level security;

drop policy if exists "Authenticated users can read tasks" on public.tasks;
create policy "Authenticated users can read tasks" on public.tasks
  for select to authenticated using (auth.uid() is not null);
drop policy if exists "Authenticated users can insert tasks" on public.tasks;
create policy "Authenticated users can insert tasks" on public.tasks
  for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "Authenticated users can update tasks" on public.tasks;
create policy "Authenticated users can update tasks" on public.tasks
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "Authenticated users can delete tasks" on public.tasks;
create policy "Authenticated users can delete tasks" on public.tasks
  for delete to authenticated using (auth.uid() is not null);

drop trigger if exists update_tasks_updated_at on public.tasks;
create trigger update_tasks_updated_at before update on public.tasks
  for each row execute function public.update_updated_at_column();

create index if not exists tasks_event_id_idx on public.tasks (event_id);
create index if not exists tasks_stage_idx on public.tasks (stage);

-- ── Typed date/time columns (dual-write period) ───────────────────
alter table public.events
  add column if not exists event_date date,
  add column if not exists event_time time;

update public.events
   set event_date = nullif(date, '')::date
 where event_date is null and date ~ '^\d{4}-\d{2}-\d{2}$';

update public.events
   set event_time = nullif(time, '')::time
 where event_time is null and time ~ '^\d{1,2}:\d{2}(:\d{2})?$';

create index if not exists events_event_date_idx on public.events (event_date);

alter table public.invoices
  add column if not exists due_on date;

update public.invoices
   set due_on = nullif(due_date, '')::date
 where due_on is null and due_date ~ '^\d{4}-\d{2}-\d{2}$';

create index if not exists invoices_due_on_idx on public.invoices (due_on);

grant select (due_on) on public.invoices to anon;

-- Overdue check now uses the real date column, falling back to the text one.
create or replace function public.mark_overdue_invoices()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.invoices
  set status = 'Overdue'
  where status in ('Sent', 'Quotation')
    and status <> 'Paid'
    and coalesce(due_on, nullif(due_date, '')::date) < current_date;
end;
$$;

revoke all on function public.mark_overdue_invoices() from public, anon;
grant execute on function public.mark_overdue_invoices() to authenticated, service_role;
