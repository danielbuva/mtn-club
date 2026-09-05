-- Keep every applicable opt-out in the same transaction as registration ownership.
-- The application-level profile merge may run later or retry after interruption.
alter function public.merge_trip_registrations(uuid,uuid) set schema registration_private;
revoke all on function registration_private.merge_trip_registrations(uuid,uuid) from public,anon,authenticated,service_role;
create function public.merge_trip_registrations(p_primary uuid,p_secondary uuid) returns void
language plpgsql security definer set search_path='' as $$
declare lock_user uuid; opted_out jsonb; begin
 for lock_user in select u from unnest(array[p_primary,p_secondary]) u order by u loop
  perform pg_advisory_xact_lock(hashtextextended('email-preferences:'||lock_user,0));
 end loop;
 perform registration_private.merge_trip_registrations(p_primary,p_secondary);
 select coalesce(jsonb_object_agg(key,value),'{}') into opted_out
 from public.profile_private p, lateral jsonb_each(coalesce(p.notification_settings,'{}')) prefs
 where p.user_id in (p_primary,p_secondary)
 and key in ('email','tripUpdates','tripReminders','announcements','general','memberStories','safetyAlerts') and value='false'::jsonb;
 -- An older announcement opt-out also disabled reminders before they had a separate choice.
 if exists(select 1 from public.profile_private where user_id in (p_primary,p_secondary)
  and notification_settings->'announcements'='false'::jsonb
  and registration_private.preference_boolean(notification_settings,'tripReminders',null) is null) then
  opted_out:=opted_out||'{"tripReminders":false}';
 end if;
 if exists(select 1 from public.mailing_list_subscriptions where user_id in (p_primary,p_secondary) and not subscribed) then
  opted_out:=opted_out||'{"announcements":false,"general":false,"memberStories":false}';
  update public.mailing_list_subscriptions set subscribed=false,subscribed_at=null,
   unsubscribed_at=coalesce(unsubscribed_at,now()),updated_at=now() where user_id=p_primary;
 end if;
 update public.profile_private set notification_settings=coalesce(notification_settings,'{}')||opted_out,updated_at=now() where user_id=p_primary;
 insert into public.profile_email_consent_events(user_id,preferences)
 values(p_primary,registration_private.email_preferences(p_primary));
end $$;
revoke all on function public.merge_trip_registrations(uuid,uuid) from public,anon,authenticated;
grant execute on function public.merge_trip_registrations(uuid,uuid) to service_role;
