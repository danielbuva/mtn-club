-- Existing trip documents remain immutable; only new records can be annual.
alter table public.registration_waivers alter column trip_id drop not null;
alter table public.registration_waivers add column effective_from date;
alter table public.registration_waivers add column effective_until date;
alter table public.registration_waivers add column activity_scope text[];
alter table public.registration_waivers add column filled_values jsonb;
alter table public.registration_waivers add constraint annual_waiver_period check (
 trip_id is not null or (effective_from is not null and effective_until is not null
 and extract(month from effective_from)=7 and extract(day from effective_from)=1
 and effective_until=(effective_from+interval '1 year'-interval '1 day')::date
 and cardinality(activity_scope)>0 and filled_values is not null));
create unique index annual_waiver_version on public.registration_waivers(version) where trip_id is null;
alter table public.registration_signatures alter column trip_id drop not null;
alter table public.registration_signatures alter column signed_at set default clock_timestamp();
alter table public.registration_signatures drop constraint registration_signatures_user_id_waiver_id_key;
alter table public.registration_signatures add column signer_kind text not null default 'adult' check(signer_kind in ('adult','guardian'));
alter table public.registration_signatures add column valid_from date;
alter table public.registration_signatures add column valid_until date;
create unique index legacy_registration_signature on public.registration_signatures(user_id,waiver_id) where trip_id is not null;
create table public.registration_waiver_publications (
 waiver_id uuid primary key references public.registration_waivers(id),
 published_at timestamptz not null default clock_timestamp(), published_by uuid not null,
 review_reference text not null check(length(trim(review_reference)) between 5 and 2000)
);
create table public.registration_waiver_withdrawals (
 signature_id uuid primary key references public.registration_signatures(id),
 withdrawn_at timestamptz not null default clock_timestamp(), withdrawn_by uuid not null
);
create table public.registration_waiver_requests (
 actor_id uuid not null, request_id uuid not null, payload jsonb not null,
 signature_id uuid references public.registration_signatures(id), primary key(actor_id,request_id)
);
create table public.registration_risk_disclosures (
 id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id),
 revision integer not null, statements text[] not null check(cardinality(statements) between 1 and 5),
 activity_scope text[] not null check(cardinality(activity_scope)>0),
 created_at timestamptz not null default clock_timestamp(), created_by uuid not null,
 unique(trip_id,revision)
);
create table public.registration_risk_acknowledgements (
 id uuid primary key default gen_random_uuid(), disclosure_id uuid not null references public.registration_risk_disclosures(id),
 user_id uuid not null references auth.users(id), acknowledged_at timestamptz not null default clock_timestamp(),
 unique(disclosure_id,user_id)
);
alter table public.trip_registration_settings add column annual_waiver boolean not null default true;
alter table public.trip_registration_settings add column risk_disclosure_id uuid references public.registration_risk_disclosures(id);
-- Compatibility: existing trips retain their exact legacy assignment until an organizer
-- supplies their informed risks and explicitly classifies them through save_trip_informed_risks.
-- New trips use the annual model. Existing signatures are never relabeled as annual.
update public.trip_registration_settings set annual_waiver=false;
alter table public.trip_drafts add column informed_risks text not null default '';
alter table public.trip_drafts add column waiver_activities text[] not null default '{}';
do $$ declare t text; begin
 foreach t in array array['registration_waiver_publications','registration_waiver_withdrawals','registration_waiver_requests',
 'registration_risk_disclosures','registration_risk_acknowledgements'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
 execute format('create trigger %I before update or delete on public.%I for each row execute function registration_private.immutable_document()',t||'_immutable',t);
 end loop;
end $$;

create function registration_private.owns_record(p_user uuid,p_owner uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select p_user=p_owner or exists(select 1 from public.registration_account_merges where primary_id=p_user and secondary_id=p_owner);
$$;
create function registration_private.current_annual_waiver(p_on date) returns uuid
language sql stable security definer set search_path='' as $$
 select w.id from public.registration_waivers w join public.registration_waiver_publications p on p.waiver_id=w.id
 where w.trip_id is null and p_on between w.effective_from and w.effective_until
 order by p.published_at desc,w.version desc limit 1;
$$;
create function registration_private.trip_waiver(p_trip uuid) returns uuid
language sql stable security definer set search_path='' as $$
 select case when s.annual_waiver then registration_private.current_annual_waiver((t.starts_at at time zone t.time_zone)::date) else s.waiver_id end
 from public.trip_registration_settings s join public.trips t on t.id=s.trip_id where s.trip_id=p_trip;
$$;
create function registration_private.annual_signature(p_waiver uuid,p_user uuid,p_start date,p_end date,p_at timestamptz default clock_timestamp()) returns uuid
language sql stable security definer set search_path='' as $$
 select s.id from public.registration_signatures s join public.registration_waivers w on w.id=s.waiver_id
 where w.trip_id is null and s.waiver_id=p_waiver and registration_private.owns_record(p_user,s.user_id)
 and p_start>=s.valid_from and p_end<=s.valid_until and s.signed_at<=p_at
 and not exists(select 1 from public.registration_waiver_withdrawals x where x.signature_id=s.id and x.withdrawn_at<=p_at)
 and (s.signer_kind='guardian' or not (exists(select 1 from public.account_age_declarations where user_id=p_user and not is_18_or_older)
 or exists(select 1 from public.membership_applications where user_id=p_user and age_status='minor')))
 order by s.signed_at desc limit 1;
$$;
-- Preserve the old logic for completed/legacy trips.
alter function registration_private.waiver_complete(uuid,uuid) rename to legacy_waiver_complete;
create function registration_private.waiver_complete(p_trip uuid,p_user uuid) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare t public.trips; s public.trip_registration_settings; w public.registration_waivers; d public.registration_risk_disclosures; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 if not s.annual_waiver then return registration_private.legacy_waiver_complete(p_trip,p_user); end if;
 select * into t from public.trips where id=p_trip;
 select * into d from public.registration_risk_disclosures where id=s.risk_disclosure_id;
 select * into w from public.registration_waivers where id=registration_private.trip_waiver(p_trip);
 return coalesce(cardinality(d.activity_scope)>0 and d.activity_scope<@w.activity_scope and
 registration_private.annual_signature(w.id,p_user,(t.starts_at at time zone t.time_zone)::date,
 (t.ends_at at time zone t.time_zone)::date) is not null,false);
end $$;
create function public.save_trip_informed_risks(p_trip uuid,p_revision integer,p_statements text[],p_activities text[]) returns uuid
language plpgsql security definer set search_path='' as $$
declare s public.trip_registration_settings; d public.registration_risk_disclosures; result uuid; normalized text[]; activities text[]; begin
 perform id from public.trips where id=p_trip for update;
 if not registration_private.can_manage(p_trip) then raise exception 'Trip management permission required.'; end if;
 if exists(select 1 from public.trips where id=p_trip and starts_at<=now()) then raise exception 'Past trip disclosures cannot be changed.'; end if;
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 select * into d from public.registration_risk_disclosures where id=s.risk_disclosure_id;
 if coalesce(d.revision,0) is distinct from p_revision then raise exception 'Informed risks changed. Refresh and review the current version.'; end if;
 select array_agg(regexp_replace(trim(x),'\s+',' ','g') order by n) into normalized from unnest(p_statements) with ordinality a(x,n) where trim(x)<>'';
 select array_agg(x order by x) into activities from (select distinct lower(trim(a)) x from unnest(p_activities) a where trim(a)<>'') a;
 if coalesce(cardinality(normalized),0) not between 1 and 5 or exists(select 1 from unnest(normalized) x where length(x)>1000)
 or coalesce(cardinality(activities),0) not between 1 and 12 or exists(select 1 from unnest(activities) x where length(x)>80) then raise exception 'Add 1–5 concise risk statements and identify the trip activities.'; end if;
 if (normalized,activities) is not distinct from (d.statements,d.activity_scope) then return d.id; end if;
 insert into public.registration_risk_disclosures(trip_id,revision,statements,activity_scope,created_by)
 values(p_trip,coalesce(d.revision,0)+1,normalized,activities,auth.uid()) returning id into result;
 update public.trip_registration_settings set risk_disclosure_id=result,annual_waiver=true,revision=revision+1 where trip_id=p_trip;
 perform registration_private.event(p_trip,null,'informed_risks_updated',jsonb_build_object('disclosureId',result));
 return result;
end $$;
