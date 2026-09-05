-- Optional transportation intent, not ride matching or trip-seat allocation.
alter table public.trip_registration_settings add column collect_transportation boolean not null default false;
alter table public.trip_drafts add column collect_transportation boolean not null default false;
alter table public.trip_drafts add column public_host_ids uuid[] not null default '{}';
alter table public.trip_drafts add column leader_user_ids uuid[] not null default '{}';
alter table public.registration_responses add column transportation jsonb;

create function registration_private.valid_transportation(value jsonb) returns boolean
language sql immutable set search_path = '' as $$
 select case
   when value is null or value='null'::jsonb then true
   when jsonb_typeof(value) is distinct from 'object' then false
   when value->>'mode' in ('needs_ride','self_arranged') then value=jsonb_build_object('mode',value->>'mode')
   when value->>'mode'='driver' and jsonb_typeof(value->'seatsOffered')='number' then
     value=jsonb_build_object('mode','driver','seatsOffered',value->'seatsOffered')
     and (value->>'seatsOffered')::numeric between 1 and 8
     and trunc((value->>'seatsOffered')::numeric)=(value->>'seatsOffered')::numeric
   else false end;
$$;
revoke all on function registration_private.valid_transportation(jsonb) from public,anon,authenticated;
-- Existing SECURITY DEFINER commands may be owned by postgres even when migrations run as supabase_admin.
grant execute on function registration_private.valid_transportation(jsonb) to postgres,service_role;
alter table public.registration_responses add constraint registration_transportation_valid
 check (registration_private.valid_transportation(transportation));

-- Extend the current definitions, preserving prior RSVP, waiver, and privacy fixes.
do $migration$
declare definition text; marker text;
begin
 select pg_get_functiondef('public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure) into definition;
 marker:='insert into public.registration_requests(actor_id,request_id,trip_id,payload)';
 if position(marker in definition)=0 then raise exception 'Registration command persistence marker missing'; end if;
 definition:=replace(definition,marker,$addition$
 if p_data ? 'transportation' then
   if p_command not in ('save_draft','register','update_response') then
     raise exception 'Transportation can only be saved with your registration answers.';
   end if;
   if not registration_private.valid_transportation(p_data->'transportation') then
     raise exception 'Choose valid transportation and 1–8 passenger seats when driving.';
   end if;
   if not s.collect_transportation and p_data->'transportation'<>'null'::jsonb then
     raise exception 'Transportation collection is disabled. Refresh your registration form.';
   end if;
   update public.registration_responses set transportation=nullif(p_data->'transportation','null'::jsonb),updated_at=now()
   where trip_id=p_trip_id and user_id=target;
 end if;
 insert into public.registration_requests(actor_id,request_id,trip_id,payload)
 $addition$);
 execute definition;

 select pg_get_functiondef('public.get_trip_registration(uuid)'::regprocedure) into definition;
 marker:='''answers'',coalesce((select answers';
 if position(marker in definition)=0 then raise exception 'Registration snapshot marker missing'; end if;
 definition:=replace(definition,marker,$addition$
 'collectTransportation',coalesce(s.collect_transportation,false),
 'transportation',(select transportation from public.registration_responses where trip_id=p_trip_id and user_id=uid),
 'answers',coalesce((select answers$addition$);
 execute definition;

 select pg_get_functiondef('public.get_registration_roster(uuid)'::regprocedure) into definition;
 marker:='''answers'',coalesce(a.answers';
 if position(marker in definition)=0 then raise exception 'Registration roster marker missing'; end if;
 definition:=replace(definition,marker,'''transportation'',a.transportation,''answers'',coalesce(a.answers');
 execute definition;

 select pg_get_functiondef('public.save_registration_settings(uuid,integer,jsonb)'::regprocedure) into definition;
 marker:='v_questions:=p_data->''questions'';';
 if position(marker in definition)=0 then raise exception 'Registration settings validation marker missing'; end if;
 definition:=replace(definition,marker,$addition$
 if p_data ? 'collectTransportation' and jsonb_typeof(p_data->'collectTransportation') is distinct from 'boolean' then
   raise exception 'Choose whether to collect transportation preferences.';
 end if;
 v_questions:=p_data->'questions';$addition$);
 marker:='update public.trip_registration_settings set enabled=';
 if position(marker in definition)=0 then raise exception 'Registration settings update marker missing'; end if;
 definition:=replace(definition,marker,'update public.trip_registration_settings set collect_transportation=coalesce((p_data->>''collectTransportation'')::boolean,s.collect_transportation),enabled=');
 execute definition;
 -- Preserve transportation when account registrations are consolidated.
 select pg_get_functiondef(coalesce(to_regprocedure('registration_private.merge_trip_registrations(uuid,uuid)'),to_regprocedure('public.merge_trip_registrations(uuid,uuid)'))) into definition;
 if position('form_version,answers,emergency_contact)' in definition)=0 then raise exception 'Registration merge marker missing'; end if;
 definition:=replace(definition,'(a.answers,a.emergency_contact,a.form_version)', '(a.answers,a.emergency_contact,a.form_version,a.transportation)');
 definition:=replace(definition,'(b.answers,b.emergency_contact,b.form_version)', '(b.answers,b.emergency_contact,b.form_version,b.transportation)');
 definition:=replace(definition,'form_version,answers,emergency_contact)', 'form_version,answers,emergency_contact,transportation)');
 definition:=replace(definition,'form_version,answers,emergency_contact from', 'form_version,answers,emergency_contact,transportation from');
 execute definition;
end $migration$;

-- Narrow, retry-safe command for the creator to finish configuration after publication.
create function public.set_trip_transportation_collection(p_trip_id uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform id from public.trips where id=p_trip_id for update;
 if not registration_private.can_manage(p_trip_id) then raise exception 'Trip management permission required.'; end if;
 if p_enabled is null then raise exception 'Choose whether to collect transportation preferences.'; end if;
 update public.trip_registration_settings set collect_transportation=p_enabled,revision=revision+1
 where trip_id=p_trip_id and collect_transportation is distinct from p_enabled;
 if found then perform registration_private.event(p_trip_id,null,'settings_changed'); end if;
end $$;
revoke all on function public.set_trip_transportation_collection(uuid,boolean) from public,anon;
grant execute on function public.set_trip_transportation_collection(uuid,boolean) to authenticated;
