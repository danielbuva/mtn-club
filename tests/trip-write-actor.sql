begin;
do $$
declare
  creator uuid := gen_random_uuid(); admin_actor uuid := gen_random_uuid(); member_actor uuid := gen_random_uuid();
  creator_role uuid := gen_random_uuid(); official_trip uuid := gen_random_uuid();
  community_trip uuid := gen_random_uuid(); system_trip uuid := gen_random_uuid(); denied boolean := false;
begin
  insert into auth.users(id, email) values(creator, creator||'@example.test'), (admin_actor, admin_actor||'@example.test'), (member_actor, member_actor||'@example.test');
  insert into public.admin_roles(id, key, name, is_super_admin)
  values(creator_role, 'historical_creator_'||replace(creator_role::text, '-', '_'), 'Trip administrators', true) on conflict do nothing;
  select id into creator_role from public.admin_roles where is_super_admin;
  insert into public.admin_user_roles(user_id, role_id) values(creator, creator_role), (admin_actor, creator_role);
  insert into public.membership_access_overrides(user_id, reason, granted_by)
  values(member_actor, 'Community trip actor regression', admin_actor);
  perform set_config('request.jwt.claim.sub', creator::text, true);
  set local role authenticated;
  insert into public.trips(id, title, starts_at, ends_at, created_by, is_official)
  values(official_trip, 'Former admin official trip', now()+interval '2 days', now()+interval '3 days', creator, true);
  reset role;
  delete from public.admin_user_roles where user_id = creator;
  if public.has_admin_capability(creator, 'trips.official') then raise exception 'Creator still has official capability'; end if;
  perform set_config('request.jwt.claim.sub', admin_actor::text, true);
  set local role authenticated;
  update public.trips set starts_at = starts_at+interval '1 hour' where id = official_trip;
  if not found then raise exception 'Authorized admin could not reschedule official trip'; end if;
  update public.trips set lifecycle_status = 'canceled', cancellation_reason = 'Weather' where id = official_trip;
  if not found then raise exception 'Authorized admin could not cancel official trip'; end if;
  reset role;
  if not exists(select 1 from public.trips where id = official_trip and lifecycle_status = 'canceled' and starts_at > now()+interval '2 days') then
    raise exception 'Cancellation or reschedule did not persist';
  end if;

  perform set_config('request.jwt.claim.sub', member_actor::text, true);
  set local role authenticated;
  insert into public.trips(id, title, starts_at, created_by)
  values(community_trip, 'Community promotion regression', now()+interval '2 days', member_actor);
  -- An active member may edit their own unofficial trip through the edit RPC.
  perform public.save_trip_detail_edits(community_trip, '{"title":"Owner edit"}', null);
  if (select title from public.trips where id = community_trip) <> 'Owner edit' then
    raise exception 'Owner edit of an unofficial trip was not saved';
  end if;
  begin
    update public.trips set is_official = true where id = community_trip;
  exception when raise_exception then
    if sqlerrm <> 'official trip permission required' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'Member promoted own trip'; end if;
  -- A forged service JWT claim is not a trusted database service session.
  perform set_config('request.jwt.claim.role', 'service_role', true);
  begin
    insert into public.trips(title, starts_at, created_by, is_official)
    values('Forged service creator', now()+interval '2 days', creator, true);
    raise exception 'Member forged a service actor';
  exception when raise_exception then
    if sqlerrm <> 'Trip creator must be the current actor.' then raise; end if;
  end;
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  reset role;
  -- Even an inactive historical creator cannot block the current authorized admin.
  update public.membership_access_overrides set revoked_at = now(), revoked_by = admin_actor,
    revoke_reason = 'Actor regression membership ended' where user_id = member_actor;
  if public.is_active_member(member_actor) then raise exception 'Historical creator still has membership access'; end if;
  perform set_config('request.jwt.claim.sub', admin_actor::text, true);
  set local role authenticated;
  update public.trips set title = 'Metadata edit', starts_at = starts_at where id = community_trip;
  if not found then raise exception 'Unrelated update revalidated the creator'; end if;
  update public.trips set is_official = true where id = community_trip;
  if not found then raise exception 'Current admin could not promote community trip'; end if;
  reset role;

  -- Service-role schedule synchronization remains independent of end-user rights.
  perform set_config('request.jwt.claim.sub', '', true);
  set local role service_role;
  insert into public.trips(id, title, starts_at, is_official, created_by)
  values(system_trip, 'System schedule regression', now()+interval '4 days', true, creator);
  update public.trips set starts_at = starts_at+interval '1 hour' where id = system_trip;
  reset role;
  if not exists(select 1 from public.trips where id = system_trip and starts_at > now()+interval '4 days') then raise exception 'Service schedule sync failed'; end if;
end $$;
rollback;
