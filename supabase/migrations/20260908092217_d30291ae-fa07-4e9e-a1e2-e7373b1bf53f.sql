-- Helper functions
create or replace function public.portal_event_access(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from events e
    join clients c on c.id = e.client_id
    where e.id = p_event_id
      and c.portal_token is not null
      and c.portal_token = public.current_portal_token()
      and (c.portal_token_expires_at is null or c.portal_token_expires_at > now())
  );
$$;

create or replace function public.portal_client_from_token()
returns uuid language sql stable security definer set search_path = public as $$
  select c.id from clients c
  where c.portal_token is not null
    and c.portal_token = public.current_portal_token()
    and (c.portal_token_expires_at is null or c.portal_token_expires_at > now())
  limit 1;
$$;

grant execute on function public.portal_event_access(uuid) to anon, authenticated;
grant execute on function public.portal_client_from_token() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Concepts
create table if not exists public.concepts (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  name       text not null,
  summary    text,
  position   integer not null default 0,
  status     text not null default 'Draft',
  shared_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concepts_status_check
    check (status in ('Draft', 'Shared', 'Chosen', 'Not chosen', 'Changes Requested'))
);

grant select, insert, update, delete on public.concepts to authenticated;
grant select on public.concepts to anon;
grant all on public.concepts to service_role;

-- Inspiration boards
create table if not exists public.inspiration_boards (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  concept_id    uuid references public.concepts(id) on delete set null,
  title         text not null default 'Inspiration',
  description   text,
  status        text not null default 'Draft',
  cover_item_id uuid,
  shared_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint inspiration_boards_status_check
    check (status in ('Draft', 'Shared', 'Approved', 'Changes Requested'))
);

grant select, insert, update, delete on public.inspiration_boards to authenticated;
grant select on public.inspiration_boards to anon;
grant all on public.inspiration_boards to service_role;

create table if not exists public.inspiration_items (
  id           uuid primary key default gen_random_uuid(),
  board_id     uuid not null references public.inspiration_boards(id) on delete cascade,
  storage_path text not null,
  caption      text,
  category     text,
  source_url   text,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

grant select, insert, update, delete on public.inspiration_items to authenticated;
grant select on public.inspiration_items to anon;
grant all on public.inspiration_items to service_role;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inspiration_boards_cover_item_fkey') then
    alter table public.inspiration_boards
      add constraint inspiration_boards_cover_item_fkey
      foreign key (cover_item_id) references public.inspiration_items(id) on delete set null;
  end if;
end $$;

-- Budgets
create table if not exists public.budgets (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  concept_id        uuid references public.concepts(id) on delete set null,
  title             text not null default 'Event Budget',
  currency          text not null default 'USD',
  status            text not null default 'Draft',
  contingency_type  text not null default 'percent',
  contingency_value numeric not null default 0,
  notes             text,
  internal_notes    text,
  version           integer not null default 1,
  parent_id         uuid references public.budgets(id) on delete set null,
  shared_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint budgets_status_check
    check (status in ('Draft', 'Shared', 'Approved', 'Changes Requested')),
  constraint budgets_contingency_type_check
    check (contingency_type in ('percent', 'flat'))
);

grant select, insert, update, delete on public.budgets to authenticated;
grant all on public.budgets to service_role;

create table if not exists public.budget_lines (
  id          uuid primary key default gen_random_uuid(),
  budget_id   uuid not null references public.budgets(id) on delete cascade,
  category    text not null default 'Other',
  description text not null,
  quantity    numeric not null default 1,
  unit_price  numeric not null default 0,
  vendor_name text,
  vendor_id   uuid,
  status      text not null default 'Estimated',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  constraint budget_lines_status_check check (status in ('Estimated', 'Confirmed'))
);

grant select, insert, update, delete on public.budget_lines to authenticated;
grant select on public.budget_lines to anon;
grant all on public.budget_lines to service_role;

-- Vendor options
create table if not exists public.vendor_options (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  concept_id     uuid references public.concepts(id) on delete set null,
  title          text not null,
  category       text,
  description    text,
  selection_mode text not null default 'single',
  status         text not null default 'Draft',
  shared_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint vendor_options_status_check
    check (status in ('Draft', 'Shared', 'Decided', 'Changes Requested')),
  constraint vendor_options_selection_mode_check
    check (selection_mode in ('single', 'multiple'))
);

grant select, insert, update, delete on public.vendor_options to authenticated;
grant select on public.vendor_options to anon;
grant all on public.vendor_options to service_role;

create table if not exists public.vendor_option_items (
  id          uuid primary key default gen_random_uuid(),
  option_id   uuid not null references public.vendor_options(id) on delete cascade,
  vendor_name text not null,
  vendor_id   uuid,
  headline    text,
  description text,
  price       numeric,
  image_path  text,
  link_url    text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

grant select, insert, update, delete on public.vendor_option_items to authenticated;
grant select on public.vendor_option_items to anon;
grant all on public.vendor_option_items to service_role;

-- Portal responses
create table if not exists public.portal_responses (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  event_id     uuid references public.events(id) on delete cascade,
  subject_type text not null,
  subject_id   uuid not null,
  action       text not null,
  body         text,
  created_at   timestamptz not null default now(),
  constraint portal_responses_subject_type_check
    check (subject_type in ('concept','inspiration_board','inspiration_item','budget','budget_line','vendor_option','vendor_option_item')),
  constraint portal_responses_action_check
    check (action in ('approved','changes_requested','favourited','unfavourited','selected','deselected','commented'))
);

grant select, insert on public.portal_responses to authenticated;
grant select, insert on public.portal_responses to anon;
grant all on public.portal_responses to service_role;

create or replace function public.stamp_portal_response_client()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  v_client := public.portal_client_from_token();
  if v_client is not null then
    new.client_id := v_client;
    return new;
  end if;
  if auth.uid() is not null then
    return new;
  end if;
  raise exception 'No valid portal token';
end;
$$;

drop trigger if exists trg_stamp_portal_response_client on public.portal_responses;
create trigger trg_stamp_portal_response_client
  before insert on public.portal_responses
  for each row execute function public.stamp_portal_response_client();

create or replace function public.apply_portal_response_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_event uuid;
begin
  if new.action = 'approved' then
    if new.subject_type = 'inspiration_board' then
      update public.inspiration_boards set status = 'Approved' where id = new.subject_id;
    elsif new.subject_type = 'budget' then
      update public.budgets set status = 'Approved' where id = new.subject_id;
    elsif new.subject_type = 'vendor_option' then
      update public.vendor_options set status = 'Decided' where id = new.subject_id;
    end if;

  elsif new.action = 'changes_requested' then
    if new.subject_type = 'inspiration_board' then
      update public.inspiration_boards set status = 'Changes Requested' where id = new.subject_id;
    elsif new.subject_type = 'budget' then
      update public.budgets set status = 'Changes Requested' where id = new.subject_id;
    elsif new.subject_type = 'vendor_option' then
      update public.vendor_options set status = 'Changes Requested' where id = new.subject_id;
    elsif new.subject_type = 'concept' then
      update public.concepts set status = 'Changes Requested' where id = new.subject_id;
    end if;

  elsif new.action = 'selected' then
    if new.subject_type = 'vendor_option_item' then
      update public.vendor_options set status = 'Decided'
       where id = (select option_id from public.vendor_option_items where id = new.subject_id);

    elsif new.subject_type = 'concept' then
      select event_id into v_event from public.concepts where id = new.subject_id;

      update public.concepts set status = 'Chosen' where id = new.subject_id;
      update public.concepts set status = 'Not chosen'
       where event_id = v_event and id <> new.subject_id and shared_at is not null;

      update public.inspiration_boards set status = 'Approved' where concept_id = new.subject_id;
      update public.budgets            set status = 'Approved' where concept_id = new.subject_id;
      update public.vendor_options     set status = 'Decided'  where concept_id = new.subject_id;

      update public.inspiration_boards set status = 'Shared'
       where status = 'Approved'
         and concept_id in (select id from public.concepts where event_id = v_event and id <> new.subject_id);
      update public.budgets set status = 'Shared'
       where status = 'Approved'
         and concept_id in (select id from public.concepts where event_id = v_event and id <> new.subject_id);
      update public.vendor_options set status = 'Shared'
       where status = 'Decided'
         and concept_id in (select id from public.concepts where event_id = v_event and id <> new.subject_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_portal_response_status on public.portal_responses;
create trigger trg_apply_portal_response_status
  after insert on public.portal_responses
  for each row execute function public.apply_portal_response_status();

-- Concept integrity
create or replace function public.enforce_concept_same_event()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.concept_id is not null then
    if not exists (select 1 from public.concepts c where c.id = new.concept_id and c.event_id = new.event_id) then
      raise exception 'Concept % belongs to a different event', new.concept_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_boards_concept_event on public.inspiration_boards;
create trigger trg_boards_concept_event
  before insert or update of concept_id, event_id on public.inspiration_boards
  for each row execute function public.enforce_concept_same_event();

drop trigger if exists trg_budgets_concept_event on public.budgets;
create trigger trg_budgets_concept_event
  before insert or update of concept_id, event_id on public.budgets
  for each row execute function public.enforce_concept_same_event();

drop trigger if exists trg_vendor_options_concept_event on public.vendor_options;
create trigger trg_vendor_options_concept_event
  before insert or update of concept_id, event_id on public.vendor_options
  for each row execute function public.enforce_concept_same_event();

create unique index if not exists uq_budgets_concept_root
  on public.budgets(concept_id)
  where concept_id is not null and parent_id is null;

-- updated_at triggers
drop trigger if exists trg_concepts_updated on public.concepts;
create trigger trg_concepts_updated before update on public.concepts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_inspiration_boards_updated on public.inspiration_boards;
create trigger trg_inspiration_boards_updated before update on public.inspiration_boards
  for each row execute function public.set_updated_at();

drop trigger if exists trg_budgets_updated on public.budgets;
create trigger trg_budgets_updated before update on public.budgets
  for each row execute function public.set_updated_at();

drop trigger if exists trg_vendor_options_updated on public.vendor_options;
create trigger trg_vendor_options_updated before update on public.vendor_options
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.concepts             enable row level security;
alter table public.inspiration_boards   enable row level security;
alter table public.inspiration_items    enable row level security;
alter table public.budgets              enable row level security;
alter table public.budget_lines         enable row level security;
alter table public.vendor_options       enable row level security;
alter table public.vendor_option_items  enable row level security;
alter table public.portal_responses     enable row level security;

drop policy if exists "team all concepts" on public.concepts;
create policy "team all concepts" on public.concepts for all to authenticated using (true) with check (true);

drop policy if exists "team all inspiration_boards" on public.inspiration_boards;
create policy "team all inspiration_boards" on public.inspiration_boards for all to authenticated using (true) with check (true);

drop policy if exists "team all inspiration_items" on public.inspiration_items;
create policy "team all inspiration_items" on public.inspiration_items for all to authenticated using (true) with check (true);

drop policy if exists "team all budgets" on public.budgets;
create policy "team all budgets" on public.budgets for all to authenticated using (true) with check (true);

drop policy if exists "team all budget_lines" on public.budget_lines;
create policy "team all budget_lines" on public.budget_lines for all to authenticated using (true) with check (true);

drop policy if exists "team all vendor_options" on public.vendor_options;
create policy "team all vendor_options" on public.vendor_options for all to authenticated using (true) with check (true);

drop policy if exists "team all vendor_option_items" on public.vendor_option_items;
create policy "team all vendor_option_items" on public.vendor_option_items for all to authenticated using (true) with check (true);

drop policy if exists "portal read concepts" on public.concepts;
create policy "portal read concepts" on public.concepts for select to anon
  using (shared_at is not null and public.portal_event_access(event_id));

drop policy if exists "portal read inspiration_boards" on public.inspiration_boards;
create policy "portal read inspiration_boards" on public.inspiration_boards for select to anon
  using (shared_at is not null and public.portal_event_access(event_id));

drop policy if exists "portal read inspiration_items" on public.inspiration_items;
create policy "portal read inspiration_items" on public.inspiration_items for select to anon
  using (exists (
    select 1 from public.inspiration_boards b
    where b.id = board_id and b.shared_at is not null and public.portal_event_access(b.event_id)
  ));

drop policy if exists "portal read budgets" on public.budgets;
create policy "portal read budgets" on public.budgets for select to anon
  using (shared_at is not null and public.portal_event_access(event_id));

drop policy if exists "portal read budget_lines" on public.budget_lines;
create policy "portal read budget_lines" on public.budget_lines for select to anon
  using (exists (
    select 1 from public.budgets b
    where b.id = budget_id and b.shared_at is not null and public.portal_event_access(b.event_id)
  ));

drop policy if exists "portal read vendor_options" on public.vendor_options;
create policy "portal read vendor_options" on public.vendor_options for select to anon
  using (shared_at is not null and public.portal_event_access(event_id));

drop policy if exists "portal read vendor_option_items" on public.vendor_option_items;
create policy "portal read vendor_option_items" on public.vendor_option_items for select to anon
  using (exists (
    select 1 from public.vendor_options o
    where o.id = option_id and o.shared_at is not null and public.portal_event_access(o.event_id)
  ));

drop policy if exists "team all portal_responses" on public.portal_responses;
create policy "team all portal_responses" on public.portal_responses for select to authenticated using (true);

drop policy if exists "team insert portal_responses" on public.portal_responses;
create policy "team insert portal_responses" on public.portal_responses for insert to authenticated with check (true);

drop policy if exists "portal insert portal_responses" on public.portal_responses;
create policy "portal insert portal_responses" on public.portal_responses for insert to anon
  with check (public.portal_client_from_token() is not null);

drop policy if exists "portal read own portal_responses" on public.portal_responses;
create policy "portal read own portal_responses" on public.portal_responses for select to anon
  using (client_id = public.portal_client_from_token());

-- Column level grant: keep internal_notes off the portal
revoke select on public.budgets from anon;
grant select (
  id, event_id, concept_id, title, currency, status,
  contingency_type, contingency_value, notes,
  version, parent_id, shared_at, created_at, updated_at
) on public.budgets to anon;

-- Indexes
create index if not exists idx_concepts_event             on public.concepts(event_id, position);
create index if not exists idx_inspiration_boards_concept on public.inspiration_boards(concept_id);
create index if not exists idx_budgets_concept            on public.budgets(concept_id);
create index if not exists idx_vendor_options_concept     on public.vendor_options(concept_id);
create index if not exists idx_inspiration_boards_event   on public.inspiration_boards(event_id);
create index if not exists idx_inspiration_items_board    on public.inspiration_items(board_id, position);
create index if not exists idx_budgets_event              on public.budgets(event_id);
create index if not exists idx_budget_lines_budget        on public.budget_lines(budget_id, position);
create index if not exists idx_vendor_options_event       on public.vendor_options(event_id);
create index if not exists idx_vendor_option_items_option on public.vendor_option_items(option_id, position);
create index if not exists idx_portal_responses_subject   on public.portal_responses(subject_type, subject_id, created_at desc);
create index if not exists idx_portal_responses_event     on public.portal_responses(event_id, created_at desc);

-- Storage policy for the private event-media bucket
drop policy if exists "team manages event media" on storage.objects;
create policy "team manages event media" on storage.objects
  for all to authenticated
  using (bucket_id = 'event-media')
  with check (bucket_id = 'event-media');