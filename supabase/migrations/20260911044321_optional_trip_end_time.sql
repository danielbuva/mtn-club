-- A null end means an open-ended trip; coverage is required for its start date.
alter table public.trip_drafts add column no_end_time boolean not null default false;

alter table public.trips alter column ends_at drop not null;

CREATE OR REPLACE FUNCTION registration_private.waiver_complete(p_trip uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t public.trips; s public.trip_registration_settings; w public.registration_waivers; d public.registration_risk_disclosures; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 if not s.annual_waiver then return registration_private.legacy_waiver_complete(p_trip,p_user); end if;
 select * into t from public.trips where id=p_trip;
 select * into d from public.registration_risk_disclosures where id=s.risk_disclosure_id;
 select * into w from public.registration_waivers where id=registration_private.trip_waiver(p_trip);
 return coalesce(cardinality(d.activity_scope)>0 and d.activity_scope<@w.activity_scope and
 registration_private.annual_signature(w.id,p_user,(t.starts_at at time zone t.time_zone)::date,
 (coalesce(t.ends_at,t.starts_at) at time zone t.time_zone)::date,least(clock_timestamp(),t.starts_at)) is not null,false);
end $function$
;



-- Enable the existing ride-needs and seats step for upcoming outdoor trips.
update public.trip_registration_settings s
set collect_transportation = true, revision = s.revision + 1
from public.trips t
where t.id = s.trip_id and t.starts_at > now()
  and t.event_kind = 'outdoor' and not s.collect_transportation;
