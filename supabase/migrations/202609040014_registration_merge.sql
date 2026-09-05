alter table public.registration_responses drop constraint registration_responses_trip_id_user_id_fkey;
alter table public.registration_responses add foreign key(trip_id,user_id) references public.trip_rsvps(trip_id,user_id) on update cascade;
alter table public.registration_offers drop constraint registration_offers_trip_id_user_id_fkey;
alter table public.registration_offers add foreign key(trip_id,user_id) references public.trip_rsvps(trip_id,user_id) on update cascade;

create function public.merge_trip_registrations(p_primary uuid,p_secondary uuid) returns void
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
 insert into public.registration_guardian_reviews(trip_id,user_id,waiver_id,reviewer_id,evidence,reviewed_at)
   select trip_id,p_primary,waiver_id,reviewer_id,evidence,reviewed_at from public.registration_guardian_reviews where user_id=p_secondary on conflict do nothing;
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
