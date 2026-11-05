begin;
do $$
declare
  actor uuid := gen_random_uuid();
  member_id uuid := gen_random_uuid();
  v_role_id uuid := gen_random_uuid();
  trip uuid := gen_random_uuid();
  other_trip uuid := gen_random_uuid();
  activity uuid := gen_random_uuid();
  template uuid := gen_random_uuid();
  own_comment uuid := gen_random_uuid();
begin
  insert into auth.users(id,email)
    select id,id::text || '@example.test' from unnest(array[actor,member_id]) id;
  insert into public.admin_roles(id,key,name) values(v_role_id,'scope_' || replace(v_role_id::text,'-','_'),'Scope regression');
  insert into public.admin_capabilities(key,resource,action,label,is_active,supports_assigned_scope)
    select key,split_part(key,'.',1),split_part(key,'.',2),key,true,key like 'trips.%'
    from unnest(array['overview.read','settings.update','trips.read','trips.update']) key
    on conflict(key) do update set is_active=true,supports_assigned_scope=excluded.supports_assigned_scope;
  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'overview.read','all');
  insert into public.admin_user_roles(user_id,role_id) values(actor,v_role_id);
  insert into public.activities(id,slug,name) values(activity,'regression-' || activity,'Original activity');
  insert into public.waiver_templates(id,key,title,body,version) values(template,'regression-' || template,'Original waiver','Original body','1');
  -- Community ownership is deliberately separate from the admin under test.
  insert into public.membership_access_overrides(user_id,granted_by,reason) values(member_id,member_id,'Regression membership');
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  insert into public.trips(id,title,starts_at,created_by,visibility,is_official)
    values(trip,'Assigned trip',now()+interval '2 days',member_id,'public',false),
      (other_trip,'Unassigned trip',now()+interval '3 days',member_id,'public',false);
  insert into public.trip_comments(trip_id,user_id,body) values(trip,member_id,'Assigned comment'),(other_trip,member_id,'Unassigned comment');
  insert into public.trip_comments(id,trip_id,user_id,body) values(own_comment,other_trip,actor,'Own comment');
  perform set_config('request.jwt.claim.sub',actor::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  set local role authenticated;
  update public.activities set name='Unauthorized' where id=activity;
  if found then raise exception 'Overview-only role edited activities'; end if;
  update public.waiver_templates set body='Unauthorized' where id=template;
  if found then raise exception 'Overview-only role edited waiver templates'; end if;
  begin
    insert into public.activities(slug,name) values('denied-' || actor,'Denied');
    raise exception 'Overview-only role inserted an activity';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.waiver_templates(key,title,body,version) values('denied-' || actor,'Denied','Denied','1');
    raise exception 'Overview-only role inserted a waiver template';
  exception when insufficient_privilege then null;
  end;
  delete from public.trip_comments where user_id=member_id;
  if found then raise exception 'Overview-only role deleted another member comment'; end if;
  delete from public.trip_comments where id=own_comment;
  if not found then raise exception 'Admin lost own member comment access'; end if;
  reset role;

  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'settings.update','all');
  set local role authenticated;
  update public.activities set name='Authorized activity' where id=activity;
  if not found then raise exception 'Settings manager cannot edit activities'; end if;
  update public.waiver_templates set body='Authorized body' where id=template;
  if not found then raise exception 'Settings manager cannot edit waiver templates'; end if;
  insert into public.activities(slug,name) values('allowed-' || actor,'Allowed');
  insert into public.waiver_templates(key,title,body,version) values('allowed-' || actor,'Allowed','Allowed','1');
  delete from public.trip_comments where user_id=member_id;
  if found then raise exception 'Settings manager gained comment moderation'; end if;
  reset role;

  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'trips.update','assigned');
  insert into public.trip_leaders(trip_id,user_id) values(trip,actor);
  set local role authenticated;
  delete from public.trip_comments where trip_id=other_trip and user_id=member_id;
  if found then raise exception 'Assigned manager moderated an unassigned trip'; end if;
  delete from public.trip_comments where trip_id=trip and user_id=member_id;
  if not found then raise exception 'Assigned manager cannot moderate assigned trip'; end if;
  reset role;

  -- Both replaced visibility helpers must honor trips.read's assigned scope.
  delete from public.admin_role_grants where role_id=v_role_id;
  insert into public.admin_role_grants(role_id,capability_key,scope) values(v_role_id,'trips.read','assigned');
  update public.trips set visibility='members' where id in(trip,other_trip);
  if public.can_view_trip(other_trip,actor) or public.can_view_trip_private(other_trip,actor) then
    raise exception 'Trip reader gained unassigned visibility';
  end if;
  if not public.can_view_trip(trip,actor) or not public.can_view_trip_private(trip,actor) then
    raise exception 'Trip reader lost assigned visibility';
  end if;
end $$;
rollback;
