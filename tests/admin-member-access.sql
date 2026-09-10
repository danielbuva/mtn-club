-- Disposable fixtures, always rolled back. Run against the migrated schema.
begin;
do $$
declare
  u uuid := gen_random_uuid();
  r uuid := gen_random_uuid();
  t uuid := gen_random_uuid();
  allowed boolean;
begin
  insert into auth.users(id,email) values(u,u::text || '@example.test');
  insert into public.profiles(user_id,display_name) values(u,'Access regression') on conflict do nothing;
  insert into public.admin_roles(id,key,name) values(r,'access_' || replace(r::text,'-','_'),'Access regression');
  insert into public.admin_capabilities(key,label,resource,action) values('overview.read','Overview','overview','read') on conflict do nothing;
  insert into public.admin_role_grants(role_id,capability_key,scope) values(r,'overview.read','all');
  if public.is_active_member(u) then raise exception 'Nonmember has member access'; end if;
  insert into public.admin_user_roles(user_id,role_id) values(u,r);
  if not public.is_active_member(u) then raise exception 'Admin without membership lacks access'; end if;
  if public.has_membership_access(u) then raise exception 'Admin became an actual member'; end if;
  if public.has_admin_capability(u,'accounts.delete') then raise exception 'Admin role was escalated'; end if;
  perform set_config('request.jwt.claim.sub',u::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  select access_active into allowed from public.get_my_membership_access();
  if allowed then raise exception 'Membership status was changed'; end if;
  -- Exercise actual member row policies as an authenticated, nonmember admin.
  set local role authenticated;
  insert into public.trips(id,title,starts_at,ends_at,created_by,visibility,is_official)
  values(t,'Access regression',now()+interval '2 days',now()+interval '3 days',u,'members',false);
  if not exists(select 1 from public.trips where id=t) then raise exception 'Member trip hidden'; end if;
  insert into public.trip_comments(trip_id,user_id,body) values(t,u,'Member action');
  update public.trip_comments set body='Updated member action' where trip_id=t and user_id=u;
  if not found then raise exception 'Member comment update denied'; end if;
  delete from public.trip_comments where trip_id=t and user_id=u;
  if not found then raise exception 'Member comment delete denied'; end if;
  reset role;
  delete from public.admin_user_roles where user_id=u;
  if public.is_active_member(u) then raise exception 'Role removal left member access'; end if;
  insert into public.admin_user_roles(user_id,role_id) values(u,r);
  insert into public.membership_account_restrictions(user_id,restriction,internal_reason,restricted_at) values(u,'suspended','Access regression',now());
  if public.is_active_member(u) then raise exception 'Suspended admin has member access'; end if;
  update public.membership_account_restrictions set restriction='banned' where user_id=u;
  if public.is_active_member(u) then raise exception 'Banned admin has member access'; end if;
  delete from public.membership_account_restrictions where user_id=u;
  if not exists(select 1 from public.admin_roles where is_super_admin) then
    update public.admin_roles set is_super_admin=true where id=r;
  end if;
  insert into public.admin_user_roles(user_id,role_id)
    select u,id from public.admin_roles where is_super_admin on conflict do nothing;
  if not public.is_active_member(u) or not public.has_admin_capability(u,'accounts.delete') then
    raise exception 'Super admin access missing';
  end if;
  delete from public.admin_user_roles where user_id=u;
  insert into public.membership_access_overrides(user_id,reason,granted_by) values(u,'Access regression',u);
  if not public.is_active_member(u) then raise exception 'Ordinary member lost access'; end if;
  if public.is_active_member(null) then raise exception 'Anonymous access granted'; end if;
end $$;
rollback;
