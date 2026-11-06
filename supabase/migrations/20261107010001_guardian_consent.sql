-- Guardian consent without a guardian account.
--
-- A minor designates a parent or legal guardian. The guardian opens a secret link
-- (same device or email), proves access to their email with a one-time code, and
-- signs the membership permission and/or the current annual waiver. Electronic
-- guardian signatures count only after an officer approves them, or automatically
-- when the same, unchanged guardian was previously verified by an officer.
--
-- Records are append-only where they are evidence (consents, reviews, withdrawals,
-- signatures). Contact rows keep identity fields immutable; changing the guardian's
-- name, email, or relationship creates a new contact that needs its own review.
-- Token-side functions are callable only by the server (service_role). Secrets are
-- hashed by the server before they reach the database.
begin;

create table public.guardian_contacts (
 id uuid primary key default gen_random_uuid(),
 participant_id uuid not null references auth.users(id),
 full_name text not null check(length(trim(full_name)) between 2 and 200),
 email text not null check(length(email) between 5 and 320 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and email=lower(email)),
 phone text check(phone is null or length(trim(phone)) between 7 and 50),
 relationship text not null check(length(trim(relationship)) between 2 and 80),
 created_at timestamptz not null default clock_timestamp(),
 created_by text not null check(created_by in ('participant','guardian')),
 email_verified_at timestamptz,
 officer_verified_at timestamptz,
 officer_verified_by uuid,
 superseded_at timestamptz,
 superseded_by uuid references public.guardian_contacts(id)
);
create unique index guardian_contact_active on public.guardian_contacts(participant_id) where superseded_at is null;

create table public.guardian_requests (
 id uuid primary key default gen_random_uuid(),
 participant_id uuid not null references auth.users(id),
 contact_id uuid references public.guardian_contacts(id),
 trip_id uuid references public.trips(id),
 needs_membership boolean not null,
 waiver_id uuid references public.registration_waivers(id),
 created_at timestamptz not null default clock_timestamp(),
 status text not null default 'open' check(status in ('open','signed','declined','cancelled','superseded')),
 invite_sent_at timestamptz,
 invite_count integer not null default 0 check(invite_count between 0 and 5),
 completed_at timestamptz,
 signed_contact_id uuid references public.guardian_contacts(id),
 signature_id uuid references public.registration_signatures(id),
 consent_id uuid,
 special_arrangement boolean not null default false,
 decline_reason text check(decline_reason is null or length(decline_reason)<=1000),
 check(needs_membership or waiver_id is not null)
);
create unique index guardian_request_open on public.guardian_requests(participant_id) where status='open';
create index guardian_request_signature on public.guardian_requests(signature_id) where signature_id is not null;

create table public.guardian_request_tokens (
 token_hash text primary key check(token_hash ~ '^[0-9a-f]{64}$'),
 request_id uuid not null references public.guardian_requests(id),
 delivery text not null check(delivery in ('same_device','email','record')),
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null
);
create index guardian_token_request on public.guardian_request_tokens(request_id);

create table public.guardian_email_codes (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.guardian_requests(id),
 email text not null,
 code_hash text not null check(code_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null,
 attempts integer not null default 0,
 verified_at timestamptz
);
create index guardian_code_request on public.guardian_email_codes(request_id,created_at desc);

create table public.guardian_sessions (
 session_hash text primary key check(session_hash ~ '^[0-9a-f]{64}$'),
 request_id uuid not null references public.guardian_requests(id),
 code_id uuid not null references public.guardian_email_codes(id),
 email text not null,
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null
);

-- Membership permission: a reviewable record comparable to the activity waiver.
create table public.guardian_consents (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.guardian_requests(id),
 participant_id uuid not null references auth.users(id),
 contact_id uuid not null references public.guardian_contacts(id),
 kind text not null check(kind='membership'),
 document_version integer not null,
 document_body text not null,
 signature_name text not null check(length(trim(signature_name)) between 2 and 200),
 signed_at timestamptz not null default clock_timestamp(),
 evidence jsonb not null
);
alter table public.guardian_requests add constraint guardian_request_consent foreign key(consent_id) references public.guardian_consents(id);

create table public.guardian_reviews (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.guardian_requests(id),
 decision text not null check(decision in ('approved','rejected','clarification')),
 basis text not null check(basis in ('officer','prior_verification')),
 identity_checked boolean not null default false,
 reason text check(reason is null or length(trim(reason)) between 5 and 2000),
 reviewer_id uuid,
 created_at timestamptz not null default clock_timestamp(),
 check(decision='approved' or reason is not null),
 check(basis='prior_verification' or reviewer_id is not null)
);
create index guardian_review_request on public.guardian_reviews(request_id,created_at desc);

create table public.guardian_withdrawals (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.guardian_requests(id),
 participant_id uuid not null references auth.users(id),
 contact_id uuid not null references public.guardian_contacts(id),
 note text check(note is null or length(note)<=1000),
 created_at timestamptz not null default clock_timestamp(),
 acknowledged_at timestamptz,
 acknowledged_by uuid
);

do $$ declare t text; begin
 foreach t in array array['guardian_contacts','guardian_requests','guardian_request_tokens','guardian_email_codes',
 'guardian_sessions','guardian_consents','guardian_reviews','guardian_withdrawals'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
 end loop;
 foreach t in array array['guardian_consents','guardian_reviews'] loop
 execute format('create trigger %I before update or delete on public.%I for each row execute function registration_private.immutable_document()',t||'_immutable',t);
 end loop;
end $$;

create function registration_private.guardian_contact_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='DELETE' then raise exception 'Guardian records are retained.'; end if;
 if (new.participant_id,new.full_name,new.email,new.relationship,new.created_at,new.created_by)
 is distinct from (old.participant_id,old.full_name,old.email,old.relationship,old.created_at,old.created_by) then
 raise exception 'Guardian identity details are immutable. Record a new guardian instead.'; end if;
 return new;
end $$;
create trigger guardian_contact_identity before update or delete on public.guardian_contacts
for each row execute function registration_private.guardian_contact_identity();
create function registration_private.guardian_request_retained() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='DELETE' then raise exception 'Guardian records are retained.'; end if;
 if (new.participant_id,new.needs_membership,new.waiver_id,new.created_at) is distinct from (old.participant_id,old.needs_membership,old.waiver_id,old.created_at)
 or (old.signature_id is not null and new.signature_id is distinct from old.signature_id)
 or (old.consent_id is not null and new.consent_id is distinct from old.consent_id) then
 raise exception 'Signed guardian requests are immutable.'; end if;
 return new;
end $$;
create trigger guardian_request_retained before update or delete on public.guardian_requests
for each row execute function registration_private.guardian_request_retained();
create trigger guardian_withdrawal_retained before delete on public.guardian_withdrawals
for each row execute function registration_private.immutable_document();

-- Frozen membership permission text. Add a new version instead of editing.
create function registration_private.membership_consent_document(p_version integer default 1) returns text
language sql immutable set search_path='' as $$
 select case p_version when 1 then
'UNLV Mountain Club — Parent or Legal Guardian Membership Permission (version 1)

I am the parent or legal guardian of the participant named on this form, and I am legally authorized to give this permission.

I give permission for the participant to join UNLV Mountain Club, a Registered Student Organization at UNLV, as a member, and to take part in general club meetings and membership activities.

This permission is for club membership only. It does not authorize outdoor trips or activities. Outdoor activities require a separate signed UNLV RSO liability waiver that names the covered activities and dates.

I may withdraw this permission for the future at any time by contacting the club. Withdrawal does not change records of activities that already took place.' end;
$$;

create function registration_private.is_minor(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.membership_applications where user_id=p_user and age_status='minor')
 or exists(select 1 from public.account_age_declarations where user_id=p_user and not is_18_or_older);
$$;

create function registration_private.guardian_review_decision(p_request uuid) returns text
language sql stable security definer set search_path='' as $$
 select decision from public.guardian_reviews where request_id=p_request order by created_at desc,id desc limit 1;
$$;

create function registration_private.guardian_signature_approved(p_signature uuid,p_at timestamptz default clock_timestamp()) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((select r.decision='approved' from public.guardian_requests q join public.guardian_reviews r on r.request_id=q.id
 where q.signature_id=p_signature and r.created_at<=p_at order by r.created_at desc,r.id desc limit 1),false);
$$;

-- Guardian signatures count only when officer-verified (legacy paper path, which
-- records reviewerId) or when their electronic request has been approved.
create or replace function registration_private.annual_signature(p_waiver uuid,p_user uuid,p_start date,p_end date,p_at timestamptz default clock_timestamp()) returns uuid
language sql stable security definer set search_path='' as $$
 select s.id from public.registration_signatures s join public.registration_waivers w on w.id=s.waiver_id
 where w.trip_id is null and s.waiver_id=p_waiver and registration_private.owns_record(p_user,s.user_id)
 and p_start>=s.valid_from and p_end<=s.valid_until and s.signed_at<=p_at
 and not exists(select 1 from public.registration_waiver_withdrawals x where x.signature_id=s.id and x.withdrawn_at<=p_at)
 and (s.signer_kind='guardian' or not (exists(select 1 from public.account_age_declarations where user_id=p_user and not is_18_or_older)
 or exists(select 1 from public.membership_applications where user_id=p_user and age_status='minor')))
 and (s.signer_kind<>'guardian' or s.signer_details ? 'reviewerId' or registration_private.guardian_signature_approved(s.id,p_at))
 order by s.signed_at desc limit 1;
$$;

-- Electronic guardian signature for a waiver that is signed but not yet decided.
create function registration_private.guardian_pending_signature(p_waiver uuid,p_user uuid) returns uuid
language sql stable security definer set search_path='' as $$
 select s.id from public.guardian_requests q join public.registration_signatures s on s.id=q.signature_id
 where q.waiver_id=p_waiver and registration_private.owns_record(p_user,q.participant_id) and q.status='signed'
 and registration_private.guardian_review_decision(q.id) is null
 and s.valid_until>=registration_private.waiver_today()
 and not exists(select 1 from public.registration_waiver_withdrawals x where x.signature_id=s.id)
 order by s.signed_at desc limit 1;
$$;

create function registration_private.membership_consent_needed(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.membership_applications where user_id=p_user and age_status='minor'
 and status='submitted' and guardian_consent='pending');
$$;

create function registration_private.membership_consent_pending(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.guardian_requests q where registration_private.owns_record(p_user,q.participant_id)
 and q.status='signed' and q.consent_id is not null and registration_private.guardian_review_decision(q.id) is null);
$$;

-- The waiver a guardian should sign now: the trip's annual document, else the current one.
create function registration_private.guardian_target_waiver(p_user uuid,p_trip uuid) returns uuid
language plpgsql stable security definer set search_path='' as $$
declare s public.trip_registration_settings; w uuid; begin
 if p_trip is not null then
  select * into s from public.trip_registration_settings where trip_id=p_trip;
  if s.annual_waiver and s.waiver_required then w:=registration_private.trip_waiver(p_trip); end if;
 end if;
 w:=coalesce(w,registration_private.current_annual_waiver(registration_private.waiver_today()));
 if w is null then return null; end if;
 if registration_private.annual_signature(w,p_user,registration_private.waiver_today(),registration_private.waiver_today()) is not null
 or registration_private.guardian_pending_signature(w,p_user) is not null then return null; end if;
 return w;
end $$;

create function registration_private.guardian_request_for_token(p_token_hash text) returns public.guardian_requests
language sql stable security definer set search_path='' as $$
 select q.* from public.guardian_request_tokens t join public.guardian_requests q on q.id=t.request_id
 where t.token_hash=p_token_hash and t.expires_at>now();
$$;

create function registration_private.guardian_session_email(p_request uuid,p_session_hash text) returns text
language sql stable security definer set search_path='' as $$
 select email from public.guardian_sessions where request_id=p_request and session_hash=p_session_hash and expires_at>now();
$$;

-- Applies an approval's side effects. Membership activation keeps its existing rules.
create function registration_private.apply_guardian_approval(p_request uuid,p_reviewer uuid) returns void
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; begin
 select * into q from public.guardian_requests where id=p_request;
 if q.consent_id is not null then
  update public.membership_applications set guardian_consent='confirmed',updated_at=now()
  where user_id=q.participant_id and age_status='minor' and status='submitted' and guardian_consent='pending';
  if found then
   perform public.activate_confirmed_zelle_membership(q.participant_id);
   insert into public.admin_activity_events(actor_user_id,subject_user_id,action,resource_type,resource_id,summary)
   values(p_reviewer,q.participant_id,'guardian_consent_confirmed','membership_application',q.participant_id::text,
   case when p_reviewer is null then 'Guardian e-signature accepted using a previous officer verification.' else 'Guardian e-signature approved.' end);
  end if;
 end if;
end $$;

-- Participant: start (or reuse) a guardian request and attach a fresh link.
create function public.guardian_open_request(p_token_hash text,p_delivery text,p_trip uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); q public.guardian_requests; waiver uuid; membership boolean; begin
 if uid is null or registration_private.blocked(uid) then raise exception 'Sign in with an eligible account.'; end if;
 if p_delivery not in ('same_device','email') or p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid guardian link.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||uid,0));
 if exists(select 1 from public.registration_account_merges where secondary_id=uid) then raise exception 'Sign in with your retained account.'; end if;
 if not registration_private.is_minor(uid) then raise exception 'Guardian signing is only for participants under 18.'; end if;
 if p_trip is not null and not exists(select 1 from public.trips where id=p_trip) then raise exception 'Trip not found.'; end if;
 waiver:=registration_private.guardian_target_waiver(uid,p_trip);
 membership:=registration_private.membership_consent_needed(uid) and not registration_private.membership_consent_pending(uid);
 select * into q from public.guardian_requests where participant_id=uid and status='open' for update;
 if q.id is not null and (q.waiver_id is distinct from waiver or q.needs_membership<>membership) then
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

-- Participant: designate the guardian and record an email invitation (the server sends it).
create function public.guardian_prepare_invite(p_token_hash text,p_guardian jsonb,p_trip uuid default null) returns jsonb
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
 insert into public.guardian_request_tokens(token_hash,request_id,delivery,expires_at) values(p_token_hash,q.id,'email',now()+interval '14 days');
 update public.guardian_requests set contact_id=c.id,invite_sent_at=now(),invite_count=invite_count+1 where id=q.id;
 return jsonb_build_object('requestId',q.id,'email',c.email,'guardianName',c.full_name,
 'participantName',coalesce((select display_name from public.profiles where user_id=uid),'A club member'),'inviteCount',q.invite_count+1);
end $$;

-- Participant: record a new designated guardian when nothing needs signing yet.
create function public.guardian_designate(p_guardian jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); c public.guardian_contacts; v_email text; v_name text; v_relationship text; begin
 if uid is null or registration_private.blocked(uid) then raise exception 'Sign in with an eligible account.'; end if;
 if not registration_private.is_minor(uid) then raise exception 'Guardian details are only for participants under 18.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||uid,0));
 v_email:=lower(trim(p_guardian->>'email')); v_name:=regexp_replace(trim(p_guardian->>'name'),'\s+',' ','g'); v_relationship:=trim(p_guardian->>'relationship');
 if coalesce(length(v_name),0) not between 2 and 200 or coalesce(v_email,'') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email)>320
 or coalesce(length(v_relationship),0) not between 2 and 80 then raise exception 'Enter your guardian''s name, relationship, and email address.'; end if;
 if v_email=(select lower(u.email) from auth.users u where u.id=uid) then raise exception 'Use your parent or guardian''s own email address, not yours.'; end if;
 select * into c from public.guardian_contacts where participant_id=uid and superseded_at is null for update;
 if c.id is not null and (c.email,c.full_name,c.relationship) is not distinct from (v_email,v_name,v_relationship) then return; end if;
 update public.guardian_contacts set superseded_at=clock_timestamp() where id=c.id;
 insert into public.guardian_contacts(participant_id,full_name,email,relationship,phone,created_by)
 values(uid,v_name,v_email,v_relationship,c.phone,'participant') returning * into c;
 update public.guardian_contacts set superseded_by=c.id where participant_id=uid and superseded_at is not null and superseded_by is null and id<>c.id;
end $$;

create function public.guardian_cancel_request() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required.'; end if;
 update public.guardian_requests set status='cancelled',completed_at=now() where participant_id=auth.uid() and status='open';
 delete from public.guardian_sessions s using public.guardian_requests q where q.id=s.request_id and q.participant_id=auth.uid() and q.status='cancelled';
end $$;

-- Participant: replace phone on the saved guardian (identity changes go through a new invite or signing).
create function public.guardian_update_contact_phone(p_phone text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required.'; end if;
 if p_phone is not null and length(trim(p_phone)) not between 7 and 50 then raise exception 'Enter a phone number with at least 7 digits.'; end if;
 update public.guardian_contacts set phone=nullif(trim(p_phone),'') where participant_id=auth.uid() and superseded_at is null;
 if not found then raise exception 'No saved guardian yet.'; end if;
end $$;

-- Status shown to the participant (profile, trip page, registration).
create function public.get_my_guardian_status(p_trip uuid default null) returns jsonb
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
 if p_trip is not null then
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

-- Token side (server only) ---------------------------------------------------

create function public.guardian_get_request(p_token_hash text,p_session_hash text default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare q public.guardian_requests; c public.guardian_contacts; w public.registration_waivers; verified text; delivery text; previous public.registration_signatures;
 participant text; trip jsonb; sig public.registration_signatures; consent public.guardian_consents; begin
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
 select jsonb_build_object('id',t.id,'title',t.title,'startsAt',t.starts_at,'timeZone',t.time_zone) into trip from public.trips t where t.id=q.trip_id;
 if verified is not null then
  select s.* into previous from public.registration_signatures s where s.signer_kind='guardian' and registration_private.owns_record(q.participant_id,s.user_id)
  and s.signer_details ? 'participant' order by s.signed_at desc limit 1;
 end if;
 return jsonb_build_object(
  'state',case when q.status='open' then 'open' when q.status='signed' then 'signed' when q.status='declined' then 'declined' else 'closed' end,
  'requestId',q.id,'delivery',delivery,'participantName',participant,'trip',trip,
  'verifiedEmail',verified,
  'guardian',case when c.id is null then null else jsonb_build_object('name',c.full_name,'email',c.email,'phone',c.phone,'relationship',c.relationship,
   'emailVerified',c.email_verified_at is not null) end,
  'membership',case when q.needs_membership then jsonb_build_object('version',1,'body',registration_private.membership_consent_document(1)) end,
  'waiver',case when w.id is null then null else jsonb_build_object('id',w.id,'title',w.title,'version',w.version,'body',w.body,'sourceUrl',w.source_url,
   'from',w.effective_from,'until',w.effective_until,'activities',w.activity_scope) end,
  'prefill',case when verified is null then null else jsonb_build_object(
   'participant',coalesce(previous.signer_details->'participant','{}'),
   'emergencyContact',coalesce((select emergency_contact from public.profile_private where user_id=q.participant_id),previous.signer_details->'emergencyContact','{}')) end,
  'signed',case when q.status<>'signed' then null else jsonb_build_object('at',q.completed_at,'name',coalesce(sig.signature_name,consent.signature_name),
   'validFrom',sig.valid_from,'validUntil',sig.valid_until,'withdrawn',exists(select 1 from public.guardian_withdrawals where request_id=q.id),
   'withdrawnAt',(select created_at from public.guardian_withdrawals where request_id=q.id),
   'decision',registration_private.guardian_review_decision(q.id)) end);
end $$;

create function public.guardian_start_verification(p_token_hash text,p_email text,p_code_hash text) returns jsonb
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
 if v_email=(select lower(u.email) from auth.users u where u.id=q.participant_id) then raise exception 'Use the parent or guardian''s own email, not the participant''s.'; end if;
 if exists(select 1 from public.guardian_email_codes where request_id=q.id and created_at>now()-interval '45 seconds') then
  raise exception 'A code was just sent. Wait a moment before asking for another.'; end if;
 select count(*) into recent from public.guardian_email_codes where request_id=q.id and created_at>now()-interval '1 hour';
 if recent>=5 then raise exception 'Too many codes requested. Try again in an hour or contact the club.'; end if;
 insert into public.guardian_email_codes(request_id,email,code_hash,expires_at) values(q.id,v_email,p_code_hash,now()+interval '10 minutes') returning id into code;
 return jsonb_build_object('email',v_email,'participantName',coalesce((select nullif(trim(display_name),'') from public.profiles where user_id=q.participant_id),'The participant'));
end $$;

create function public.guardian_verify_code(p_token_hash text,p_code_hash text,p_session_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; code public.guardian_email_codes; begin
 if auth.role()<>'service_role' then raise exception 'Server access required.'; end if;
 select * into q from registration_private.guardian_request_for_token(p_token_hash);
 if q.id is null or q.status not in ('open','signed') then raise exception 'This signing link is no longer active.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('guardian-request:'||q.id,0));
 select * into code from public.guardian_email_codes where request_id=q.id and verified_at is null order by created_at desc limit 1 for update;
 if code.id is null then return jsonb_build_object('ok',false,'reason','missing'); end if;
 if code.expires_at<=now() then return jsonb_build_object('ok',false,'reason','expired'); end if;
 if code.attempts>=5 then return jsonb_build_object('ok',false,'reason','locked'); end if;
 if code.code_hash<>p_code_hash then
  update public.guardian_email_codes set attempts=attempts+1 where id=code.id;
  return jsonb_build_object('ok',false,'reason',case when code.attempts+1>=5 then 'locked' else 'wrong' end,'remaining',4-code.attempts);
 end if;
 update public.guardian_email_codes set verified_at=clock_timestamp() where id=code.id;
 insert into public.guardian_sessions(session_hash,request_id,code_id,email,expires_at) values(p_session_hash,q.id,code.id,code.email,now()+interval '1 hour');
 return jsonb_build_object('ok',true,'email',code.email);
end $$;

create function public.guardian_sign(p_token_hash text,p_session_hash text,p_record_token_hash text,p_data jsonb) returns jsonb
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
  insert into public.profile_private(user_id,emergency_contact)
  values(q.participant_id,jsonb_build_object('name',trim(e->>'name'),'relationship',trim(e->>'relationship'),'phone',trim(e->>'phone'),'notes',coalesce(e->>'notes','')))
  on conflict(user_id) do update set emergency_contact=excluded.emergency_contact;
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

create function public.guardian_decline(p_token_hash text,p_reason text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; begin
 if auth.role()<>'service_role' then raise exception 'Server access required.'; end if;
 select * into q from registration_private.guardian_request_for_token(p_token_hash);
 if q.id is null or q.status<>'open' then raise exception 'This request is no longer open.'; end if;
 update public.guardian_requests set status='declined',completed_at=clock_timestamp(),decline_reason=left(nullif(trim(p_reason),''),1000) where id=q.id;
 return jsonb_build_object('participantEmail',(select email from auth.users where id=q.participant_id));
end $$;

-- Guardian: withdraw authorization for future activities (requires a fresh code).
create function public.guardian_withdraw(p_token_hash text,p_session_hash text,p_note text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; begin
 if auth.role()<>'service_role' then raise exception 'Server access required.'; end if;
 select * into q from registration_private.guardian_request_for_token(p_token_hash);
 if q.id is null or q.status<>'signed' then raise exception 'There is no signed permission on this link.'; end if;
 if registration_private.guardian_session_email(q.id,p_session_hash) is null then raise exception 'Verify your email again first.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||q.participant_id,0));
 if exists(select 1 from public.guardian_withdrawals where request_id=q.id) then return jsonb_build_object('duplicate',true); end if;
 insert into public.guardian_withdrawals(request_id,participant_id,contact_id,note) values(q.id,q.participant_id,q.signed_contact_id,left(nullif(trim(p_note),''),1000));
 if q.signature_id is not null then
  insert into public.registration_waiver_withdrawals(signature_id,withdrawn_by) values(q.signature_id,q.participant_id) on conflict do nothing;
 end if;
 delete from public.guardian_sessions where request_id=q.id;
 return jsonb_build_object('participantEmail',(select email from auth.users where id=q.participant_id),'membership',q.consent_id is not null);
end $$;

-- Signed copy for the guardian (requires a verified session).
create function public.guardian_signed_copy(p_token_hash text,p_session_hash text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare q public.guardian_requests; s public.registration_signatures; w public.registration_waivers; k public.guardian_consents; begin
 if auth.role()<>'service_role' then raise exception 'Server access required.'; end if;
 select * into q from registration_private.guardian_request_for_token(p_token_hash);
 if q.id is null or q.status<>'signed' or registration_private.guardian_session_email(q.id,p_session_hash) is null then return null; end if;
 select * into s from public.registration_signatures where id=q.signature_id;
 select * into w from public.registration_waivers where id=s.waiver_id;
 select * into k from public.guardian_consents where id=q.consent_id;
 return jsonb_build_object('signedAt',q.completed_at,'participantName',coalesce((select display_name from public.profiles where user_id=q.participant_id),''),
  'membership',case when k.id is null then null else jsonb_build_object('body',k.document_body,'version',k.document_version,'signatureName',k.signature_name,'signedAt',k.signed_at,'evidence',k.evidence) end,
  'waiver',case when s.id is null then null else jsonb_build_object('title',w.title,'version',w.version,'body',w.body,'signatureName',s.signature_name,'signedAt',s.signed_at,
   'validFrom',s.valid_from,'validUntil',s.valid_until,'activities',w.activity_scope,'details',s.signer_details) end);
end $$;

-- Officer review ---------------------------------------------------------------

create function public.get_guardian_review_queue() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'membership.confirm_guardian') then
  raise exception 'Guardian review permission required.'; end if;
 return jsonb_build_object(
 'requests',coalesce((select jsonb_agg(item order by item->>'signedAt') from (
  select jsonb_build_object('id',q.id,'participantId',q.participant_id,
   'participantName',coalesce((select display_name from public.profiles where user_id=q.participant_id),'Participant'),
   'signedAt',q.completed_at,'decision',registration_private.guardian_review_decision(q.id),
   'decisionReason',(select reason from public.guardian_reviews where request_id=q.id order by created_at desc,id desc limit 1),
   'guardian',jsonb_build_object('name',c.full_name,'email',c.email,'phone',c.phone,'relationship',c.relationship,
    'emailVerifiedAt',c.email_verified_at,'officerVerifiedAt',c.officer_verified_at,'guardianChanged',
    exists(select 1 from public.guardian_contacts o where o.participant_id=q.participant_id and o.id<>c.id and o.officer_verified_at is not null)),
   'specialArrangement',q.special_arrangement,
   'evidence',coalesce(k.evidence,s.signer_details-'initials'-'participant'-'emergencyContact'),
   'membership',case when k.id is null then null else jsonb_build_object('version',k.document_version,'signedAt',k.signed_at,'signatureName',k.signature_name) end,
   'waiver',case when s.id is null then null else jsonb_build_object('title',w.title,'version',w.version,'signatureName',s.signature_name,'signedAt',s.signed_at,
    'validFrom',s.valid_from,'validUntil',s.valid_until,'activities',w.activity_scope,'body',w.body,
    'participantBirthDate',s.signer_details->'participant'->>'birthDate') end,
   'priorReviews',coalesce((select jsonb_agg(jsonb_build_object('decision',r.decision,'basis',r.basis,'at',r.created_at,'identityChecked',r.identity_checked,
     'guardianName',(select g2.full_name from public.guardian_contacts g2 where g2.id=q2.signed_contact_id)) order by r.created_at)
    from public.guardian_reviews r join public.guardian_requests q2 on q2.id=r.request_id where q2.participant_id=q.participant_id and q2.id<>q.id),'[]'),
   'blockers',coalesce((select jsonb_agg(distinct jsonb_build_object('tripId',t.id,'title',t.title,'startsAt',t.starts_at))
    from public.trip_rsvps r join public.trips t on t.id=r.trip_id where r.user_id=q.participant_id and t.starts_at>now()
    and r.registration_state not in ('cancelled','removed_by_organizer')),'[]')) item
  from public.guardian_requests q join public.guardian_contacts c on c.id=q.signed_contact_id
  left join public.guardian_consents k on k.id=q.consent_id
  left join public.registration_signatures s on s.id=q.signature_id
  left join public.registration_waivers w on w.id=s.waiver_id
  where q.status='signed' and coalesce(registration_private.guardian_review_decision(q.id),'clarification')='clarification'
  and not exists(select 1 from public.guardian_withdrawals x where x.request_id=q.id)
  and not exists(select 1 from public.guardian_requests later where later.participant_id=q.participant_id and later.status='signed' and later.completed_at>q.completed_at)) items),'[]'),
 'withdrawals',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'participantName',coalesce((select display_name from public.profiles where user_id=x.participant_id),'Participant'),
   'guardianName',c.full_name,'at',x.created_at,'note',x.note,'membership',q.consent_id is not null,'waiver',q.signature_id is not null) order by x.created_at)
  from public.guardian_withdrawals x join public.guardian_requests q on q.id=x.request_id join public.guardian_contacts c on c.id=x.contact_id
  where x.acknowledged_at is null),'[]'),
 'waiting',coalesce((select jsonb_agg(jsonb_build_object('participantName',coalesce(p.display_name,'Participant'),'tripTitle',t.title,'startsAt',t.starts_at,
   'invited',exists(select 1 from public.guardian_requests q where q.participant_id=r.user_id and q.status='open' and q.invite_sent_at is not null)) order by t.starts_at)
  from public.trip_rsvps r join public.trips t on t.id=r.trip_id join public.trip_registration_settings s on s.trip_id=t.id
  left join public.profiles p on p.user_id=r.user_id
  where t.starts_at>now() and t.lifecycle_status='published' and s.annual_waiver and s.waiver_required
  and r.registration_state not in ('cancelled','removed_by_organizer') and registration_private.is_minor(r.user_id)
  and not registration_private.waiver_complete(t.id,r.user_id)
  and registration_private.guardian_pending_signature(registration_private.trip_waiver(t.id),r.user_id) is null),'[]'));
end $$;

create function public.review_guardian_request(p_request uuid,p_decision text,p_reason text,p_identity_checked boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.guardian_requests; reviewer uuid:=auth.uid(); begin
 if reviewer is null or registration_private.blocked(reviewer) or not public.has_admin_capability(reviewer,'membership.confirm_guardian') then
  raise exception 'Guardian review permission required.'; end if;
 if p_decision not in ('approved','rejected','clarification') then raise exception 'Choose approve, reject, or request information.'; end if;
 if p_decision<>'approved' and coalesce(length(trim(p_reason)),0) not between 5 and 2000 then raise exception 'Add a short reason the family will see.'; end if;
 select * into q from public.guardian_requests where id=p_request;
 if q.id is null or q.status<>'signed' then raise exception 'Signed request not found.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('registration-account:'||q.participant_id,0));
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
 values(reviewer,q.participant_id,'guardian_request_'||p_decision,'guardian_request',q.id::text,
 case p_decision when 'approved' then 'Guardian e-signature approved.' when 'rejected' then 'Guardian e-signature rejected.' else 'More guardian information requested.' end);
 return jsonb_build_object('participantEmail',(select u.email from auth.users u where u.id=q.participant_id),
  'participantName',coalesce((select nullif(trim(display_name),'') from public.profiles where user_id=q.participant_id),'there'),
  'guardianEmail',(select c.email from public.guardian_contacts c where c.id=q.signed_contact_id));
end $$;

create function public.acknowledge_guardian_withdrawal(p_withdrawal uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.has_admin_capability(auth.uid(),'membership.confirm_guardian') then raise exception 'Guardian review permission required.'; end if;
 update public.guardian_withdrawals set acknowledged_at=now(),acknowledged_by=auth.uid() where id=p_withdrawal and acknowledged_at is null;
end $$;

-- Minors on annual-waiver trips get a precise, actionable eligibility reason.
create function registration_private.guardian_reason(p_trip uuid,p_user uuid) returns text
language plpgsql stable security definer set search_path='' as $$
declare w uuid; q public.guardian_requests; begin
 if registration_private.waiver_complete(p_trip,p_user) then return null; end if;
 w:=registration_private.trip_waiver(p_trip);
 if w is not null and registration_private.guardian_pending_signature(w,p_user) is not null then
  return 'Your guardian signed. The club is reviewing it before you can register.'; end if;
 select * into q from public.guardian_requests where participant_id=p_user and status='open';
 if q.id is not null and q.invite_sent_at is not null then return 'Waiting for your guardian to sign.'; end if;
 return 'A parent or legal guardian needs to sign before you can register.';
end $$;

create or replace function registration_private.eligibility(p_trip uuid,p_user uuid) returns text[]
language plpgsql stable security definer set search_path='' as $$
declare s public.trip_registration_settings; reasons text[]:='{}'; adult boolean; minor boolean; reason text; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 if p_user is null then return array['Sign in to register.']; end if;
 if registration_private.blocked(p_user) then reasons:=array_append(reasons,'Your account cannot register. Contact the club.'); end if;
 if s.eligibility='members' and not public.is_active_member(p_user) then reasons:=array_append(reasons,'An active membership is required.'); end if;
 select is_18_or_older into adult from public.account_age_declarations where user_id=p_user;
 select age_status='minor' into minor from public.membership_applications where user_id=p_user;
 if coalesce(minor,false) or adult=false then
   if s.annual_waiver and s.waiver_required then
     reason:=registration_private.guardian_reason(p_trip,p_user);
     if reason is not null then reasons:=array_append(reasons,reason); end if;
   elsif not exists(select 1 from public.registration_guardian_reviews g where g.trip_id=p_trip and registration_private.owns_record(p_user,g.user_id)
     and g.waiver_id is not distinct from case when s.waiver_required then s.waiver_id end
     and (not s.waiver_required or g.document_details->>'guardianName' is not null))
     and not (not s.waiver_required and exists(select 1 from public.membership_applications where user_id=p_user and age_status='minor' and guardian_consent='confirmed')) then
     reasons:=array_append(reasons,'An officer must confirm guardian consent for this trip.');
   end if;
 elsif adult is distinct from true then reasons:=array_append(reasons,'Declare whether you are 18 or older.'); end if;
 return reasons;
end $$;

-- Grants -----------------------------------------------------------------------
do $$ declare f text; begin
 foreach f in array array[
  'registration_private.guardian_contact_identity()','registration_private.guardian_request_retained()',
  'registration_private.membership_consent_document(integer)','registration_private.is_minor(uuid)',
  'registration_private.guardian_review_decision(uuid)','registration_private.guardian_signature_approved(uuid,timestamptz)',
  'registration_private.guardian_pending_signature(uuid,uuid)','registration_private.membership_consent_needed(uuid)',
  'registration_private.membership_consent_pending(uuid)','registration_private.guardian_target_waiver(uuid,uuid)',
  'registration_private.guardian_request_for_token(text)','registration_private.guardian_session_email(uuid,text)',
  'registration_private.apply_guardian_approval(uuid,uuid)',
  'registration_private.guardian_reason(uuid,uuid)'] loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f);
 end loop;
 foreach f in array array['public.guardian_open_request(text,text,uuid)','public.guardian_prepare_invite(text,jsonb,uuid)',
  'public.guardian_cancel_request()','public.guardian_designate(jsonb)','public.guardian_update_contact_phone(text)','public.get_my_guardian_status(uuid)',
  'public.get_guardian_review_queue()','public.review_guardian_request(uuid,text,text,boolean)','public.acknowledge_guardian_withdrawal(uuid)'] loop
  execute format('revoke all on function %s from public,anon,service_role',f);
  execute format('grant execute on function %s to authenticated',f);
 end loop;
 foreach f in array array['public.guardian_get_request(text,text)','public.guardian_start_verification(text,text,text)',
  'public.guardian_verify_code(text,text,text)','public.guardian_sign(text,text,text,jsonb)','public.guardian_decline(text,text)',
  'public.guardian_withdraw(text,text,text)','public.guardian_signed_copy(text,text)'] loop
  execute format('revoke all on function %s from public,anon,authenticated',f);
  execute format('grant execute on function %s to service_role',f);
 end loop;
end $$;

commit;
