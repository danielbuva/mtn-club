-- Actual authenticated-role reads/writes, with independent capability grants.
begin;
do $$
declare
  actor uuid := gen_random_uuid();
  subject uuid := gen_random_uuid();
  newcomer uuid := gen_random_uuid();
  v_role_id uuid := gen_random_uuid();
  grant_id uuid;
begin
  insert into auth.users(id,email)
    select id,id::text || '@example.test' from unnest(array[actor,subject,newcomer]) id;
  insert into public.profiles(user_id,display_name) values(actor,'Officer'),(subject,'Member');
  insert into public.profile_private(user_id,phone) values(actor,'own'),(subject,'private');
  insert into public.memberships(user_id,status,role) values(actor,'pending','regular'),(subject,'pending','regular');
  insert into public.user_waivers(user_id,waiver_key,version) values(subject,'legacy','1');
  insert into public.admin_roles(id,key,name) values(v_role_id,'rls_' || replace(v_role_id::text,'-','_'),'RLS regression');
  insert into public.admin_capabilities(key,resource,action,label,is_active)
    select key,split_part(key,'.',1),split_part(key,'.',2),key,true
    from unnest(array['overview.read','accounts.read','accounts.update','membership.read','membership.update']) key
    on conflict(key) do update set is_active=true;
  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'overview.read','all');
  insert into public.admin_user_roles(user_id,role_id) values(actor,v_role_id);
  perform set_config('request.jwt.claim.sub',actor::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);

  set local role authenticated;
  if exists(select 1 from public.profile_private where user_id=subject) then
    raise exception 'Overview-only role read another private profile';
  end if;
  if exists(select 1 from public.memberships where user_id=subject) then
    raise exception 'Overview-only role read another membership';
  end if;
  if exists(select 1 from public.user_waivers where user_id=subject) then
    raise exception 'Overview-only role read another waiver';
  end if;
  update public.profile_private set phone='unauthorized' where user_id=subject;
  if found then raise exception 'Overview-only role updated another private profile'; end if;
  update public.profiles set display_name='unauthorized' where user_id=subject;
  if found then raise exception 'Overview-only role updated another public profile'; end if;
  begin
    update public.memberships set status='active' where user_id=subject;
    raise exception 'Overview-only role updated another membership';
  exception when insufficient_privilege then null;
  end;
  -- Dashboard access still includes ordinary member access, never officer access.
  if not public.is_active_member(actor) then raise exception 'Admin lost ordinary member access'; end if;
  if not exists(select 1 from public.profile_private where user_id=actor) then raise exception 'Own profile hidden'; end if;
  if not exists(select 1 from public.memberships where user_id=actor) then raise exception 'Own membership hidden'; end if;
  update public.profile_private set phone='own updated' where user_id=actor;
  if not found then raise exception 'Own profile update denied'; end if;
  reset role;

  -- Read capability is necessary and sufficient for private account reads.
  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'accounts.read','all');
  set local role authenticated;
  if not exists(select 1 from public.profile_private where user_id=subject and phone='private') then
    raise exception 'Accounts reader cannot read private profile';
  end if;
  update public.profile_private set phone='reader write' where user_id=subject;
  if found then raise exception 'Accounts reader updated private profile'; end if;
  if exists(select 1 from public.memberships where user_id=subject) then
    raise exception 'Accounts reader gained membership table access';
  end if;
  reset role;
  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'accounts.update','all');
  set local role authenticated;
  update public.profile_private set phone='authorized' where user_id=subject;
  if not found then raise exception 'Accounts manager cannot update private profile'; end if;
  update public.profiles set display_name='Authorized member' where user_id=subject;
  if not found then raise exception 'Accounts manager cannot update public profile'; end if;
  reset role;

  -- Membership reads do not confer account access or direct membership writes.
  delete from public.admin_role_grants where admin_role_grants.role_id=v_role_id and capability_key like 'accounts.%';
  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'membership.read','all');
  set local role authenticated;
  if not exists(select 1 from public.memberships where user_id=subject and status='pending') then
    raise exception 'Membership reader cannot read membership';
  end if;
  if not exists(select 1 from public.user_waivers where user_id=subject) then
    raise exception 'Membership reader cannot read legacy waiver';
  end if;
  if exists(select 1 from public.profile_private where user_id=subject) then
    raise exception 'Membership reader gained private profile access';
  end if;
  begin
    update public.memberships set status='active' where user_id=subject;
    raise exception 'Membership reader wrote directly';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- The app's service-only RPC checks the actor's operation-specific capability.
  perform set_config('request.jwt.claim.role','service_role',true);
  set local role service_role;
  begin
    perform public.grant_complimentary_membership_access(actor,subject,30,'Regression grant');
    raise exception 'Membership reader used the write RPC';
  exception when raise_exception then
    if sqlerrm <> 'membership update permission required' then raise; end if;
  end;
  reset role;
  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'membership.update','all');
  perform set_config('request.jwt.claim.role','authenticated',true);
  set local role authenticated;
  begin
    update public.memberships set role='admin' where user_id=subject;
    raise exception 'Membership manager bypassed the write RPC';
  exception when insufficient_privilege then null;
  end;
  reset role;
  perform set_config('request.jwt.claim.role','service_role',true);
  set local role service_role;
  grant_id := public.grant_complimentary_membership_access(actor,subject,30,'Regression grant');
  reset role;
  if not exists(select 1 from public.memberships where user_id=subject and status='active' and role='regular')
    or not exists(select 1 from public.membership_access_overrides where id=grant_id and granted_by=actor)
    or not exists(select 1 from public.admin_activity_events where actor_user_id=actor and resource_id=grant_id::text) then
    raise exception 'Authorized membership RPC did not preserve membership, entitlement and audit';
  end if;

  -- A plain member retains self reads, edits and initial pending signup.
  perform set_config('request.jwt.claim.sub',subject::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  set local role authenticated;
  if not exists(select 1 from public.memberships where user_id=subject) then raise exception 'Member lost self read'; end if;
  if not exists(select 1 from public.user_waivers where user_id=subject) then raise exception 'Member lost waiver read'; end if;
  update public.profile_private set phone='member edit' where user_id=subject;
  if not found then raise exception 'Member lost private profile edit'; end if;
  update public.profiles set display_name='Member edit' where user_id=subject;
  if not found then raise exception 'Member lost public profile edit'; end if;
  begin
    update public.profile_private set user_id=newcomer where user_id=subject;
    raise exception 'Member reassigned a private profile';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub',newcomer::text,true);
  insert into public.memberships(user_id,status,role) values(newcomer,'pending','regular');
  if not exists(select 1 from public.memberships where user_id=newcomer) then raise exception 'Own pending signup denied'; end if;
  reset role;
end $$;
rollback;
