create table public.registration_annual_guardian_requests (
 user_id uuid not null references auth.users(id), waiver_id uuid not null references public.registration_waivers(id),
 requested_at timestamptz not null default now(), primary key(user_id,waiver_id)
);
alter table public.registration_annual_guardian_requests enable row level security;
revoke all on public.registration_annual_guardian_requests from public,anon,authenticated,service_role;
create trigger annual_guardian_request_immutable before update or delete on public.registration_annual_guardian_requests for each row execute function registration_private.immutable_document();
create function public.request_annual_guardian_review(p_waiver uuid) returns void
language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) then raise exception 'Sign in required.'; end if;
 if p_waiver is distinct from registration_private.current_annual_waiver(current_date) then raise exception 'Review the current annual waiver.'; end if;
 if not exists(select 1 from public.account_age_declarations where user_id=auth.uid() and not is_18_or_older)
 and not exists(select 1 from public.membership_applications where user_id=auth.uid() and age_status='minor') then raise exception 'Declare your age before requesting guardian review.'; end if;
 insert into public.registration_annual_guardian_requests(user_id,waiver_id) values(auth.uid(),p_waiver) on conflict do nothing;
end $$;
create function public.verify_annual_guardian(p_waiver uuid,p_user uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; w public.registration_waivers; document jsonb:=p_data->'guardianDocument'; lock_user uuid; begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'membership.confirm_guardian') then raise exception 'Guardian verification permission required.'; end if;
 for lock_user in select distinct u from unnest(array[auth.uid(),p_user]) u order by u loop perform pg_advisory_xact_lock(hashtextextended('registration-account:'||lock_user,0)); end loop;
 perform pg_advisory_xact_lock(hashtextextended('annual-waiver-publication',0));
 if exists(select 1 from public.registration_account_merges where secondary_id=p_user) then raise exception 'Use the retained account for guardian verification.'; end if;
 select * into w from public.registration_waivers where id=p_waiver;
 if p_waiver is distinct from registration_private.current_annual_waiver(current_date) or w.id is null then raise exception 'Verify the current annual document.'; end if;
 if not exists(select 1 from public.registration_annual_guardian_requests where waiver_id=p_waiver and registration_private.owns_record(p_user,user_id))
 and not exists(select 1 from public.trip_rsvps r join public.trip_registration_settings s on s.trip_id=r.trip_id where r.user_id=p_user and s.annual_waiver) then raise exception 'Guardian review request not found.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>10000
 or coalesce(length(trim(document->>'guardianName')),0) not between 2 and 200
 or coalesce(length(trim(document->>'reference')),0) not between 5 and 1000
 or coalesce(document->>'signedOn','') !~ '^\d{4}-\d{2}-\d{2}$'
 or (document->>'signedOn')::date not between w.effective_from and least(current_date,w.effective_until)
 or document->'verified' is distinct from 'true'::jsonb
 or coalesce(length(trim(p_data->>'evidence')),0) not between 5 and 2000 then raise exception 'Verify guardian identity, authority, signature, date, completed form, and retained document reference.'; end if;
 result:=registration_private.annual_signature(w.id,p_user,current_date,current_date,clock_timestamp());
 if result is null then
 insert into public.registration_signatures(user_id,original_signer_id,waiver_id,signature_name,signer_kind,signer_details,valid_from,valid_until)
 values(p_user,p_user,w.id,document->>'guardianName','guardian',document||jsonb_build_object('reviewerId',auth.uid(),'reviewedAt',now(),'evidence',p_data->>'evidence'),current_date,w.effective_until) returning id into result;
 end if;
 return result;
end $$;
create function public.get_annual_guardian_requests() returns jsonb
language plpgsql stable security definer set search_path='' as $$ begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'membership.confirm_guardian') then raise exception 'Guardian verification permission required.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('userId',coalesce(m.primary_id,r.user_id),'name',coalesce(p.display_name,'Participant'),
 'waiverId',w.id,'waiverTitle',w.title,'waiverVersion',w.version,'waiverBody',w.body))
 from public.registration_annual_guardian_requests r join public.registration_waivers w on w.id=r.waiver_id
 left join public.registration_account_merges m on m.secondary_id=r.user_id
 left join public.profiles p on p.user_id=coalesce(m.primary_id,r.user_id)
 where w.id=registration_private.current_annual_waiver(current_date)
 and registration_private.annual_signature(w.id,coalesce(m.primary_id,r.user_id),current_date,current_date) is null),'[]');
end $$;
-- For completed annual trips, evaluate publications and withdrawals at the trip's start.
create or replace function registration_private.trip_waiver(p_trip uuid) returns uuid
language sql stable security definer set search_path='' as $$
 select case when s.annual_waiver then (select w.id from public.registration_waivers w join public.registration_waiver_publications p on p.waiver_id=w.id
 where w.trip_id is null and (t.starts_at at time zone t.time_zone)::date between w.effective_from and w.effective_until
 and p.published_at<=least(clock_timestamp(),t.starts_at) order by p.published_at desc,w.version desc limit 1) else s.waiver_id end
 from public.trip_registration_settings s join public.trips t on t.id=s.trip_id where s.trip_id=p_trip;
$$;
do $migration$ declare definition text; begin
 select pg_get_functiondef('registration_private.waiver_complete(uuid,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'(t.ends_at at time zone t.time_zone)::date) is not null','(t.ends_at at time zone t.time_zone)::date,least(clock_timestamp(),t.starts_at)) is not null');
 execute definition;
end $migration$;
revoke all on function public.request_annual_guardian_review(uuid),public.verify_annual_guardian(uuid,uuid,jsonb),public.get_annual_guardian_requests() from public,anon,service_role;
grant execute on function public.request_annual_guardian_review(uuid),public.verify_annual_guardian(uuid,uuid,jsonb),public.get_annual_guardian_requests() to authenticated,postgres;
-- An old trip-specific guardian review must never satisfy a new annual version.
create or replace function registration_private.eligibility(p_trip uuid,p_user uuid) returns text[]
language plpgsql stable security definer set search_path='' as $$
declare s public.trip_registration_settings; reasons text[]:='{}'; adult boolean; minor boolean; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 if p_user is null then return array['Sign in to register.']; end if;
 if registration_private.blocked(p_user) then reasons:=array_append(reasons,'Your account cannot register. Contact the club.'); end if;
 if s.eligibility='members' and not public.is_active_member(p_user) then reasons:=array_append(reasons,'An active membership is required.'); end if;
 select is_18_or_older into adult from public.account_age_declarations where user_id=p_user;
 select age_status='minor' into minor from public.membership_applications where user_id=p_user;
 if coalesce(minor,false) or adult=false then
   if s.annual_waiver and s.waiver_required then
     if not registration_private.waiver_complete(p_trip,p_user) then reasons:=array_append(reasons,'An officer must confirm guardian consent for this trip.'); end if;
   elsif not exists(select 1 from public.registration_guardian_reviews g where g.trip_id=p_trip and registration_private.owns_record(p_user,g.user_id)
     and g.waiver_id is not distinct from case when s.waiver_required then s.waiver_id end
     and (not s.waiver_required or g.document_details->>'guardianName' is not null))
     and not (not s.waiver_required and exists(select 1 from public.membership_applications where user_id=p_user and age_status='minor' and guardian_consent='confirmed')) then
     reasons:=array_append(reasons,'An officer must confirm guardian consent for this trip.');
   end if;
 elsif adult is distinct from true then reasons:=array_append(reasons,'Declare whether you are 18 or older.'); end if;
 return reasons;
end $$;
