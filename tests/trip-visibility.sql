-- Run against the migrated schema, using actual anon/authenticated policies.
begin;
do $$
#variable_conflict use_variable
declare
  owner_id uuid := gen_random_uuid();
  member_id uuid := gen_random_uuid();
  leader_id uuid := gen_random_uuid();
  admin_id uuid := gen_random_uuid();
  unrelated_id uuid := gen_random_uuid();
  setup_role uuid;
  reader_role uuid := gen_random_uuid();
  unrelated_role uuid := gen_random_uuid();
  trip_id uuid := gen_random_uuid();
  public_id uuid := gen_random_uuid();
  member_trip_id uuid := gen_random_uuid();
  photo_id uuid := gen_random_uuid();
  member_photo_id uuid := gen_random_uuid();
  notification_id uuid := gen_random_uuid();
  lease_id uuid := gen_random_uuid();
  event_id uuid := gen_random_uuid();
  uid uuid;
  result jsonb;
begin
  insert into auth.users(id,email) select id,id||'@example.test'
    from unnest(array[owner_id,member_id,leader_id,admin_id,unrelated_id]) id;
  insert into public.profiles(user_id,display_name) values(owner_id,'Creator') on conflict do nothing;
  select id into strict setup_role from public.admin_roles where is_super_admin;
  insert into public.admin_user_roles(user_id,role_id) values(owner_id,setup_role);
  insert into public.admin_roles(id,key,name) values
    (reader_role,'visibility_'||replace(reader_role::text,'-','_'),'Trip reader'),
    (unrelated_role,'visibility_'||replace(unrelated_role::text,'-','_'),'Unrelated admin');
  insert into public.admin_capabilities(key,label,resource,action,supports_assigned_scope) values
    ('trips.read','Read trips','trips','read',true),
    ('trips.update','Update trips','trips','update',true),
    ('gallery.read','Read gallery','gallery','read',false) on conflict do nothing;
  insert into public.admin_role_grants(role_id,capability_key,scope) values
    (reader_role,'trips.read','all'),(unrelated_role,'gallery.read','all');
  insert into public.admin_user_roles(user_id,role_id) values
    (admin_id,reader_role),(unrelated_id,unrelated_role);
  insert into public.membership_access_overrides(user_id,reason,granted_by)
    values(member_id,'Visibility test',owner_id),(owner_id,'Visibility test',owner_id);
  insert into public.trips(id,title,created_by,visibility,starts_at,ends_at,is_official) values
    (trip_id,'Restricted leaders trip',owner_id,'leaders',now()+interval '2 days',now()+interval '3 days',true),
    (public_id,'Public control',owner_id,'public',now()+interval '2 days',now()+interval '3 days',true),
    (member_trip_id,'Members control',owner_id,'members',now()+interval '2 days',now()+interval '3 days',true);
  delete from public.admin_user_roles where user_id=owner_id;
  insert into public.trip_leaders(trip_id,user_id) values(trip_id,leader_id);
  -- A historical RSVP and creator status must not bypass the restriction.
  insert into public.trip_rsvps(trip_id,user_id,status) values(trip_id,member_id,'going');
  insert into public.trip_private(trip_id,meetup_point) values(trip_id,'Restricted meeting point');
  insert into public.gallery_photos(id,trip_id,title,alt_text,storage_path,uploaded_by,is_published)
    values(photo_id,trip_id,'Restricted photo','Restricted photo',photo_id||'.jpg',owner_id,true),
      (member_photo_id,member_trip_id,'Publicly published photo','Published photo',member_photo_id||'.jpg',owner_id,true);

  insert into public.registration_events(id,trip_id,user_id,kind) values(event_id,trip_id,member_id,'confirmed');
  insert into public.registration_notifications(id,event_id,trip_id,user_id,kind,dedupe_key,status,lease_token,leased_until)
    values(notification_id,event_id,trip_id,member_id,'confirmed',notification_id::text,'sending',lease_id,now()+interval '2 minutes');
  if public.prepare_registration_notification(notification_id,lease_id) is not null then raise exception 'Email leaked restricted trip'; end if;
  if (select status from public.registration_notifications where id=notification_id) <> 'suppressed' then raise exception 'Restricted notification not suppressed'; end if;

  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if exists(select 1 from public.trips where id=trip_id) then raise exception 'Anon read leaders trip'; end if;
  if not exists(select 1 from public.trips where id=public_id) then raise exception 'Anon lost public trip'; end if;
  if exists(select 1 from public.gallery_photos where id=photo_id) then raise exception 'Anon read leaders gallery'; end if;
  if not exists(select 1 from public.gallery_photos where id=member_photo_id) then raise exception 'Ordinary published gallery changed'; end if;
  begin
    perform public.get_trip_registration(trip_id);
    raise exception 'Anon RPC exposed leaders trip';
  exception when others then if sqlerrm <> 'Trip not available.' then raise; end if; end;
  reset role;

  foreach uid in array array[member_id,owner_id,unrelated_id] loop
    perform set_config('request.jwt.claim.sub',uid::text,true);
    set local role authenticated;
    if exists(select 1 from public.trips where id=trip_id) then raise exception 'Member/creator/unrelated admin read leaders trip'; end if;
    if exists(select 1 from public.trip_private p where p.trip_id=trip_id) then raise exception 'Private details leaked'; end if;
    if exists(select 1 from public.trip_leaders l where l.trip_id=trip_id) then raise exception 'Leader assignment leaked'; end if;
    if exists(select 1 from public.gallery_photos where id=photo_id) then raise exception 'Gallery capability bypassed trip access'; end if;
    if uid <> unrelated_id and not exists(select 1 from public.trips where id=member_trip_id) then raise exception 'Member lost members trip'; end if;
    begin
      perform public.get_trip_registration(trip_id);
      raise exception 'Historical RSVP/creator/admin RPC bypass';
    exception when others then if sqlerrm <> 'Trip not available.' then raise; end if; end;
    begin
      perform public.get_registration_summaries(array[trip_id]);
      raise exception 'Summary RPC bypass';
    exception when others then if sqlerrm <> 'Trip not available.' then raise; end if; end;
    if public.get_my_registrations() <> '[]'::jsonb then raise exception 'Profile exposed restricted registration'; end if;
    reset role;
  end loop;

  foreach uid in array array[leader_id,admin_id] loop
    perform set_config('request.jwt.claim.sub',uid::text,true);
    set local role authenticated;
    if not exists(select 1 from public.trips where id=trip_id) then raise exception 'Assigned leader/trips admin cannot read'; end if;
    if not exists(select 1 from public.trip_private p where p.trip_id=trip_id) then raise exception 'Authorized private details hidden'; end if;
    if not exists(select 1 from public.gallery_photos where id=photo_id) then raise exception 'Authorized leaders gallery hidden'; end if;
    result := public.get_trip_registration(trip_id);
    if result->>'title' <> 'Restricted leaders trip' then raise exception 'Authorized snapshot missing'; end if;
    if jsonb_array_length(public.get_registration_summaries(array[trip_id])) <> 1 then raise exception 'Authorized summary missing'; end if;
    reset role;
  end loop;

  -- Assigned-scope admins need an assignment; update capability also grants read.
  update public.admin_role_grants set scope='assigned' where role_id=reader_role;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.trips where id=trip_id) then raise exception 'Unassigned scoped admin read trip'; end if;
  reset role;
  insert into public.trip_leaders(trip_id,user_id) values(trip_id,admin_id);
  set local role authenticated;
  if not exists(select 1 from public.trips where id=trip_id) then raise exception 'Assigned scoped admin cannot read'; end if;
  reset role;
  update public.admin_role_grants set capability_key='trips.update',scope='all' where role_id=reader_role;
  delete from public.trip_leaders where user_id=admin_id;
  set local role authenticated;
  if not exists(select 1 from public.trips where id=trip_id) then raise exception 'Trips update admin lost access'; end if;
  if not public.can_view_trip_private(trip_id,admin_id) then raise exception 'Trips update admin lost private access'; end if;
  reset role;
  delete from public.trip_leaders where user_id=leader_id;
  perform set_config('request.jwt.claim.sub',leader_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.trips where id=trip_id) then raise exception 'Removed leader retained access'; end if;
  reset role;
end $$;
rollback;
