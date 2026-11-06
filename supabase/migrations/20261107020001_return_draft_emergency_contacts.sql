-- Show a member their own saved emergency contact for this trip, even when it is an incomplete draft.
-- Other saved sources (profile, signatures, other trips) still prefill only complete contacts.
create function registration_private.form_emergency_contact(p_trip uuid,p_user uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce((select r.emergency_contact from public.registration_responses r
  where r.trip_id=p_trip and r.user_id=p_user and jsonb_typeof(r.emergency_contact)='object' and r.emergency_contact<>'{}'::jsonb),
  registration_private.emergency_contact(p_trip,p_user));
$$;
revoke all on function registration_private.form_emergency_contact(uuid,uuid) from public,anon,authenticated,service_role;

-- The snapshot, its on-file flag, and omitted command contacts must agree, so the form never skips
-- a step for a contact it did not show. Readiness checks keep using complete contacts only.
do $migration$
declare definition text; marker text;
begin
 select pg_get_functiondef('public.get_trip_registration(uuid)'::regprocedure) into definition;
 marker:='''emergencyContact'',registration_private.emergency_contact(p_trip_id,uid),''emergencyOnFile'',registration_private.valid_emergency_contact(registration_private.emergency_contact(p_trip_id,uid))';
 if position(marker in definition)=0 then raise exception 'Missing snapshot emergency contact'; end if;
 definition:=replace(definition,marker,'''emergencyContact'',registration_private.form_emergency_contact(p_trip_id,uid),''emergencyOnFile'',registration_private.valid_emergency_contact(registration_private.form_emergency_contact(p_trip_id,uid))');
 execute definition;

 select pg_get_functiondef('public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure) into definition;
 marker:='contact:=coalesce(p_data->''emergencyContact'',registration_private.emergency_contact(p_trip_id,target));';
 if position(marker in definition)=0 then raise exception 'Missing command contact lookup'; end if;
 definition:=replace(definition,marker,'contact:=coalesce(p_data->''emergencyContact'',registration_private.form_emergency_contact(p_trip_id,target));');
 execute definition;
end $migration$;
