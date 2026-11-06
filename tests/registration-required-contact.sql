begin;
do $$
#variable_conflict use_variable
declare owner_id uuid:=gen_random_uuid(); participant uuid:=gen_random_uuid(); role_id uuid:=gen_random_uuid(); tid uuid:=gen_random_uuid();
 payload jsonb; invalid jsonb; result jsonb; version integer; question jsonb;
begin
 insert into auth.users(id,email) values(owner_id,owner_id||'@example.test'),(participant,participant||'@example.test');
 insert into public.admin_roles(id,key,name,is_super_admin) values(role_id,'contact_'||replace(role_id::text,'-','_'),'Contact test admin',true) on conflict do nothing;
 insert into public.admin_user_roles(user_id,role_id) select owner_id,id from public.admin_roles where is_super_admin;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 insert into public.trips(id,title,starts_at,ends_at,capacity,created_by)
 values(tid,'Required contacts test',now()+interval '2 days',now()+interval '3 days',5,owner_id);
 perform public.set_registration_enabled(true);
 -- An organizer cannot disable the standard contact requirements.
 perform public.save_registration_settings(tid,0,'{"enabled":true,"eligibility":"account","emergencyRequired":false,"waiverRequired":false,"questions":[],"capacity":5,"waitlistEnabled":true,"deadline":null,"offerHours":24}');
 if not (select emergency_required from public.trip_registration_settings where trip_id=tid) then raise exception 'Emergency contact was optional'; end if;
 if (select questions from public.trip_registration_settings where trip_id=tid) <> registration_private.required_contact_questions('[]') then raise exception 'Required contact questions missing'; end if;
 select form_version into version from public.trip_registration_settings where trip_id=tid;
 payload:=jsonb_build_object('formVersion',version,'emergencyConfirmed',true,'answers','{"participant_email":"participant@example.test","participant_phone":"+1 (702) 555-0123"}'::jsonb,
 'emergencyContact','{"name":"Test Contact","relationship":"Friend","phone":"702-555-0124"}'::jsonb);
 perform set_config('request.jwt.claim.sub',participant::text,true);
 perform public.declare_registration_age(true);
 for invalid in select value from jsonb_array_elements(jsonb_build_array(
  payload||'{"answers":{}}',
  payload||'{"answers":{"participant_email":"bad-email","participant_phone":"7025550123"}}',
  payload||'{"answers":{"participant_email":"participant@example.test","participant_phone":"123"}}',
  payload||'{"emergencyContact":{}}',
  payload||'{"emergencyContact":{"name":"A","relationship":"Friend","phone":"7025550124"}}',
  payload||'{"emergencyContact":{"name":"Test Contact","relationship":"","phone":"7025550124"}}',
  payload||'{"emergencyContact":{"name":"Test Contact","relationship":"Friend","phone":"letters only"}}',
  payload||'{"emergencyConfirmed":false}'
 )) loop
  begin
   perform public.registration_command(tid,'register',gen_random_uuid(),0,invalid);
   raise exception 'INVALID_CONTACT_ACCEPTED';
  exception when others then
   if sqlerrm='INVALID_CONTACT_ACCEPTED' then raise; end if;
   if sqlerrm not like 'Answer the required question:%' and sqlerrm not like 'Enter a %' and sqlerrm not like 'Confirm %' then raise; end if;
  end;
 end loop;
 result:=public.registration_command(tid,'register',gen_random_uuid(),0,payload);
 if result->>'state'<>'confirmed' then raise exception 'Valid contact failed registration'; end if;
 begin
  perform public.registration_command(tid,'update_response',gen_random_uuid(),1,payload||'{"emergencyContact":{}}');
  raise exception 'INVALID_UPDATE_ACCEPTED';
 exception when others then
  if sqlerrm not like 'Confirm an emergency contact%' then raise; end if;
 end;
 if (select emergency_contact->>'name' from public.registration_responses where trip_id=tid and user_id=participant)<>'Test Contact' then raise exception 'Failed update changed response'; end if;
 raise notice 'Required contacts: missing/malformed fields rejected; valid registration and rollback verified';
end $$;
rollback;
