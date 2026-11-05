-- Internal helpers are not exposed through the Data API.
create schema trip_write_private;
revoke all on schema trip_write_private from public, anon, authenticated, service_role;

create or replace function trip_write_private.validate_assignments(p_hosts uuid[], p_leaders uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_hosts is null or p_leaders is null
    or cardinality(p_hosts) > 20 or cardinality(p_leaders) > 20
    or array_position(p_hosts, null) is not null or array_position(p_leaders, null) is not null then
    raise exception 'Choose up to 20 hosts and leaders.';
  end if;
  -- Keep the validated references and host credit titles stable until commit.
  perform id from public.club_hosts where id = any(p_hosts) for share;
  perform id from auth.users where id = any(p_leaders) for key share;
  if exists (
    select 1 from unnest(p_hosts) h(id)
    left join public.club_hosts c on c.id = h.id
    where c.id is null or nullif(trim(c.club_title), '') is null
  ) then
    raise exception 'A selected host is no longer available. Choose hosts again.';
  end if;
  if exists (
    select 1 from unnest(p_leaders) l(id) left join auth.users u on u.id = l.id where u.id is null
  ) then
    raise exception 'A selected leader is no longer available. Choose leaders again.';
  end if;
end;
$$;

create or replace function trip_write_private.replace_assignments(p_trip uuid, p_hosts uuid[], p_leaders uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.trip_hosts where trip_id = p_trip;
  delete from public.trip_leaders where trip_id = p_trip;
  insert into public.trip_hosts(trip_id, host_id, credited_title, sort_order)
  select p_trip, c.id, c.club_title, (row_number() over (order by h.position) - 1)::integer
  from (select id, min(n) as position from unnest(p_hosts) with ordinality h(id, n) group by id) h
  join public.club_hosts c on c.id = h.id;
  insert into public.trip_leaders(trip_id, user_id)
  select p_trip, id from unnest(p_leaders) l(id) group by id;
end;
$$;

create or replace function trip_write_private.validate_trip(p_trip public.trips)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if nullif(trim(p_trip.title), '') is null or p_trip.starts_at is null
    or nullif(trim(p_trip.time_zone), '') is null then
    raise exception 'Title, start time, and timezone are required.';
  end if;
  if not exists(select 1 from pg_catalog.pg_timezone_names where name = p_trip.time_zone) then
    raise exception 'Choose a valid timezone.';
  end if;
  if p_trip.ends_at <= p_trip.starts_at then raise exception 'End time must be after start time.'; end if;
  if p_trip.rsvp_deadline > p_trip.starts_at then raise exception 'Registration must close by the trip start.'; end if;
  if p_trip.registration_opens_at >= least(p_trip.starts_at, coalesce(p_trip.rsvp_deadline, p_trip.starts_at)) then
    raise exception 'Registration must open before it closes.';
  end if;
  if p_trip.elevation_ft < 0 or p_trip.elevation_ft > 100000 then
    raise exception 'Enter an elevation gain from 0 to 100,000 feet.';
  end if;
end;
$$;

-- Definer access is necessary for private rows/assignment replacement. Every
-- entry checks the same admin capability as the edit action; ownership alone is insufficient.
create or replace function public.save_trip_detail_edits(
  p_trip_id uuid,
  p_data jsonb,
  p_meetup_point text,
  p_public_host_ids uuid[] default null,
  p_leader_user_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_trip public.trips;
  v_replace boolean := p_public_host_ids is not null or p_leader_user_ids is not null;
begin
  if v_actor is null or registration_private.blocked(v_actor)
    or not public.has_trip_admin_capability(v_actor, 'trips.update', p_trip_id) then
    raise exception 'Trip management permission required.';
  end if;
  select * into v_trip from public.trips where id = p_trip_id for update;
  if not found then raise exception 'Trip not found. Refresh and try again.'; end if;
  -- Assignment changes also take this lock; recheck a scoped editor after waiting.
  if not public.has_trip_admin_capability(v_actor, 'trips.update', p_trip_id) then
    raise exception 'Trip management permission required.';
  end if;
  -- Preserve the existing official-trip edit policy.
  if v_trip.is_official and not public.has_admin_capability(v_actor, 'trips.official') then
    raise exception 'official trip permission required';
  end if;
  if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text) > 200000
    or exists(select 1 from jsonb_object_keys(p_data) k where k <> all(array[
      'title', 'description_public', 'location_public', 'overview_what', 'overview_where',
      'overview_weather', 'overview_equipment', 'overview_carpool_need_gear', 'difficulty',
      'activity_tags', 'starts_at', 'ends_at', 'is_all_day', 'elevation_ft'
    ])) then
    raise exception 'Invalid event edits.';
  end if;
  v_trip := jsonb_populate_record(v_trip, p_data);
  perform trip_write_private.validate_trip(v_trip);
  if v_replace then
    if public.admin_capability_scope(v_actor, 'trips.update') is distinct from 'all'::public.admin_permission_scope then
      raise exception 'All-trip permission is required to reassign leaders.';
    end if;
    perform trip_write_private.validate_assignments(coalesce(p_public_host_ids, '{}'), coalesce(p_leader_user_ids, '{}'));
  end if;

  update public.trips set title = v_trip.title, description_public = v_trip.description_public,
    location_public = v_trip.location_public, overview_what = v_trip.overview_what,
    overview_where = v_trip.overview_where, overview_weather = v_trip.overview_weather,
    overview_equipment = v_trip.overview_equipment, overview_carpool_need_gear = v_trip.overview_carpool_need_gear,
    difficulty = v_trip.difficulty, activity_tags = v_trip.activity_tags,
    starts_at = v_trip.starts_at, ends_at = v_trip.ends_at, is_all_day = v_trip.is_all_day,
    elevation_ft = v_trip.elevation_ft, updated_at = now()
  where id = p_trip_id;
  insert into public.trip_private(trip_id, meetup_point) values(p_trip_id, p_meetup_point)
  on conflict(trip_id) do update set meetup_point = excluded.meetup_point, updated_at = now();
  insert into public.trip_tag_options(tag)
  select distinct tag from unnest(v_trip.activity_tags) t(tag) on conflict(tag) do nothing;
  if v_replace then
    perform trip_write_private.replace_assignments(p_trip_id, coalesce(p_public_host_ids, '{}'), coalesce(p_leader_user_ids, '{}'));
  end if;
  return p_trip_id;
end;
$$;

revoke all on all functions in schema trip_write_private from public, anon, authenticated, service_role;
revoke all on function public.save_trip_detail_edits(uuid, jsonb, text, uuid[], uuid[]) from public, anon, service_role;
grant execute on function public.save_trip_detail_edits(uuid, jsonb, text, uuid[], uuid[]) to authenticated;
