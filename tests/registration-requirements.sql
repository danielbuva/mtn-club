begin;
do $$
#variable_conflict use_variable
declare owner_id uuid:=gen_random_uuid(); user1 uuid:=gen_random_uuid(); user2 uuid:=gen_random_uuid(); role_id uuid:=gen_random_uuid(); tid uuid:=gen_random_uuid();
 minor_id uuid:=gen_random_uuid(); payload jsonb; snap jsonb; doc uuid; rec record; job jsonb; evidence_count integer;
begin
 insert into auth.users(id,email) values(owner_id,owner_id||'@example.test'),(user1,user1||'@example.test'),(user2,user2||'@example.test');
 insert into public.admin_roles(id,key,name,is_super_admin) values(role_id,'registration_'||replace(role_id::text,'-','_'),'RSVP test admin',true);
 insert into public.admin_user_roles(user_id,role_id) values(owner_id,role_id);
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 insert into public.trips(id,title,starts_at,ends_at,capacity,created_by)
 values(tid,'Requirements test',now()+interval '10 hours',now()+interval '14 hours',2,owner_id);
 perform public.set_registration_enabled(true);
 perform public.save_registration_settings(tid,0,jsonb_build_object('enabled',true,'eligibility','account','emergencyRequired',true,'waiverRequired',true,
 'waiverTitle','Test fixture only','waiverBody','Synthetic test document. Not a real waiver.',
 'questions','[{"id":"experience","label":"Experience","type":"boolean","required":true}]'::jsonb,
 'capacity',2,'waitlistEnabled',true,'deadline',null,'offerHours',24));
 select waiver_id into doc from public.trip_registration_settings where trip_id=tid;
 payload:=jsonb_build_object('formVersion',2,'emergencyConfirmed',true,'answers','{"experience":false}'::jsonb,'waiverAgreed',true,'waiverId',doc,'signatureName','Synthetic participant',
 'emergencyContact','{"name":"Test Contact","relationship":"Friend","phone":"555-010-1234"}'::jsonb);
 perform set_config('request.jwt.claim.sub',user1::text,true); perform public.declare_registration_age(true);
 begin perform public.registration_command(tid,'register',gen_random_uuid(),0,payload||'{"answers":{"unknown":"tampered"}}');
 raise exception 'Unknown answers accepted'; exception when others then if sqlerrm<>'Unknown registration question.' then raise; end if; end;
 begin perform public.registration_command(tid,'register',gen_random_uuid(),0,payload||'{"emergencyContact":{}}');
 raise exception 'Missing emergency accepted'; exception when others then if sqlerrm<>'Confirm an emergency contact name, relationship, and phone number.' then raise; end if; end;
 begin perform public.registration_command(tid,'register',gen_random_uuid(),0,payload||'{"waiverAgreed":false}');
 raise exception 'Unsigned waiver accepted'; exception when others then if sqlerrm<>'Read and sign the required waiver.' then raise; end if; end;
 snap:=public.registration_command(tid,'register',gen_random_uuid(),0,payload);
 if snap->>'state'<>'confirmed' then raise exception 'Valid requirements failed'; end if;
 select count(*) into evidence_count from public.registration_signatures where trip_id=tid;
 begin update public.registration_waivers set body='Changed' where id=doc; raise exception 'Document changed';
 exception when others then if sqlerrm<>'Signed documents and registration history are immutable' then raise; end if; end;
 begin update public.registration_signatures set signature_name='Different signer' where trip_id=tid; raise exception 'Signature evidence changed';
 exception when others then if sqlerrm<>'Signed documents and registration history are immutable' then raise; end if; end;
 perform public.registration_command(tid,'update_response',gen_random_uuid(),1,payload||'{"emergencyContact":{"name":"Updated Contact","relationship":"Parent","phone":"5551234567"}}');
 if (select count(*) from public.registration_signatures where trip_id=tid)<>evidence_count then raise exception 'Signature duplicated'; end if;

 insert into public.profile_private(user_id,notification_settings) values(user1,'{"email":false}')
 on conflict(user_id) do update set notification_settings=excluded.notification_settings;
 perform public.registration_maintenance();
 for rec in select id,lease_token from public.registration_notifications where false loop null; end loop;
 for job in select value from jsonb_array_elements(public.claim_registration_notifications(20)) loop
  if exists(select 1 from public.registration_notifications where id=(job->>'id')::uuid and user_id=user1) then
   if public.prepare_registration_notification((job->>'id')::uuid,(job->>'leaseToken')::uuid) is not null then raise exception 'Email opt out ignored'; end if;
  end if;
 end loop;
 if not exists(select 1 from public.registration_notifications where user_id=user1 and status='suppressed') then raise exception 'Suppression not recorded'; end if;

 perform set_config('request.jwt.claim.sub',user2::text,true); perform public.declare_registration_age(true);
 perform public.registration_command(tid,'register',gen_random_uuid(),0,payload);
 -- Different form data must fail BEFORE moving either registration.
 begin perform public.merge_trip_registrations(user1,user2); raise exception 'Conflicting forms merged';
 exception when others then if sqlerrm<>'Resolve conflicting registration forms before merging accounts.' then raise; end if; end;
 if exists(select 1 from public.registration_account_merges where secondary_id=user2) then raise exception 'Failed merge mutated accounts'; end if;
 perform public.registration_command(tid,'update_response',gen_random_uuid(),1,payload||'{"emergencyContact":{"name":"Updated Contact","relationship":"Parent","phone":"5551234567"}}');
 perform public.merge_trip_registrations(user1,user2);
 if (select count(*) from public.trip_rsvps where trip_id=tid and registration_state='confirmed')<>1 then raise exception 'Merge retained duplicate seat'; end if;
 if (select count(*) from public.registration_signatures where trip_id=tid)<>2 then raise exception 'Merge lost original signature evidence'; end if;
 perform set_config('request.jwt.claim.sub',user1::text,true);
 if jsonb_array_length(public.get_my_registration_signatures())<>2 then raise exception 'Merged signatures unavailable'; end if;

 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.registration_command(tid,'attendance',gen_random_uuid(),3,'{"attendance":"present"}',user1);
 if not exists(select 1 from public.trip_attendance where trip_id=tid and user_id=user1 and attended) then raise exception 'Checkin not stored'; end if;

 -- A child cannot sign the adult agreement; an officer verifies the parent's actual document.
 insert into auth.users(id,email) values(minor_id,minor_id||'@example.test');
 perform set_config('request.jwt.claim.sub',minor_id::text,true); perform public.declare_registration_age(false);
 begin perform public.registration_command(tid,'register',gen_random_uuid(),0,payload);
 raise exception 'Minor self-signature accepted'; exception when others then
 if sqlerrm<>'A parent or legal guardian must sign the waiver. Request officer verification of that document.' then raise; end if; end;
 perform public.registration_command(tid,'request_guardian',gen_random_uuid(),0,'{}');
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 begin perform public.registration_command(tid,'guardian_review',gen_random_uuid(),1,'{"evidence":"Unsupported consent"}',minor_id);
 raise exception 'Unsigned guardian document accepted'; exception when others then
 if sqlerrm<>'Verify the parent-signed waiver, signer name, signing date, and retained document reference.' then raise; end if; end;
 perform public.registration_command(tid,'guardian_review',gen_random_uuid(),1,jsonb_build_object('evidence','Synthetic fixture only',
 'guardianDocument',jsonb_build_object('guardianName','Synthetic Parent','signedOn',current_date::text,'reference','test-fixture:parent-consent','verified',true)),minor_id);
 perform set_config('request.jwt.claim.sub',minor_id::text,true);
 snap:=public.registration_command(tid,'register',gen_random_uuid(),2,payload-'waiverAgreed'-'waiverId'-'signatureName');
 if snap->>'state'<>'confirmed' or snap->'waiverSigned'<>'true'::jsonb then raise exception 'Verified parent waiver did not satisfy registration'; end if;
 if exists(select 1 from public.registration_signatures where user_id=minor_id) then raise exception 'Fabricated minor signature'; end if;
 begin update public.registration_guardian_evidence set evidence='Changed' where user_id=minor_id;
 raise exception 'Guardian evidence changed'; exception when others then
 if sqlerrm<>'Signed documents and registration history are immutable' then raise; end if; end;
 begin perform registration_private.validate_signer_details('{"initials":[]}'); raise exception 'Incomplete official waiver accepted';
 exception when others then if sqlerrm not like 'Complete the waiver contact%' then raise; end if; end;
 perform registration_private.validate_signer_details('{"phone":"5550101234","address":"123 Test Street","emergencyAddress":"456 Test Street","birthDate":"1990-01-01","initials":["TT","TT","TT","TT","TT","TT","TT"]}');
 raise notice 'Requirements, notifications, and merge checks passed';
end $$;
rollback;
