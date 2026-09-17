-- Transactional fixtures: never committed, so no real email can leave the queue.
begin;
create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'Assertion failed: %',message; end if; end $$;
do $$
declare trip uuid:=gen_random_uuid(); owner_id uuid:=gen_random_uuid(); follower uuid:=gen_random_uuid();
 general_user uuid:=gen_random_uuid(); both_user uuid:=gen_random_uuid(); neither uuid:=gen_random_uuid(); opted_out uuid:=gen_random_uuid();
 job record; prepared jsonb; n integer;
begin
 insert into auth.users(id,email) select u,u||'@example.test' from unnest(array[owner_id,follower,general_user,both_user,neither,opted_out]) u;
 insert into public.profile_private(user_id,notification_settings) values
 (follower,'{"email":true,"tripUpdates":false}'),(general_user,'{"email":true,"announcements":true,"tripUpdates":false}'),
 (both_user,'{"email":true,"announcements":true}'),(neither,'{"email":true}'),(opted_out,'{"email":false,"announcements":true}')
 on conflict(user_id) do update set notification_settings=excluded.notification_settings;
 insert into public.mailing_list_subscriptions(user_id,email,subscribed,consent_source,subscribed_at)
 select u,u||'@example.test',true,'account_settings',now() from unnest(array[general_user,both_user,opted_out]) u;
 insert into public.trips(id,title,starts_at,ends_at,created_by,visibility,lifecycle_status)
 values(trip,'Registration opening test',now()+interval '3 days',now()+interval '4 days',null,'public','published');
 insert into public.trip_update_followers(trip_id,user_id) select trip,u from unnest(array[follower,both_user,opted_out]) u;
 update public.club_admin_settings set registration_enabled=true where id;
 update public.trip_registration_settings set enabled=true where trip_id=trip;
 select count(*) into n from public.registration_notifications where trip_id=trip and kind='registration_opened' and user_id=any(array[follower,general_user,both_user,neither,opted_out]);
 perform pg_temp.assert_true(n=3,'follower OR announcement opt-in; overlap deduped, master opt-out excluded');
 update public.trip_registration_settings set enabled=true where trip_id=trip;
 perform pg_temp.assert_true((select count(*)=3 from public.registration_notifications where trip_id=trip and user_id=any(array[follower,general_user,both_user,neither,opted_out])),'unchanged save does not duplicate');
 for job in select * from public.registration_notifications where trip_id=trip loop
  update public.registration_notifications set status='sending',lease_token=gen_random_uuid(),leased_until=now()+interval '2 minutes' where id=job.id returning * into job;
  prepared:=public.prepare_registration_notification(job.id,job.lease_token);
  perform pg_temp.assert_true(prepared->>'kind'='registration_opened','eligible follower/general recipient prepared');
 end loop;
 delete from public.trip_update_followers where trip_id=trip and user_id=follower;
 select * into job from public.registration_notifications where trip_id=trip and user_id=follower;
 perform pg_temp.assert_true(public.prepare_registration_notification(job.id,job.lease_token) is null,'unfollow before delivery suppresses');
 update public.profile_private set notification_settings='{"email":false,"announcements":true}' where user_id=general_user;
 select * into job from public.registration_notifications where trip_id=trip and user_id=general_user;
 perform pg_temp.assert_true(public.prepare_registration_notification(job.id,job.lease_token) is null,'opt-out before delivery suppresses');
 update public.trip_registration_settings set enabled=false where trip_id=trip;
 select * into job from public.registration_notifications where trip_id=trip and user_id=both_user;
 perform pg_temp.assert_true(public.prepare_registration_notification(job.id,job.lease_token) is null,'closed trip suppresses queued email');
 update public.trip_registration_settings set enabled=true where trip_id=trip;
 perform pg_temp.assert_true((select count(*)=4 from public.registration_notifications where trip_id=trip and user_id=any(array[follower,general_user,both_user,neither,opted_out])),'reopening creates one new email for remaining eligible recipient');
 update public.trip_registration_settings set enabled=false where trip_id=trip;
 update public.trips set rsvp_deadline=now()-interval '1 hour' where id=trip;
 update public.trip_registration_settings set enabled=true where trip_id=trip;
 perform pg_temp.assert_true((select count(*)=4 from public.registration_notifications where trip_id=trip and user_id=any(array[follower,general_user,both_user,neither,opted_out])),'expired registration never announces');
 update public.trips set rsvp_deadline=now()+interval '1 day' where id=trip;
 perform pg_temp.assert_true((select count(*)=5 from public.registration_notifications where trip_id=trip and user_id=any(array[follower,general_user,both_user,neither,opted_out])),'extended deadline reopens registration');
 perform pg_temp.assert_true(not has_function_privilege('anon','public.set_trip_update_following(uuid,boolean)','execute'),'anonymous callers cannot follow');
 perform pg_temp.assert_true(not has_function_privilege('authenticated','public.prepare_registration_notification(uuid,uuid)','execute'),'queue remains service-only');
end $$;
rollback;
