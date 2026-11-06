begin;
do $$
#variable_conflict use_variable
declare owner_id uuid:=gen_random_uuid(); member_id uuid:=gen_random_uuid(); missing_id uuid:=gen_random_uuid(); signature_id uuid:=gen_random_uuid();
 tid uuid:=gen_random_uuid(); doc uuid; snapshot jsonb; result jsonb; version integer; contact jsonb:='{"name":"Known Friend","relationship":"Friend","phone":"7025550124"}';
begin
 insert into auth.users(id,email) values(owner_id,owner_id||'@example.test'),(member_id,member_id||'@example.test'),(missing_id,missing_id||'@example.test'),(signature_id,signature_id||'@example.test');
 insert into public.admin_user_roles(user_id,role_id) select owner_id,id from public.admin_roles where is_super_admin;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 insert into public.trips(id,title,starts_at,ends_at,capacity,created_by) values(tid,'Saved contacts',now()+interval '2 days',now()+interval '3 days',10,owner_id);
 perform public.set_registration_enabled(true);
 perform public.save_registration_settings(tid,0,'{"enabled":true,"eligibility":"account","emergencyRequired":true,"waiverRequired":false,"questions":[],"capacity":10,"waitlistEnabled":true,"deadline":null,"offerHours":24}');
 update public.trip_registration_settings set annual_waiver=false where trip_id=tid;
 select form_version into version from public.trip_registration_settings where trip_id=tid;
 insert into public.profile_private(user_id,phone,emergency_contact) values(member_id,'+1 (702) 555-0123',contact);
 insert into public.account_age_declarations(user_id,is_18_or_older) values(member_id,true),(missing_id,true),(signature_id,true);
 perform set_config('request.jwt.claim.sub',member_id::text,true);
 snapshot:=public.get_trip_registration(tid);
 if snapshot->'questions'<>'[]'::jsonb then raise exception 'Known contacts were asked again'; end if;
 if snapshot->'emergencyOnFile'<>'true'::jsonb then raise exception 'Known emergency contact was not recognized'; end if;
 if snapshot->'answers'->>'participant_phone'<>'+1 (702) 555-0123' then raise exception 'Profile phone missing'; end if;
 result:=public.registration_command(tid,'register',gen_random_uuid(),0,jsonb_build_object('formVersion',version,'answers','{}'::jsonb,'emergencyConfirmed',true));
 if result->>'state'<>'confirmed' or result->'requirements'<>'[]'::jsonb then raise exception 'Registration did not reuse saved information'; end if;
 -- Default contact answers never leak through someone else's snapshot, including anonymous reads.
 perform set_config('request.jwt.claim.sub',missing_id::text,true);
 snapshot:=public.get_trip_registration(tid);
 if jsonb_array_length(snapshot->'questions')<>1 or snapshot->'questions'->0->>'id'<>'participant_phone' then raise exception 'Missing phone was not requested'; end if;
 if snapshot->'answers'->>'participant_phone' is not null then raise exception 'Another user phone leaked'; end if;
 perform set_config('request.jwt.claim.sub','',true);
 snapshot:=public.get_trip_registration(tid);
 if snapshot->'answers'<>'{}'::jsonb or snapshot->'emergencyOnFile'<>'false'::jsonb then raise exception 'Anonymous snapshot leaked saved contacts'; end if;
 -- The phone and emergency contact previously supplied on a signed waiver also count.
 insert into public.registration_waivers(trip_id,version,title,body) values(tid,1,'Synthetic test waiver','Synthetic fixture only.') returning id into doc;
 insert into public.registration_signatures(trip_id,user_id,original_signer_id,waiver_id,signature_name,signer_details)
 values(tid,signature_id,signature_id,doc,'Synthetic Participant',jsonb_build_object('phone','7025550199','emergencyContact',contact));
 perform set_config('request.jwt.claim.sub',signature_id::text,true);
 snapshot:=public.get_trip_registration(tid);
 if snapshot->'questions'<>'[]'::jsonb or snapshot->'answers'->>'participant_phone'<>'7025550199' or snapshot->'emergencyOnFile'<>'true'::jsonb then raise exception 'Signed waiver contacts not reused'; end if;
 raise notice 'Saved contact regression passed';
end $$;
rollback;
