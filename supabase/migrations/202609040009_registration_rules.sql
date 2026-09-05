create function registration_private.blocked(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select public.is_banned(p_user) or exists(select 1 from public.membership_account_restrictions
 where user_id=p_user and restriction in ('suspended','banned'));
$$;
create function registration_private.can_manage(p_trip uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and not registration_private.blocked(auth.uid())
    and public.can_manage_trip(p_trip,auth.uid());
$$;
create function registration_private.email_enabled(p_user uuid, p_kind text) returns boolean
language sql stable security definer set search_path = '' as $$
 select coalesce((select
   coalesce(notification_settings->'email','true') <> 'false'::jsonb
   and coalesce(notification_settings->'tripUpdates','true') <> 'false'::jsonb
   and (p_kind <> 'reminder' or coalesce(notification_settings->'announcements','true') <> 'false'::jsonb)
   from public.profile_private where user_id=p_user),true)
 and coalesce((select trip_email_notifications from public.user_preferences where user_id=p_user),true);
$$;
create function registration_private.can_review_guardian(p_trip uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and not registration_private.blocked(auth.uid())
 and public.has_admin_capability(auth.uid(),'membership.confirm_guardian')
 and exists(select 1 from public.trip_rsvps r where r.trip_id=p_trip and (
   exists(select 1 from public.account_age_declarations where user_id=r.user_id and not is_18_or_older)
   or exists(select 1 from public.membership_applications where user_id=r.user_id and age_status='minor')));
$$;
create function registration_private.event(p_trip uuid,p_user uuid,p_kind text,p_details jsonb default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare e uuid; begin
 insert into public.registration_events(trip_id,user_id,actor_id,kind,details)
 values(p_trip,p_user,auth.uid(),p_kind,p_details) returning id into e;
 if p_user is not null and p_kind in ('confirmed','waitlisted','offered','offer_expired','cancelled',
    'removed_by_organizer','offer_revoked','trip_canceled','trip_changed','reminder') then
   insert into public.registration_notifications(event_id,trip_id,user_id,kind,dedupe_key)
   values(e,p_trip,p_user,p_kind,e::text);
 end if;
 return e;
end $$;
create function registration_private.expire_offers(p_trip uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare o record; begin
 -- Every caller locks the trip first, including the background worker.
 for o in update public.registration_offers set status='expired',resolved_at=clock_timestamp()
   where trip_id=p_trip and status='pending' and expires_at<=clock_timestamp() returning * loop
   update public.trip_rsvps set registration_state='waitlisted',status='waitlisted',revision=revision+1
     where trip_id=p_trip and user_id=o.user_id and registration_state='offered';
   perform registration_private.event(p_trip,o.user_id,'offer_expired',jsonb_build_object('offerId',o.id));
 end loop;
end $$;
create function registration_private.eligibility(p_trip uuid,p_user uuid) returns text[]
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
      and g.waiver_id is not distinct from case when s.waiver_required then s.waiver_id end)
    and not (not s.waiver_required and exists(select 1 from public.membership_applications
      where user_id=p_user and age_status='minor' and guardian_consent='confirmed')) then
     reasons := array_append(reasons,'An officer must confirm guardian consent for this trip.');
   end if;
 elsif adult is distinct from true then reasons := array_append(reasons,'Declare whether you are 18 or older.'); end if;
 return reasons;
end $$;
create function registration_private.validate_questions(p_questions jsonb) returns void
language plpgsql immutable set search_path = '' as $$
declare q jsonb; keys text[] := '{}'; begin
 if jsonb_typeof(p_questions) is distinct from 'array' or jsonb_array_length(p_questions)>20 then
   raise exception 'Use at most 20 questions.'; end if;
 for q in select value from jsonb_array_elements(p_questions) loop
  if jsonb_typeof(q) is distinct from 'object' or coalesce(q->>'id','') !~ '^[a-zA-Z][a-zA-Z0-9_]{0,49}$'
    or coalesce(length(trim(q->>'label')),0) not between 1 and 300
    or coalesce(q->>'type','') not in ('text','single','multiple','boolean')
    or jsonb_typeof(q->'required') is distinct from 'boolean'
    or (q->>'id')=any(keys) then raise exception 'Invalid or duplicate registration question.'; end if;
  keys := array_append(keys,q->>'id');
  if q->>'type' in ('single','multiple') then
    if jsonb_typeof(q->'options') is distinct from 'array' then raise exception 'Choice questions need options.'; end if;
    if jsonb_array_length(q->'options') not between 2 and 20
      or exists(select 1 from jsonb_array_elements(q->'options') x where jsonb_typeof(x)<>'string' or length(trim(x #>> '{}')) not between 1 and 200)
      or (select count(*)<>count(distinct x) from jsonb_array_elements(q->'options') x) then
      raise exception 'Use 2 to 20 unique nonempty options.'; end if;
  end if;
 end loop;
end $$;
create function registration_private.validate_answers(p_questions jsonb,p_answers jsonb) returns void
language plpgsql immutable set search_path = '' as $$
declare q jsonb; a jsonb; begin
 if jsonb_typeof(p_answers) is distinct from 'object' or octet_length(p_answers::text)>100000 then
  raise exception 'Invalid registration answers.'; end if;
 if exists(select 1 from jsonb_object_keys(p_answers) k where not exists(
   select 1 from jsonb_array_elements(p_questions) item where item->>'id'=k)) then raise exception 'Unknown registration question.'; end if;
 for q in select value from jsonb_array_elements(p_questions) loop
  a := p_answers->(q->>'id');
  if a is null or a='null'::jsonb or a='""'::jsonb or a='[]'::jsonb then
    if (q->>'required')::boolean then raise exception 'Answer the required question: %',q->>'label'; end if;
    continue;
  end if;
  if q->>'type'='text' and (jsonb_typeof(a)<>'string' or length(trim(a #>> '{}')) not between 1 and 4000)
    or q->>'type'='boolean' and jsonb_typeof(a)<>'boolean'
    or q->>'type'='single' and (jsonb_typeof(a)<>'string' or not (q->'options' @> jsonb_build_array(a))) then
    raise exception 'Invalid answer: %',q->>'label'; end if;
  if q->>'type'='multiple' then
    if jsonb_typeof(a)<>'array' then raise exception 'Choose valid options.'; end if;
    if not (q->'options' @> a) or (select count(*)<>count(distinct x) from jsonb_array_elements(a) x) then
      raise exception 'Choose valid unique options.'; end if;
  end if;
 end loop;
end $$;
create function registration_private.requirements(p_trip uuid,p_user uuid) returns text[]
language plpgsql stable security definer set search_path = '' as $$
declare s public.trip_registration_settings; r public.registration_responses; reasons text[] := '{}'; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 select * into r from public.registration_responses where trip_id=p_trip and user_id=p_user;
 if r.form_version is distinct from s.form_version then reasons:=array_append(reasons,'Complete the current registration form.'); end if;
 if s.emergency_required and (coalesce(length(trim(r.emergency_contact->>'name')),0)<2
   or coalesce(length(trim(r.emergency_contact->>'phone')),0)<7
   or coalesce(length(trim(r.emergency_contact->>'relationship')),0)<1) then
    reasons:=array_append(reasons,'Confirm an emergency contact name, relationship, and phone number.'); end if;
 if s.waiver_required and not exists(select 1 from public.registration_signatures where
    trip_id=p_trip and (user_id=p_user or user_id in (select secondary_id from public.registration_account_merges where primary_id=p_user)) and waiver_id=s.waiver_id) then
    reasons:=array_append(reasons,'Read and sign the required waiver.'); end if;
 return reasons;
end $$;
create function public.declare_registration_age(p_adult boolean) returns void
language plpgsql security definer set search_path = '' as $$ begin
 if auth.uid() is null then raise exception 'Sign in required.'; end if;
 insert into public.account_age_declarations(user_id,is_18_or_older,source)
 values(auth.uid(),p_adult,'trip_registration') on conflict(user_id) do nothing;
 if exists(select 1 from public.account_age_declarations where user_id=auth.uid() and is_18_or_older<>p_adult) then
   raise exception 'An age declaration already exists. Contact an officer to correct it.'; end if;
end $$;
revoke all on function public.declare_registration_age(boolean) from public,anon;
grant execute on function public.declare_registration_age(boolean) to authenticated;

create function registration_private.trip_guard() returns trigger language plpgsql security definer set search_path = '' as $$
declare s public.trip_registration_settings; occupied integer; r record; begin
 select * into s from public.trip_registration_settings where trip_id=old.id;
 if s.enabled and new.is_all_day and new.rsvp_deadline is null then
   raise exception 'Set an explicit registration deadline for a trip with a TBA start time.'; end if;
 perform registration_private.expire_offers(old.id);
 select count(*) into occupied from public.trip_rsvps where trip_id=old.id and registration_state in ('confirmed','offered');
 if new.capacity is not null and new.capacity<occupied and new.capacity is distinct from old.capacity then
  raise exception 'Capacity cannot be lower than confirmed and reserved seats.'; end if;
 if new.rsvp_deadline is not null and new.rsvp_deadline>new.starts_at then raise exception 'Registration must close by the trip start.'; end if;
 if exists(select 1 from public.registration_offers where trip_id=old.id and status='pending'
   and expires_at>coalesce(new.rsvp_deadline,new.starts_at)) then
   raise exception 'Revoke outstanding offers before moving the deadline earlier.'; end if;
 if new.lifecycle_status<>old.lifecycle_status and new.lifecycle_status in ('canceled','archived') then
   update public.trip_registration_settings set enabled=false,revision=revision+1 where trip_id=old.id;
   update public.registration_offers set status='revoked',resolved_at=now() where trip_id=old.id and status='pending';
   for r in select user_id from public.trip_rsvps where trip_id=old.id and registration_state in ('confirmed','offered','waitlisted','legacy_review') loop
     if new.lifecycle_status='canceled' then
       update public.trip_rsvps set registration_state='cancelled',status='not_going',revision=revision+1 where trip_id=old.id and user_id=r.user_id;
       perform registration_private.event(old.id,r.user_id,'trip_canceled');
     else
       update public.trip_rsvps set registration_state='waitlisted',status='waitlisted',revision=revision+1
         where trip_id=old.id and user_id=r.user_id and registration_state='offered';
     end if;
   end loop;
 elsif (new.starts_at,new.ends_at,new.location_public) is distinct from (old.starts_at,old.ends_at,old.location_public) then
   for r in select user_id from public.trip_rsvps where trip_id=old.id and registration_state in ('confirmed','offered','waitlisted') loop
     perform registration_private.event(old.id,r.user_id,'trip_changed');
   end loop;
 end if;
 return new;
end $$;
create trigger registration_trip_guard before update on public.trips
for each row execute function registration_private.trip_guard();
