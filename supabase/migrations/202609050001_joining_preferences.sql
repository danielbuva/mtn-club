-- Opt-in attendee visibility is independent of capacity and directory visibility.
alter table public.user_preferences add column show_in_attendee_lists boolean not null default false;
alter table public.registration_responses add column show_in_attendee_list boolean not null default false;

create function registration_private.joining_email_updates(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select case when exists(select 1 from public.profile_private where user_id=p_user
   and jsonb_typeof(notification_settings->'tripUpdates')='boolean')
   or exists(select 1 from public.user_preferences where user_id=p_user)
  then (registration_private.email_preferences(p_user)->>'tripUpdates')::boolean
  else false end;
$$;
revoke all on function registration_private.joining_email_updates(uuid) from public,anon,authenticated;
grant execute on function registration_private.joining_email_updates(uuid) to postgres,service_role;

do $migration$
declare definition text; marker text;
begin
 select pg_get_functiondef('public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure) into definition;
 -- This runs after answer validation and before the registration event, in the same transaction.
 marker:='perform registration_private.event(p_trip_id,target,case p_command';
 if position(marker in definition)=0 then raise exception 'Registration event marker missing'; end if;
 definition:=replace(definition,marker,$addition$
 if p_data ? 'joiningPreferences' then
  if target<>uid or p_command not in ('register','update_response') then
   raise exception 'Joining preferences can only be confirmed with your own registration.';
  end if;
  if jsonb_typeof(p_data->'joiningPreferences') is distinct from 'object' then
   raise exception 'Choose valid joining preferences.';
  end if;
  if (select count(*) from jsonb_object_keys(p_data->'joiningPreferences'))<>4
   or exists(select 1 from jsonb_each(p_data->'joiningPreferences') x where
    x.key not in ('showInAttendeeList','emailUpdates','expectedEmailUpdates','expectedAttendeeDefault') or jsonb_typeof(x.value)<>'boolean') then
   raise exception 'Choose yes or no for joining preferences.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('email-preferences:'||uid,0));
  if registration_private.joining_email_updates(uid) is distinct from (p_data->'joiningPreferences'->>'expectedEmailUpdates')::boolean
   or coalesce((select show_in_attendee_lists from public.user_preferences where user_id=uid),false)
     is distinct from (p_data->'joiningPreferences'->>'expectedAttendeeDefault')::boolean then
   raise exception 'Joining preferences changed elsewhere. Refresh and review your choices.';
  end if;
  if registration_private.joining_email_updates(uid) is distinct from (p_data->'joiningPreferences'->>'emailUpdates')::boolean
   and (registration_private.email_preferences(uid)->>'tripUpdates')::boolean=(p_data->'joiningPreferences'->>'emailUpdates')::boolean then
   insert into public.profile_email_consent_events(user_id,preferences)
    values(uid,registration_private.email_preferences(uid));
  end if;
  perform public.save_privacy_email_preferences('{}'::jsonb,
   registration_private.email_preferences(uid)||jsonb_build_object('tripUpdates',(p_data->'joiningPreferences'->>'emailUpdates')::boolean),
   registration_private.email_preferences(uid));
  -- Keep the legacy trip-email gate aligned even when the category was already the default.
  insert into public.user_preferences(user_id,trip_email_notifications,show_in_attendee_lists)
   values(uid,(p_data->'joiningPreferences'->>'emailUpdates')::boolean,(p_data->'joiningPreferences'->>'showInAttendeeList')::boolean)
   on conflict(user_id) do update set trip_email_notifications=excluded.trip_email_notifications,show_in_attendee_lists=excluded.show_in_attendee_lists;
  update public.registration_responses set show_in_attendee_list=(p_data->'joiningPreferences'->>'showInAttendeeList')::boolean
   where trip_id=p_trip_id and user_id=uid;
 end if;
 perform registration_private.event(p_trip_id,target,case p_command$addition$);
 execute definition;

 select pg_get_functiondef('public.get_trip_registration(uuid)'::regprocedure) into definition;
 marker:='''collectTransportation'',coalesce(s.collect_transportation,false),';
 if position(marker in definition)=0 then raise exception 'Snapshot preferences marker missing'; end if;
 definition:=replace(definition,marker,$addition$
 'emailUpdates',registration_private.joining_email_updates(uid),
 'emailAllowed',(registration_private.email_preferences(uid)->>'email')::boolean,
 'defaultShowInAttendeeList',coalesce((select show_in_attendee_lists from public.user_preferences where user_id=uid),false),
 'showInAttendeeList',coalesce(
  (select show_in_attendee_list from public.registration_responses where trip_id=p_trip_id and user_id=uid
   and state not in ('none','incomplete','maybe','not_going')),
  (select show_in_attendee_lists from public.user_preferences where user_id=uid),false),
 'collectTransportation',coalesce(s.collect_transportation,false),$addition$);
 marker:='and (manager or coalesce(pp.privacy_settings->''profileVisible'',''true'')<>''false''::jsonb)';
 if position(marker in definition)=0 then raise exception 'Attendee privacy marker missing'; end if;
 definition:=replace(definition,marker,$addition$
 and exists(select 1 from public.registration_responses visible_response
  where visible_response.trip_id=a.trip_id and visible_response.user_id=a.user_id and visible_response.show_in_attendee_list)
 and (manager or coalesce(pp.privacy_settings->'profileVisible','true')<>'false'::jsonb)$addition$);
 execute definition;

 -- Account merge must preserve per-trip visibility and detect conflicting responses.
 select pg_get_functiondef(coalesce(to_regprocedure('registration_private.merge_trip_registrations(uuid,uuid)'),to_regprocedure('public.merge_trip_registrations(uuid,uuid)'))) into definition;
 marker:='form_version,answers,emergency_contact,transportation)';
 if position(marker in definition)=0 then raise exception 'Registration merge preferences marker missing'; end if;
 definition:=replace(definition,'a.form_version,a.transportation)', 'a.form_version,a.transportation,a.show_in_attendee_list)');
 definition:=replace(definition,'b.form_version,b.transportation)', 'b.form_version,b.transportation,b.show_in_attendee_list)');
 definition:=replace(definition,marker,'form_version,answers,emergency_contact,transportation,show_in_attendee_list)');
 definition:=replace(definition,'form_version,answers,emergency_contact,transportation from','form_version,answers,emergency_contact,transportation,show_in_attendee_list from');
 execute definition;
end $migration$;
