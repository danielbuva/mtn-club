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
   insert into public.registration_waivers(trip_id,version,title,body)
   values(p_trip_id,coalesce((select max(version)+1 from public.registration_waivers where trip_id=p_trip_id),1),
     trim(p_data->>'waiverTitle'),p_data->>'waiverBody') returning id into waiver;
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

create or replace function public.set_registration_enabled(p_enabled boolean) returns void
language plpgsql security definer set search_path = '' as $$ begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'settings.update') then
   raise exception 'Settings permission required.'; end if;
 insert into public.club_admin_settings(id,registration_enabled) values(true,p_enabled)
 on conflict(id) do update set registration_enabled=excluded.registration_enabled;
 perform public.record_admin_activity(auth.uid(),null,'registration_switch','settings','registration',
   case when p_enabled then 'Registration enabled.' else 'New registration paused.' end,null,null,'succeeded');
end $$;
revoke all on function public.set_registration_enabled(boolean) from public,anon;
grant execute on function public.set_registration_enabled(boolean) to authenticated;

create or replace function public.registration_operations() returns jsonb
language plpgsql stable security definer set search_path = '' as $$ begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'settings.read') then raise exception 'Settings permission required.'; end if;
 return jsonb_build_object('enabled',coalesce((select registration_enabled from public.club_admin_settings where id),false),
 'health',(select to_jsonb(h) from public.registration_worker_health h where id),
 'pending',(select count(*) from public.registration_notifications where status in ('pending','sending')),
 'oldestPending',(select min(created_at) from public.registration_notifications where status in ('pending','sending')),
 'failures',coalesce((select jsonb_agg(x) from (select id,trip_id,kind,status,error_code,updated_at from public.registration_notifications
   where status in ('failed','bounced') order by updated_at desc limit 100) x),'[]'));
end $$;
revoke all on function public.registration_operations() from public,anon;
grant execute on function public.registration_operations() to authenticated;

-- Private meetup changes also produce a durable trip-change notification.
create function registration_private.meetup_changed() returns trigger language plpgsql security definer set search_path = '' as $$
declare r record; begin
 if new.meetup_point is distinct from old.meetup_point then
   perform id from public.trips where id=new.trip_id for update;
   for r in select user_id from public.trip_rsvps where trip_id=new.trip_id and registration_state in ('confirmed','offered','waitlisted') loop
     perform registration_private.event(new.trip_id,r.user_id,'trip_changed');
   end loop;
 end if;
 return new;
end $$;
create trigger registration_meetup_changed after update on public.trip_private
for each row execute function registration_private.meetup_changed();
