-- Optional trip registration window and elevation; signed waiver records are unchanged.
alter table public.trips add column registration_opens_at timestamptz,
 add column registration_open_announced_at timestamptz,
 add column elevation_ft numeric check(elevation_ft between 0 and 100000),
 add constraint registration_window_valid check(registration_opens_at is null or registration_opens_at < least(starts_at,coalesce(rsvp_deadline,starts_at)));
alter table public.trip_drafts add column registration_opens_at timestamptz,
 add column rsvp_deadline timestamptz, add column elevation_ft numeric check(elevation_ft between 0 and 100000),
 add column registration_enabled boolean not null default false,
 add column waitlist_enabled boolean not null default false;

do $migration$ declare definition text; marker text; begin
select pg_get_functiondef('public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure) into definition;
marker := $marker$close_at:=coalesce(t.rsvp_deadline,t.starts_at);$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$close_at:=least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at));
 if clock_timestamp()>=t.starts_at and p_command<>'attendance' then
   raise exception 'Past trips do not accept registration changes.';
 end if;$patch$);
marker := $marker$if not s.enabled or not coalesce$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$if t.registration_opens_at>clock_timestamp() then raise exception 'Registration is not open yet.'; end if;
   if not s.enabled or not coalesce$patch$);
execute definition;
end $migration$;

do $migration$ declare definition text; marker text; begin
select pg_get_functiondef('public.get_trip_registration(uuid)'::regprocedure) into definition;
marker := $marker$when now()>=close_at then 'closed'$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$when now()>=least(close_at,t.starts_at) then 'closed' when t.registration_opens_at>now() then 'disabled'$patch$);
marker := $marker$'availability',available$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$'opensAt',t.registration_opens_at,'availability',available$patch$);
execute definition;
end $migration$;

do $migration$ declare definition text; marker text; begin
select pg_get_functiondef('public.get_registration_summaries(uuid[])'::regprocedure) into definition;
marker := $marker$when now()>=coalesce(t.rsvp_deadline,t.starts_at) then 'closed'$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$when now()>=least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at)) then 'closed' when t.registration_opens_at>now() then 'disabled'$patch$);
execute definition;
end $migration$;

do $migration$ declare definition text; marker text; begin
select pg_get_functiondef('public.get_registration_roster(uuid)'::regprocedure) into definition;
marker := $marker$'deadline',rsvp_deadline$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$'opensAt',registration_opens_at,'deadline',rsvp_deadline$patch$);
execute definition;
end $migration$;

do $migration$ declare definition text; marker text; begin
select pg_get_functiondef('public.save_registration_settings(uuid,integer,jsonb)'::regprocedure) into definition;
marker := $marker$select * into s from public.trip_registration_settings$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$if t.starts_at<=now() then raise exception 'Past trip registration settings cannot be changed.'; end if;
 select * into s from public.trip_registration_settings$patch$);
marker := $marker$rsvp_deadline=nullif(p_data->>'deadline','')::timestamptz$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$registration_opens_at=case when p_data ? 'opensAt' then nullif(p_data->>'opensAt','')::timestamptz else t.registration_opens_at end,
   rsvp_deadline=nullif(p_data->>'deadline','')::timestamptz$patch$);
execute definition;
end $migration$;

do $migration$ declare definition text; marker text; begin
select pg_get_functiondef('registration_private.email_enabled(uuid,text)'::regprocedure) into definition;
marker := $marker$p_kind<>'reminder'$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$p_kind not in ('reminder','incomplete_reminder')$patch$);
execute definition;
end $migration$;

do $migration$ declare definition text; marker text; begin
select pg_get_functiondef('registration_private.queue_registration_open(uuid)'::regprocedure) into definition;
marker := $marker$insert into public.registration_events$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$update public.trips set registration_open_announced_at=now() where id=p_trip;
 insert into public.registration_events$patch$);
execute definition;
end $migration$;

do $migration$ declare definition text; marker text; begin
select pg_get_functiondef('registration_private.registration_open_transition()'::regprocedure) into definition;
marker := $marker$where s.enabled and trips.lifecycle_status$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$where (trips.registration_opens_at is null or trips.registration_opens_at<=now()) and s.enabled and trips.lifecycle_status$patch$);
marker := $marker$if not was_open and is_open and global_enabled$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$if (t.registration_opens_at is null or t.registration_opens_at<=now()) and not was_open and is_open and global_enabled$patch$);
marker := $marker$was_open:=old.lifecycle_status$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$was_open:=(old.registration_opens_at is null or old.registration_opens_at<=now()) and old.lifecycle_status$patch$);
marker := $marker$is_open:=new.lifecycle_status$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$is_open:=(new.registration_opens_at is null or new.registration_opens_at<=now()) and new.lifecycle_status$patch$);
execute definition;
end $migration$;

drop trigger registration_open_trip on public.trips;
create trigger registration_open_trip after update of lifecycle_status,starts_at,rsvp_deadline,registration_opens_at on public.trips
 for each row execute function registration_private.registration_open_transition();

do $migration$ declare definition text; marker text; begin
select pg_get_functiondef('public.prepare_registration_notification(uuid,uuid)'::regprocedure) into definition;
marker := $marker$or least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))<=now()$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$or t.registration_opens_at>now() or least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))<=now()$patch$);
marker := $marker$or (n.kind='reminder' and$marker$;
if position(marker in definition)=0 then raise exception 'Missing registration migration marker'; end if;
definition := replace(definition, marker, $patch$or (n.kind='incomplete_reminder' and (state is distinct from 'incomplete' or t.lifecycle_status<>'published'
     or t.registration_opens_at>now() or least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))<=now()
     or not coalesce((select enabled from public.trip_registration_settings where trip_id=t.id),false)
     or not coalesce((select registration_enabled from public.club_admin_settings where id),false)))
   or (n.kind in ('reminder','incomplete_reminder') and$patch$);
execute definition;
end $migration$;

create or replace function public.registration_maintenance() returns void
language plpgsql security definer set search_path='' as $$
declare t public.trips; r record; eid uuid; dedupe text; reminder_kind text; due timestamptz; begin
 update public.registration_worker_health set last_run_at=now() where id;
 for t in select trips.* from public.trips trips where exists(select 1 from public.registration_offers
   where trip_id=trips.id and status='pending' and expires_at<=now()) or
   (starts_at>now() and lifecycle_status='published' and (starts_at<=now()+interval '24 hours' or
     (registration_opens_at<=now() and (registration_open_announced_at is null or registration_open_announced_at<registration_opens_at))))
   order by id for update loop
   perform registration_private.expire_offers(t.id);
   if t.registration_opens_at<=now() and least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))>now()
     and (t.registration_open_announced_at is null or t.registration_open_announced_at<t.registration_opens_at)
     and t.lifecycle_status='published'
     and coalesce((select enabled from public.trip_registration_settings where trip_id=t.id),false)
     and coalesce((select registration_enabled from public.club_admin_settings where id),false) then
     perform registration_private.queue_registration_open(t.id);
   end if;
   if t.lifecycle_status='published' and t.starts_at>now() and t.starts_at<=now()+interval '24 hours' then
    for r in select rsvp.user_id,rsvp.registration_state,coalesce((select max(e.created_at) from public.registration_events e
      where e.trip_id=t.id and e.user_id=rsvp.user_id and e.kind='begin_signup'),rsvp.created_at) as created_at from public.trip_rsvps rsvp
      where trip_id=t.id and registration_state in ('confirmed','incomplete') loop
     reminder_kind:=case when r.registration_state='incomplete' then 'incomplete_reminder' else 'reminder' end;
     if not registration_private.email_enabled(r.user_id,reminder_kind) then continue; end if;
     if r.registration_state='incomplete' then
       if least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))<=now()
         or t.registration_opens_at>now()
         or not coalesce((select enabled from public.trip_registration_settings where trip_id=t.id),false)
         or not coalesce((select registration_enabled from public.club_admin_settings where id),false) then continue; end if;
       due:=t.starts_at-interval '24 hours';
       if r.created_at>due then
         -- Prefer 6pm the evening before departure, with at least two hours after signup.
         due:=greatest(r.created_at+interval '2 hours',
           least(((t.starts_at at time zone t.time_zone)::date-1+time '18:00') at time zone t.time_zone,
             least(t.starts_at,coalesce(t.rsvp_deadline,t.starts_at))-interval '2 hours'));
       end if;
       if now()<due then continue; end if;
     end if;
     dedupe:=reminder_kind||':'||t.id||':'||r.user_id||':'||t.starts_at;
     if not exists(select 1 from public.registration_notifications where dedupe_key=dedupe) then
       insert into public.registration_events(trip_id,user_id,kind,details)
       values(t.id,r.user_id,reminder_kind,jsonb_build_object('startAt',t.starts_at)) returning id into eid;
       insert into public.registration_notifications(event_id,trip_id,user_id,kind,dedupe_key)
       values(eid,t.id,r.user_id,reminder_kind,dedupe) on conflict(dedupe_key) do nothing;
     end if;
    end loop;
   end if;
 end loop;
end $$;
