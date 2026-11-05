-- Published drafts are deleted, so their original visibility intent cannot be
-- recovered. Fail closed for every legacy minimal trip/draft. Operators can
-- explicitly restore public visibility after reviewing historical intent.
update public.trips set visibility = 'leaders' where visibility = 'minimal';
update public.trip_drafts set visibility = 'leaders' where visibility = 'minimal';
alter table public.trips add constraint trips_no_legacy_minimal
  check (visibility <> 'minimal');
alter table public.trip_drafts add constraint trip_drafts_no_legacy_minimal
  check (visibility <> 'minimal');

-- This definer lookup avoids recursion through trip_leaders RLS. Retain the
-- existing helper's signature because policies and registration functions use it.
create or replace function public.can_view_trip(p_trip_id uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t where t.id = p_trip_id and (
      case when t.visibility in ('leaders', 'minimal') then
        p_uid is not null and (
          public.has_trip_admin_capability(p_uid, 'trips.read', t.id)
          or public.has_trip_admin_capability(p_uid, 'trips.update', t.id)
          or exists (select 1 from public.trip_leaders l
            where l.trip_id = t.id and l.user_id = p_uid)
        )
      else
        t.visibility = 'public'
        or public.is_staff_or_admin(p_uid)
        or public.is_active_member(p_uid)
        or exists (select 1 from public.trip_leaders l
          where l.trip_id = t.id and l.user_id = p_uid)
        or exists (select 1 from public.trip_rsvps r
          where r.trip_id = t.id and r.user_id = p_uid and r.status <> 'removed')
      end
    )
  );
$$;

create or replace function public.can_manage_trip(p_trip_id uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_trip_admin_capability(p_uid, 'trips.update', p_trip_id)
    or exists (
      select 1 from public.trips t where t.id = p_trip_id
        and t.created_by = p_uid and not t.is_official
        and public.is_active_member(p_uid) and not public.is_banned(p_uid)
        and (t.visibility not in ('leaders', 'minimal')
          or public.can_view_trip(t.id, p_uid))
    );
$$;

create or replace function public.can_view_trip_private(p_trip_id uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t where t.id = p_trip_id
      and (t.visibility not in ('leaders', 'minimal')
        or public.can_view_trip(t.id, p_uid))
      and (
        public.has_trip_admin_capability(p_uid, 'trips.read', t.id)
        or public.is_staff_or_admin(p_uid)
        or public.is_active_member(p_uid)
        or exists (select 1 from public.trip_leaders l
          where l.trip_id = t.id and l.user_id = p_uid)
        or exists (select 1 from public.trip_rsvps r
          where r.trip_id = t.id and r.user_id = p_uid
            and r.status in ('invited', 'going', 'maybe', 'waitlisted'))
      )
  );
$$;

drop policy trips_select_public on public.trips;
create policy trips_select_public on public.trips for select
to anon, authenticated using (visibility = 'public');

-- Gallery publication remains independent of ordinary member-trip visibility.
-- Only leaders trips require the caller's trip assignment/capability. Keep the
-- definer lookup in the existing non-exposed schema; it returns no trip data.
create or replace function registration_private.can_view_trip_gallery(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t where t.id = p_trip
      and (t.visibility not in ('leaders', 'minimal')
        or (auth.uid() is not null and public.can_view_trip(t.id, auth.uid())))
  );
$$;
revoke all on function registration_private.can_view_trip_gallery(uuid) from public, anon, authenticated, service_role;
grant execute on function registration_private.can_view_trip_gallery(uuid) to anon, authenticated;

-- Gallery permissions alone must not reveal a leaders trip via its photos.
create policy gallery_photos_trip_access on public.gallery_photos
as restrictive for select to anon, authenticated
using (trip_id is null or registration_private.can_view_trip_gallery(trip_id));

-- Definer RPCs must not let historical RSVPs or guardian permissions bypass
-- leaders visibility. Preserve the existing registration workflow otherwise.
CREATE OR REPLACE FUNCTION public.get_trip_registration(p_trip_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t public.trips; s public.trip_registration_settings; r public.trip_rsvps; o public.registration_offers;
 uid uuid:=auth.uid(); reasons text[]; requirements text[]; available text; actions text[]:='{}'; state text;
 confirmed integer; reserved integer; queued integer; manager boolean; global_enabled boolean; close_at timestamptz;
begin
 select * into t from public.trips where id=p_trip_id;
 if not found then raise exception 'Trip not found.'; end if;
 if t.visibility in ('leaders', 'minimal') and not public.can_view_trip(p_trip_id, uid) then
   raise exception 'Trip not available.'; end if;
 manager:=registration_private.can_manage(p_trip_id);
 if not public.can_view_trip_readonly(p_trip_id) and not manager and not registration_private.can_review_guardian(p_trip_id) and not exists(
   select 1 from public.trip_rsvps where trip_id=p_trip_id and user_id=uid) then raise exception 'Trip not available.'; end if;
 select * into s from public.trip_registration_settings where trip_id=p_trip_id;
 if s.annual_waiver then s.waiver_id:=registration_private.trip_waiver(p_trip_id); end if;
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
   when now()>=least(close_at,t.starts_at) then 'closed' when t.registration_opens_at>now() then 'disabled' when not s.enabled or not coalesce(global_enabled,false) then 'disabled'
   when t.capacity is not null and confirmed+reserved>=t.capacity or queued>0 then case when t.waitlist_enabled then 'waitlist' else 'full' end
   else 'open' end;
 if uid is not null then
  if state in ('none','maybe','cancelled','incomplete') and available in ('open','waitlist') then actions:=actions||array['register','begin_signup','save_draft','set_maybe','set_not_going']; end if;
  if state in ('incomplete','confirmed','waitlisted','offered','legacy_review') and now()<t.starts_at then actions:=array_append(actions,'cancel'); end if;
  if state='offered' and o.id is not null and now()<close_at and t.lifecycle_status='published' then actions:=actions||array['accept_offer','decline_offer']; end if;
  if state in ('confirmed','waitlisted','offered','legacy_review') and now()<t.starts_at and t.lifecycle_status='published' then actions:=array_append(actions,'update_response'); end if;
 end if;
 return jsonb_build_object(
  'tripId',t.id,'title',t.title,'startAt',t.starts_at,'endAt',t.ends_at,'timeZone',t.time_zone,
  'opensAt',t.registration_opens_at,'availability',available,'closeAt',close_at,'eligibility',s.eligibility,'eligibilityReasons',reasons,
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
 'annualWaiver',s.annual_waiver,
 'waiverApplicable',coalesce((select array_remove(d.activity_scope,'none')<@w.activity_scope from public.registration_risk_disclosures d join public.registration_waivers w on w.id=s.waiver_id where d.id=s.risk_disclosure_id),false),
 'waiverReason',case when s.annual_waiver and s.waiver_required then registration_private.waiver_reason(p_trip_id,uid) end,
 'waiverCoverage',(select jsonb_build_object('from',effective_from,'until',effective_until,'activities',activity_scope)
 from public.registration_waivers where id=s.waiver_id and trip_id is null),
 'informedRisks',(select jsonb_build_object('id',d.id,'revision',d.revision,'statements',d.statements,'activities',d.activity_scope)
 from public.registration_risk_disclosures d where d.id=s.risk_disclosure_id),
 'risksAcknowledged',exists(select 1 from public.registration_risk_acknowledgements where disclosure_id=s.risk_disclosure_id and registration_private.owns_record(uid,user_id)),



 'emailUpdates',registration_private.joining_email_updates(uid),
 'emailAllowed',(registration_private.email_preferences(uid)->>'email')::boolean,
 'defaultShowInAttendeeList',coalesce((select show_in_attendee_lists from public.user_preferences where user_id=uid),false),
 'showInAttendeeList',coalesce(
  (select show_in_attendee_list from public.registration_responses where trip_id=p_trip_id and user_id=uid
   and state not in ('none','incomplete','maybe','not_going')),
  (select show_in_attendee_lists from public.user_preferences where user_id=uid),false),
 'collectTransportation',coalesce(s.collect_transportation,false),
 'transportation',(select transportation from public.registration_responses where trip_id=p_trip_id and user_id=uid),
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

 and exists(select 1 from public.registration_responses visible_response
  where visible_response.trip_id=a.trip_id and visible_response.user_id=a.user_id and visible_response.show_in_attendee_list)
 and (manager or coalesce(pp.privacy_settings->'profileVisible','true')<>'false'::jsonb)),'[]') else '[]'::jsonb end
 );
end $function$;

CREATE OR REPLACE FUNCTION public.get_registration_summaries(p_trip_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb:='[]'; t public.trips; s public.trip_registration_settings; state text;
 confirmed integer; reserved integer; queued integer; available text; begin
 if cardinality(p_trip_ids)>200 then raise exception 'Request at most 200 trips.'; end if;
 for t in select * from public.trips where id=any(p_trip_ids) loop
   if t.visibility in ('leaders', 'minimal') and not public.can_view_trip(t.id, auth.uid()) then
     raise exception 'Trip not available.'; end if;
   if not public.can_view_trip_readonly(t.id) and not registration_private.can_manage(t.id) and not exists(
     select 1 from public.trip_rsvps where trip_id=t.id and user_id=auth.uid()) then raise exception 'Trip not available.'; end if;
   select * into s from public.trip_registration_settings where trip_id=t.id;
   select count(*) filter(where registration_state='confirmed'),count(*) filter(where registration_state in ('waitlisted','legacy_review','offered'))
     into confirmed,queued from public.trip_rsvps where trip_id=t.id;
   select count(*) into reserved from public.registration_offers where trip_id=t.id and status='pending' and expires_at>now();
   queued:=queued-reserved;
   select registration_state into state from public.trip_rsvps where trip_id=t.id and user_id=auth.uid();
   state:=coalesce(state,'none');
   if state='offered' and not exists(select 1 from public.registration_offers where trip_id=t.id
     and user_id=auth.uid() and status='pending' and expires_at>now()) then state:='waitlisted'; end if;
   available:=case when t.lifecycle_status<>'published' then t.lifecycle_status::text
     when now()>=least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at)) then 'closed' when t.registration_opens_at>now() then 'disabled'
     when not s.enabled or not coalesce((select registration_enabled from public.club_admin_settings where id),false) then 'disabled'
     when (t.capacity is not null and confirmed+reserved>=t.capacity) or queued>0 then case when t.waitlist_enabled then 'waitlist' else 'full' end
     else 'open' end;
   result:=result||jsonb_build_array(jsonb_build_object('tripId',t.id,'confirmedCount',confirmed,
    'reservedCount',reserved,'availability',available,'state',state,'requirements',case when auth.uid() is null then array[]::text[] else registration_private.requirements(t.id,auth.uid()) end));
 end loop;
 return result;
end $function$;

CREATE OR REPLACE FUNCTION public.get_my_registrations()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select coalesce(jsonb_agg(public.get_trip_registration(t.id) order by t.starts_at),'[]')
 from public.trip_rsvps r join public.trips t on t.id=r.trip_id
 where (t.visibility not in ('leaders', 'minimal') or public.can_view_trip(t.id, auth.uid()))
 and r.user_id=auth.uid() and (t.ends_at>now() or t.starts_at>now()-interval '90 days');
$function$;

CREATE OR REPLACE FUNCTION public.get_trip_guardian_requests()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'membership.confirm_guardian') then
   raise exception 'Guardian review permission required.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('tripId',t.id,'title',t.title,'userId',r.user_id,
   'name',coalesce(p.display_name,'Participant'),'revision',r.revision,'waiverId',w.id,'waiverTitle',w.title,'waiverVersion',w.version,'waiverBody',w.body)
   order by t.starts_at,r.created_at)
 from public.trip_rsvps r join public.trips t on t.id=r.trip_id
 join public.trip_registration_settings s on s.trip_id=t.id
 left join public.registration_waivers w on w.id=registration_private.trip_waiver(t.id)
 left join public.profiles p on p.user_id=r.user_id
 where (t.visibility not in ('leaders', 'minimal') or public.can_view_trip(t.id, auth.uid()))
 and t.lifecycle_status='published' and t.starts_at>now() and r.registration_state not in ('cancelled','removed_by_organizer')
 and 'An officer must confirm guardian consent for this trip.'=any(registration_private.eligibility(t.id,r.user_id))),'[]');
end $function$;

CREATE OR REPLACE FUNCTION public.prepare_registration_notification(p_id uuid, p_lease uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare n public.registration_notifications; t public.trips; e public.registration_events; address text; state text; begin
 select * into n from public.registration_notifications where id=p_id for update;
 if n.status<>'sending' or n.lease_token is distinct from p_lease or n.leased_until<=now() then return null; end if;
 select * into t from public.trips where id=n.trip_id;
 if t.visibility in ('leaders', 'minimal') and not public.can_view_trip(t.id, n.user_id) then
   update public.registration_notifications set status='suppressed',error_code='trip_access_revoked',updated_at=now() where id=p_id;
   return null;
 end if;
 select * into e from public.registration_events where id=n.event_id;
 select registration_state into state from public.trip_rsvps where trip_id=n.trip_id and user_id=n.user_id;
 if (n.kind='registration_opened' and not registration_private.open_email_enabled(n.trip_id,n.user_id))
 or (n.kind<>'registration_opened' and not registration_private.email_enabled(n.user_id,n.kind)) then
   update public.registration_notifications set status='suppressed',error_code='email_opt_out',updated_at=now() where id=p_id; return null;
 end if;
 if (n.kind='registration_opened' and (t.lifecycle_status<>'published'
     or t.registration_opens_at>now() or least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))<=now()
     or not coalesce((select enabled from public.trip_registration_settings where trip_id=t.id),false)
     or not coalesce((select registration_enabled from public.club_admin_settings where id),false)
     or exists(select 1 from public.registration_events newer where newer.trip_id=t.id
       and newer.kind='registration_opened' and newer.created_at>e.created_at)))
   or (n.kind='offered' and not exists(select 1 from public.registration_offers where id=(e.details->>'offerId')::uuid
      and status='pending' and expires_at>now()))
   or (n.kind in ('confirmed','reminder') and (state is distinct from 'confirmed' or t.lifecycle_status<>'published'))
   or (n.kind='waitlisted' and state is distinct from 'waitlisted')
   or (n.kind='offer_expired' and state is distinct from 'waitlisted')
   or (n.kind='incomplete_reminder' and (state is distinct from 'incomplete' or t.lifecycle_status<>'published'
     or t.registration_opens_at>now() or least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))<=now()
     or not coalesce((select enabled from public.trip_registration_settings where trip_id=t.id),false)
     or not coalesce((select registration_enabled from public.club_admin_settings where id),false)))
   or (n.kind in ('reminder','incomplete_reminder') and (t.starts_at<=now() or (e.details->>'startAt')::timestamptz is distinct from t.starts_at))
   or (n.kind='trip_changed' and t.lifecycle_status<>'published') then
   update public.registration_notifications set status='obsolete',updated_at=now() where id=p_id; return null;
 end if;
 select email into address from auth.users where id=n.user_id;
 if address is null then
   update public.registration_notifications set status='failed',error_code='no_email',updated_at=now() where id=p_id; return null;
 end if;
 return jsonb_build_object('id',n.id,'tripId',t.id,'title',t.title,'kind',n.kind,'email',address,
   'startAt',t.starts_at,'timeZone',t.time_zone,
   'offerExpiresAt',(select expires_at from public.registration_offers where id=(e.details->>'offerId')::uuid));
end $function$;
