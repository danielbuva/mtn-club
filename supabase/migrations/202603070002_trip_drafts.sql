create table if not exists public.trip_drafts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (user_id) on delete cascade,
  title text null,
  short_summary text null,
  activity_tags text[] not null default '{}'::text[],
  starts_at timestamptz null,
  ends_at timestamptz null,
  time_zone text null,
  primary_location_name text null,
  meeting_location_name text null,
  location_notes text null,
  overview_what text null,
  overview_where text null,
  overview_weather text null,
  overview_equipment text null,
  overview_carpool_need_gear text null,
  visibility public.trip_visibility not null default 'members',
  difficulty public.trip_difficulty null,
  max_participants integer null,
  is_official boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trip_drafts_created_by_updated_at_idx
  on public.trip_drafts (created_by, updated_at desc);

alter table public.trip_drafts enable row level security;
grant select, insert, update, delete on table public.trip_drafts to authenticated;
revoke all on table public.trip_drafts from anon;

drop policy if exists trip_drafts_select_own on public.trip_drafts;
create policy trip_drafts_select_own
on public.trip_drafts
for select
to authenticated
using (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
  )
);

drop policy if exists trip_drafts_insert_own on public.trip_drafts;
create policy trip_drafts_insert_own
on public.trip_drafts
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
  )
  and (
    is_official = false
    or public.is_staff_or_admin(auth.uid())
  )
);

drop policy if exists trip_drafts_update_own on public.trip_drafts;
create policy trip_drafts_update_own
on public.trip_drafts
for update
to authenticated
using (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
  )
)
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
  )
  and (
    is_official = false
    or public.is_staff_or_admin(auth.uid())
  )
);

drop policy if exists trip_drafts_delete_own on public.trip_drafts;
create policy trip_drafts_delete_own
on public.trip_drafts
for delete
to authenticated
using (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
  )
);
