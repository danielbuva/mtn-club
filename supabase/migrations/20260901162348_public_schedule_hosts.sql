-- Fall 2026 public schedule, all-day semantics, and public host credits.
-- This migration builds on the captured single-club production schema.

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.try_uuid(text) set search_path = public, pg_temp;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.try_uuid(text) from public, anon;

alter table public.trips
  add column if not exists is_all_day boolean not null default false,
  add column if not exists schedule_key text,
  alter column created_by drop not null;

create unique index if not exists trips_schedule_key_unique
  on public.trips (schedule_key)
  where schedule_key is not null;

create table if not exists public.club_hosts (
  id uuid primary key default gen_random_uuid(),
  public_name text not null check (length(trim(public_name)) > 0),
  club_title text not null check (length(trim(club_title)) > 0),
  linked_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists club_hosts_public_name_unique
  on public.club_hosts (lower(public_name));

drop trigger if exists club_hosts_set_updated_at on public.club_hosts;
create trigger club_hosts_set_updated_at
before update on public.club_hosts
for each row execute function public.set_updated_at();

create table if not exists public.trip_hosts (
  trip_id uuid not null references public.trips(id) on delete cascade,
  host_id uuid not null references public.club_hosts(id) on delete restrict,
  credited_title text not null check (length(trim(credited_title)) > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  primary key (trip_id, host_id)
);

create index if not exists trip_hosts_host_id_idx
  on public.trip_hosts(host_id);

create table if not exists public.schedule_review_items (
  id uuid primary key default gen_random_uuid(),
  schedule_key text not null unique,
  scheduled_date date not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'canceled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and reviewed_at is null)
    or (status <> 'pending' and reviewed_at is not null)
  )
);

drop trigger if exists schedule_review_items_set_updated_at
  on public.schedule_review_items;
create trigger schedule_review_items_set_updated_at
before update on public.schedule_review_items
for each row execute function public.set_updated_at();

alter table public.club_hosts enable row level security;
alter table public.trip_hosts enable row level security;
alter table public.schedule_review_items enable row level security;

drop policy if exists club_hosts_public_read on public.club_hosts;
create policy club_hosts_public_read
on public.club_hosts for select
to anon, authenticated
using (true);

drop policy if exists club_hosts_staff_manage on public.club_hosts;
create policy club_hosts_staff_manage
on public.club_hosts for all
to authenticated
using (public.is_staff_or_admin(auth.uid()))
with check (public.is_staff_or_admin(auth.uid()));

drop policy if exists trip_hosts_public_read on public.trip_hosts;
create policy trip_hosts_public_read
on public.trip_hosts for select
to anon, authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_hosts.trip_id
      and trips.visibility in ('public', 'minimal')
  )
);

drop policy if exists trip_hosts_staff_manage on public.trip_hosts;
create policy trip_hosts_staff_manage
on public.trip_hosts for all
to authenticated
using (public.is_staff_or_admin(auth.uid()))
with check (public.is_staff_or_admin(auth.uid()));

drop policy if exists schedule_review_items_staff_manage
  on public.schedule_review_items;
create policy schedule_review_items_staff_manage
on public.schedule_review_items for all
to authenticated
using (public.is_staff_or_admin(auth.uid()))
with check (public.is_staff_or_admin(auth.uid()));

grant select on public.club_hosts, public.trip_hosts to anon, authenticated;
grant insert, update, delete on public.club_hosts, public.trip_hosts
  to authenticated;
grant select, insert, update, delete on public.schedule_review_items
  to authenticated;
grant all on public.club_hosts, public.trip_hosts, public.schedule_review_items
  to service_role;

insert into public.club_hosts (public_name, club_title)
values
  ('Alyssa Moreno Callaway', 'Gear Manager'),
  ('Alex Wright', 'Trip Leader'),
  ('Dax Whitaker', 'Club President'),
  ('Lilly Czerwinski', 'Trip Leader'),
  ('Wyatt Diaz Gomez', 'Treasurer'),
  ('Sophia Pascual', 'Community Director')
on conflict ((lower(public_name))) do update
set club_title = excluded.club_title;

with weekly as (
  select
    day::date as event_date,
    'Tuesday meetup'::text as title,
    'Nevada Climbing Center'::text as location,
    'fall-2026-weekly-nevada-climbing-center-' || day::date::text as schedule_key
  from generate_series(
    date '2026-09-01',
    date '2026-12-08',
    interval '7 days'
  ) as day
  union all
  select
    day::date,
    'Thursday meetup',
    'UNLV Rec Wall',
    'fall-2026-weekly-unlv-rec-wall-' || day::date::text
  from generate_series(
    date '2026-09-03',
    date '2026-12-10',
    interval '7 days'
  ) as day
  where day::date <> date '2026-11-26'
)
insert into public.trips (
  visibility,
  is_official,
  is_all_day,
  schedule_key,
  title,
  starts_at,
  ends_at,
  time_zone,
  location_public,
  description_public,
  activity_tags,
  created_by
)
select
  'public',
  true,
  false,
  schedule_key,
  title,
  (event_date + time '17:00') at time zone 'America/Los_Angeles',
  (event_date + time '19:00') at time zone 'America/Los_Angeles',
  'America/Los_Angeles',
  location,
  'Weekly community meetup. General meeting dates and schedule changes are announced in Discord.',
  array['climbing', 'meetup', 'fall'],
  null
from weekly
on conflict (schedule_key) where schedule_key is not null do update
set
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  location_public = excluded.location_public,
  description_public = excluded.description_public,
  activity_tags = excluded.activity_tags,
  is_official = true,
  is_all_day = false,
  visibility = 'public';

insert into public.schedule_review_items (
  schedule_key,
  scheduled_date,
  reason
)
values (
  'fall-2026-weekly-unlv-rec-wall-2026-11-26',
  date '2026-11-26',
  'Thanksgiving closure and officer availability must be confirmed before publishing.'
)
on conflict (schedule_key) do nothing;

with special_events (
  schedule_key,
  start_date,
  end_date,
  title,
  activity_slug,
  activity_tags,
  location
) as (
  values
    ('fall-2026-red-rock-sport-climbing', date '2026-09-06', date '2026-09-06', 'Red Rock Sport Climbing', 'sport_climbing', array['climbing', 'sport climbing', 'fall']::text[], 'Red Rock Canyon'),
    ('fall-2026-black-mountain-hike', date '2026-09-13', date '2026-09-13', 'Black Mountain Hike', 'hiking', array['hiking', 'fall']::text[], 'Black Mountain'),
    ('fall-2026-red-rock-south-oak-creek-hike', date '2026-09-19', date '2026-09-19', 'Red Rock South Oak Creek Hike', 'hiking', array['hiking', 'fall']::text[], 'South Oak Creek, Red Rock Canyon'),
    ('fall-2026-cathedral-rock-sunrise-hike', date '2026-09-20', date '2026-09-20', 'Cathedral Rock Sunrise Hike', 'hiking', array['hiking', 'fall']::text[], 'Cathedral Rock'),
    ('fall-2026-kraft-mountain-night-bouldering', date '2026-09-26', date '2026-09-26', 'Kraft Mountain Night Bouldering', 'bouldering', array['climbing', 'bouldering', 'fall']::text[], 'Kraft Mountain'),
    ('fall-2026-camping-in-lovell-canyon', date '2026-10-03', date '2026-10-04', 'Camping in Lovell Canyon', 'camping', array['camping', 'fall']::text[], 'Lovell Canyon'),
    ('fall-2026-echo-overlook-hike', date '2026-10-10', date '2026-10-10', 'Echo Overlook Hike', 'hiking', array['hiking', 'fall']::text[], 'Echo Overlook'),
    ('fall-2026-camp-climb-joshua-tree', date '2026-10-16', date '2026-10-18', 'Camp and Climb in Joshua Tree National Park', 'sport_climbing', array['camping', 'climbing', 'fall']::text[], 'Joshua Tree National Park'),
    ('fall-2026-camp-climb-hike-zion', date '2026-11-06', date '2026-11-08', 'Camp, Climb, and Hike in Zion National Park', 'hiking', array['camping', 'climbing', 'hiking', 'fall']::text[], 'Zion National Park'),
    ('fall-2026-camp-climb-bishop', date '2026-11-27', date '2026-11-29', 'Camp and Climb in Bishop', 'sport_climbing', array['camping', 'climbing', 'fall']::text[], 'Bishop, California')
)
insert into public.trips (
  visibility,
  is_official,
  is_all_day,
  schedule_key,
  title,
  activity_id,
  starts_at,
  ends_at,
  time_zone,
  location_public,
  description_public,
  activity_tags,
  created_by
)
select
  'public',
  true,
  true,
  event.schedule_key,
  event.title,
  activities.id,
  event.start_date::timestamp at time zone 'America/Los_Angeles',
  (event.end_date + time '23:59:59') at time zone 'America/Los_Angeles',
  'America/Los_Angeles',
  event.location,
  'Exact time and logistics announced in Discord.',
  event.activity_tags,
  null
from special_events event
left join public.activities on activities.slug = event.activity_slug
on conflict (schedule_key) where schedule_key is not null do update
set
  title = excluded.title,
  activity_id = excluded.activity_id,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  location_public = excluded.location_public,
  description_public = excluded.description_public,
  activity_tags = excluded.activity_tags,
  is_official = true,
  is_all_day = true,
  visibility = 'public';

with credits (schedule_key, public_name, credited_title, sort_order) as (
  values
    ('fall-2026-red-rock-sport-climbing', 'Alyssa Moreno Callaway', 'Gear Manager', 0),
    ('fall-2026-black-mountain-hike', 'Alex Wright', 'Trip Leader', 0),
    ('fall-2026-red-rock-south-oak-creek-hike', 'Dax Whitaker', 'Club President', 0),
    ('fall-2026-cathedral-rock-sunrise-hike', 'Alex Wright', 'Trip Leader', 0),
    ('fall-2026-kraft-mountain-night-bouldering', 'Alyssa Moreno Callaway', 'Gear Manager', 0),
    ('fall-2026-kraft-mountain-night-bouldering', 'Lilly Czerwinski', 'Trip Leader', 1),
    ('fall-2026-camping-in-lovell-canyon', 'Wyatt Diaz Gomez', 'Treasurer', 0),
    ('fall-2026-camping-in-lovell-canyon', 'Sophia Pascual', 'Community Director', 1),
    ('fall-2026-echo-overlook-hike', 'Sophia Pascual', 'Community Director', 0),
    ('fall-2026-camp-climb-joshua-tree', 'Dax Whitaker', 'Club President', 0),
    ('fall-2026-camp-climb-hike-zion', 'Dax Whitaker', 'Club President', 0),
    ('fall-2026-camp-climb-bishop', 'Lilly Czerwinski', 'Trip Leader', 0)
)
insert into public.trip_hosts (trip_id, host_id, credited_title, sort_order)
select trips.id, hosts.id, credits.credited_title, credits.sort_order
from credits
join public.trips on trips.schedule_key = credits.schedule_key
join public.club_hosts hosts
  on lower(hosts.public_name) = lower(credits.public_name)
on conflict (trip_id, host_id) do update
set
  credited_title = excluded.credited_title,
  sort_order = excluded.sort_order;

comment on column public.trips.is_all_day is
  'When true, clients render calendar dates without a clock time.';
comment on table public.club_hosts is
  'Public event credits only. Rows do not grant trip-management permissions.';
comment on table public.trip_hosts is
  'Public event host credits, separate from authenticated trip_leaders.';
;
