create function public.get_trip_registration(p_trip_id uuid) returns jsonb
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
  'waiver',(select jsonb_build_object('id',w.id,'title',w.title,'body',w.body,'version',w.version)
    from public.registration_waivers w where w.id=s.waiver_id),
  'waiverSigned',exists(select 1 from public.registration_signatures where trip_id=p_trip_id and (user_id=uid or user_id in (select secondary_id from public.registration_account_merges where primary_id=uid)) and waiver_id=s.waiver_id),
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

create function public.get_registration_summaries(p_trip_ids uuid[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb:='[]'; t public.trips; s public.trip_registration_settings; state text;
 confirmed integer; reserved integer; queued integer; available text; begin
 if cardinality(p_trip_ids)>200 then raise exception 'Request at most 200 trips.'; end if;
 for t in select * from public.trips where id=any(p_trip_ids) loop
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
     when now()>=coalesce(t.rsvp_deadline,t.starts_at) then 'closed'
     when not s.enabled or not coalesce((select registration_enabled from public.club_admin_settings where id),false) then 'disabled'
     when (t.capacity is not null and confirmed+reserved>=t.capacity) or queued>0 then case when t.waitlist_enabled then 'waitlist' else 'full' end
     else 'open' end;
   result:=result||jsonb_build_array(jsonb_build_object('tripId',t.id,'confirmedCount',confirmed,
    'reservedCount',reserved,'availability',available,'state',state));
 end loop;
 return result;
end $$;
revoke all on function public.get_registration_summaries(uuid[]) from public;
grant execute on function public.get_registration_summaries(uuid[]) to anon,authenticated;
create function public.get_my_registrations() returns jsonb
language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(public.get_trip_registration(t.id) order by t.starts_at),'[]')
 from public.trip_rsvps r join public.trips t on t.id=r.trip_id
 where r.user_id=auth.uid() and (t.ends_at>now() or t.starts_at>now()-interval '90 days');
$$;
revoke all on function public.get_my_registrations() from public,anon;
grant execute on function public.get_my_registrations() to authenticated;

create function public.get_registration_roster(p_trip_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
 if not registration_private.can_manage(p_trip_id) then raise exception 'Trip management permission required.'; end if;
 return jsonb_build_object('snapshot',public.get_trip_registration(p_trip_id),
 'settings',(select to_jsonb(s) from public.trip_registration_settings s where trip_id=p_trip_id),
 'trip',(select jsonb_build_object('capacity',capacity,'waitlistEnabled',waitlist_enabled,'deadline',rsvp_deadline,'isAllDay',is_all_day)
   from public.trips where id=p_trip_id),
 'rows',coalesce((select jsonb_agg(jsonb_build_object('userId',r.user_id,'name',coalesce(p.display_name,'Participant'),
   'state',case when r.registration_state='offered' and not exists(select 1 from public.registration_offers o
      where o.trip_id=p_trip_id and o.user_id=r.user_id and o.status='pending' and o.expires_at>now()) then 'waitlisted' else r.registration_state end,
   'revision',r.revision,'registeredAt',r.registered_at,'queuedAt',r.queued_at,
   'email',case when pp.privacy_settings->'shareEmail'='true'::jsonb then u.email end,
   'phone',case when pp.privacy_settings->'sharePhone'='true'::jsonb then pp.phone end,
   'emailEnabled',registration_private.email_enabled(r.user_id,'offered'),
   'requirements',registration_private.requirements(p_trip_id,r.user_id)||registration_private.eligibility(p_trip_id,r.user_id),
   'answers',coalesce(a.answers,'{}'),'emergencyContact',coalesce(a.emergency_contact,'{}'),
   'attendance',case att.attended when true then 'present' when false then 'absent' else 'unmarked' end,
   'offers',coalesce((select jsonb_agg(jsonb_build_object('id',id,'status',status,'issuedAt',issued_at,'expiresAt',expires_at) order by issued_at desc)
      from public.registration_offers where trip_id=p_trip_id and user_id=r.user_id),'[]'),
   'delivery',coalesce((select jsonb_agg(x) from (select id,kind,status,created_at as "createdAt",error_code as "errorCode"
      from public.registration_notifications where trip_id=p_trip_id and user_id=r.user_id order by created_at desc limit 10) x),'[]')
 ) order by r.queued_at nulls last,r.registered_at,r.user_id)
 from public.trip_rsvps r left join public.profiles p on p.user_id=r.user_id
 left join public.profile_private pp on pp.user_id=r.user_id left join auth.users u on u.id=r.user_id
 left join public.registration_responses a on a.trip_id=r.trip_id and a.user_id=r.user_id
 left join public.trip_attendance att on att.trip_id=r.trip_id and att.user_id=r.user_id where r.trip_id=p_trip_id),'[]'));
end $$;
revoke all on function public.get_registration_roster(uuid) from public,anon;
grant execute on function public.get_registration_roster(uuid) to authenticated;
create function public.get_my_registration_signatures() returns jsonb
language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('tripId',s.trip_id,'title',w.title,'version',w.version,'body',w.body,
   'signatureName',s.signature_name,'signedAt',s.signed_at) order by s.signed_at desc),'[]')
 from public.registration_signatures s join public.registration_waivers w on w.id=s.waiver_id where s.user_id=auth.uid() or s.user_id in (select secondary_id from public.registration_account_merges where primary_id=auth.uid());
$$;
revoke all on function public.get_my_registration_signatures() from public,anon;
grant execute on function public.get_my_registration_signatures() to authenticated;

create function public.get_trip_guardian_requests() returns jsonb
language plpgsql stable security definer set search_path = '' as $$ begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'membership.confirm_guardian') then
   raise exception 'Guardian review permission required.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('tripId',t.id,'title',t.title,'userId',r.user_id,
   'name',coalesce(p.display_name,'Participant'),'revision',r.revision,'waiverTitle',w.title,'waiverVersion',w.version,'waiverBody',w.body)
   order by t.starts_at,r.created_at)
 from public.trip_rsvps r join public.trips t on t.id=r.trip_id
 join public.trip_registration_settings s on s.trip_id=t.id
 left join public.registration_waivers w on w.id=s.waiver_id
 left join public.profiles p on p.user_id=r.user_id
 where t.lifecycle_status='published' and t.starts_at>now() and r.registration_state not in ('cancelled','removed_by_organizer')
 and 'An officer must confirm guardian consent for this trip.'=any(registration_private.eligibility(t.id,r.user_id))),'[]');
end $$;
revoke all on function public.get_trip_guardian_requests() from public,anon;
grant execute on function public.get_trip_guardian_requests() to authenticated;
