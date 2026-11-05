begin;
create function public.test_fail_leader_replacement() returns trigger language plpgsql as $$
begin
  if current_setting('trip_test.fail_assignments', true) = 'on' then raise exception 'Injected assignment failure'; end if;
  return new;
end $$;
create trigger test_fail_leader_replacement before insert on public.trip_leaders
for each row execute function public.test_fail_leader_replacement();

do $$
declare
  actor uuid := gen_random_uuid(); leader uuid := gen_random_uuid(); scoped uuid := gen_random_uuid();
  admin_role uuid := gen_random_uuid(); scoped_role uuid := gen_random_uuid(); trip uuid := gen_random_uuid();
  old_host uuid := gen_random_uuid(); new_host uuid := gen_random_uuid(); denied boolean;
begin
  insert into auth.users(id, email) values(actor, actor||'@example.test'), (leader, leader||'@example.test'), (scoped, scoped||'@example.test');
  insert into public.admin_roles(id, key, name, is_super_admin)
  values(admin_role, 'atomic_edit_'||replace(admin_role::text, '-', '_'), 'Editor', true),
    (scoped_role, 'scoped_edit_'||replace(scoped_role::text, '-', '_'), 'Assigned editor', false) on conflict do nothing;
  select id into admin_role from public.admin_roles where is_super_admin;
  insert into public.admin_capabilities(key, resource, action, label)
  values('trips.update', 'trips', 'update', 'Edit trips') on conflict do nothing;
  insert into public.admin_role_grants(role_id, capability_key, scope) values(scoped_role, 'trips.update', 'assigned');
  insert into public.admin_user_roles(user_id, role_id) values(actor, admin_role), (scoped, scoped_role);
  insert into public.club_hosts(id, public_name, club_title)
  values(old_host, 'Original host', 'Original title'), (new_host, 'Replacement host', 'Server-owned title');
  insert into public.trips(id, created_by, title, starts_at, ends_at, visibility)
  values(trip, actor, 'Original event', now()+interval '2 days', now()+interval '3 days', 'members');
  insert into public.trip_private(trip_id, meetup_point) values(trip, 'Original meetup');
  insert into public.trip_hosts(trip_id, host_id, credited_title) values(trip, old_host, 'Original title');
  insert into public.trip_leaders(trip_id, user_id) values(trip, actor), (trip, scoped);
  perform set_config('request.jwt.claim.sub', actor::text, true);
  set local role authenticated;
  denied := false;
  begin
    perform public.save_trip_detail_edits(trip, '{"title":"Invalid host edit"}', 'Changed meetup', array[gen_random_uuid()], array[leader]);
  exception when raise_exception then
    if sqlerrm <> 'A selected host is no longer available. Choose hosts again.' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'Invalid assignment accepted'; end if;
  reset role;
  if not exists(select 1 from public.trips where id = trip and title = 'Original event') then raise exception 'Validation failure committed trip edits'; end if;
  if not exists(select 1 from public.trip_private where trip_id = trip and meetup_point = 'Original meetup') then raise exception 'Validation failure committed private edits'; end if;

  perform set_config('request.jwt.claim.sub', scoped::text, true);
  set local role authenticated;
  denied := false;
  begin
    perform public.save_trip_detail_edits(trip, '{"title":"Unauthorized reassignment"}', null, '{}', '{}');
  exception when raise_exception then
    if sqlerrm <> 'All-trip permission is required to reassign leaders.' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'Assigned admin could reassign leaders'; end if;
  reset role;
  if not exists(select 1 from public.trips where id = trip and title = 'Original event') then raise exception 'Permission failure committed edits'; end if;

  perform set_config('request.jwt.claim.sub', actor::text, true);
  perform set_config('trip_test.fail_assignments', 'on', true);
  set local role authenticated;
  denied := false;
  begin
    perform public.save_trip_detail_edits(trip, '{"title":"Replacement event","activity_tags":["atomic-edit-regression"]}',
      'Replacement meetup', array[new_host], array[leader]);
  exception when raise_exception then
    if sqlerrm <> 'Injected assignment failure' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'Assignment failure was not injected'; end if;
  reset role;
  if not exists(select 1 from public.trips where id = trip and title = 'Original event') then raise exception 'Assignment failure committed edits'; end if;
  if not exists(select 1 from public.trip_private where trip_id = trip and meetup_point = 'Original meetup') then raise exception 'Assignment failure committed private edits'; end if;
  if exists(select 1 from public.trip_tag_options where tag = 'atomic-edit-regression') then raise exception 'Assignment failure committed tag'; end if;
  if not exists(select 1 from public.trip_hosts where trip_id = trip and host_id = old_host) then raise exception 'Original host lost on failure'; end if;
  if exists(select 1 from public.trip_hosts where trip_id = trip and host_id = new_host) then raise exception 'Partial host replacement survived'; end if;
  if (select count(*) from public.trip_leaders where trip_id = trip and user_id in (actor, scoped)) <> 2 then raise exception 'Original leaders lost on failure'; end if;

  perform set_config('trip_test.fail_assignments', 'off', true);
  set local role authenticated;
  perform public.save_trip_detail_edits(trip, '{"title":"Replacement event","activity_tags":["atomic-edit-regression"]}',
    'Replacement meetup', array[new_host, new_host], array[leader, leader]);
  perform public.save_trip_detail_edits(trip, '{"title":"Final event"}', 'Final meetup');
  reset role;
  if not exists(select 1 from public.trips where id = trip and title = 'Final event') then raise exception 'Valid edit was not saved'; end if;
  if (select count(*) from public.trip_hosts where trip_id = trip) <> 1
    or not exists(select 1 from public.trip_hosts where trip_id = trip and host_id = new_host and credited_title = 'Server-owned title' and sort_order = 0) then
    raise exception 'Host replacement or omitted-assignment behavior failed';
  end if;
  if (select count(*) from public.trip_leaders where trip_id = trip) <> 1
    or not exists(select 1 from public.trip_leaders where trip_id = trip and user_id = leader) then raise exception 'Leader replacement failed'; end if;
  set local role authenticated;
  perform public.save_trip_detail_edits(trip, '{}', 'Final meetup', '{}', '{}');
  reset role;
  if exists(select 1 from public.trip_hosts where trip_id = trip)
    or exists(select 1 from public.trip_leaders where trip_id = trip) then raise exception 'Explicit empty assignments did not clear'; end if;
end $$;
rollback;
