begin;

-- Open email invitations are bound to the designated contact at issuance.
-- Previously issued open email links require a fresh invite.
alter table public.guardian_request_tokens
  add column invited_contact_id uuid references public.guardian_contacts(id);

-- Keep original attribution across merges, like registration signatures.
-- Ownership of retained evidence is resolved through the registration alias ledger.
alter table public.guardian_contacts drop constraint guardian_contacts_participant_id_fkey;
alter table public.guardian_requests drop constraint guardian_requests_participant_id_fkey;
alter table public.guardian_consents drop constraint guardian_consents_participant_id_fkey;
alter table public.guardian_withdrawals drop constraint guardian_withdrawals_participant_id_fkey;

create function registration_private.guardian_account(p_owner uuid)
returns uuid language sql stable set search_path='' as $$
  select coalesce(
    (select primary_id from public.registration_account_merges where secondary_id=p_owner),
    p_owner
  );
$$;
revoke all on function registration_private.guardian_account(uuid)
  from public, anon, authenticated, service_role;


create or replace function public.guardian_open_request(p_token_hash text,p_delivery text,p_trip uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); q public.guardian_requests; waiver uuid; membership boolean; begin
 if uid is null or registration_private.blocked(uid) then raise exception 'Sign in with an eligible account.'; end if;
 if p_delivery not in ('same_device','email') or p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid guardian link.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||uid,0));
 if exists(select 1 from public.registration_account_merges where secondary_id=uid) then raise exception 'Sign in with your retained account.'; end if;
 if not registration_private.is_minor(uid) then raise exception 'Guardian signing is only for participants under 18.'; end if;
 if p_trip is not null and not public.can_view_trip(p_trip,uid) then raise exception 'Trip not found.'; end if;
 waiver:=registration_private.guardian_target_waiver(uid,p_trip);
 membership:=registration_private.membership_consent_needed(uid) and not registration_private.membership_consent_pending(uid);
 select * into q from public.guardian_requests where participant_id=uid and status='open' for update;
 if q.id is not null and (q.waiver_id is distinct from waiver or q.needs_membership<>membership or q.trip_id is distinct from p_trip) then
  update public.guardian_requests set status='superseded',completed_at=now() where id=q.id;
  q:=null;
 end if;
 if q.id is null then
  if waiver is null and not membership then raise exception 'Nothing needs a guardian signature right now.'; end if;
  if p_trip is not null and waiver is null and exists(select 1 from public.trip_registration_settings s where s.trip_id=p_trip and s.annual_waiver and s.waiver_required)
  and registration_private.trip_waiver(p_trip) is null then raise exception 'This trip''s annual waiver is not published yet. Contact the club.'; end if;
  insert into public.guardian_requests(participant_id,contact_id,trip_id,needs_membership,waiver_id)
  values(uid,(select id from public.guardian_contacts where participant_id=uid and superseded_at is null),p_trip,membership,waiver) returning * into q;
 end if;
 if p_delivery='same_device' then
  insert into public.guardian_request_tokens(token_hash,request_id,delivery,expires_at) values(p_token_hash,q.id,'same_device',now()+interval '2 hours');
 end if;
 return jsonb_build_object('requestId',q.id);
end $$;

create or replace function public.guardian_prepare_invite(p_token_hash text,p_guardian jsonb,p_trip uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); q public.guardian_requests; c public.guardian_contacts; v_email text; v_name text; v_relationship text; begin
 perform public.guardian_open_request(p_token_hash,'email',p_trip);
 v_email:=lower(trim(p_guardian->>'email')); v_name:=regexp_replace(trim(p_guardian->>'name'),'\s+',' ','g'); v_relationship:=trim(p_guardian->>'relationship');
 if coalesce(length(v_name),0) not between 2 and 200 or coalesce(v_email,'') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email)>320
 or coalesce(length(v_relationship),0) not between 2 and 80 then raise exception 'Enter your guardian''s name, relationship, and email address.'; end if;
 if v_email=(select lower(u.email) from auth.users u where u.id=uid) then raise exception 'Use your parent or guardian''s own email address, not yours.'; end if;
 select * into q from public.guardian_requests where participant_id=uid and status='open' for update;
 if q.invite_count>=5 then raise exception 'This invitation was sent 5 times. Contact an officer for help reaching your guardian.'; end if;
 if q.invite_sent_at>now()-interval '10 minutes' then raise exception 'An invitation was just sent. You can resend it in a few minutes.'; end if;
 select * into c from public.guardian_contacts where participant_id=uid and superseded_at is null for update;
 if c.id is null or (c.email,c.full_name,c.relationship) is distinct from (v_email,v_name,v_relationship) then
  update public.guardian_contacts set superseded_at=clock_timestamp() where id=c.id;
  insert into public.guardian_contacts(participant_id,full_name,email,relationship,phone,created_by)
  values(uid,v_name,v_email,v_relationship,c.phone,'participant') returning * into c;
  update public.guardian_contacts set superseded_by=c.id where participant_id=uid and superseded_at is not null and superseded_by is null and id<>c.id;
 end if;
 insert into public.guardian_request_tokens(token_hash,request_id,delivery,expires_at,invited_contact_id)
 values(p_token_hash,q.id,'email',now()+interval '14 days',c.id);
 update public.guardian_requests set contact_id=c.id,invite_sent_at=now(),invite_count=invite_count+1 where id=q.id;
 return jsonb_build_object('requestId',q.id,'email',c.email,'guardianName',c.full_name,
 'participantName',coalesce((select display_name from public.profiles where user_id=uid),'A club member'),'inviteCount',q.invite_count+1);
end $$;

create or replace function registration_private.guardian_request_for_token(p_token_hash text) returns public.guardian_requests
language sql stable security definer set search_path='' as $$
 select q.* from public.guardian_request_tokens t join public.guardian_requests q on q.id=t.request_id
 where t.token_hash=p_token_hash and t.expires_at>now()
   and (q.status<>'open' or (
     q.participant_id=registration_private.guardian_account(q.participant_id)
     and (q.trip_id is null or public.can_view_trip(q.trip_id,q.participant_id))
     and (t.delivery<>'email' or t.invited_contact_id=q.contact_id)
     and exists(select 1 from auth.users u where u.id=q.participant_id and u.deleted_at is null)
   ));
$$;

create or replace function registration_private.guardian_session_email(p_request uuid,p_session_hash text) returns text
language sql stable security definer set search_path='' as $$
 select s.email from public.guardian_sessions s
 join public.guardian_requests q on q.id=s.request_id
 where s.request_id=p_request and s.session_hash=p_session_hash and s.expires_at>now()
   and (q.status<>'signed' or s.email=(select c.email from public.guardian_contacts c where c.id=q.signed_contact_id));
$$;

create or replace function public.get_my_guardian_status(p_trip uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); c public.guardian_contacts; q public.guardian_requests; last_q public.guardian_requests; w public.registration_waivers;
 trip_w public.registration_waivers; signature public.registration_signatures; prior public.registration_signatures; decision public.guardian_reviews;
 waiver_state text; membership_state text; trip_state text:=null; s public.trip_registration_settings; t public.trips; d public.registration_risk_disclosures; begin
 if uid is null then raise exception 'Sign in required.'; end if;
 select * into c from public.guardian_contacts where participant_id=uid and superseded_at is null;
 select * into q from public.guardian_requests where participant_id=uid and status='open';
 select * into last_q from public.guardian_requests where registration_private.owns_record(uid,participant_id) and status in ('signed','declined')
 order by completed_at desc limit 1;
 select * into decision from public.guardian_reviews where request_id=last_q.id order by created_at desc,id desc limit 1;
 select * into w from public.registration_waivers where id=registration_private.current_annual_waiver(registration_private.waiver_today());
 select * into signature from public.registration_signatures where id=registration_private.annual_signature(w.id,uid,registration_private.waiver_today(),registration_private.waiver_today());
 select s1.* into prior from public.registration_signatures s1 join public.registration_waivers w1 on w1.id=s1.waiver_id
 where w1.trip_id is null and registration_private.owns_record(uid,s1.user_id) order by s1.signed_at desc limit 1;
 waiver_state:=case
  when w.id is null then 'not_published'
  when signature.id is not null then 'covered'
  when registration_private.guardian_pending_signature(w.id,uid) is not null then 'awaiting_review'
  when exists(select 1 from public.registration_waiver_withdrawals where signature_id=prior.id) then 'withdrawn'
  when prior.id is not null and prior.waiver_id=w.id and prior.valid_until<registration_private.waiver_today() then 'aged_out'
  when prior.id is not null and prior.waiver_id<>w.id and prior.valid_until<registration_private.waiver_today() then 'expired'
  when prior.id is not null and prior.waiver_id<>w.id then 'updated'
  else 'needs_signature' end;
 membership_state:=case
  when not exists(select 1 from public.membership_applications where user_id=uid and age_status='minor') then 'not_applicable'
  when exists(select 1 from public.membership_applications where user_id=uid and guardian_consent='confirmed') then 'confirmed'
  when registration_private.membership_consent_pending(uid) then 'awaiting_review'
  when registration_private.membership_consent_needed(uid) then 'needs_signature'
  else 'not_applicable' end;
 if p_trip is not null and public.can_view_trip(p_trip,uid) then
  select * into s from public.trip_registration_settings where trip_id=p_trip;
  select * into t from public.trips where id=p_trip;
  if s.trip_id is not null and s.annual_waiver and s.waiver_required then
   select * into trip_w from public.registration_waivers where id=registration_private.trip_waiver(p_trip);
   select * into d from public.registration_risk_disclosures where id=s.risk_disclosure_id;
   trip_state:=case
    when registration_private.waiver_complete(p_trip,uid) then 'covered'
    when d.id is null then 'risks_pending'
    when trip_w.id is null then 'not_published'
    when not array_remove(d.activity_scope,'none')<@trip_w.activity_scope then 'out_of_scope'
    when registration_private.guardian_pending_signature(trip_w.id,uid) is not null then 'awaiting_review'
    when q.id is not null and q.waiver_id=trip_w.id and q.invite_sent_at is not null then 'waiting_for_guardian'
    when exists(select 1 from public.registration_waiver_withdrawals where signature_id=prior.id) then 'withdrawn'
    when prior.id is not null and prior.valid_until<registration_private.waiver_business_date(t.starts_at) and prior.waiver_id=trip_w.id then 'aged_out'
    when prior.id is not null and prior.valid_until<registration_private.waiver_business_date(t.starts_at) then 'expired'
    when prior.id is not null and prior.waiver_id<>trip_w.id then 'updated'
    else 'needs_signature' end;
  elsif s.trip_id is not null then trip_state:='legacy';
  end if;
 end if;
 return jsonb_build_object(
  'minor',registration_private.is_minor(uid),
  'guardian',case when c.id is null then null else jsonb_build_object('name',c.full_name,'email',c.email,'phone',c.phone,
   'relationship',c.relationship,'emailVerifiedAt',c.email_verified_at,'officerVerifiedAt',c.officer_verified_at) end,
  'request',case when q.id is null then null else jsonb_build_object('id',q.id,'inviteSentAt',q.invite_sent_at,'inviteCount',q.invite_count,
   'invitedEmail',(select email from public.guardian_contacts where id=q.contact_id),
   'nextInviteAt',case when q.invite_sent_at is null then null else q.invite_sent_at+interval '10 minutes' end,
   'needsMembership',q.needs_membership,'needsWaiver',q.waiver_id is not null) end,
  'lastOutcome',case when last_q.id is null then null else jsonb_build_object('status',last_q.status,'completedAt',last_q.completed_at,
   'decision',decision.decision,'reason',decision.reason,'decidedAt',decision.created_at,'basis',decision.basis) end,
  'membership',membership_state,
  'waiver',jsonb_build_object('state',waiver_state,'current',case when w.id is null then null else jsonb_build_object('id',w.id,'title',w.title,
   'version',w.version,'from',w.effective_from,'until',w.effective_until,'activities',w.activity_scope) end,
   'validUntil',signature.valid_until,'signedAt',signature.signed_at,'signerKind',signature.signer_kind,'signerName',signature.signature_name),
  'trip',trip_state,
  'tripCoverage',case when trip_w.id is null then null else jsonb_build_object('from',trip_w.effective_from,'until',trip_w.effective_until,'activities',trip_w.activity_scope) end);
end $$;

create or replace function public.guardian_get_request(p_token_hash text,p_session_hash text default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare q public.guardian_requests; c public.guardian_contacts; w public.registration_waivers; verified text; delivery text; previous public.registration_signatures;
 participant text; trip jsonb; allow_prefill boolean; sig public.registration_signatures; consent public.guardian_consents; begin
 if auth.role()<>'service_role' then raise exception 'Server access required.'; end if;
 select * into q from registration_private.guardian_request_for_token(p_token_hash);
 if q.id is null then return jsonb_build_object('state','invalid'); end if;
 select t.delivery into delivery from public.guardian_request_tokens t where t.token_hash=p_token_hash;
 select * into c from public.guardian_contacts where id=coalesce(q.signed_contact_id,q.contact_id);
 select * into w from public.registration_waivers where id=q.waiver_id;
 select * into sig from public.registration_signatures where id=q.signature_id;
 select * into consent from public.guardian_consents where id=q.consent_id;
 verified:=registration_private.guardian_session_email(q.id,p_session_hash);
 participant:=coalesce((select nullif(trim(display_name),'') from public.profiles where user_id=q.participant_id),'The participant');
 select jsonb_build_object('id',t.id,'title',t.title,'startsAt',t.starts_at,'timeZone',t.time_zone) into trip from public.trips t where t.id=q.trip_id
 and public.can_view_trip(t.id,registration_private.guardian_account(q.participant_id));
 allow_prefill := q.status='open' and verified=c.email and c.officer_verified_at is not null
   and c.superseded_at is null;
 if allow_prefill then
  select s.* into previous from public.registration_signatures s
  where s.signer_kind='guardian' and s.user_id=q.participant_id
  and s.signer_details->>'guardianContactId'=c.id::text
  and registration_private.guardian_signature_approved(s.id)
  and s.signer_details ? 'participant' order by s.signed_at desc limit 1;
 end if;
 return jsonb_build_object(
  'state',case when q.status='open' then 'open' when q.status='signed' then 'signed' when q.status='declined' then 'declined' else 'closed' end,
  'requestId',q.id,'delivery',delivery,'participantName',participant,'trip',trip,
  'verifiedEmail',verified,
  'guardian',case when c.id is null then null else jsonb_build_object('name',c.full_name,'email',c.email,'phone',case when verified=c.email then c.phone end,'relationship',c.relationship,
   'emailVerified',c.email_verified_at is not null) end,
  'membership',case when q.needs_membership then jsonb_build_object('version',1,'body',registration_private.membership_consent_document(1)) end,
  'waiver',case when w.id is null then null else jsonb_build_object('id',w.id,'title',w.title,'version',w.version,'body',w.body,'sourceUrl',w.source_url,
   'from',w.effective_from,'until',w.effective_until,'activities',w.activity_scope) end,
  'prefill',case when allow_prefill is distinct from true then null else jsonb_build_object(
   'participant',coalesce(previous.signer_details->'participant','{}'),
   'emergencyContact',coalesce((select emergency_contact from public.profile_private where user_id=q.participant_id),previous.signer_details->'emergencyContact','{}')) end,
  'signed',case when q.status<>'signed' then null else jsonb_build_object('at',q.completed_at,'name',coalesce(sig.signature_name,consent.signature_name),
   'validFrom',sig.valid_from,'validUntil',sig.valid_until,'withdrawn',exists(select 1 from public.guardian_withdrawals where request_id=q.id),
   'withdrawnAt',(select created_at from public.guardian_withdrawals where request_id=q.id),
   'decision',registration_private.guardian_review_decision(q.id)) end);
end $$;

create or replace function public.guardian_start_verification(p_token_hash text,p_email text,p_code_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; v_email text:=lower(trim(p_email)); code uuid; recent integer; signed_email text; begin
 if auth.role()<>'service_role' then raise exception 'Server access required.'; end if;
 select * into q from registration_private.guardian_request_for_token(p_token_hash);
 if q.id is null or q.status not in ('open','signed') then raise exception 'This signing link is no longer active. Ask the participant to send a new one.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('guardian-request:'||q.id,0));
 if coalesce(v_email,'') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email)>320 then raise exception 'Enter a valid email address.'; end if;
 if p_code_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid verification request.'; end if;
 if q.status='signed' then
  select c.email into signed_email from public.guardian_contacts c where c.id=q.signed_contact_id;
  if v_email is distinct from signed_email then raise exception 'Use the email address you signed with.'; end if;
 end if;
 if q.status='open' and exists(
  select 1 from public.guardian_request_tokens t
  join public.guardian_contacts invited on invited.id=t.invited_contact_id
  where t.token_hash=p_token_hash and t.delivery='email' and invited.email<>v_email
 ) then raise exception 'Use the email address that received this invitation.'; end if;
 if v_email=(select lower(u.email) from auth.users u where u.id=registration_private.guardian_account(q.participant_id)) then raise exception 'Use the parent or guardian''s own email, not the participant''s.'; end if;
 if exists(select 1 from public.guardian_email_codes where request_id=q.id and created_at>now()-interval '45 seconds') then
  raise exception 'A code was just sent. Wait a moment before asking for another.'; end if;
 select count(*) into recent from public.guardian_email_codes where request_id=q.id and created_at>now()-interval '1 hour';
 if recent>=5 then raise exception 'Too many codes requested. Try again in an hour or contact the club.'; end if;
 insert into public.guardian_email_codes(request_id,email,code_hash,expires_at) values(q.id,v_email,p_code_hash,now()+interval '10 minutes') returning id into code;
 return jsonb_build_object('email',v_email,'participantName',coalesce((select nullif(trim(display_name),'') from public.profiles where user_id=q.participant_id),'The participant'));
end $$;

create or replace function public.guardian_sign(p_token_hash text,p_session_hash text,p_record_token_hash text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; v_email text; c public.guardian_contacts; w public.registration_waivers; g jsonb:=p_data->'guardian';
 p jsonb:=p_data->'participant'; e jsonb:=p_data->'emergencyContact'; v_name text; v_relationship text; v_phone text; birth date;
 v_signature uuid; v_consent uuid; v_evidence jsonb; session public.guardian_sessions; auto boolean:=false; v_until date; special boolean; begin
 if auth.role()<>'service_role' then raise exception 'Server access required.'; end if;
 select * into q from registration_private.guardian_request_for_token(p_token_hash);
 if q.id is null then raise exception 'This signing link is no longer active. Ask the participant to send a new one.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||q.participant_id,0));
 perform pg_advisory_xact_lock(hashtextextended('annual-waiver-publication',0));
 select * into q from public.guardian_requests where id=q.id for update;
 if q.status='signed' then return jsonb_build_object('requestId',q.id,'duplicate',true); end if;
 if q.status<>'open' then raise exception 'This request was closed. Ask the participant to send a new one.'; end if;
 select * into session from public.guardian_sessions where request_id=q.id and session_hash=p_session_hash and expires_at>now();
 if session.session_hash is null then raise exception 'Verify your email again before signing.'; end if;
 v_email:=session.email;
 if not exists(select 1 from registration_private.guardian_request_for_token(p_token_hash) r where r.id=q.id) then
  raise exception 'This signing link is no longer active. Ask the participant to send a new one.';
 end if;
 if exists (
  select 1 from public.guardian_request_tokens t join public.guardian_contacts invited on invited.id=t.invited_contact_id
  where t.token_hash=p_token_hash and t.delivery='email' and invited.email<>v_email
 ) then raise exception 'Use the email address that received this invitation.'; end if;
 if coalesce(p_record_token_hash,'') !~ '^[0-9a-f]{64}$' then raise exception 'Invalid signing request.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>16000 then raise exception 'Invalid signing details.'; end if;
 v_name:=regexp_replace(trim(g->>'name'),'\s+',' ','g'); v_relationship:=trim(g->>'relationship'); v_phone:=nullif(trim(g->>'phone'),'');
 special:=coalesce((g->'special')='true'::jsonb,false);
 if coalesce(length(v_name),0) not between 2 and 200 or coalesce(length(v_relationship),0) not between 2 and 80
 or coalesce(length(v_phone),0) not between 7 and 50 then raise exception 'Enter your full legal name, relationship, and phone number.'; end if;
 if g->'authority' is distinct from 'true'::jsonb then raise exception 'Confirm that you are the participant''s parent or legal guardian and may sign for them.'; end if;
 if coalesce(length(trim(p_data->>'signatureName')),0) not between 2 and 200 then raise exception 'Type your full name as your signature.'; end if;
 if lower(regexp_replace(trim(p_data->>'signatureName'),'\s+',' ','g'))<>lower(v_name) then raise exception 'Your signature must match the full legal name you entered.'; end if;
 if q.waiver_id is not null then
  select * into w from public.registration_waivers where id=q.waiver_id;
  if w.id is null or not exists(select 1 from public.registration_waiver_publications where waiver_id=w.id)
  or w.effective_until<registration_private.waiver_today() then raise exception 'The waiver changed while this request was open. Ask the participant for a new link.'; end if;
  if p_data->>'waiverId' is distinct from w.id::text or p_data->'waiverAgreed' is distinct from 'true'::jsonb then raise exception 'Read and agree to the current waiver.'; end if;
  if coalesce(p->>'birthDate','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Enter the participant''s date of birth.'; end if;
  birth:=(p->>'birthDate')::date;
  if birth<=registration_private.waiver_today()-interval '18 years' or birth>registration_private.waiver_today()-interval '5 years' then
   raise exception 'Guardian signing is for participants under 18. Check the date of birth.'; end if;
  if coalesce(length(trim(p->>'address')),0) not between 5 and 500 then raise exception 'Enter the participant''s local address.'; end if;
  if coalesce(length(trim(e->>'name')),0) not between 2 and 200 or coalesce(length(trim(e->>'phone')),0) not between 7 and 50
  or coalesce(length(trim(e->>'relationship')),0) not between 1 and 200 or coalesce(length(trim(e->>'address')),0) not between 5 and 500
  or length(coalesce(e->>'notes',''))>1000 then raise exception 'Complete the emergency contact name, relationship, phone, and address.'; end if;
  if jsonb_typeof(p_data->'initials') is distinct from 'array' or jsonb_array_length(p_data->'initials')<>7
  or exists(select 1 from jsonb_array_elements(p_data->'initials') x where jsonb_typeof(x)<>'string' or length(trim(x #>> '{}')) not between 1 and 10) then
   raise exception 'Initial each of the seven waiver provisions.'; end if;
 end if;
 if q.needs_membership and p_data->'membershipAgreed' is distinct from 'true'::jsonb then raise exception 'Agree to the membership permission.'; end if;
 -- Contact: same person and relationship keeps prior verification; any identity change is a new guardian.
 select * into c from public.guardian_contacts where participant_id=q.participant_id and superseded_at is null for update;
 if c.id is null or (c.email,c.full_name,c.relationship) is distinct from (v_email,v_name,v_relationship) then
  update public.guardian_contacts set superseded_at=clock_timestamp() where id=c.id;
  insert into public.guardian_contacts(participant_id,full_name,email,relationship,phone,created_by,email_verified_at)
  values(q.participant_id,v_name,v_email,v_relationship,v_phone,'guardian',clock_timestamp()) returning * into c;
  update public.guardian_contacts set superseded_by=c.id where participant_id=q.participant_id and superseded_at is not null and superseded_by is null and id<>c.id;
 else
  update public.guardian_contacts set phone=v_phone,email_verified_at=clock_timestamp() where id=c.id returning * into c;
 end if;
 v_evidence:=jsonb_build_object('method','email_code','verifiedEmail',v_email,'codeId',session.code_id,'emailVerifiedAt',
  (select verified_at from public.guardian_email_codes where id=session.code_id),'delivery',(select delivery from public.guardian_request_tokens where token_hash=p_token_hash),
  'userAgent',left(coalesce(p_data->>'userAgent',''),500),'ipHash',left(coalesce(p_data->>'ipHash',''),64),'requestId',q.id,
  'guardianContactId',c.id,'relationship',v_relationship,'authorityDeclared',true,'specialArrangement',special,
  'specialNote',left(coalesce(g->>'specialNote',''),1000));
 if q.needs_membership then
  insert into public.guardian_consents(request_id,participant_id,contact_id,kind,document_version,document_body,signature_name,evidence)
  values(q.id,q.participant_id,c.id,'membership',1,registration_private.membership_consent_document(1),v_name,v_evidence) returning id into v_consent;
 end if;
 if q.waiver_id is not null then
  v_until:=least(w.effective_until,(birth+interval '18 years'-interval '1 day')::date);
  insert into public.registration_signatures(user_id,original_signer_id,waiver_id,signature_name,signer_kind,signer_details,valid_from,valid_until)
  values(q.participant_id,q.participant_id,w.id,v_name,'guardian',v_evidence||jsonb_build_object(
   'guardianName',v_name,'guardianEmail',v_email,'guardianPhone',v_phone,'initials',p_data->'initials',
   'participant',jsonb_build_object('name',coalesce((select display_name from public.profiles where user_id=q.participant_id),''),'birthDate',p->>'birthDate','address',trim(p->>'address')),
   'emergencyContact',jsonb_build_object('name',trim(e->>'name'),'relationship',trim(e->>'relationship'),'phone',trim(e->>'phone'),'address',trim(e->>'address'),'notes',coalesce(e->>'notes','')),
   'sourceTemplate','UNLV RSO Liability Waiver Template, August 2022'),
   greatest(w.effective_from,registration_private.waiver_today()),v_until) returning id into v_signature;
 end if;
 update public.guardian_requests set status='signed',completed_at=clock_timestamp(),signed_contact_id=c.id,signature_id=v_signature,consent_id=v_consent,
  special_arrangement=special where id=q.id;
 -- A long-lived link lets the guardian get a copy or withdraw later (always behind a fresh code).
 insert into public.guardian_request_tokens(token_hash,request_id,delivery,expires_at)
 values(p_record_token_hash,q.id,'record',greatest(coalesce(v_until::timestamptz+interval '1 day',now()+interval '1 year'),now()+interval '30 days'));
 -- Reuse an officer's earlier review of this same unchanged guardian.
 auto:=c.officer_verified_at is not null and not special;
 if auto then
  insert into public.guardian_reviews(request_id,decision,basis,identity_checked) values(q.id,'approved','prior_verification',false);
  perform registration_private.apply_guardian_approval(q.id,null);
 end if;
 delete from public.guardian_sessions where request_id=q.id;
 return jsonb_build_object('requestId',q.id,'autoApproved',auto,'participantId',q.participant_id,'validUntil',v_until,
  'participantEmail',(select u.email from auth.users u where u.id=q.participant_id),'guardianEmail',v_email,'guardianName',v_name,
  'participantName',coalesce((select nullif(trim(display_name),'') from public.profiles where user_id=q.participant_id),'The participant'));
end $$;

create or replace function registration_private.apply_guardian_approval(p_request uuid,p_reviewer uuid) returns void
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; participant uuid; contact jsonb; begin
 select * into q from public.guardian_requests where id=p_request;
 participant:=registration_private.guardian_account(q.participant_id);
 if not exists(select 1 from auth.users u where u.id=participant and u.deleted_at is null) then return; end if;
 if q.signature_id is not null then
  select (s.signer_details->'emergencyContact') - 'address' into contact
    from public.registration_signatures s where s.id=q.signature_id;
  if contact is not null then
   insert into public.profile_private(user_id,emergency_contact) values(participant,contact)
   on conflict(user_id) do update set emergency_contact=excluded.emergency_contact
   where public.profile_private.emergency_contact is null
     or public.profile_private.emergency_contact='{}'::jsonb;
  end if;
 end if;
 if q.consent_id is not null then
  update public.membership_applications set guardian_consent='confirmed',updated_at=now()
  where user_id=participant and age_status='minor' and status='submitted' and guardian_consent='pending';
  if found then
   perform public.activate_confirmed_zelle_membership(participant);
   insert into public.admin_activity_events(actor_user_id,subject_user_id,action,resource_type,resource_id,summary)
   values(p_reviewer,participant,'guardian_consent_confirmed','membership_application',q.participant_id::text,
   case when p_reviewer is null then 'Guardian e-signature accepted using a previous officer verification.' else 'Guardian e-signature approved.' end);
  end if;
 end if;
end $$;

-- Pause access after withdrawal while preserving paid terms and signed evidence.
create function registration_private.pause_withdrawn_membership(p_request uuid)
returns void language plpgsql set search_path='' as $$
declare q public.guardian_requests; participant uuid;
begin
  select * into q from public.guardian_requests where id=p_request;
  if q.consent_id is null or registration_private.guardian_review_decision(q.id) is distinct from 'approved' then
    return;
  end if;
  participant:=registration_private.guardian_account(q.participant_id);
  if exists (
    select 1 from public.guardian_requests later
    where registration_private.owns_record(participant,later.participant_id)
      and later.consent_id is not null and (later.completed_at,later.id)>(q.completed_at,q.id)
      and registration_private.guardian_review_decision(later.id)='approved'
      and not exists(select 1 from public.guardian_withdrawals w where w.request_id=later.id)
  ) then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(participant::text,0));
  update public.membership_applications
    set guardian_consent='pending',
        status=case when status='confirmed' then 'submitted'::public.membership_application_status else status end,
        confirmed_at=null, confirmed_by=null, membership_access_override_id=null
    where user_id=participant and age_status='minor' and guardian_consent='confirmed';
end $$;
revoke all on function registration_private.pause_withdrawn_membership(uuid)
  from public, anon, authenticated, service_role;


create or replace function public.guardian_withdraw(p_token_hash text,p_session_hash text,p_note text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; participant uuid; begin
 if auth.role()<>'service_role' then raise exception 'Server access required.'; end if;
 select * into q from registration_private.guardian_request_for_token(p_token_hash);
 if q.id is null or q.status<>'signed' then raise exception 'There is no signed permission on this link.'; end if;
 if registration_private.guardian_session_email(q.id,p_session_hash) is null then raise exception 'Verify your email again first.'; end if;
 participant:=registration_private.guardian_account(q.participant_id);
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||participant,0));
 if exists(select 1 from public.guardian_withdrawals where request_id=q.id) then return jsonb_build_object('duplicate',true); end if;
 insert into public.guardian_withdrawals(request_id,participant_id,contact_id,note) values(q.id,q.participant_id,q.signed_contact_id,left(nullif(trim(p_note),''),1000));
 if q.signature_id is not null then
  insert into public.registration_waiver_withdrawals(signature_id,withdrawn_by) values(q.signature_id,q.participant_id) on conflict do nothing;
 end if;
 perform registration_private.pause_withdrawn_membership(q.id);
 delete from public.guardian_sessions where request_id=q.id;
 return jsonb_build_object('participantEmail',(select email from auth.users where id=participant),'membership',q.consent_id is not null);
end $$;

do $$
declare request uuid;
begin
  for request in select w.request_id from public.guardian_withdrawals w
    join public.guardian_requests q on q.id=w.request_id where q.consent_id is not null
  loop
    perform registration_private.pause_withdrawn_membership(request);
  end loop;
end $$;

create or replace function public.has_membership_access(p_uid uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select p_uid is not null
    and not exists (
      select 1 from public.membership_account_restrictions r
      where r.user_id=p_uid and r.restriction<>'normal'
    )
    and not exists (
      select 1 from public.membership_applications a
      where a.user_id=p_uid and a.age_status='minor' and a.guardian_consent='pending'
    )
    and (
      exists (select 1 from public.membership_entitlements e
        where e.user_id=p_uid and e.revoked_at is null and e.starts_at<=now() and e.ends_at>now())
      or exists (select 1 from public.membership_access_overrides o
        where o.user_id=p_uid and o.revoked_at is null and o.starts_at<=now()
          and (o.ends_at is null or o.ends_at>now()))
    );
$$;


create or replace function public.get_my_membership_access()
returns table (
  restriction text,
  access_active boolean,
  provisional_access boolean,
  expires_at timestamptz,
  override_active boolean
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with account as (
    select coalesce(
      (
        select restrictions.restriction
        from public.membership_account_restrictions restrictions
        where restrictions.user_id = auth.uid()
      ),
      'normal'::public.membership_restriction
    ) as restriction
  ), entitlement as (
    select max(ends_at) as expires_at
    from public.membership_entitlements
    where user_id = auth.uid()
      and revoked_at is null
      and starts_at <= now()
      and ends_at > now()
  ), access_override as (
    select exists (
      select 1
      from public.membership_access_overrides
      where user_id = auth.uid()
        and revoked_at is null
        and starts_at <= now()
        and (ends_at is null or ends_at > now())
    ) as is_active
  )
  select
    account.restriction::text,
    public.has_membership_access(auth.uid()),
    account.restriction = 'normal'
      and public.has_provisional_membership_access(),
    case when public.has_membership_access(auth.uid()) then entitlement.expires_at end,
    public.has_membership_access(auth.uid()) and access_override.is_active
  from account, entitlement, access_override;
$$;

create or replace function public.merge_accounts(
  p_actor uuid, p_primary uuid, p_secondary uuid, p_dry_run boolean default true
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
  item record;
  n bigint;
  counts jsonb := '{}';
  snapshot jsonb := '{}';
  left_row jsonb;
  right_row jsonb;
  merged jsonb;
  assignments text;
  existing public.account_merge_jobs;
begin
  if p_primary is null or p_secondary is null or p_primary=p_secondary then
    raise exception 'Choose two different accounts.' using errcode='22023';
  end if;
  if p_actor is null or not public.has_admin_capability(p_actor,'accounts.update') then
    raise exception 'Account management permission required.' using errcode='42501';
  end if;
  -- Match the existing registration/preference command lock order.
  for uid in select u from unnest(array[p_primary,p_secondary]) u order by u loop
    perform pg_advisory_xact_lock(hashtextextended('email-preferences:'||uid,0));
  end loop;
  for uid in select u from unnest(array[p_primary,p_secondary]) u order by u loop
    perform pg_advisory_xact_lock(hashtextextended('registration-account:'||uid,0));
  end loop;
  perform id from auth.users where id in (p_primary,p_secondary) order by id for update;
  if exists(select 1 from public.registration_account_merges where secondary_id=p_primary) then
    raise exception 'The primary account was already merged. Use its retained account.' using errcode='22023';
  end if;
  select * into existing from public.account_merge_jobs where secondary_user_id=p_secondary for update;
  if found then
    if existing.primary_user_id<>p_primary then
      raise exception 'This secondary account was merged into a different account. Use the recorded primary account.' using errcode='22023';
    end if;
    return jsonb_build_object('counts',existing.counts,'status',existing.status,'resumed',true);
  end if;
  if (select count(*) from auth.users where id in (p_primary,p_secondary))<>2 then
    raise exception 'An account was not found. Refresh the account list and select two existing accounts.' using errcode='22023';
  end if;
  -- Even inactive/suspended officers must have roles explicitly removed first.
  perform user_id from public.memberships where user_id in (p_primary,p_secondary) order by user_id for update;
  if exists(select 1 from public.admin_user_roles where user_id=p_secondary)
    or exists(select 1 from public.memberships where user_id=p_secondary and role<>'regular') then
    raise exception 'The secondary account holds a privileged role. Remove its roles before merging, or retain that account as primary.' using errcode='22023';
  end if;
  if exists(select 1 from public.account_deletion_jobs where user_id in (p_primary,p_secondary)) then
    raise exception 'An account has an account-deletion job. Resolve the deletion job before merging.' using errcode='22023';
  end if;
  if exists(select 1 from public.account_merge_jobs where primary_user_id in (p_primary,p_secondary) and status='pending_auth_delete') then
    raise exception 'Finish the pending auth cleanup for these accounts before starting another merge.' using errcode='22023';
  end if;

  -- Inventory includes every application FK to auth.users/profiles, composite
  -- registration ownership, plus UUID provenance columns without FKs. Immutable
  -- history/provenance stays under the original UUID and the durable alias map.
  for item in select * from (values
    ('profiles','user_id'),('profile_private','user_id'),('memberships','user_id'),
    ('membership_applications','user_id'),('membership_applications','confirmed_by'),
    ('membership_account_restrictions','user_id'),('membership_account_restrictions','updated_by'),
    ('user_preferences','user_id'),('account_age_declarations','user_id'),
    ('mailing_list_subscriptions','user_id'),('mailing_list_consent_events','user_id'),
    ('profile_email_consent_events','user_id'),('membership_checkout_attempts','user_id'),
    ('membership_payments','user_id'),('membership_zelle_payments','user_id'),('membership_zelle_payments','reviewed_by'),
    ('membership_entitlements','user_id'),('membership_access_overrides','user_id'),
    ('membership_access_overrides','granted_by'),('membership_access_overrides','revoked_by'),
    ('membership_review_items','user_id'),('membership_review_items','reviewed_by'),
    ('trips','created_by'),('trips','canceled_by'),('trip_drafts','created_by'),
    ('trip_leaders','user_id'),('trip_rsvps','user_id'),('trip_favorites','user_id'),
    ('trip_attendance','user_id'),('trip_carpools','user_id'),('trip_comments','user_id'),('trip_update_followers','user_id'),
    ('user_interests','user_id'),('user_waivers','user_id'),
    ('registration_responses','user_id'),('registration_offers','user_id'),('registration_offers','issued_by'),
    ('registration_guardian_reviews','user_id'),('registration_guardian_reviews','reviewer_id'),
    ('registration_notifications','user_id'),('registration_signatures','user_id'),('registration_signatures','original_signer_id'),
    ('registration_guardian_evidence','user_id'),('registration_guardian_evidence','reviewer_id'),
    ('registration_annual_guardian_requests','user_id'),('registration_risk_acknowledgements','user_id'),
    ('registration_events','user_id'),('registration_events','actor_id'),('registration_requests','actor_id'),
    ('registration_waiver_requests','actor_id'),('registration_waiver_publications','published_by'),
    ('registration_waiver_withdrawals','withdrawn_by'),('registration_risk_disclosures','created_by'),
    ('gallery_photos','uploaded_by'),('announcements','created_by'),('announcements','updated_by'),
    ('club_hosts','linked_user_id'),('club_admin_settings','updated_by'),('schedule_review_items','reviewed_by'),
    ('admin_user_roles','user_id'),('admin_user_roles','assigned_by'),('admin_activity_events','actor_user_id'),('admin_activity_events','subject_user_id'),
    ('registration_account_merges','primary_id'),('registration_account_merges','secondary_id'),
    ('account_deletion_jobs','user_id'),('account_deletion_jobs','requested_by'),
    ('guardian_contacts','participant_id'),('guardian_requests','participant_id'),
    ('guardian_consents','participant_id'),('guardian_withdrawals','participant_id')
  ) inventory(table_name,column_name) loop
    execute format('select count(*) from public.%I where %I=$1',item.table_name,item.column_name) into n using p_secondary;
    counts:=counts||jsonb_build_object('secondary_'||item.table_name||'_'||item.column_name,n);
  end loop;
  select count(*) into n from trip_write_private.draft_publications where draft_owner_id=p_secondary;
  counts:=counts||jsonb_build_object('secondary_draft_publications_draft_owner_id',n);
  select count(*) into n from trip_write_private.draft_publications where published_by=p_secondary;
  counts:=counts||jsonb_build_object('secondary_draft_publications_published_by',n);
  for item in select c.relname as table_name,a.attname as column_name from pg_attribute a
    join pg_class c on c.oid=a.attrelid join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='storage' and c.relname in ('objects','buckets') and c.relkind in ('r','p')
      and a.attname in ('owner','owner_id') and not a.attisdropped loop
    execute format('select count(*) from storage.%I where %I::text=$1',item.table_name,item.column_name) into n using p_secondary::text;
    counts:=counts||jsonb_build_object('secondary_storage_'||item.table_name||'_'||item.column_name,n);
  end loop;
  if p_dry_run is distinct from false then
    return jsonb_build_object('counts',counts,'status','preview','resumed',false);
  end if;

  -- Snapshot every row that can be coalesced/discarded, before registration merge.
  for item in select unnest(array['profiles','profile_private','memberships','membership_applications',
    'membership_account_restrictions','user_preferences','account_age_declarations','mailing_list_subscriptions',
    'trip_rsvps','trip_attendance','registration_responses','registration_guardian_reviews',
    'trip_leaders','trip_favorites','trip_update_followers','user_interests','user_waivers']) as table_name loop
    execute format('select user_id from public.%I where user_id in ($1,$2) order by user_id for update',item.table_name) using p_primary,p_secondary;
    execute format('select coalesce(jsonb_agg(to_jsonb(t)),''[]'') from public.%I t where user_id=$1',item.table_name)
      into right_row using p_secondary;
    snapshot:=snapshot||jsonb_build_object(item.table_name,right_row);
  end loop;

  -- Receipts confer retry/read access and have UUID owners without auth FKs.
  -- Archive original attribution before transferring that access to the primary.
  perform draft_id from trip_write_private.draft_publications
    where draft_owner_id in (p_primary,p_secondary) or published_by in (p_primary,p_secondary)
    order by draft_id for update;
  select coalesce(jsonb_agg(to_jsonb(r)), '[]') into right_row
    from trip_write_private.draft_publications r
    where draft_owner_id=p_secondary or published_by=p_secondary;
  snapshot:=snapshot||jsonb_build_object('draft_publications',right_row);

  -- Null profile fields inherit secondary values; keep primary values otherwise.
  -- Whole application/restriction records keep their consistency constraints.
  for item in select unnest(array['profiles','profile_private','memberships','membership_applications',
    'membership_account_restrictions','user_preferences','mailing_list_subscriptions']) as table_name loop
    execute format('select to_jsonb(t) from public.%I t where user_id=$1',item.table_name) into left_row using p_primary;
    execute format('select to_jsonb(t) from public.%I t where user_id=$1',item.table_name) into right_row using p_secondary;
    if right_row is null then continue; end if;
    merged:=right_row||coalesce(jsonb_strip_nulls(left_row),'{}')||jsonb_build_object('user_id',p_primary);
    if item.table_name='profile_private' then
      merged:=merged||jsonb_build_object('notification_settings',coalesce(nullif(right_row->'notification_settings','null'::jsonb),'{}')||coalesce(nullif(left_row->'notification_settings','null'::jsonb),'{}'));
      -- The registration merge below combines all effective category opt-outs.
    elsif item.table_name='memberships' then
      if left_row->>'status'='banned' or right_row->>'status'='banned' then
        merged:=merged||'{"status":"banned"}';
      elsif left_row->>'status'='suspended' or right_row->>'status'='suspended' then
        merged:=merged||'{"status":"suspended"}';
      end if;
    elsif item.table_name='membership_applications' then
      merged:=coalesce(left_row,right_row)||jsonb_build_object('user_id',p_primary);
      if left_row is not null and (left_row->>'age_status'='minor' or right_row->>'age_status'='minor') then
        merged:=merged||'{"age_status":"minor","guardian_consent":"pending","status":"submitted","confirmed_at":null,"confirmed_by":null,"membership_access_override_id":null}';
      end if;
    elsif item.table_name='membership_account_restrictions' then
      if array_position(array['normal','suspended','banned'],coalesce(left_row->>'restriction','normal'))
        >array_position(array['normal','suspended','banned'],right_row->>'restriction') then
        merged:=left_row;
      else merged:=right_row; end if;
      merged:=merged||jsonb_build_object('user_id',p_primary);
    elsif item.table_name='user_preferences' then
      merged:=merged||jsonb_build_object('trip_email_notifications',
        coalesce((left_row->>'trip_email_notifications')::boolean,true) and (right_row->>'trip_email_notifications')::boolean);
    elsif item.table_name='mailing_list_subscriptions' then
      -- Consent belongs to an email address: never opt the retained address in.
      merged:=merged||jsonb_build_object('email',coalesce((select email from auth.users where id=p_primary),left_row->>'email',right_row->>'email'),
        'subscribed',false,'subscribed_at',null,'unsubscribed_at',now());
    end if;
    if item.table_name='membership_applications' then
      -- membership_access_override_id is unique: release the source row's
      -- reference before the retained row takes it over.
      update public.membership_applications set membership_access_override_id=null
        where user_id=p_secondary and membership_access_override_id is not null;
    end if;
    select string_agg(format('%I=excluded.%I',attname,attname),',') into assignments
      from pg_attribute where attrelid=format('public.%I',item.table_name)::regclass and attnum>0 and not attisdropped and attname<>'user_id';
    execute format('insert into public.%1$I select * from jsonb_populate_record(null::public.%1$I,$1) on conflict(user_id) do update set %2$s',item.table_name,assignments) using merged;
  end loop;

  -- Preserve opt-outs before the helper reads either private row (the primary's
  -- coalescing above must not erase an opt-out from its original settings).
  update public.profile_private set notification_settings=coalesce(notification_settings,'{}')||
    coalesce((select jsonb_object_agg(prefs.key,prefs.value) from jsonb_array_elements(snapshot->'profile_private') row_data,
      lateral jsonb_each(coalesce(nullif(row_data->'notification_settings','null'::jsonb),'{}')) prefs where prefs.value='false'::jsonb),'{}')
  where user_id=p_primary;
  -- Colliding mutable forms/check-ins deterministically retain the primary's
  -- values. The exact secondary rows were archived above; signed evidence is
  -- never changed. Normalize before the legacy registration helper's checks.
  update public.registration_responses s set form_version=p.form_version,answers=p.answers,emergency_contact=p.emergency_contact
    from public.registration_responses p where s.user_id=p_secondary and p.user_id=p_primary and s.trip_id=p.trip_id
      and (s.form_version,s.answers,s.emergency_contact) is distinct from (p.form_version,p.answers,p.emergency_contact);
  update public.trip_attendance s set attended=p.attended from public.trip_attendance p
    where s.user_id=p_secondary and p.user_id=p_primary and s.trip_id=p.trip_id
      and p.attended is not null and s.attended is not null and p.attended<>s.attended;
  -- The registration helper records the merge alias before expiring offers, and
  -- expiry notifies the offer's owner. Expire the secondary's overdue offers
  -- first (trips locked in id order, as every expiry caller does), so no
  -- notification is created for an already-aliased account.
  for item in select distinct o.trip_id from public.registration_offers o
      where o.user_id=p_secondary and o.status='pending' and o.expires_at<=clock_timestamp()
      order by o.trip_id loop
    perform 1 from public.trips where id=item.trip_id for update;
    perform registration_private.expire_offers(item.trip_id);
  end loop;
  perform public.merge_trip_registrations(p_primary,p_secondary);

  -- Partial unique keys: retain primary pending items; preserve the secondary
  -- records as reviewable history, without calling a payment provider.
  update public.membership_checkout_attempts set status='review_required',updated_at=now()
    where user_id=p_secondary and status='open'
    and exists(select 1 from public.membership_checkout_attempts where user_id=p_primary and status='open');
  update public.membership_zelle_payments set status='rejected',reviewed_at=now(),reviewed_by=p_actor,
    internal_note=concat_ws(E'\n',internal_note,'Account merge: duplicate pending claim; review retained payment history.'),updated_at=now()
    where user_id=p_secondary and status='claimed'
    and exists(select 1 from public.membership_zelle_payments where user_id=p_primary and status='claimed');

  insert into public.trip_leaders(trip_id,user_id,created_at) select trip_id,p_primary,created_at from public.trip_leaders where user_id=p_secondary on conflict do nothing;
  insert into public.trip_update_followers(trip_id,user_id,created_at) select trip_id,p_primary,created_at from public.trip_update_followers where user_id=p_secondary on conflict do nothing;
  insert into public.trip_favorites(trip_id,user_id,created_at) select trip_id,p_primary,created_at from public.trip_favorites where user_id=p_secondary on conflict do nothing;
  insert into public.user_interests(user_id,activity_id,experience_level,created_at) select p_primary,activity_id,experience_level,created_at from public.user_interests where user_id=p_secondary on conflict do nothing;
  -- Legacy waiver collisions keep the retained signature; the original is in the private snapshot.
  delete from public.user_waivers s using public.user_waivers p where s.user_id=p_secondary and p.user_id=p_primary and s.waiver_key=p.waiver_key and s.version=p.version;

  for item in select * from (values
    ('trip_drafts','created_by'),('trips','created_by'),('trips','canceled_by'),
    ('trip_carpools','user_id'),('trip_comments','user_id'),('user_waivers','user_id'),
    ('membership_checkout_attempts','user_id'),('membership_payments','user_id'),('membership_zelle_payments','user_id'),
    ('membership_zelle_payments','reviewed_by'),('membership_entitlements','user_id'),
    ('membership_access_overrides','user_id'),('membership_access_overrides','granted_by'),('membership_access_overrides','revoked_by'),
    ('membership_review_items','user_id'),('membership_review_items','reviewed_by'),('membership_applications','confirmed_by'),
    ('membership_account_restrictions','updated_by'),('mailing_list_consent_events','user_id'),
    ('gallery_photos','uploaded_by'),('announcements','created_by'),('announcements','updated_by'),
    ('club_hosts','linked_user_id'),('club_admin_settings','updated_by'),('schedule_review_items','reviewed_by'),
    ('admin_user_roles','assigned_by'),('admin_activity_events','actor_user_id'),('admin_activity_events','subject_user_id'),
    ('account_deletion_jobs','requested_by')
  ) transfer(table_name,column_name) loop
    execute format('update public.%I set %I=$1 where %I=$2',item.table_name,item.column_name,item.column_name) using p_primary,p_secondary;
  end loop;
  update trip_write_private.draft_publications
    set draft_owner_id=case when draft_owner_id=p_secondary then p_primary else draft_owner_id end,
        published_by=case when published_by=p_secondary then p_primary else published_by end
    where draft_owner_id=p_secondary or published_by=p_secondary;
  -- Storage metadata can also block auth deletion. Storage is absent in some
  -- local test installations; inspect only the two supported ownership columns.
  for item in select c.relname as table_name,a.attname as column_name from pg_attribute a
    join pg_class c on c.oid=a.attrelid join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='storage' and c.relname in ('objects','buckets') and c.relkind in ('r','p')
      and a.attname in ('owner','owner_id') and not a.attisdropped loop
    execute format('update storage.%I set %I=$1::%s where %I::text=$2',item.table_name,item.column_name,
      case when item.column_name='owner' then 'uuid' else 'text' end,item.column_name) using p_primary::text,p_secondary::text;
  end loop;

  -- All profile-owned drafts and mutable rows have moved before any deletion.
  for item in select unnest(array['trip_leaders','trip_favorites','trip_update_followers','user_interests','registration_guardian_reviews',
    'account_age_declarations','profile_private','memberships','membership_applications',
    'membership_account_restrictions','user_preferences','mailing_list_subscriptions']) as table_name loop
    execute format('delete from public.%I where user_id=$1',item.table_name) using p_secondary;
  end loop;
  -- Fail closed if a later schema addition introduces an unhandled owner FK;
  -- a cascade must never silently discard a newly introduced kind of data.
  for item in select c.conrelid::regclass as relation_name,a.attname as column_name
    from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.contype='f' and c.connamespace in ('public'::regnamespace,'trip_write_private'::regnamespace)
      and c.confrelid in ('auth.users'::regclass,'public.profiles'::regclass)
      and c.conrelid<>'public.profiles'::regclass loop
    execute format('select count(*) from %s where %I=$1',item.relation_name,item.column_name) into n using p_secondary;
    if n<>0 then
      raise exception 'Untransferred account data in %.%. Contact an administrator before retrying.',item.relation_name,item.column_name;
    end if;
  end loop;
  delete from public.profiles where user_id=p_secondary;
  update auth.users set banned_until=now()+interval '100 years' where id=p_secondary;
  delete from auth.sessions where user_id=p_secondary;
  insert into public.account_merge_jobs(secondary_user_id,primary_user_id,actor_user_id,counts,secondary_snapshot)
    values(p_secondary,p_primary,p_actor,counts,snapshot);
  insert into public.admin_activity_events(actor_user_id,subject_user_id,action,resource_type,resource_id,summary,before_data,after_data)
    values(p_actor,p_primary,'accounts.merge','account',p_primary::text,'Merged account; auth cleanup pending.',
      jsonb_build_object('secondaryUserId',p_secondary),jsonb_build_object('primaryUserId',p_primary,'counts',counts));
  return jsonb_build_object('counts',counts,'status','pending_auth_delete','resumed',false);
end $$;

create or replace function registration_private.membership_consent_pending(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.guardian_requests q where registration_private.owns_record(p_user,q.participant_id)
 and not exists(select 1 from public.guardian_withdrawals w where w.request_id=q.id)
 and q.status='signed' and q.consent_id is not null and registration_private.guardian_review_decision(q.id) is null);
$$;

create or replace function public.review_guardian_request(p_request uuid,p_decision text,p_reason text,p_identity_checked boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; reviewer uuid:=auth.uid(); participant uuid; begin
 if reviewer is null or registration_private.blocked(reviewer) or not public.has_admin_capability(reviewer,'membership.confirm_guardian') then
  raise exception 'Guardian review permission required.'; end if;
 if p_decision not in ('approved','rejected','clarification') then raise exception 'Choose approve, reject, or request information.'; end if;
 if p_decision<>'approved' and coalesce(length(trim(p_reason)),0) not between 5 and 2000 then raise exception 'Add a short reason the family will see.'; end if;
 select * into q from public.guardian_requests where id=p_request;
 if q.id is null or q.status<>'signed' then raise exception 'Signed request not found.'; end if;
 participant:=registration_private.guardian_account(q.participant_id);
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||participant,0));
 if registration_private.guardian_review_decision(q.id) in ('approved','rejected') then raise exception 'This request was already decided. Refresh the queue.'; end if;
 if exists(select 1 from public.guardian_withdrawals where request_id=q.id) then raise exception 'The guardian withdrew this permission.'; end if;
 insert into public.guardian_reviews(request_id,decision,basis,identity_checked,reason,reviewer_id)
 values(q.id,p_decision,'officer',coalesce(p_identity_checked,false) and p_decision='approved',nullif(trim(p_reason),''),reviewer);
 if p_decision='approved' then
  if coalesce(p_identity_checked,false) then
   update public.guardian_contacts set officer_verified_at=clock_timestamp(),officer_verified_by=reviewer where id=q.signed_contact_id;
  end if;
  perform registration_private.apply_guardian_approval(q.id,reviewer);
 end if;
 insert into public.admin_activity_events(actor_user_id,subject_user_id,action,resource_type,resource_id,summary)
 values(reviewer,participant,'guardian_request_'||p_decision,'guardian_request',q.id::text,
 case p_decision when 'approved' then 'Guardian e-signature approved.' when 'rejected' then 'Guardian e-signature rejected.' else 'More guardian information requested.' end);
 return jsonb_build_object('participantEmail',(select u.email from auth.users u where u.id=participant),
  'participantName',coalesce((select nullif(trim(display_name),'') from public.profiles where user_id=participant),'there'),
  'guardianEmail',(select c.email from public.guardian_contacts c where c.id=q.signed_contact_id));
end $$;

commit;
