-- Byte-for-byte copy of the existing UNLV August 2022 template; only designated fields may be filled.
create table registration_private.unlv_template (id boolean primary key default true check(id), body text not null, source_url text not null);
insert into registration_private.unlv_template(body,source_url) values($unlv$Event:  Enter the Event Name
Date of Event: Enter the Event Date
I, ___________________________,  (“Participant”) in consideration of my participation in the Enter the Event Name (“Event”), on behalf of myself, my assigns, and my heirs, expressly and knowingly agree to indemnify, defend, and hold harmless the Enter the Name of the RSO (hereinafter: “Sponsor”), Board of Regents of the Nevada System of Higher Education, on behalf of the University of Nevada, Las Vegas (“UNLV”), its officers, agents, employees, and volunteers, for any and all claims, demands, and/or causes of action for property damage, personal injury, or death sustained by me arising out of the Event conducted by or under the auspices of Sponsor, including, but not limited to, the selection and/or provision of emergency medical services.  (Initial beside each item below)
I understand and agree that Sponsor cannot control all of the risks associated with the Event, and may need to respond to accidents and other emergency situations.  Therefore, I hereby give my consent to the administration of any medical treatment that may be deemed necessary by Sponsor resulting from my participation in the Event, with the understanding that all costs of such treatment will be my sole responsibility and the Sponsor, UNLV, its officers, agents, volunteers, and employees harmless from all costs associated with such treatment.
I acknowledge that Sponsor does not carry medical or any other insurance for participants in the Event.  Therefore, I must provide my own medical, disability, or other appropriate insurance.
I acknowledge the inherent risks associated with participating in the Event and that such risks include, but are not limited to the following:
LIST POSSIBLE INJURIES
I hereby certify that I am in good physical and mental health and have had no previous, and have no pre-existing, medical conditions or injuries affecting my ability to participate in the Event, nor have I been declared medically ineligible for any athletic competition.
I hereby grant to UNLV the right to photograph, videotape, or otherwise digitally collect my likeness, voice, and sounds.  I understand that video and/or audio recordings taken of me by UNLV shall be used for educational purposes, including dissemination of information for public service announcements.
This agreement contains the entire agreement between parties, and supersedes any prior written or oral agreements between them concerning the Event.  The provisions of this agreement will continue in effect after the conclusion of the Event, whether said conclusion is by agreement, operation of law, or otherwise.
I have read the foregoing Agreement and have knowingly and willingly signed it with a full understanding of its purpose.  I affirmatively represent that I am at least eighteen (18) years of age and am otherwise competent to execute this Agreement, intend to be bound by it, and agree that it shall be governed by the laws of the State of Nevada.  
Printed Name: _______________________________________ Phone Number: ________________________
Signature: __________________________________________  Date: ________________________________
Local Address: ____________________________________________________________________________

UNDER 18 YEARS OF AGE
I expressly represent that I am a parent or legal guardian of Participant, that I am legally authorized and entitled to execute this agreement on my behalf and that of Participant, that I have read the foregoing agreement and have signed on behalf of Participant and myself with a full understanding of its purpose.  I acknowledge that the activity specified involves strenuous activity, and I know of no medical reason why Participant should not participate.  I affirmatively represent that I am competent to execute this agreement, Participant and I intend to be bound by it, and agree that it shall be governed by the laws of the State of Nevada.
Parent/Legal Guardian Signature: ___________________________________  Date: ___________________
Parent/Legal Guadrian Printed Name: ________________________________________________________
EMERGENCY CONTACT INFORMATION:
Participant Name: _____________________________________ Date of Birth: ___________________________
Emergency Contact’s Name: 
Address: _____________________________________ Phone Number: __________________
Please list any special medical services required, existing medical conditions, or allergies of Participant: 
___________________________________________________________________________________________
To participate in the Event, you must scan and email or bring this completed form with you to the first event you attend.  Failure to submit this completed form to the RSO at or prior to the Event, will preclude the individual from participating in the Event.$unlv$,'https://www.unlv.edu/sites/default/files/page_files/27/RSO%20Liability%20Waiver%20Template%20%28August%202022%29.docx');
create trigger unlv_template_immutable before update or delete on registration_private.unlv_template for each row execute function registration_private.immutable_document();
create function public.create_annual_waiver(p_fields jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare template registration_private.unlv_template; doc text; result uuid; activities text[]; start_date date; begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'settings.update') then raise exception 'Waiver configuration permission required.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('annual-waiver-publication',0));
 if jsonb_typeof(p_fields) is distinct from 'object' or octet_length(p_fields::text)>20000 then raise exception 'Invalid waiver fields.'; end if;
 if coalesce(length(trim(p_fields->>'event')),0) not between 5 and 200
 or coalesce(length(trim(p_fields->>'sponsor')),0) not between 5 and 200
 or coalesce(length(trim(p_fields->>'risks')),0) not between 20 and 10000 then raise exception 'Complete the event, sponsor, and specific risks fields.'; end if;
 start_date:=(p_fields->>'effectiveFrom')::date;
 select array_agg(x order by x) into activities from (select distinct lower(trim(value)) x from jsonb_array_elements_text(p_fields->'activities') where trim(value)<>'') a;
 if coalesce(cardinality(activities),0) not between 1 and 12 or exists(select 1 from unnest(activities) x where length(x)>80) then raise exception 'List the specifically covered activities.'; end if;
 select * into template from registration_private.unlv_template where id;
 doc:=replace(replace(replace(replace(template.body,'Enter the Event Name',p_fields->>'event'),
 'Enter the Event Date',to_char(start_date,'FMMonth FMDD, YYYY')||' – '||to_char(start_date+interval '1 year'-interval '1 day','FMMonth FMDD, YYYY')),
 'Enter the Name of the RSO',p_fields->>'sponsor'),'LIST POSSIBLE INJURIES',p_fields->>'risks');
 insert into public.registration_waivers(version,title,body,source_url,effective_from,effective_until,activity_scope,filled_values)
 values(coalesce((select max(version)+1 from public.registration_waivers where trip_id is null),1),p_fields->>'event',doc,template.source_url,
 start_date,(start_date+interval '1 year'-interval '1 day')::date,activities,p_fields) returning id into result;
 return result;
end $$;
create function public.publish_annual_waiver(p_waiver uuid,p_review_reference text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'settings.update') then raise exception 'Waiver configuration permission required.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('annual-waiver-publication',0));
 if not exists(select 1 from public.registration_waivers where id=p_waiver and trip_id is null) then raise exception 'Annual document not found.'; end if;
 insert into public.registration_waiver_publications(waiver_id,published_by,review_reference) values(p_waiver,auth.uid(),p_review_reference) on conflict do nothing;
end $$;
create function public.sign_annual_waiver(p_waiver uuid,p_request uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); w public.registration_waivers; existing public.registration_waiver_requests; result uuid; payload jsonb; begin
 if uid is null or p_request is null or registration_private.blocked(uid) then raise exception 'Sign in with an eligible account.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||uid,0));
 if exists(select 1 from public.registration_account_merges where secondary_id=uid) then raise exception 'Sign in with your retained account.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>12000 then raise exception 'Invalid signing details.'; end if;
 payload:=jsonb_build_object('waiver',p_waiver,'data',p_data);
 select * into existing from public.registration_waiver_requests where actor_id=uid and request_id=p_request;
 if found then
 if existing.payload is distinct from payload then raise exception 'Request identifier already used.'; end if;
 return existing.signature_id;
 end if;
 perform pg_advisory_xact_lock(hashtextextended('annual-waiver-publication',0));
 select * into w from public.registration_waivers where id=p_waiver and trip_id is null;
 if w.id is null or p_waiver is distinct from registration_private.current_annual_waiver(current_date) then raise exception 'Our annual waiver has been updated or expired. Review the current version.'; end if;
 if not exists(select 1 from public.account_age_declarations where user_id=uid and is_18_or_older)
 or exists(select 1 from public.membership_applications where user_id=uid and age_status='minor') then raise exception 'A parent or legal guardian must sign. Contact an officer for verification.'; end if;
 if p_data->'waiverAgreed' is distinct from 'true'::jsonb then raise exception 'Read and agree to the annual waiver.'; end if;
 perform registration_private.validate_signer_details(p_data->'signerDetails');
 if coalesce(length(trim(p_data->'emergencyContact'->>'name')),0)<2 or coalesce(length(trim(p_data->'emergencyContact'->>'phone')),0)<7 then raise exception 'Complete your emergency contact.'; end if;
 result:=registration_private.annual_signature(w.id,uid,current_date,current_date,clock_timestamp());
 if result is null then
 insert into public.registration_signatures(user_id,original_signer_id,waiver_id,signature_name,signer_details,valid_from,valid_until)
 values(uid,uid,w.id,trim(p_data->>'signatureName'),(p_data->'signerDetails')||jsonb_build_object('emergencyContact',p_data->'emergencyContact',
 'authenticatedEmail',(select email from auth.users where id=uid),'authenticatedUserId',uid,'sourceTemplate','UNLV RSO Liability Waiver Template, August 2022'),
 greatest(w.effective_from,current_date),w.effective_until) returning id into result;
 end if;
 insert into public.registration_waiver_requests(actor_id,request_id,payload,signature_id) values(uid,p_request,payload,result);
 return result;
end $$;
create function public.withdraw_annual_waiver(p_signature uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||auth.uid(),0));
 if exists(select 1 from public.registration_account_merges where secondary_id=auth.uid()) then raise exception 'Sign in with your retained account.'; end if;
 if not exists(select 1 from public.registration_signatures s join public.registration_waivers w on w.id=s.waiver_id
 where s.id=p_signature and w.trip_id is null and registration_private.owns_record(auth.uid(),s.user_id)) then raise exception 'Signed annual waiver not found.'; end if;
 insert into public.registration_waiver_withdrawals(signature_id,withdrawn_by) values(p_signature,auth.uid()) on conflict do nothing;
end $$;
create function public.get_annual_waivers() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare current_id uuid:=registration_private.current_annual_waiver(current_date); begin
 if auth.uid() is null then raise exception 'Sign in required.'; end if;
 return jsonb_build_object('current',(select to_jsonb(w) from public.registration_waivers w where id=current_id),
 'signatureId',registration_private.annual_signature(current_id,auth.uid(),current_date,current_date),
 'history',coalesce((select jsonb_agg(to_jsonb(w)||jsonb_build_object('signatureId',s.id,'signedAt',s.signed_at,
 'signatureName',s.signature_name,'signerKind',s.signer_kind,'guardianSignedOn',s.signer_details->>'signedOn','details',s.signer_details,'withdrawnAt',x.withdrawn_at,
 'validFrom',s.valid_from,'validUntil',s.valid_until) order by s.signed_at desc)
 from public.registration_signatures s join public.registration_waivers w on w.id=s.waiver_id
 left join public.registration_waiver_withdrawals x on x.signature_id=s.id
 where w.trip_id is null and registration_private.owns_record(auth.uid(),s.user_id)),'[]'),
 'upcomingRegistrations',(select count(*) from public.trip_rsvps r join public.trips t on t.id=r.trip_id
 where r.user_id=auth.uid() and t.starts_at>now() and r.registration_state in ('confirmed','waitlisted','offered')),
 'ageAdult',case when exists(select 1 from public.membership_applications where user_id=auth.uid() and age_status='minor') then false
 else (select is_18_or_older from public.account_age_declarations where user_id=auth.uid()) end,
 'emergencyContact',coalesce((select emergency_contact from public.profile_private where user_id=auth.uid()),'{}'));
end $$;
create function public.get_annual_waiver_configuration() returns jsonb
language plpgsql stable security definer set search_path='' as $$ begin
 if auth.uid() is null or not public.has_admin_capability(auth.uid(),'settings.update') then raise exception 'Waiver configuration permission required.'; end if;
 return coalesce((select jsonb_agg(to_jsonb(w)||jsonb_build_object('publishedAt',p.published_at) order by w.version desc)
 from public.registration_waivers w left join public.registration_waiver_publications p on p.waiver_id=w.id where w.trip_id is null),'[]');
end $$;
-- Explicit RPC grants; private helpers remain inaccessible to clients.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='registration_private' and p.proname in ('owns_record','current_annual_waiver','trip_waiver','annual_signature','waiver_complete','legacy_waiver_complete'))
 or (n.nspname='public' and p.proname in ('save_trip_informed_risks','create_annual_waiver','publish_annual_waiver','sign_annual_waiver','withdraw_annual_waiver','get_annual_waivers','get_annual_waiver_configuration')) loop
 execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 if f.nspname='public' then execute format('grant execute on function %s to authenticated',f.signature); end if;
 execute format('grant execute on function %s to postgres',f.signature);
 end loop;
end $$;
