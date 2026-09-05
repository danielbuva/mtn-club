-- Private, non-seat-holding signups become confirmed only through the existing validated submission.
alter table public.trip_rsvps drop constraint trip_rsvps_registration_state_check;
alter table public.trip_rsvps add constraint trip_rsvps_registration_state_check check
 (registration_state in ('none','incomplete','confirmed','waitlisted','offered','cancelled','removed_by_organizer','legacy_review'));

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
 if p_command in ('register','issue_offer','begin_signup','save_draft') then
   if t.lifecycle_status<>'published' or clock_timestamp()>=close_at then raise exception 'Registration is closed.'; end if;
   if not s.enabled or not coalesce((select registration_enabled from public.club_admin_settings where id),false) then
     raise exception 'Registration is not open yet.'; end if;
 end if;
 if p_command in ('begin_signup','save_draft') then
   if target<>uid then raise exception 'Participants must start their own signup.'; end if;
   if registration_private.blocked(uid) then raise exception 'Your account cannot register. Contact the club.'; end if;
   if coalesce(r.registration_state,'none') not in ('none','cancelled','incomplete') then
     raise exception 'This registration cannot be started. Refresh to view its status.'; end if;
   if public.get_trip_registration(p_trip_id)->>'availability' not in ('open','waitlist') then
     raise exception 'Registration is unavailable.'; end if;
   insert into public.trip_rsvps(trip_id,user_id,status) values(p_trip_id,target,'removed') on conflict do nothing;
   if p_command='save_draft' then
     if (p_data->>'formVersion')::integer is distinct from s.form_version then
       raise exception 'The registration form changed. Refresh and try again.'; end if;
     answers:=coalesce(p_data->'answers','{}');
     contact:=coalesce(p_data->'emergencyContact','{}');
     perform registration_private.validate_answers(
       coalesce((select jsonb_agg(q || '{"required":false}'::jsonb) from jsonb_array_elements(s.questions) q),'[]'),answers);
     if jsonb_typeof(contact)<>'object' or octet_length(contact::text)>4000 or exists(
       select 1 from jsonb_each(contact) field where field.key not in ('name','relationship','phone','notes')
       or jsonb_typeof(field.value)<>'string' or length(field.value #>> '{}')>case field.key when 'notes' then 1000 when 'phone' then 50 else 200 end) then
       raise exception 'Use text values for the emergency contact fields.'; end if;
     -- A saved draft never satisfies the submitted-form requirement or records a signature.
     insert into public.registration_responses(trip_id,user_id,form_version,answers,emergency_contact)
       values(p_trip_id,target,0,answers,contact)
       on conflict(trip_id,user_id) do update set form_version=0,answers=excluded.answers,
         emergency_contact=excluded.emergency_contact,updated_at=now();
   end if;
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
 when 'begin_signup','save_draft' then next_state:='incomplete';
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
   if coalesce(r.registration_state,'none') not in ('incomplete','confirmed','waitlisted','offered','legacy_review') then raise exception 'No active registration to cancel.'; end if;
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

-- Extend the existing snapshot without changing its privacy filters or waiver data.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.get_trip_registration(uuid)'::regprocedure) into definition;
 if position('state in (''none'',''cancelled'')' in definition)=0 then
   raise exception 'Expected registration action rule missing';
 end if;
 definition:=replace(definition,'state in (''none'',''cancelled'')','state in (''none'',''cancelled'',''incomplete'')');
 definition:=replace(definition,
   'then actions:=array_append(actions,''register''); end if;',
   'then actions:=actions||array[''register'',''begin_signup'',''save_draft'']; end if;');
 definition:=replace(definition,
   'state in (''confirmed'',''waitlisted'',''offered'',''legacy_review'') and now()<t.starts_at then',
   'state in (''incomplete'',''confirmed'',''waitlisted'',''offered'',''legacy_review'') and now()<t.starts_at then');
 execute definition;
end $migration$;
