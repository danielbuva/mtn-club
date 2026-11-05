-- Members may edit their own unofficial trips (matches can_manage_trip and the
-- trips UPDATE policy). Official trips still require trips.official, and
-- reassigning hosts/leaders still requires all-trip trips.update.
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
  -- can_manage_trip: scoped trips.update admins, or an active, unbanned member
  -- editing their own unofficial trip.
  if v_actor is null or registration_private.blocked(v_actor)
    or not public.can_manage_trip(p_trip_id, v_actor) then
    raise exception 'Trip management permission required.';
  end if;
  select * into v_trip from public.trips where id = p_trip_id for update;
  if not found then raise exception 'Trip not found. Refresh and try again.'; end if;
  -- Assignment changes also take this lock; recheck a scoped editor after waiting.
  if not public.can_manage_trip(p_trip_id, v_actor) then
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
  -- Like publication, only trip administrators extend the shared tag list.
  if public.has_admin_capability(v_actor, 'trips.update') then
    insert into public.trip_tag_options(tag)
    select distinct tag from unnest(v_trip.activity_tags) t(tag) on conflict(tag) do nothing;
  end if;
  if v_replace then
    perform trip_write_private.replace_assignments(p_trip_id, coalesce(p_public_host_ids, '{}'), coalesce(p_leader_user_ids, '{}'));
  end if;
  return p_trip_id;
end;
$$;

revoke all on function public.save_trip_detail_edits(uuid, jsonb, text, uuid[], uuid[]) from public, anon, service_role;
grant execute on function public.save_trip_detail_edits(uuid, jsonb, text, uuid[], uuid[]) to authenticated;

-- The trip page and save action now call this permission helper through RPC.
grant execute on function public.can_manage_trip(uuid, uuid) to authenticated;
