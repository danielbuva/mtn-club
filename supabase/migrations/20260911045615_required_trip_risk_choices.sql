-- 'none' records an explicit organizer decision to omit risk acknowledgement.
-- It does not remove the separately configured liability-waiver requirement.
do $migration$
declare definition text; target regprocedure; marker text;
begin
 foreach target in array array[
  'registration_private.waiver_complete(uuid,uuid)'::regprocedure,
  'registration_private.waiver_reason(uuid,uuid)'::regprocedure,
  'public.get_trip_registration(uuid)'::regprocedure
 ] loop
  select pg_get_functiondef(target) into definition;
  marker := 'd.activity_scope<@w.activity_scope';
  if position(marker in definition)=0 then raise exception 'Missing waiver scope check in %',target; end if;
  execute replace(definition,marker,'array_remove(d.activity_scope,''none'')<@w.activity_scope');
 end loop;
 select pg_get_functiondef('public.save_trip_informed_risks(uuid,integer,text[],text[])'::regprocedure) into definition;
 marker := 'if (normalized,activities) is not distinct from';
 if position(marker in definition)=0 then raise exception 'Missing risk revision check'; end if;
 definition := replace(definition,'risk_disclosure_id=result,annual_waiver=true,revision=revision+1','risk_disclosure_id=result,revision=revision+1');
 execute replace(definition,marker,E'if ''none''=any(activities) and cardinality(activities)<>1 then raise exception ''Choose activities or no risk disclosure, not both.''; end if;\n '||marker);
 select pg_get_functiondef('public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure) into definition;
 marker := 'if s.annual_waiver and p_data->''riskAcknowledged''=''true''::jsonb then';
 if position(marker in definition)=0 then raise exception 'Missing acknowledgement branch'; end if;
 execute replace(definition,marker,'if p_data->''riskAcknowledged''=''true''::jsonb then');
end $migration$;

create or replace function registration_private.requirements(p_trip uuid,p_user uuid) returns text[]
language plpgsql stable security definer set search_path='' as $$
declare s public.trip_registration_settings; reasons text[]; reason text;
begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 reasons:=registration_private.legacy_requirements(p_trip,p_user);
 if s.annual_waiver then
  reasons:=array_remove(reasons,'Read and sign the required waiver.');
  if s.waiver_required then
   reason:=registration_private.waiver_reason(p_trip,p_user);
   if reason is not null then reasons:=array_append(reasons,reason); end if;
  end if;
 elsif s.risk_disclosure_id is null then return reasons;
 end if;
 if exists(select 1 from public.registration_risk_disclosures where id=s.risk_disclosure_id and activity_scope=ARRAY['none']::text[]) then return reasons; end if;
 if s.risk_disclosure_id is null then reasons:=array_append(reasons,'An organizer must add this trip’s informed risks.');
 elsif not exists(select 1 from public.registration_risk_acknowledgements where disclosure_id=s.risk_disclosure_id and registration_private.owns_record(p_user,user_id)) then
  reasons:=array_append(reasons,'Review and acknowledge the current trip-specific informed risks.');
 end if;
 return reasons;
end $$;

