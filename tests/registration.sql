-- Disposable application database only. Fixtures and writes are rolled back.
begin;
do $$
#variable_conflict use_variable
declare owner_id uuid:=gen_random_uuid(); first_id uuid:=gen_random_uuid(); second_id uuid:=gen_random_uuid();
 third_id uuid:=gen_random_uuid(); minor_id uuid:=gen_random_uuid(); role_id uuid:=gen_random_uuid(); trip_id uuid:=gen_random_uuid();
 request_id uuid:=gen_random_uuid(); offer_id uuid; result jsonb; settings jsonb;
begin
 insert into auth.users(id,email,email_confirmed_at) values
 (owner_id,owner_id||'@example.test',now()),(first_id,first_id||'@example.test',now()),
 (second_id,second_id||'@example.test',now()),(third_id,third_id||'@example.test',now()),(minor_id,minor_id||'@example.test',now());
 insert into public.admin_roles(id,key,name,is_super_admin) values(role_id,'rsvp_test_'||replace(role_id::text,'-','_'),'RSVP test admin',true);
 insert into public.admin_user_roles(user_id,role_id) values(owner_id,role_id);
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 insert into public.trips(id,title,starts_at,ends_at,capacity,created_by)
 values(trip_id,'RSVP integration test',now()+interval '3 days',now()+interval '4 days',1,owner_id);
 perform public.set_registration_enabled(true);
 settings:=jsonb_build_object('enabled',true,'eligibility','account','emergencyRequired',false,'waiverRequired',false,
 'questions','[]'::jsonb,'capacity',1,'waitlistEnabled',true,'deadline',null,'offerHours',24);
 perform public.save_registration_settings(trip_id,0,settings);
 if has_table_privilege('authenticated','public.trip_rsvps','INSERT')
 or has_function_privilege('authenticated','public.claim_registration_notifications(integer)','EXECUTE') then
 raise exception 'Direct mutation privileges leaked'; end if;

 perform set_config('request.jwt.claim.sub',first_id::text,true);
 perform public.declare_registration_age(true);
 result:=public.registration_command(trip_id,'register',request_id,0,'{"answers":{},"formVersion":2}');
 if result->>'state'<>'confirmed' or result->>'confirmedCount'<>'1' then raise exception 'First member not confirmed: %',result; end if;
 result:=public.registration_command(trip_id,'register',request_id,0,'{"answers":{},"formVersion":2}');
 if result->>'state'<>'confirmed' or result->>'revision'<>'1' then raise exception 'Retry changed state'; end if;
 begin
 perform public.registration_command(trip_id,'cancel',request_id,1);
 raise exception 'Reused request accepted';
 exception when others then if sqlerrm<>'Request identifier was already used for a different action.' then raise; end if; end;

 perform set_config('request.jwt.claim.sub',second_id::text,true);
 perform public.declare_registration_age(true);
 result:=public.registration_command(trip_id,'register',gen_random_uuid(),0,'{"answers":{},"formVersion":2}');
 if result->>'state'<>'waitlisted' or result->>'confirmedCount'<>'1' then raise exception 'Waitlist/count incorrect'; end if;
 if jsonb_array_length(result->'attendees')<>0 then raise exception 'Waitlisted person sees attendee identities'; end if;
 begin perform public.get_registration_roster(trip_id); raise exception 'Roster leaked';
 exception when others then if sqlerrm<>'Trip management permission required.' then raise; end if; end;

 perform set_config('request.jwt.claim.sub',first_id::text,true);
 perform public.registration_command(trip_id,'cancel',gen_random_uuid(),1);
 perform set_config('request.jwt.claim.sub',third_id::text,true);
 perform public.declare_registration_age(true);
 result:=public.registration_command(trip_id,'register',gen_random_uuid(),0,'{"answers":{},"formVersion":2}');
 if result->>'state'<>'waitlisted' then raise exception 'New arrival bypassed queue'; end if;

 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.registration_command(trip_id,'issue_offer',gen_random_uuid(),1,'{}',second_id);
 begin perform public.registration_command(trip_id,'issue_offer',gen_random_uuid(),1,'{}',third_id);
 raise exception 'Offered more than capacity'; exception when others then if sqlerrm<>'No unreserved seat is available.' then raise; end if; end;
 begin perform public.save_registration_settings(trip_id,1,settings||'{"eligibility":"members"}'::jsonb);
 raise exception 'Changed frozen requirements'; exception when others then if sqlerrm<>'Registration requirements are frozen after the first submission.' then raise; end if; end;

 select id into offer_id from public.registration_offers where registration_offers.trip_id=trip_id and user_id=second_id and status='pending';
 perform public.set_registration_enabled(false);
 perform set_config('request.jwt.claim.sub',second_id::text,true);
 result:=public.registration_command(trip_id,'accept_offer',gen_random_uuid(),2,jsonb_build_object('offerId',offer_id));
 if result->>'state'<>'confirmed' then raise exception 'Kill switch blocked existing offer'; end if;
 perform public.registration_command(trip_id,'cancel',gen_random_uuid(),3);

 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.set_registration_enabled(true);
 perform public.registration_command(trip_id,'issue_offer',gen_random_uuid(),1,'{}',third_id);
 update public.registration_offers set expires_at=now()-interval '1 second' where user_id=third_id;
 perform registration_private.expire_offers(trip_id);
 if not exists(select 1 from public.trip_rsvps where user_id=third_id and registration_state='waitlisted' and revision=3) then raise exception 'Offer did not expire'; end if;
 perform public.registration_command(trip_id,'remove',gen_random_uuid(),3,'{"reason":"Test removal"}',third_id);
 perform set_config('request.jwt.claim.sub',third_id::text,true);
 begin perform public.registration_command(trip_id,'register',gen_random_uuid(),4,'{"answers":{},"formVersion":2}'); raise exception 'Removed person rejoined';
 exception when others then if sqlerrm<>'An organizer must restore your registration access.' then raise; end if; end;

 perform set_config('request.jwt.claim.sub',minor_id::text,true);
 perform public.declare_registration_age(false);
 begin perform public.registration_command(trip_id,'register',gen_random_uuid(),0,'{"answers":{},"formVersion":2}'); raise exception 'Minor bypassed review';
 exception when others then if sqlerrm<>'An officer must confirm guardian consent for this trip.' then raise; end if; end;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.registration_command(trip_id,'guardian_review',gen_random_uuid(),0,'{"evidence":"Consent verified in test"}',minor_id);
 perform set_config('request.jwt.claim.sub',minor_id::text,true);
 result:=public.registration_command(trip_id,'register',gen_random_uuid(),0,'{"answers":{},"formVersion":2}');
 if result->>'state'<>'confirmed' then raise exception 'Reviewed minor not accepted'; end if;

 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 update public.trips set lifecycle_status='canceled' where id=trip_id;
 if exists(select 1 from public.trip_rsvps where trip_rsvps.trip_id=trip_id and registration_state in ('confirmed','offered')) then raise exception 'Cancellation retained seats'; end if;
 if not exists(select 1 from public.registration_notifications where registration_notifications.trip_id=trip_id and kind='trip_canceled') then raise exception 'Cancellation notification missing'; end if;
 raise notice 'Registration workflow checks passed';
end $$;
rollback;
