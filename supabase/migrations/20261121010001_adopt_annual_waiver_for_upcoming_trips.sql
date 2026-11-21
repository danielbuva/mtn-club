-- Upcoming trips that predate the annual waiver were left on their per-trip (legacy) waiver:
-- 202609050005 set every existing trip to annual_waiver=false, and 20260911045615 removed the
-- only path that switched a trip over (saving its informed risks). Those trips kept asking
-- members to sign a new waiver for each trip even after they had signed the annual one.
--
-- A trip now adopts the annual waiver as soon as that is safe: it has not started, a published
-- annual document covers its whole date range, and its informed-risk activities fall within that
-- document's approved scope. Trips that do not qualify keep their legacy assignment, so open
-- registration is never blocked. Per-trip signatures already collected keep counting for their trip.
begin;

create or replace function registration_private.published_annual_waiver_for_trip(p_trip uuid) returns uuid
language sql stable security definer set search_path='' as $$
 select w.id from public.trips t
 join public.registration_waivers w on w.trip_id is null
  and registration_private.waiver_business_date(t.starts_at) between w.effective_from and w.effective_until
 join public.registration_waiver_publications p on p.waiver_id=w.id and p.published_at<=least(clock_timestamp(),t.starts_at)
 where t.id=p_trip order by p.published_at desc,w.version desc limit 1;
$$;

create or replace function registration_private.trip_waiver(p_trip uuid) returns uuid
language sql stable security definer set search_path='' as $$
 select case when s.annual_waiver then registration_private.published_annual_waiver_for_trip(p_trip) else s.waiver_id end
 from public.trip_registration_settings s where s.trip_id=p_trip;
$$;

create or replace function registration_private.adopt_annual_waiver(p_trip uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare t public.trips; s public.trip_registration_settings; w public.registration_waivers; d public.registration_risk_disclosures; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip for update;
 if not found or s.annual_waiver then return false; end if;
 select * into t from public.trips where id=p_trip;
 if t.starts_at<=now() then return false; end if;
 select * into w from public.registration_waivers where id=registration_private.published_annual_waiver_for_trip(p_trip);
 select * into d from public.registration_risk_disclosures where id=s.risk_disclosure_id;
 if w.id is null or d.id is null
  or not array_remove(d.activity_scope,'none')<@w.activity_scope
  or registration_private.waiver_business_date(coalesce(t.ends_at,t.starts_at))>w.effective_until then return false; end if;
 update public.trip_registration_settings set annual_waiver=true,revision=revision+1 where trip_id=p_trip;
 perform registration_private.event(p_trip,null,'annual_waiver_adopted',
  jsonb_build_object('waiverId',w.id,'legacyWaiverId',s.waiver_id));
 return true;
end $$;

-- An annual trip also accepts a per-trip signature already collected for that same trip.
-- legacy_waiver_complete matches only signatures/guardian reviews whose trip_id is this trip and
-- whose waiver is the trip's retained legacy waiver_id, so annual records are never relabeled.
create or replace function registration_private.waiver_complete(p_trip uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t public.trips; s public.trip_registration_settings; w public.registration_waivers; d public.registration_risk_disclosures; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 if not s.annual_waiver then return registration_private.legacy_waiver_complete(p_trip,p_user); end if;
 if s.waiver_id is not null and registration_private.legacy_waiver_complete(p_trip,p_user) then return true; end if;
 select * into t from public.trips where id=p_trip;
 select * into d from public.registration_risk_disclosures where id=s.risk_disclosure_id;
 select * into w from public.registration_waivers where id=registration_private.trip_waiver(p_trip);
 return coalesce(cardinality(d.activity_scope)>0 and array_remove(d.activity_scope,'none')<@w.activity_scope and
 registration_private.annual_signature(w.id,p_user,registration_private.waiver_business_date(t.starts_at),
 registration_private.waiver_business_date(coalesce(t.ends_at,t.starts_at)),least(clock_timestamp(),t.starts_at)) is not null,false);
end $function$;

-- Saving a trip's informed risks adopts the annual waiver when the trip qualifies.
do $migration$
declare definition text; marker text; begin
 select pg_get_functiondef('public.save_trip_informed_risks(uuid,integer,text[],text[])'::regprocedure) into definition;
 marker := 'then return d.id; end if;';
 if position(marker in definition)=0 then raise exception 'Missing unchanged-risk return'; end if;
 definition := replace(definition,marker,'then perform registration_private.adopt_annual_waiver(p_trip); return d.id; end if;');
 marker := 'return result;';
 if position(marker in definition)=0 then raise exception 'Missing risk save return'; end if;
 execute replace(definition,marker,'perform registration_private.adopt_annual_waiver(p_trip); return result;');
end $migration$;

-- Publishing an annual document adopts it for every qualifying upcoming trip.
create or replace function public.publish_annual_waiver(p_waiver uuid,p_review_reference text) returns void
language plpgsql security definer set search_path='' as $$
declare trip uuid; begin
 if auth.uid() is null or registration_private.blocked(auth.uid()) or not public.has_admin_capability(auth.uid(),'settings.update') then raise exception 'Waiver configuration permission required.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('annual-waiver-publication',0));
 if not exists(select 1 from public.registration_waivers where id=p_waiver and trip_id is null) then raise exception 'Annual document not found.'; end if;
 insert into public.registration_waiver_publications(waiver_id,published_by,review_reference) values(p_waiver,auth.uid(),p_review_reference) on conflict do nothing;
 for trip in select s.trip_id from public.trip_registration_settings s join public.trips t on t.id=s.trip_id
  where not s.annual_waiver and t.starts_at>now() order by s.trip_id loop
  perform registration_private.adopt_annual_waiver(trip);
 end loop;
end $$;

revoke all on function registration_private.published_annual_waiver_for_trip(uuid), registration_private.adopt_annual_waiver(uuid)
 from public, anon, authenticated, service_role;
grant execute on function registration_private.published_annual_waiver_for_trip(uuid), registration_private.adopt_annual_waiver(uuid) to postgres;

-- Backfill: move qualifying upcoming legacy trips onto the annual waiver now.
do $$ declare trip uuid; begin
 for trip in select s.trip_id from public.trip_registration_settings s join public.trips t on t.id=s.trip_id
  where not s.annual_waiver and t.starts_at>now() order by s.trip_id loop
  perform registration_private.adopt_annual_waiver(trip);
 end loop;
end $$;

commit;
