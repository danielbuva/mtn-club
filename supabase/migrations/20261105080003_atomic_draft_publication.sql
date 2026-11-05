-- The receipt survives draft deletion and is inaccessible except through scoped RPCs.
create table trip_write_private.draft_publications (
  draft_id uuid primary key,
  draft_owner_id uuid not null,
  published_by uuid not null,
  trip_id uuid not null unique references public.trips(id),
  published_at timestamptz not null default now()
);
alter table trip_write_private.draft_publications enable row level security;
revoke all on trip_write_private.draft_publications from public, anon, authenticated, service_role;

create or replace function public.get_published_trip_for_draft(p_draft_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required.'; end if;
  return (select trip_id from trip_write_private.draft_publications
    where draft_id = p_draft_id and auth.uid() in (draft_owner_id, published_by));
end;
$$;

-- All publication writes, including the registration/risk configuration and
-- draft consumption, commit together. Serialize by draft ID even after deletion.
create or replace function public.publish_trip_draft(
  p_draft_id uuid,
  p_data jsonb,
  p_meetup_point text,
  p_public_host_ids uuid[],
  p_leader_user_ids uuid[],
  p_risk_statements text[],
  p_waiver_activities text[],
  p_registration_enabled boolean,
  p_collect_transportation boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_trip public.trips;
  v_draft public.trip_drafts;
  v_receipt trip_write_private.draft_publications;
  v_settings public.trip_registration_settings;
begin
  if v_actor is null then raise exception 'Sign in required.'; end if;
  if p_draft_id is null then raise exception 'Save a draft before publishing.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_draft_id::text, 80500));
  select * into v_receipt from trip_write_private.draft_publications where draft_id = p_draft_id;
  if found then
    if v_actor not in (v_receipt.draft_owner_id, v_receipt.published_by) then
      raise exception 'Draft publication access required.';
    end if;
    return v_receipt.trip_id;
  end if;
  if registration_private.blocked(v_actor)
    or not (public.is_active_member(v_actor) or public.has_admin_capability(v_actor, 'trips.create'))
    or not exists(select 1 from public.profiles where user_id = v_actor) then
    raise exception 'Active membership or trip administration access required.';
  end if;
  select * into v_draft from public.trip_drafts where id = p_draft_id for update;
  if not found then raise exception 'Draft not found. Refresh and try again.'; end if;
  if v_draft.created_by <> v_actor and (
    public.admin_capability_scope(v_actor, 'trips.read') = 'all'
    and public.admin_capability_scope(v_actor, 'trips.delete') = 'all'
  ) is not true then
    raise exception 'Draft publication access required.';
  end if;
  if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text) > 200000
    or exists(select 1 from jsonb_object_keys(p_data) k where k <> all(array[
      'title', 'event_kind', 'registration_opens_at', 'rsvp_deadline', 'waitlist_enabled',
      'elevation_ft', 'starts_at', 'ends_at', 'time_zone', 'activity_tags', 'visibility',
      'difficulty', 'location_public', 'description_public', 'overview_what', 'overview_where',
      'overview_weather', 'overview_equipment', 'overview_carpool_need_gear', 'capacity',
      'is_official', 'is_all_day'
    ])) then
    raise exception 'Invalid event publication.';
  end if;
  v_trip := jsonb_populate_record(null::public.trips,
    '{"event_kind":"outdoor","waitlist_enabled":false,"time_zone":"America/Los_Angeles","activity_tags":[],"is_official":false,"is_all_day":false}'::jsonb || p_data);
  v_trip.id := gen_random_uuid();
  v_trip.created_by := v_actor;
  perform trip_write_private.validate_trip(v_trip);
  if nullif(trim(v_trip.location_public), '') is null then raise exception 'Primary location is required.'; end if;
  if v_trip.is_official and not public.has_admin_capability(v_actor, 'trips.official') then
    raise exception 'official trip permission required';
  end if;
  if p_registration_enabled is null or p_collect_transportation is null then
    raise exception 'Choose registration and transportation settings.';
  end if;
  perform trip_write_private.validate_assignments(p_public_host_ids, p_leader_user_ids);
  if (cardinality(p_public_host_ids) > 0 or cardinality(p_leader_user_ids) > 0)
    and not public.has_admin_capability(v_actor, 'trips.update') then
    raise exception 'Trip management permission is required to assign hosts.';
  end if;

  insert into public.trips(id, created_by, title, event_kind, registration_opens_at, rsvp_deadline,
    waitlist_enabled, elevation_ft, starts_at, ends_at, time_zone, activity_tags, visibility,
    difficulty, location_public, description_public, overview_what, overview_where, overview_weather,
    overview_equipment, overview_carpool_need_gear, capacity, is_official, is_all_day)
  values(v_trip.id, v_actor, v_trip.title, v_trip.event_kind, v_trip.registration_opens_at, v_trip.rsvp_deadline,
    v_trip.waitlist_enabled, v_trip.elevation_ft, v_trip.starts_at, v_trip.ends_at, v_trip.time_zone,
    v_trip.activity_tags, v_trip.visibility, v_trip.difficulty, v_trip.location_public,
    v_trip.description_public, v_trip.overview_what, v_trip.overview_where, v_trip.overview_weather,
    v_trip.overview_equipment, v_trip.overview_carpool_need_gear, v_trip.capacity, v_trip.is_official, v_trip.is_all_day);
  if public.has_admin_capability(v_actor, 'trips.update') then
    insert into public.trip_tag_options(tag)
    select distinct tag from unnest(v_trip.activity_tags) t(tag) on conflict(tag) do nothing;
  end if;
  if p_meetup_point is not null then
    insert into public.trip_private(trip_id, meetup_point) values(v_trip.id, p_meetup_point);
  end if;
  if cardinality(p_public_host_ids) > 0 or cardinality(p_leader_user_ids) > 0 then
    -- Preserve the existing per-trip assignment capability check for scoped admins.
    if not public.has_trip_admin_capability(v_actor, 'trips.update', v_trip.id) then
      raise exception 'Trip management permission is required to assign hosts.';
    end if;
    perform trip_write_private.replace_assignments(v_trip.id, p_public_host_ids, p_leader_user_ids);
  end if;
  perform public.set_trip_transportation_collection(v_trip.id, p_collect_transportation);
  perform public.save_trip_informed_risks(v_trip.id, 0, p_risk_statements, p_waiver_activities);
  if p_registration_enabled then
    select * into v_settings from public.trip_registration_settings where trip_id = v_trip.id;
    perform public.save_registration_settings(v_trip.id, v_settings.revision, jsonb_build_object(
      'enabled', true, 'eligibility', v_settings.eligibility,
      'emergencyRequired', v_settings.emergency_required, 'waiverRequired', v_settings.waiver_required,
      'questions', v_settings.questions, 'capacity', v_trip.capacity, 'waitlistEnabled', v_trip.waitlist_enabled,
      'deadline', v_trip.rsvp_deadline, 'opensAt', v_trip.registration_opens_at,
      'offerHours', v_settings.offer_hours, 'collectTransportation', p_collect_transportation
    ));
  end if;
  insert into trip_write_private.draft_publications(draft_id, draft_owner_id, published_by, trip_id)
  values(p_draft_id, v_draft.created_by, v_actor, v_trip.id);
  delete from public.trip_drafts where id = p_draft_id;
  return v_trip.id;
end;
$$;

revoke all on function public.get_published_trip_for_draft(uuid) from public, anon, service_role;
revoke all on function public.publish_trip_draft(uuid, jsonb, text, uuid[], uuid[], text[], text[], boolean, boolean) from public, anon, service_role;
grant execute on function public.get_published_trip_for_draft(uuid) to authenticated;
grant execute on function public.publish_trip_draft(uuid, jsonb, text, uuid[], uuid[], text[], text[], boolean, boolean) to authenticated;
