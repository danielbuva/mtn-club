begin;
-- Match production: the shared legacy fixtures temporarily change this default.
alter table public.trip_registration_settings alter column annual_waiver set default true;
create function public.test_fail_draft_consumption() returns trigger language plpgsql as $$
begin
  if old.title = 'Atomic publish regression' then raise exception 'Injected publication failure'; end if;
  return old;
end $$;
create trigger test_fail_draft_consumption before delete on public.trip_drafts
for each row execute function public.test_fail_draft_consumption();

do $$
declare
  actor uuid := gen_random_uuid(); outsider uuid := gen_random_uuid();
  admin_role uuid := gen_random_uuid(); draft uuid := gen_random_uuid(); host uuid := gen_random_uuid();
  trip uuid; duplicate uuid; denied boolean := false; before_counts bigint[]; after_counts bigint[];
  payload jsonb := jsonb_build_object('title', 'Atomic publish regression', 'starts_at', now()+interval '2 days',
    'ends_at', now()+interval '3 days', 'visibility', 'members', 'location_public', 'Trailhead',
    'is_official', true, 'capacity', 20, 'activity_tags', array['atomic-publish-regression']);
begin
  if has_function_privilege('anon', 'public.publish_trip_draft(uuid,jsonb,text,uuid[],uuid[],text[],text[],boolean,boolean)', 'execute')
    or has_function_privilege('anon', 'public.get_published_trip_for_draft(uuid)', 'execute')
    or has_schema_privilege('authenticated', 'trip_write_private', 'usage') then
    raise exception 'Trip write internals or RPCs are exposed to unauthorized roles';
  end if;
  insert into auth.users(id, email) values(actor, actor||'@example.test'), (outsider, outsider||'@example.test');
  insert into public.profiles(user_id, display_name) values(actor, 'Publisher') on conflict do nothing;
  insert into public.admin_roles(id, key, name, is_super_admin)
  values(admin_role, 'publish_'||replace(admin_role::text, '-', '_'), 'Publisher', true) on conflict do nothing;
  select id into admin_role from public.admin_roles where is_super_admin;
  insert into public.admin_user_roles(user_id, role_id) values(actor, admin_role);
  insert into public.club_hosts(id, public_name, club_title) values(host, 'Trip host', 'Officer');
  insert into public.trip_drafts(id, created_by, title) values(draft, actor, 'Atomic publish regression');
  select array[(select count(*) from public.trips), (select count(*) from public.trip_private),
    (select count(*) from public.trip_hosts), (select count(*) from public.trip_leaders),
    (select count(*) from public.registration_risk_disclosures), (select count(*) from public.trip_registration_settings),
    (select count(*) from public.registration_events), (select count(*) from public.registration_notifications)] into before_counts;
  perform set_config('request.jwt.claim.sub', actor::text, true);
  set local role authenticated;
  begin
    perform public.publish_trip_draft(draft, payload, 'Private meetup', array[host], array[actor],
      array['Uneven ground.'], array['hiking'], true, true);
  exception when raise_exception then
    if sqlerrm <> 'Injected publication failure' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'Publication failure was not injected'; end if;
  reset role;
  select array[(select count(*) from public.trips), (select count(*) from public.trip_private),
    (select count(*) from public.trip_hosts), (select count(*) from public.trip_leaders),
    (select count(*) from public.registration_risk_disclosures), (select count(*) from public.trip_registration_settings),
    (select count(*) from public.registration_events), (select count(*) from public.registration_notifications)] into after_counts;
  if before_counts <> after_counts then raise exception 'Failed publication left partial writes'; end if;
  if exists(select 1 from public.trip_tag_options where tag = 'atomic-publish-regression') then raise exception 'Tag write survived rollback'; end if;
  if exists(select 1 from trip_write_private.draft_publications where draft_id = draft) then raise exception 'Receipt survived rollback'; end if;
  if not exists(select 1 from public.trip_drafts where id = draft) then raise exception 'Failed publication consumed draft'; end if;
  drop trigger test_fail_draft_consumption on public.trip_drafts;
  set local role authenticated;
  trip := public.publish_trip_draft(draft, payload, 'Private meetup', array[host], array[actor],
    array['Uneven ground.'], array['hiking'], true, true);
  -- Even a retry carrying different/invalid fields resolves the original receipt.
  duplicate := public.publish_trip_draft(draft, '{}', null, '{}', '{}', '{}', '{}', false, false);
  if trip <> duplicate or public.get_published_trip_for_draft(draft) <> trip then raise exception 'Publication is not idempotent'; end if;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  if public.get_published_trip_for_draft(draft) is not null then raise exception 'Receipt leaked to outsider'; end if;
  denied := false;
  begin
    perform public.publish_trip_draft(draft, payload, null, '{}', '{}', array['Uneven ground.'], array['hiking'], false, false);
  exception when raise_exception then
    if sqlerrm <> 'Draft publication access required.' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'Outsider reused another draft'; end if;
  reset role;
  if (select count(*) from public.trips where created_by = actor) <> 1 then raise exception 'Duplicate trip created'; end if;
  if exists(select 1 from public.trip_drafts where id = draft) then raise exception 'Published draft was not consumed'; end if;
  if not exists(select 1 from public.trip_private where trip_id = trip and meetup_point = 'Private meetup') then raise exception 'Private details missing'; end if;
  if not exists(select 1 from public.trip_hosts where trip_id = trip and host_id = host and credited_title = 'Officer') then raise exception 'Host missing'; end if;
  if not exists(select 1 from public.trip_leaders where trip_id = trip and user_id = actor) then raise exception 'Leader missing'; end if;
  if not exists(select 1 from public.trip_tag_options where tag = 'atomic-publish-regression') then raise exception 'Tag missing'; end if;
  if not exists(select 1 from public.trip_registration_settings where trip_id = trip and enabled and collect_transportation and risk_disclosure_id is not null) then
    raise exception 'Publication did not save registration, transportation, and risks';
  end if;
  if (select count(*) from public.registration_risk_disclosures where trip_id = trip) <> 1 then raise exception 'Duplicate risk disclosure'; end if;
  if (select count(*) from public.registration_events where trip_id = trip and kind = 'settings_changed') <> 2 then raise exception 'Retry changed settings'; end if;
end $$;
rollback;
