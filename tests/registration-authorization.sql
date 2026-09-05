begin;
do $$
#variable_conflict use_variable
declare owner_id uuid:=gen_random_uuid(); uid uuid:=gen_random_uuid(); leader uuid:=gen_random_uuid(); role_id uuid:=gen_random_uuid(); assigned_role uuid:=gen_random_uuid();
 tid uuid:=gen_random_uuid(); other_trip uuid:=gen_random_uuid(); minor_id uuid:=gen_random_uuid(); settings jsonb; snapshot jsonb;
begin
 insert into auth.users(id,email) values(owner_id,owner_id||'@example.test'),(uid,uid||'@example.test'),(leader,leader||'@example.test');
 insert into public.admin_roles(id,key,name,is_super_admin) values(role_id,'authorization_'||replace(role_id::text,'-','_'),'Test admin',true);
 insert into public.admin_user_roles(user_id,role_id) values(owner_id,role_id);
 insert into public.account_age_declarations(user_id,is_18_or_older) values(uid,true);
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 insert into public.trips(id,title,starts_at,ends_at,created_by) values
 (tid,'Member test',now()+interval '2 days',now()+interval '3 days',owner_id),
 (other_trip,'Unassigned test',now()+interval '2 days',now()+interval '3 days',owner_id);
 settings:='{"enabled":true,"eligibility":"members","emergencyRequired":false,"waiverRequired":false,"questions":[],"capacity":2,"waitlistEnabled":false,"deadline":null,"offerHours":24}';
 perform public.save_registration_settings(tid,0,settings);
 perform public.set_registration_enabled(true);
 perform set_config('request.jwt.claim.sub',uid::text,true);
 begin perform public.registration_command(tid,'register',gen_random_uuid(),0,'{"formVersion":1,"answers":{}}'); raise exception 'Nonmember joined member trip';
 exception when others then if sqlerrm<>'An active membership is required.' then raise; end if; end;
 insert into public.membership_applications(user_id,full_name,contact_email,age_status,guardian_consent,dues_payment_claimed,dues_claimed_at,primary_interest)
 values(uid,'Test Member',uid||'@example.test','adult','not_required',true,now(),'Hiking');
 begin perform public.registration_command(tid,'register',gen_random_uuid(),0,'{"formVersion":1,"answers":{}}'); raise exception 'Provisional member joined';
 exception when others then if sqlerrm<>'An active membership is required.' then raise; end if; end;
 insert into public.membership_access_overrides(user_id,starts_at,ends_at,reason,granted_by)
 values(uid,now()-interval '1 day',now()+interval '1 day','Synthetic test access',owner_id);
 snapshot:=public.registration_command(tid,'register',gen_random_uuid(),0,'{"formVersion":1,"answers":{}}');
 if snapshot->>'state'<>'confirmed' then raise exception 'Active member not confirmed'; end if;
 update public.membership_access_overrides set ends_at=now()-interval '1 hour' where user_id=uid;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 begin perform public.registration_command(tid,'attendance',gen_random_uuid(),1,'{"attendance":"present"}',uid); raise exception 'Expired member checked in';
 exception when others then if sqlerrm<>'An active membership is required.' then raise; end if; end;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 snapshot:=public.registration_command(tid,'cancel',gen_random_uuid(),1);
 if snapshot->>'state'<>'cancelled' then raise exception 'Expired member could not cancel'; end if;

 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.save_registration_settings(other_trip,0,settings||'{"eligibility":"account"}');
 insert into public.membership_account_restrictions(user_id,restriction,restricted_at) values(uid,'banned',now());
 perform set_config('request.jwt.claim.sub',uid::text,true);
 begin perform public.registration_command(other_trip,'register',gen_random_uuid(),0,'{"formVersion":2,"answers":{}}'); raise exception 'Banned account joined open trip';
 exception when others then if sqlerrm<>'Your account cannot register. Contact the club.' then raise; end if; end;
 delete from public.membership_account_restrictions where user_id=uid;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 update public.trips set rsvp_deadline=now()-interval '1 second' where id=other_trip;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 begin perform public.registration_command(other_trip,'register',gen_random_uuid(),0,'{"formVersion":2,"answers":{}}'); raise exception 'Closed trip accepted RSVP';
 exception when others then if sqlerrm<>'Registration is closed.' then raise; end if; end;

 insert into public.admin_capabilities(key,resource,action,label,supports_assigned_scope)
 values('trips.update','trips','update','Update trips',true) on conflict do nothing;
 insert into public.admin_roles(id,key,name) values(assigned_role,'assigned_'||replace(assigned_role::text,'-','_'),'Assigned organizer');
 insert into public.admin_role_grants(role_id,capability_key,scope) values(assigned_role,'trips.update','assigned');
 insert into public.admin_user_roles(user_id,role_id) values(leader,assigned_role);
 insert into public.trip_leaders(trip_id,user_id) values(tid,leader);
 perform set_config('request.jwt.claim.sub',leader::text,true);
 perform public.get_registration_roster(tid);
 begin perform public.get_registration_roster(other_trip); raise exception 'Assigned organizer accessed unrelated roster';
 exception when others then if sqlerrm<>'Trip management permission required.' then raise; end if; end;
 -- Guardian-only permission exposes a minimal review queue, including private trips.
 insert into auth.users(id,email) values(minor_id,minor_id||'@example.test');
 insert into public.account_age_declarations(user_id,is_18_or_older) values(minor_id,false);
 insert into public.trip_rsvps(trip_id,user_id,status) values(other_trip,minor_id,'removed');
 insert into public.admin_capabilities(key,resource,action,label) values('membership.confirm_guardian','membership','confirm_guardian','Confirm guardian consent') on conflict do nothing;
 insert into public.admin_role_grants(role_id,capability_key,scope) values(assigned_role,'membership.confirm_guardian','all');
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 update public.trips set visibility='members' where id=other_trip;
 perform set_config('request.jwt.claim.sub',leader::text,true);
 snapshot:=public.get_trip_guardian_requests();
 if jsonb_array_length(snapshot)<>1 or snapshot->0 ? 'emergencyContact' or snapshot->0 ? 'answers' then raise exception 'Guardian queue scope incorrect'; end if;
 perform public.registration_command(other_trip,'guardian_review',gen_random_uuid(),0,'{"evidence":"Verified synthetic guardian consent"}',minor_id);
 if jsonb_array_length(public.get_trip_guardian_requests())<>0 then raise exception 'Reviewed guardian request remained pending'; end if;
 begin perform public.get_registration_roster(other_trip); raise exception 'Guardian permission exposed full roster';
 exception when others then if sqlerrm<>'Trip management permission required.' then raise; end if; end;
 if has_table_privilege('anon','public.registration_responses','SELECT') or has_table_privilege('authenticated','public.registration_signatures','INSERT') then
 raise exception 'Sensitive registration tables exposed'; end if;
 raise notice 'Membership, restrictions, deadlines, and assigned access checks passed';
end $$;
rollback;
