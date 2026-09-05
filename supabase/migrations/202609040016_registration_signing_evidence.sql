-- Preserve original signer and externally verified guardian document evidence.
alter table public.registration_waivers add column source_url text;
alter table public.registration_signatures add column signer_details jsonb not null default '{}';
alter table public.registration_guardian_reviews add column document_details jsonb not null default '{}';
create table public.registration_guardian_evidence (
 id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id),
 user_id uuid not null references auth.users(id), waiver_id uuid references public.registration_waivers(id),
 reviewer_id uuid not null, evidence text not null, document_details jsonb not null,
 reviewed_at timestamptz not null default now()
);
alter table public.registration_guardian_evidence enable row level security;
revoke all on public.registration_guardian_evidence from public, anon, authenticated, service_role;
create trigger registration_guardian_evidence_immutable before update or delete on public.registration_guardian_evidence
 for each row execute function registration_private.immutable_document();
create function registration_private.waiver_complete(p_trip uuid,p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select case when exists(select 1 from public.account_age_declarations where user_id=p_user and not is_18_or_older)
   or exists(select 1 from public.membership_applications where user_id=p_user and age_status='minor') then
   exists(select 1 from public.registration_guardian_reviews g join public.trip_registration_settings s on s.trip_id=g.trip_id
    where g.trip_id=p_trip and (g.user_id=p_user or g.user_id in (select secondary_id from public.registration_account_merges where primary_id=p_user))
    and g.waiver_id=s.waiver_id and g.document_details->>'guardianName' is not null)
 else exists(select 1 from public.registration_signatures r join public.trip_registration_settings s on s.trip_id=r.trip_id
    where r.trip_id=p_trip and (r.user_id=p_user or r.user_id in (select secondary_id from public.registration_account_merges where primary_id=p_user)) and r.waiver_id=s.waiver_id) end;
$$;
create function registration_private.validate_signer_details(d jsonb) returns void
language plpgsql stable set search_path='' as $$ begin
 if jsonb_typeof(d) is distinct from 'object' or octet_length(d::text)>5000
   or coalesce(length(trim(d->>'phone')),0) not between 7 and 50
   or coalesce(length(trim(d->>'address')),0) not between 5 and 500
   or coalesce(length(trim(d->>'emergencyAddress')),0) not between 5 and 500
   or coalesce(d->>'birthDate','') !~ '^\d{4}-\d{2}-\d{2}$'
   or (d->>'birthDate')::date>current_date-interval '18 years'
   or (d->>'birthDate')::date<current_date-interval '120 years'
   or jsonb_typeof(d->'initials') is distinct from 'array' then
   raise exception 'Complete the waiver contact, birth date, and initials fields. Adults must be 18 or older.'; end if;
 if jsonb_array_length(d->'initials')<>7 or exists(select 1 from jsonb_array_elements(d->'initials') x
   where jsonb_typeof(x)<>'string' or length(trim(x #>> '{}')) not between 1 and 10) then
   raise exception 'Initial each of the seven waiver provisions.'; end if;
end $$;
create or replace function registration_private.requirements(p_trip uuid,p_user uuid) returns text[]
language plpgsql stable security definer set search_path = '' as $$
declare s public.trip_registration_settings; r public.registration_responses; reasons text[] := '{}'; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 select * into r from public.registration_responses where trip_id=p_trip and user_id=p_user;
 if r.form_version is distinct from s.form_version then reasons:=array_append(reasons,'Complete the current registration form.'); end if;
 if s.emergency_required and (coalesce(length(trim(r.emergency_contact->>'name')),0)<2
   or coalesce(length(trim(r.emergency_contact->>'phone')),0)<7
   or coalesce(length(trim(r.emergency_contact->>'relationship')),0)<1) then
    reasons:=array_append(reasons,'Confirm an emergency contact name, relationship, and phone number.'); end if;
 if s.waiver_required and not registration_private.waiver_complete(p_trip,p_user) then
    reasons:=array_append(reasons,'Read and sign the required waiver.'); end if;
 return reasons;
end $$;
create or replace function public.registration_command(p_trip_id uuid,p_command text,p_request_id uuid,
 p_expected_revision integer,p_data jsonb default '{}',p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 uid uuid:=auth.uid(); target uuid:=coalesce(p_user_id,auth.uid()); t public.trips;
 s public.trip_registration_settings; r public.trip_rsvps; o public.registration_offers;
 payload jsonb; prior jsonb; reasons text[]; occupied integer; next_state text; manager boolean;
 contact jsonb; answers jsonb; close_at timestamptz; lock_user uuid;
begin
 if uid is null or p_request_id is null then raise exception 'Sign in required.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>120000 then raise exception 'Invalid registration request.'; end if;
 for lock_user in select distinct u from unnest(array[uid,target]) u order by u loop
   perform pg_advisory_xact_lock(hashtextextended('registration-account:'||lock_user,0));
 end loop;
 select * into t from public.trips where id=p_trip_id for update;
 if not found then raise exception 'Trip not found.'; end if;
 if exists(select 1 from public.registration_account_merges where secondary_id=uid) then raise exception 'This account has been merged. Sign in with the retained account.'; end if;
 manager:=registration_private.can_manage(p_trip_id);
 if target<>uid and not manager and not (p_command='guardian_review' and public.has_admin_capability(uid,'membership.confirm_guardian')) then
   raise exception 'Trip management permission required.'; end if;
 if not public.can_view_trip_readonly(p_trip_id) and not manager
   and not (p_command='guardian_review' and registration_private.can_review_guardian(p_trip_id)) and not exists(
   select 1 from public.trip_rsvps where trip_id=p_trip_id and user_id=uid) then raise exception 'Trip not available.'; end if;
 payload:=jsonb_build_object('tripId',p_trip_id,'command',p_command,'target',target,'dataHash',encode(extensions.digest(convert_to(p_data::text,'UTF8'),'sha256'),'hex'),'revision',p_expected_revision);
 select x.payload into prior from public.registration_requests x where actor_id=uid and request_id=p_request_id;
 if found then
   if prior<>payload then raise exception 'Request identifier was already used for a different action.'; end if;
   return public.get_trip_registration(p_trip_id);
 end if;
 select * into s from public.trip_registration_settings where trip_id=p_trip_id;
 select * into r from public.trip_rsvps where trip_id=p_trip_id and user_id=target;
 if coalesce(r.revision,0) is distinct from p_expected_revision then raise exception 'Registration changed. Refresh and try again.'; end if;
 perform registration_private.expire_offers(p_trip_id);
 select * into r from public.trip_rsvps where trip_id=p_trip_id and user_id=target;
 close_at:=coalesce(t.rsvp_deadline,t.starts_at);
 if p_command in ('register','issue_offer') then
   if t.lifecycle_status<>'published' or clock_timestamp()>=close_at then raise exception 'Registration is closed.'; end if;
   if not s.enabled or not coalesce((select registration_enabled from public.club_admin_settings where id),false) then
     raise exception 'Registration is not open yet.'; end if;
 end if;
 if p_command in ('register','accept_offer','update_response') then
   if target<>uid then raise exception 'Participants must submit their own registration.'; end if;
   if p_command='register' and r.registration_state in ('confirmed','waitlisted','offered') then
     raise exception 'You already have a registration. Refresh to view it.'; end if;
   if r.registration_state='removed_by_organizer' then raise exception 'An organizer must restore your registration access.'; end if;
   if p_command='update_response' and coalesce(r.registration_state,'none') not in ('confirmed','offered','waitlisted','legacy_review') then
     raise exception 'Register before updating your responses.'; end if;
   if clock_timestamp()>=t.starts_at or t.lifecycle_status<>'published' then raise exception 'This trip no longer accepts registration changes.'; end if;
   if p_command='register' then
     insert into public.trip_rsvps(trip_id,user_id,status) values(p_trip_id,target,'removed') on conflict do nothing;
   end if;
   answers:=coalesce(p_data->'answers',(select x.answers from public.registration_responses x where x.trip_id=p_trip_id and x.user_id=target),'{}');
   contact:=coalesce(p_data->'emergencyContact',(select x.emergency_contact from public.registration_responses x where x.trip_id=p_trip_id and x.user_id=target),'{}');
   if jsonb_typeof(contact)<>'object' or octet_length(contact::text)>4000 then raise exception 'Invalid emergency contact.'; end if;
   if exists(select 1 from jsonb_each(contact) field where field.key not in ('name','relationship','phone','notes')
     or jsonb_typeof(field.value)<>'string' or length(field.value #>> '{}')>case field.key when 'notes' then 1000 when 'phone' then 50 else 200 end) then
     raise exception 'Use text values for the emergency contact fields.'; end if;
   if p_command<>'accept_offer' then
     if (p_data->>'formVersion')::integer is distinct from s.form_version then raise exception 'The registration form changed. Refresh and try again.'; end if;
     perform registration_private.validate_answers(s.questions,answers);
     insert into public.registration_responses(trip_id,user_id,form_version,answers,emergency_contact)
       values(p_trip_id,target,s.form_version,answers,contact)
       on conflict(trip_id,user_id) do update set form_version=excluded.form_version,answers=excluded.answers,
       emergency_contact=excluded.emergency_contact,updated_at=now();
     if p_data->'waiverAgreed'='true'::jsonb then
       if s.waiver_id is null or (p_data->>'waiverId')::uuid is distinct from s.waiver_id then raise exception 'The waiver changed. Read the current document.'; end if;
       if exists(select 1 from public.account_age_declarations where user_id=target and not is_18_or_older)
         or exists(select 1 from public.membership_applications where user_id=target and age_status='minor') then
         raise exception 'A parent or legal guardian must sign the waiver. Request officer verification of that document.'; end if;
       if exists(select 1 from public.registration_waivers where id=s.waiver_id and source_url is not null) then
         perform registration_private.validate_signer_details(p_data->'signerDetails');
       end if;
       insert into public.registration_signatures(trip_id,user_id,original_signer_id,waiver_id,signature_name,signer_details)
         values(p_trip_id,target,target,s.waiver_id,trim(p_data->>'signatureName'),coalesce(p_data->'signerDetails','{}')) on conflict(user_id,waiver_id) do nothing;
     end if;
   end if;
   reasons:=registration_private.requirements(p_trip_id,target);
   if p_command<>'update_response' then reasons:=reasons||registration_private.eligibility(p_trip_id,target); end if;
   if cardinality(reasons)>0 then raise exception '%',array_to_string(reasons,' '); end if;
   if p_command<>'accept_offer' and s.emergency_required and p_data->'emergencyConfirmed' is distinct from 'true'::jsonb then
     raise exception 'Confirm that your emergency contact is current for this trip.'; end if;
   if p_command='update_response' then
     update public.trip_registration_settings set locked_at=coalesce(locked_at,now()) where trip_id=p_trip_id;
   end if;
 end if;
 select count(*) into occupied from public.trip_rsvps where trip_id=p_trip_id and registration_state in ('confirmed','offered');
 next_state:=r.registration_state;
 case p_command
 when 'request_guardian' then
   if target<>uid then raise exception 'Request review for your own account.'; end if;
   if not exists(select 1 from public.account_age_declarations where user_id=uid and not is_18_or_older)
      and not exists(select 1 from public.membership_applications where user_id=uid and age_status='minor') then raise exception 'Declare your age before requesting guardian review.'; end if;
   insert into public.trip_rsvps(trip_id,user_id,status) values(p_trip_id,uid,'removed') on conflict do nothing;
   next_state:=coalesce(r.registration_state,'none');
 when 'register' then
   if (t.capacity is null or occupied<t.capacity) and not exists(select 1 from public.trip_rsvps
       where trip_id=p_trip_id and registration_state in ('waitlisted','legacy_review')) then next_state:='confirmed';
   elsif t.waitlist_enabled then next_state:='waitlisted';
   else raise exception 'Trip full. No waitlist spaces are available.'; end if;
   update public.trip_rsvps set registered_at=now(),queued_at=case when next_state='waitlisted' then now() end
     where trip_id=p_trip_id and user_id=target;
   update public.trip_registration_settings set locked_at=coalesce(locked_at,now()) where trip_id=p_trip_id;
 when 'cancel' then
   if target<>uid then raise exception 'Use the organizer removal action.'; end if;
   if clock_timestamp()>=t.starts_at then raise exception 'The trip has started. Contact an organizer.'; end if;
   if coalesce(r.registration_state,'none') not in ('confirmed','waitlisted','offered','legacy_review') then raise exception 'No active registration to cancel.'; end if;
   next_state:='cancelled';
 when 'issue_offer' then
   if not manager then raise exception 'Trip management permission required.'; end if;
   if coalesce(r.registration_state,'none') not in ('waitlisted','legacy_review') then raise exception 'Select a waitlisted participant.'; end if;
   reasons:=registration_private.eligibility(p_trip_id,target)||registration_private.requirements(p_trip_id,target);
   if cardinality(reasons)>0 then raise exception '%',array_to_string(reasons,' '); end if;
   if t.capacity is not null and occupied>=t.capacity then raise exception 'No unreserved seat is available.'; end if;
   insert into public.registration_offers(trip_id,user_id,issued_by,expires_at)
     values(p_trip_id,target,uid,least(clock_timestamp()+make_interval(hours=>s.offer_hours),close_at)) returning * into o;
   next_state:='offered';
 when 'accept_offer' then
   select * into o from public.registration_offers where trip_id=p_trip_id and user_id=target and status='pending';
   if not found or o.id is distinct from (p_data->>'offerId')::uuid or o.expires_at<=clock_timestamp()
     or clock_timestamp()>=close_at or t.lifecycle_status<>'published' then raise exception 'This offer is no longer available.'; end if;
   update public.registration_offers set status='accepted',resolved_at=now() where id=o.id;
   next_state:='confirmed';
 when 'decline_offer' then
   if target<>uid or r.registration_state is distinct from 'offered' then raise exception 'No offer to decline.'; end if;
   select * into o from public.registration_offers where trip_id=p_trip_id and user_id=target and status='pending';
   if not found or o.id is distinct from (p_data->>'offerId')::uuid then raise exception 'This offer is no longer available.'; end if;
   update public.registration_offers set status='declined',resolved_at=now() where id=o.id;
   next_state:='cancelled';
 when 'revoke_offer' then
   if not manager or r.registration_state is distinct from 'offered' then raise exception 'No offer available to revoke.'; end if;
   next_state:='waitlisted';
 when 'remove' then
   if not manager or r.user_id is null then raise exception 'Trip management permission required.'; end if;
   if coalesce(length(trim(p_data->>'reason')),0)<5 then raise exception 'Provide a removal reason.'; end if;
   next_state:='removed_by_organizer';
 when 'restore' then
   if not manager or r.registration_state is distinct from 'removed_by_organizer' then raise exception 'No removed registration to restore.'; end if;
   next_state:='cancelled';
 when 'update_response' then null;
 when 'attendance' then
   if not manager or r.registration_state is distinct from 'confirmed' then raise exception 'Select a confirmed participant.'; end if;
   if coalesce(p_data->>'attendance','') not in ('present','absent','unmarked') then raise exception 'Invalid attendance state.'; end if;
   if p_data->>'attendance'='present' then
     reasons:=registration_private.eligibility(p_trip_id,target)||registration_private.requirements(p_trip_id,target);
     if cardinality(reasons)>0 then raise exception '%',array_to_string(reasons,' '); end if;
   end if;
   insert into public.trip_attendance(trip_id,user_id,attended,responded_at)
   values(p_trip_id,target,case p_data->>'attendance' when 'present' then true when 'absent' then false end,now())
   on conflict(trip_id,user_id) do update set attended=excluded.attended,responded_at=now();
 when 'guardian_review' then
   if registration_private.blocked(uid) or not public.has_admin_capability(uid,'membership.confirm_guardian') then raise exception 'Guardian review permission required.'; end if;
   if s.waiver_required then
     if coalesce(length(trim(p_data->'guardianDocument'->>'guardianName')),0) not between 2 and 200
       or coalesce(length(trim(p_data->'guardianDocument'->>'reference')),0) not between 5 and 1000
       or coalesce(p_data->'guardianDocument'->>'signedOn','') !~ '^\d{4}-\d{2}-\d{2}$'
       or (p_data->'guardianDocument'->>'signedOn')::date>current_date
       or p_data->'guardianDocument'->'verified' is distinct from 'true'::jsonb then
       raise exception 'Verify the parent-signed waiver, signer name, signing date, and retained document reference.'; end if;
   end if;
   insert into public.registration_guardian_evidence(trip_id,user_id,waiver_id,reviewer_id,evidence,document_details)
   values(p_trip_id,target,case when s.waiver_required then s.waiver_id end,uid,trim(p_data->>'evidence'),coalesce(p_data->'guardianDocument','{}'));
   insert into public.registration_guardian_reviews(trip_id,user_id,waiver_id,reviewer_id,evidence,document_details)
   values(p_trip_id,target,case when s.waiver_required then s.waiver_id end,uid,trim(p_data->>'evidence'),coalesce(p_data->'guardianDocument','{}'))
   on conflict(trip_id,user_id) do update set waiver_id=excluded.waiver_id,reviewer_id=uid,evidence=excluded.evidence,document_details=excluded.document_details,reviewed_at=now();
 else raise exception 'Unknown registration command.';
 end case;
 if p_command in ('cancel','remove','revoke_offer') then
   update public.registration_offers set status='revoked',resolved_at=now() where trip_id=p_trip_id and user_id=target and status='pending';
 end if;
 update public.trip_rsvps set registration_state=next_state, status=case next_state
   when 'confirmed' then 'going'::public.trip_rsvp_status when 'offered' then 'waitlisted'::public.trip_rsvp_status
   when 'waitlisted' then 'waitlisted'::public.trip_rsvp_status when 'legacy_review' then status
   else 'removed'::public.trip_rsvp_status end,revision=revision+1 where trip_id=p_trip_id and user_id=target;
 perform registration_private.event(p_trip_id,target,case p_command
   when 'register' then next_state when 'accept_offer' then 'confirmed' when 'issue_offer' then 'offered'
   when 'cancel' then 'cancelled' when 'decline_offer' then 'cancelled' when 'remove' then 'removed_by_organizer'
   when 'revoke_offer' then 'offer_revoked' else p_command end,
   jsonb_strip_nulls(jsonb_build_object('offerId',o.id,'attendance',p_data->>'attendance','reason',p_data->>'reason')));
 insert into public.registration_requests(actor_id,request_id,trip_id,payload) values(uid,p_request_id,p_trip_id,payload);
 return public.get_trip_registration(p_trip_id);
end $$;
revoke all on function public.registration_command(uuid,text,uuid,integer,jsonb,uuid) from public,anon;
grant execute on function public.registration_command(uuid,text,uuid,integer,jsonb,uuid) to authenticated;
create or replace function public.get_trip_registration(p_trip_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare t public.trips; s public.trip_registration_settings; r public.trip_rsvps; o public.registration_offers;
 uid uuid:=auth.uid(); reasons text[]; requirements text[]; available text; actions text[]:='{}'; state text;
 confirmed integer; reserved integer; queued integer; manager boolean; global_enabled boolean; close_at timestamptz;
begin
 select * into t from public.trips where id=p_trip_id;
 if not found then raise exception 'Trip not found.'; end if;
 manager:=registration_private.can_manage(p_trip_id);
 if not public.can_view_trip_readonly(p_trip_id) and not manager and not registration_private.can_review_guardian(p_trip_id) and not exists(
   select 1 from public.trip_rsvps where trip_id=p_trip_id and user_id=uid) then raise exception 'Trip not available.'; end if;
 select * into s from public.trip_registration_settings where trip_id=p_trip_id;
 select * into r from public.trip_rsvps where trip_id=p_trip_id and user_id=uid;
 select * into o from public.registration_offers where trip_id=p_trip_id and user_id=uid and status='pending' and expires_at>now();
 state:=coalesce(r.registration_state,'none');
 if state='offered' and o.id is null then state:='waitlisted'; end if;
 select count(*) filter(where registration_state='confirmed'),count(*) filter(where registration_state in ('waitlisted','legacy_review'))
 into confirmed,queued from public.trip_rsvps where trip_id=p_trip_id;
 select count(*) into reserved from public.registration_offers where trip_id=p_trip_id and status='pending' and expires_at>now();
 queued:=queued+(select count(*) from public.trip_rsvps where trip_id=p_trip_id and registration_state='offered')-reserved;
 reasons:=registration_private.eligibility(p_trip_id,uid);
 requirements:=registration_private.requirements(p_trip_id,uid);
 select registration_enabled into global_enabled from public.club_admin_settings where id;
 close_at:=coalesce(t.rsvp_deadline,t.starts_at);
 available:=case when t.lifecycle_status<>'published' then t.lifecycle_status::text
   when now()>=close_at then 'closed' when not s.enabled or not coalesce(global_enabled,false) then 'disabled'
   when t.capacity is not null and confirmed+reserved>=t.capacity or queued>0 then case when t.waitlist_enabled then 'waitlist' else 'full' end
   else 'open' end;
 if uid is not null then
  if state in ('none','cancelled') and available in ('open','waitlist') then actions:=array_append(actions,'register'); end if;
  if state in ('confirmed','waitlisted','offered','legacy_review') and now()<t.starts_at then actions:=array_append(actions,'cancel'); end if;
  if state='offered' and o.id is not null and now()<close_at and t.lifecycle_status='published' then actions:=actions||array['accept_offer','decline_offer']; end if;
  if state in ('confirmed','waitlisted','offered','legacy_review') and now()<t.starts_at and t.lifecycle_status='published' then actions:=array_append(actions,'update_response'); end if;
 end if;
 return jsonb_build_object(
  'tripId',t.id,'title',t.title,'startAt',t.starts_at,'endAt',t.ends_at,'timeZone',t.time_zone,
  'availability',available,'closeAt',close_at,'eligibility',s.eligibility,'eligibilityReasons',reasons,
  'requirements',requirements,'capacity',t.capacity,'confirmedCount',confirmed,'reservedCount',reserved,'waitlistCount',queued,
  'state',state,'revision',coalesce(r.revision,0),'authenticated',uid is not null,'canManage',manager,
  'canReviewGuardian',uid is not null and public.has_admin_capability(uid,'membership.confirm_guardian'),
  'emailEnabled',registration_private.email_enabled(uid,'offered'),'actions',actions,
  'ageAdult',case when exists(select 1 from public.membership_applications where user_id=uid and age_status='minor') then false
    else (select is_18_or_older from public.account_age_declarations where user_id=uid) end,
  'formVersion',s.form_version,'questions',s.questions,'emergencyRequired',s.emergency_required,'waiverRequired',s.waiver_required,
  'waiver',(select jsonb_build_object('id',w.id,'title',w.title,'body',w.body,'version',w.version,'sourceUrl',w.source_url)
    from public.registration_waivers w where w.id=s.waiver_id),
  'waiverSigned',registration_private.waiver_complete(p_trip_id,uid),
  'answers',coalesce((select answers from public.registration_responses where trip_id=p_trip_id and user_id=uid),'{}'),
  'emergencyContact',coalesce((select emergency_contact from public.registration_responses where trip_id=p_trip_id and user_id=uid),
    (select emergency_contact from public.profile_private where user_id=uid),'{}'),
  'offer',case when o.id is not null then jsonb_build_object('id',o.id,'expiresAt',o.expires_at,'issuedAt',o.issued_at) end,
  'events',coalesce((select jsonb_agg(x) from (select kind,created_at as "createdAt" from public.registration_events
    where trip_id=p_trip_id and (user_id=uid or user_id in (select secondary_id from public.registration_account_merges where primary_id=uid)) order by created_at desc limit 20) x),'[]'),
  'attendees',case when manager or state='confirmed' then coalesce((select jsonb_agg(jsonb_build_object('userId',a.user_id,
      'name',coalesce(p.display_name,'Participant'),'avatarUrl',p.avatar_url))
    from public.trip_rsvps a left join public.profiles p on p.user_id=a.user_id
    left join public.profile_private pp on pp.user_id=a.user_id where a.trip_id=p_trip_id and a.registration_state='confirmed'
    and (manager or coalesce(pp.privacy_settings->'profileVisible','true')<>'false'::jsonb)),'[]') else '[]'::jsonb end
 );
end $$;
revoke all on function public.get_trip_registration(uuid) from public;
grant execute on function public.get_trip_registration(uuid) to anon,authenticated;

create or replace function public.save_registration_settings(p_trip_id uuid,p_revision integer,p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare t public.trips; s public.trip_registration_settings; waiver uuid; v_questions jsonb; changed boolean; begin
 select * into t from public.trips where id=p_trip_id for update;
 if not registration_private.can_manage(p_trip_id) then raise exception 'Trip management permission required.'; end if;
 select * into s from public.trip_registration_settings where trip_id=p_trip_id;
 if s.revision is distinct from p_revision then raise exception 'Settings changed. Refresh and try again.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>200000 then raise exception 'Invalid settings.'; end if;
 v_questions:=p_data->'questions';
 perform registration_private.validate_questions(v_questions);
 if coalesce(p_data->>'eligibility','') not in ('members','account') then raise exception 'Choose registration eligibility.'; end if;
 changed:=(s.eligibility,s.emergency_required,s.waiver_required,s.questions) is distinct from
  (p_data->>'eligibility',(p_data->>'emergencyRequired')::boolean,(p_data->>'waiverRequired')::boolean,v_questions)
  or coalesce(trim(p_data->>'waiverBody'),'')<>'';
 if s.locked_at is not null and changed then raise exception 'Registration requirements are frozen after the first submission.'; end if;
 waiver:=s.waiver_id;
 if coalesce(trim(p_data->>'waiverBody'),'')<>'' then
   insert into public.registration_waivers(trip_id,version,title,body,source_url)
   values(p_trip_id,coalesce((select max(version)+1 from public.registration_waivers where trip_id=p_trip_id),1),
     trim(p_data->>'waiverTitle'),p_data->>'waiverBody',nullif(p_data->>'waiverSourceUrl','')) returning id into waiver;
 end if;
 if (p_data->>'enabled')::boolean then
   if t.lifecycle_status<>'published' then raise exception 'Only published trips can open registration.'; end if;
   if (p_data->>'waiverRequired')::boolean and waiver is null then raise exception 'Add the club-approved waiver before opening registration.'; end if;
   if t.is_all_day and nullif(p_data->>'deadline','') is null then raise exception 'Set an explicit registration deadline for a trip with a TBA start time.'; end if;
 end if;
 perform registration_private.expire_offers(p_trip_id);
 update public.trips set capacity=(p_data->>'capacity')::integer,waitlist_enabled=(p_data->>'waitlistEnabled')::boolean,
   rsvp_deadline=nullif(p_data->>'deadline','')::timestamptz where id=p_trip_id;
 update public.trip_registration_settings set enabled=(p_data->>'enabled')::boolean,eligibility=p_data->>'eligibility',
   emergency_required=(p_data->>'emergencyRequired')::boolean,waiver_required=(p_data->>'waiverRequired')::boolean,
   questions=v_questions,waiver_id=waiver,form_version=form_version+case when changed then 1 else 0 end,
   offer_hours=(p_data->>'offerHours')::integer,revision=revision+1 where trip_id=p_trip_id;
 perform registration_private.event(p_trip_id,null,'settings_changed');
 return public.get_registration_roster(p_trip_id);
end $$;
revoke all on function public.save_registration_settings(uuid,integer,jsonb) from public,anon;
grant execute on function public.save_registration_settings(uuid,integer,jsonb) to authenticated;

alter table public.registration_responses drop constraint registration_responses_trip_id_user_id_fkey;
alter table public.registration_responses add foreign key(trip_id,user_id) references public.trip_rsvps(trip_id,user_id) on update cascade;
alter table public.registration_offers drop constraint registration_offers_trip_id_user_id_fkey;
alter table public.registration_offers add foreign key(trip_id,user_id) references public.trip_rsvps(trip_id,user_id) on update cascade;

create or replace function public.merge_trip_registrations(p_primary uuid,p_secondary uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.trip_rsvps; p public.trip_rsvps; winner text; tid uuid; lock_user uuid; begin
 if p_primary=p_secondary or p_primary is null or p_secondary is null then raise exception 'Choose two different accounts.'; end if;
 for lock_user in select u from unnest(array[p_primary,p_secondary]) u order by u loop
   perform pg_advisory_xact_lock(hashtextextended('registration-account:'||lock_user,0));
 end loop;
 -- Serialize account merges; commands reject the secondary account after this commits.
 perform id from auth.users where id in (p_primary,p_secondary) order by id for update;
 if exists(select 1 from public.registration_account_merges where secondary_id=p_primary or secondary_id=p_secondary and primary_id<>p_primary) then
   raise exception 'Resolve the existing account merge before continuing.'; end if;
 for tid in select distinct trip_id from public.trip_rsvps where user_id in (p_primary,p_secondary) order by trip_id loop
   perform id from public.trips where id=tid for update;
 end loop;
 if exists(select 1 from public.registration_responses a join public.registration_responses b using(trip_id)
   where a.user_id=p_primary and b.user_id=p_secondary and (a.answers,a.emergency_contact,a.form_version) is distinct from (b.answers,b.emergency_contact,b.form_version)) then
   raise exception 'Resolve conflicting registration forms before merging accounts.'; end if;
 if exists(select 1 from public.trip_attendance a join public.trip_attendance b using(trip_id)
   where a.user_id=p_primary and b.user_id=p_secondary and a.attended is not null and b.attended is not null and a.attended<>b.attended) then
   raise exception 'Resolve conflicting attendance before merging accounts.'; end if;
 insert into public.registration_account_merges(secondary_id,primary_id) values(p_secondary,p_primary) on conflict do nothing;
 update public.registration_account_merges set primary_id=p_primary where primary_id=p_secondary;
 for r in select * from public.trip_rsvps where user_id=p_secondary order by trip_id loop
   perform registration_private.expire_offers(r.trip_id);
   select * into r from public.trip_rsvps where trip_id=r.trip_id and user_id=p_secondary;
   select * into p from public.trip_rsvps where trip_id=r.trip_id and user_id=p_primary;
   if not found then
     update public.trip_rsvps set user_id=p_primary,revision=revision+1 where trip_id=r.trip_id and user_id=p_secondary;
   else
     select state into winner from unnest(array[p.registration_state,r.registration_state]) state
       order by array_position(array['confirmed','offered','waitlisted','legacy_review','removed_by_organizer','cancelled','none'],state) limit 1;
     if winner='confirmed' then
       update public.registration_offers set status='revoked',resolved_at=now() where trip_id=r.trip_id and user_id in (p_primary,p_secondary) and status='pending';
     else
       update public.registration_offers set status='revoked',resolved_at=now() where trip_id=r.trip_id and user_id=p_secondary and status='pending'
       and exists(select 1 from public.registration_offers where trip_id=r.trip_id and user_id=p_primary and status='pending');
     end if;
     insert into public.registration_responses(trip_id,user_id,form_version,answers,emergency_contact)
       select trip_id,p_primary,form_version,answers,emergency_contact from public.registration_responses
       where trip_id=r.trip_id and user_id=p_secondary on conflict do nothing;
     delete from public.registration_responses where trip_id=r.trip_id and user_id=p_secondary;
     update public.registration_offers set user_id=p_primary where trip_id=r.trip_id and user_id=p_secondary;
     update public.trip_rsvps set registration_state=winner,status=case winner when 'confirmed' then 'going'::public.trip_rsvp_status
       when 'offered' then 'waitlisted'::public.trip_rsvp_status when 'waitlisted' then 'waitlisted'::public.trip_rsvp_status else 'removed'::public.trip_rsvp_status end,
       registered_at=least(registered_at,r.registered_at),queued_at=least(queued_at,r.queued_at),revision=revision+1
       where trip_id=r.trip_id and user_id=p_primary;
     delete from public.trip_rsvps where trip_id=r.trip_id and user_id=p_secondary;
   end if;
   perform registration_private.event(r.trip_id,p_primary,'account_merged',jsonb_build_object('sourceAccount',p_secondary));
 end loop;
 insert into public.trip_attendance(trip_id,user_id,attended,responded_at,feedback)
   select trip_id,p_primary,attended,responded_at,feedback from public.trip_attendance where user_id=p_secondary
   on conflict(trip_id,user_id) do update set attended=coalesce(trip_attendance.attended,excluded.attended);
 delete from public.trip_attendance where user_id=p_secondary;
 insert into public.registration_guardian_reviews(trip_id,user_id,waiver_id,reviewer_id,evidence,reviewed_at,document_details)
   select trip_id,p_primary,waiver_id,reviewer_id,evidence,reviewed_at,document_details from public.registration_guardian_reviews where user_id=p_secondary on conflict do nothing;
 update public.registration_notifications set user_id=p_primary where user_id=p_secondary;
 -- Merge opt-outs conservatively before the existing account merge copies preferences.
 insert into public.profile_private(user_id,notification_settings)
 select p_primary,coalesce(jsonb_object_agg(key,value),'{}') from public.profile_private secondary,
   lateral jsonb_each(coalesce(secondary.notification_settings,'{}')) prefs
 where secondary.user_id=p_secondary and key in ('email','tripUpdates','announcements') and value='false'::jsonb
 on conflict(user_id) do update set notification_settings=coalesce(profile_private.notification_settings,'{}')||excluded.notification_settings;
 if exists(select 1 from public.user_preferences where user_id=p_secondary and not trip_email_notifications) then
   insert into public.user_preferences(user_id,trip_email_notifications) values(p_primary,false)
   on conflict(user_id) do update set trip_email_notifications=false;
 end if;
 insert into public.account_age_declarations(user_id,is_18_or_older,source)
 select p_primary,bool_and(is_18_or_older),'trip_registration' from public.account_age_declarations
 where user_id in (p_primary,p_secondary) having count(*)>0
 on conflict(user_id) do update set is_18_or_older=account_age_declarations.is_18_or_older and excluded.is_18_or_older;
 -- Signatures and event actors retain their original identity and immutable evidence.
end $$;
revoke all on function public.merge_trip_registrations(uuid,uuid) from public,anon,authenticated;
grant execute on function public.merge_trip_registrations(uuid,uuid) to service_role;

create or replace function registration_private.eligibility(p_trip uuid,p_user uuid) returns text[]
language plpgsql stable security definer set search_path = '' as $$
declare s public.trip_registration_settings; reasons text[] := '{}'; adult boolean; minor boolean; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 if p_user is null then return array['Sign in to register.']; end if;
 if registration_private.blocked(p_user) then reasons := array_append(reasons,'Your account cannot register. Contact the club.'); end if;
 if s.eligibility='members' and not public.is_active_member(p_user) then
   reasons := array_append(reasons,'An active membership is required.'); end if;
 select is_18_or_older into adult from public.account_age_declarations where user_id=p_user;
 select age_status='minor' into minor from public.membership_applications where user_id=p_user;
 if coalesce(minor,false) or adult=false then
   if not exists(select 1 from public.registration_guardian_reviews g where g.trip_id=p_trip and g.user_id=p_user
      and g.waiver_id is not distinct from case when s.waiver_required then s.waiver_id end
      and (not s.waiver_required or g.document_details->>'guardianName' is not null))
    and not (not s.waiver_required and exists(select 1 from public.membership_applications
      where user_id=p_user and age_status='minor' and guardian_consent='confirmed')) then
     reasons := array_append(reasons,'An officer must confirm guardian consent for this trip.');
   end if;
 elsif adult is distinct from true then reasons := array_append(reasons,'Declare whether you are 18 or older.'); end if;
 return reasons;
end $$;

create or replace function public.get_my_registration_signatures() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(x order by x->>'signedAt' desc),'[]') from (
 select jsonb_build_object('tripId',s.trip_id,'title',w.title,'version',w.version,'body',w.body,
  'signatureName',s.signature_name,'signedAt',s.signed_at,'verification','Electronic signature','details',s.signer_details) x
 from public.registration_signatures s join public.registration_waivers w on w.id=s.waiver_id
 where s.user_id=auth.uid() or s.user_id in (select secondary_id from public.registration_account_merges where primary_id=auth.uid())
 union all
 select jsonb_build_object('tripId',g.trip_id,'title',w.title,'version',w.version,'body',w.body,
  'signatureName',g.document_details->>'guardianName','signedAt',g.document_details->>'signedOn',
  'verification','Parent or guardian document verified by an officer','details',g.document_details)
 from public.registration_guardian_evidence g join public.registration_waivers w on w.id=g.waiver_id
 where g.document_details->>'guardianName' is not null and (g.user_id=auth.uid()
 or g.user_id in (select secondary_id from public.registration_account_merges where primary_id=auth.uid()))
 ) records;
$$;
