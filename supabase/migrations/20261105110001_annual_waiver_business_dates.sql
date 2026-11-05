-- Annual waiver periods are club calendar dates, independent of the session or trip timezone.
-- Keep this business zone aligned with CLUB_TIME_ZONE in lib/events/formatters.ts.
begin;

create or replace function registration_private.waiver_business_date(p_at timestamptz) returns date
language sql immutable strict set search_path='' as $$
 select (p_at at time zone 'America/Los_Angeles')::date;
$$;

create or replace function registration_private.waiver_today() returns date
language sql stable set search_path='' as $$
 select registration_private.waiver_business_date(now());
$$;

create or replace function public.sign_annual_waiver(p_waiver uuid,p_request uuid,p_data jsonb) returns uuid
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
 if w.id is null or p_waiver is distinct from registration_private.current_annual_waiver(registration_private.waiver_today()) then raise exception 'Our annual waiver has been updated or expired. Review the current version.'; end if;
 if not exists(select 1 from public.account_age_declarations where user_id=uid and is_18_or_older)
 or exists(select 1 from public.membership_applications where user_id=uid and age_status='minor') then raise exception 'A parent or legal guardian must sign. Contact an officer for verification.'; end if;
 if p_data->'waiverAgreed' is distinct from 'true'::jsonb then raise exception 'Read and agree to the annual waiver.'; end if;
 perform registration_private.validate_signer_details(p_data->'signerDetails');
 if coalesce(length(trim(p_data->'emergencyContact'->>'name')),0)<2 or coalesce(length(trim(p_data->'emergencyContact'->>'phone')),0)<7 then raise exception 'Complete your emergency contact.'; end if;
 result:=registration_private.annual_signature(w.id,uid,registration_private.waiver_today(),registration_private.waiver_today(),clock_timestamp());
 if result is null then
 insert into public.registration_signatures(user_id,original_signer_id,waiver_id,signature_name,signer_details,valid_from,valid_until)
 values(uid,uid,w.id,trim(p_data->>'signatureName'),(p_data->'signerDetails')||jsonb_build_object('emergencyContact',p_data->'emergencyContact',
 'authenticatedEmail',(select email from auth.users where id=uid),'authenticatedUserId',uid,'sourceTemplate','UNLV RSO Liability Waiver Template, August 2022'),
 greatest(w.effective_from,registration_private.waiver_today()),w.effective_until) returning id into result;
 end if;
 insert into public.registration_waiver_requests(actor_id,request_id,payload,signature_id) values(uid,p_request,payload,result);
 return result;
end $$;

create or replace function public.get_annual_waivers() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare current_id uuid:=registration_private.current_annual_waiver(registration_private.waiver_today()); begin
 if auth.uid() is null then raise exception 'Sign in required.'; end if;
 return jsonb_build_object('current',(select to_jsonb(w) from public.registration_waivers w where id=current_id),
 'signatureId',registration_private.annual_signature(current_id,auth.uid(),registration_private.waiver_today(),registration_private.waiver_today()),
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

create or replace function public.request_annual_guardian_review(p_waiver uuid) returns void
language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) then raise exception 'Sign in required.'; end if;
 if p_waiver is distinct from registration_private.current_annual_waiver(registration_private.waiver_today()) then raise exception 'Review the current annual waiver.'; end if;
 if not exists(select 1 from public.account_age_declarations where user_id=auth.uid() and not is_18_or_older)
 and not exists(select 1 from public.membership_applications where user_id=auth.uid() and age_status='minor') then raise exception 'Declare your age before requesting guardian review.'; end if;
 insert into public.registration_annual_guardian_requests(user_id,waiver_id) values(auth.uid(),p_waiver) on conflict do nothing;
end $$;

create or replace function public.verify_annual_guardian(p_waiver uuid,p_user uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; w public.registration_waivers; document jsonb:=p_data->'guardianDocument'; lock_user uuid; begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'membership.confirm_guardian') then raise exception 'Guardian verification permission required.'; end if;
 for lock_user in select distinct u from unnest(array[auth.uid(),p_user]) u order by u loop perform pg_advisory_xact_lock(hashtextextended('registration-account:'||lock_user,0)); end loop;
 perform pg_advisory_xact_lock(hashtextextended('annual-waiver-publication',0));
 if exists(select 1 from public.registration_account_merges where secondary_id=p_user) then raise exception 'Use the retained account for guardian verification.'; end if;
 select * into w from public.registration_waivers where id=p_waiver;
 if p_waiver is distinct from registration_private.current_annual_waiver(registration_private.waiver_today()) or w.id is null then raise exception 'Verify the current annual document.'; end if;
 if not exists(select 1 from public.registration_annual_guardian_requests where waiver_id=p_waiver and registration_private.owns_record(p_user,user_id))
 and not exists(select 1 from public.trip_rsvps r join public.trip_registration_settings s on s.trip_id=r.trip_id where r.user_id=p_user and s.annual_waiver) then raise exception 'Guardian review request not found.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>10000
 or coalesce(length(trim(document->>'guardianName')),0) not between 2 and 200
 or coalesce(length(trim(document->>'reference')),0) not between 5 and 1000
 or coalesce(document->>'signedOn','') !~ '^\d{4}-\d{2}-\d{2}$'
 or (document->>'signedOn')::date not between w.effective_from and least(registration_private.waiver_today(),w.effective_until)
 or document->'verified' is distinct from 'true'::jsonb
 or coalesce(length(trim(p_data->>'evidence')),0) not between 5 and 2000 then raise exception 'Verify guardian identity, authority, signature, date, completed form, and retained document reference.'; end if;
 result:=registration_private.annual_signature(w.id,p_user,registration_private.waiver_today(),registration_private.waiver_today(),clock_timestamp());
 if result is null then
 insert into public.registration_signatures(user_id,original_signer_id,waiver_id,signature_name,signer_kind,signer_details,valid_from,valid_until)
 values(p_user,p_user,w.id,document->>'guardianName','guardian',document||jsonb_build_object('reviewerId',auth.uid(),'reviewedAt',now(),'evidence',p_data->>'evidence'),registration_private.waiver_today(),w.effective_until) returning id into result;
 end if;
 return result;
end $$;

create or replace function public.get_annual_guardian_requests() returns jsonb
language plpgsql stable security definer set search_path='' as $$ begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'membership.confirm_guardian') then raise exception 'Guardian verification permission required.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('userId',coalesce(m.primary_id,r.user_id),'name',coalesce(p.display_name,'Participant'),
 'waiverId',w.id,'waiverTitle',w.title,'waiverVersion',w.version,'waiverBody',w.body))
 from public.registration_annual_guardian_requests r join public.registration_waivers w on w.id=r.waiver_id
 left join public.registration_account_merges m on m.secondary_id=r.user_id
 left join public.profiles p on p.user_id=coalesce(m.primary_id,r.user_id)
 where w.id=registration_private.current_annual_waiver(registration_private.waiver_today())
 and registration_private.annual_signature(w.id,coalesce(m.primary_id,r.user_id),registration_private.waiver_today(),registration_private.waiver_today()) is null),'[]');
end $$;

create or replace function registration_private.trip_waiver(p_trip uuid) returns uuid
language sql stable security definer set search_path='' as $$
 select case when s.annual_waiver then (select w.id from public.registration_waivers w join public.registration_waiver_publications p on p.waiver_id=w.id
 where w.trip_id is null and registration_private.waiver_business_date(t.starts_at) between w.effective_from and w.effective_until
 and p.published_at<=least(clock_timestamp(),t.starts_at) order by p.published_at desc,w.version desc limit 1) else s.waiver_id end
 from public.trip_registration_settings s join public.trips t on t.id=s.trip_id where s.trip_id=p_trip;
$$;

create or replace function registration_private.waiver_reason(p_trip uuid,p_user uuid) returns text
language plpgsql stable security definer set search_path='' as $$
declare w public.registration_waivers; d public.registration_risk_disclosures; prior public.registration_signatures; begin
 if registration_private.waiver_complete(p_trip,p_user) then return null; end if;
 select * into w from public.registration_waivers where id=registration_private.trip_waiver(p_trip);
 select d1.* into d from public.registration_risk_disclosures d1 join public.trip_registration_settings s on s.risk_disclosure_id=d1.id where s.trip_id=p_trip;
 if d.id is null then return 'An organizer must identify this trip’s activities and informed risks before participation.'; end if;
 if w.id is null then return 'A current annual waiver covering this trip’s dates is required before participation. Contact the club.'; end if;
 if not array_remove(d.activity_scope,'none')<@w.activity_scope then return 'This trip is outside the annual waiver’s approved activity scope. Contact an officer for a separate waiver process before participation.'; end if;
 select * into prior from public.registration_signatures where registration_private.owns_record(p_user,user_id) and trip_id is null order by signed_at desc limit 1;
 if exists(select 1 from public.registration_waiver_withdrawals where signature_id=prior.id) then return 'Your annual waiver was withdrawn for future trips. Sign the current waiver before participation.'; end if;
 if prior.valid_until<(select registration_private.waiver_business_date(starts_at) from public.trips where id=p_trip) then return 'Your annual waiver expires before this trip. Review and sign the current waiver before participation.'; end if;
 if prior.id is not null and prior.waiver_id<>w.id then return 'Our annual waiver has been updated. Review and sign the current version before your next trip.'; end if;
 return 'Annual waiver required before participation.';
end $$;

create or replace function registration_private.waiver_complete(p_trip uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t public.trips; s public.trip_registration_settings; w public.registration_waivers; d public.registration_risk_disclosures; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 if not s.annual_waiver then return registration_private.legacy_waiver_complete(p_trip,p_user); end if;
 select * into t from public.trips where id=p_trip;
 select * into d from public.registration_risk_disclosures where id=s.risk_disclosure_id;
 select * into w from public.registration_waivers where id=registration_private.trip_waiver(p_trip);
 return coalesce(cardinality(d.activity_scope)>0 and array_remove(d.activity_scope,'none')<@w.activity_scope and
 registration_private.annual_signature(w.id,p_user,registration_private.waiver_business_date(t.starts_at),
 registration_private.waiver_business_date(coalesce(t.ends_at,t.starts_at)),least(clock_timestamp(),t.starts_at)) is not null,false);
end $function$
;

-- Existing RPC ACLs are preserved by CREATE OR REPLACE. New helpers stay private.
revoke all on function registration_private.waiver_business_date(timestamptz), registration_private.waiver_today() from public, anon, authenticated, service_role;
grant execute on function registration_private.waiver_business_date(timestamptz), registration_private.waiver_today() to postgres;

commit;
