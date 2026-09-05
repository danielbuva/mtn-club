create function registration_private.waiver_reason(p_trip uuid,p_user uuid) returns text
language plpgsql stable security definer set search_path='' as $$
declare w public.registration_waivers; d public.registration_risk_disclosures; prior public.registration_signatures; begin
 if registration_private.waiver_complete(p_trip,p_user) then return null; end if;
 select * into w from public.registration_waivers where id=registration_private.trip_waiver(p_trip);
 select d1.* into d from public.registration_risk_disclosures d1 join public.trip_registration_settings s on s.risk_disclosure_id=d1.id where s.trip_id=p_trip;
 if d.id is null then return 'An organizer must identify this trip’s activities and informed risks before participation.'; end if;
 if w.id is null then return 'A current annual waiver covering this trip’s dates is required before participation. Contact the club.'; end if;
 if not d.activity_scope<@w.activity_scope then return 'This trip is outside the annual waiver’s approved activity scope. Contact an officer for a separate waiver process before participation.'; end if;
 select * into prior from public.registration_signatures where registration_private.owns_record(p_user,user_id) and trip_id is null order by signed_at desc limit 1;
 if exists(select 1 from public.registration_waiver_withdrawals where signature_id=prior.id) then return 'Your annual waiver was withdrawn for future trips. Sign the current waiver before participation.'; end if;
 if prior.valid_until<(select (starts_at at time zone time_zone)::date from public.trips where id=p_trip) then return 'Your annual waiver expires before this trip. Review and sign the current waiver before participation.'; end if;
 if prior.id is not null and prior.waiver_id<>w.id then return 'Our annual waiver has been updated. Review and sign the current version before your next trip.'; end if;
 return 'Annual waiver required before participation.';
end $$;
alter function registration_private.requirements(uuid,uuid) rename to legacy_requirements;
create function registration_private.requirements(p_trip uuid,p_user uuid) returns text[]
language plpgsql stable security definer set search_path='' as $$
declare s public.trip_registration_settings; reasons text[]; reason text; begin
 select * into s from public.trip_registration_settings where trip_id=p_trip;
 reasons:=registration_private.legacy_requirements(p_trip,p_user);
 if not s.annual_waiver then return reasons; end if;
 reasons:=array_remove(reasons,'Read and sign the required waiver.');
 if s.waiver_required then
 reason:=registration_private.waiver_reason(p_trip,p_user);
 if reason is not null then reasons:=array_append(reasons,reason); end if;
 end if;
 if s.risk_disclosure_id is null then reasons:=array_append(reasons,'An organizer must add this trip’s informed risks.');
 elsif not exists(select 1 from public.registration_risk_acknowledgements where disclosure_id=s.risk_disclosure_id and registration_private.owns_record(p_user,user_id)) then
 reasons:=array_append(reasons,'Review and acknowledge the current trip-specific informed risks.'); end if;
 return reasons;
end $$;
-- Extend proven transaction/idempotency logic in place, asserting each integration point.
do $migration$
declare definition text; marker text; replacement text; begin
 select pg_get_functiondef('public.registration_command(uuid,text,uuid,integer,jsonb,uuid)'::regprocedure) into definition;
 marker:='select * into s from public.trip_registration_settings where trip_id=p_trip_id;';
 if position(marker in definition)=0 then raise exception 'Missing settings lookup'; end if;
 definition:=replace(definition,marker,marker||E'\n if s.annual_waiver then s.waiver_id:=registration_private.trip_waiver(p_trip_id); end if;');
 marker:='if p_data->''waiverAgreed''=''true''::jsonb then';
 if position(marker in definition)=0 then raise exception 'Missing signing branch'; end if;
 definition:=replace(definition,marker,$patch$
     if s.annual_waiver and p_data->'waiverAgreed'='true'::jsonb then
       perform public.sign_annual_waiver((p_data->>'waiverId')::uuid,p_request_id,p_data);
     end if;
     if not s.annual_waiver and p_data->'waiverAgreed'='true'::jsonb then$patch$);
 definition:=replace(definition,'on conflict(user_id,waiver_id) do nothing','on conflict(user_id,waiver_id) where trip_id is not null do nothing');
 marker:='reasons:=registration_private.requirements(p_trip_id,target);';
 if position(marker in definition)=0 then raise exception 'Missing requirements check'; end if;
 definition:=replace(definition,marker,$patch$
   if s.annual_waiver and p_data->'riskAcknowledged'='true'::jsonb then
     if (p_data->>'riskDisclosureId')::uuid is distinct from s.risk_disclosure_id or s.risk_disclosure_id is null then
       raise exception 'The trip risks changed. Review and acknowledge the current disclosure.'; end if;
     insert into public.registration_risk_acknowledgements(disclosure_id,user_id) values(s.risk_disclosure_id,target) on conflict do nothing;
   end if;
   reasons:=registration_private.requirements(p_trip_id,target);
   -- A waiver lapse does not remove an RSVP or prevent keeping answers current.
   if s.annual_waiver then reasons:=array_remove(reasons,registration_private.waiver_reason(p_trip_id,target)); end if;
 $patch$);
 marker:='insert into public.registration_guardian_evidence(trip_id,user_id,waiver_id,reviewer_id,evidence,document_details)';
 if position(marker in definition)=0 then raise exception 'Missing guardian evidence'; end if;
 definition:=replace(definition,marker,$patch$
   if s.annual_waiver and s.waiver_required then
     if (p_data->>'waiverId')::uuid is distinct from s.waiver_id or s.waiver_id is null then raise exception 'The annual waiver changed. Verify the current document.'; end if;
     perform public.verify_annual_guardian(s.waiver_id,target,p_data);
   end if;
   insert into public.registration_guardian_evidence(trip_id,user_id,waiver_id,reviewer_id,evidence,document_details)$patch$);
 execute definition;

 select pg_get_functiondef('public.get_trip_registration(uuid)'::regprocedure) into definition;
 marker:='select * into s from public.trip_registration_settings where trip_id=p_trip_id;';
 if position(marker in definition)=0 then raise exception 'Missing snapshot settings'; end if;
 definition:=replace(definition,marker,marker||E'\n if s.annual_waiver then s.waiver_id:=registration_private.trip_waiver(p_trip_id); end if;');
 marker:='''waiverSigned'',registration_private.waiver_complete(p_trip_id,uid),';
 if position(marker in definition)=0 then raise exception 'Missing waiver snapshot'; end if;
 definition:=replace(definition,marker,marker||$patch$
 'annualWaiver',s.annual_waiver,
 'waiverApplicable',coalesce((select d.activity_scope<@w.activity_scope from public.registration_risk_disclosures d join public.registration_waivers w on w.id=s.waiver_id where d.id=s.risk_disclosure_id),false),
 'waiverReason',case when s.annual_waiver and s.waiver_required then registration_private.waiver_reason(p_trip_id,uid) end,
 'waiverCoverage',(select jsonb_build_object('from',effective_from,'until',effective_until,'activities',activity_scope)
 from public.registration_waivers where id=s.waiver_id and trip_id is null),
 'informedRisks',(select jsonb_build_object('id',d.id,'revision',d.revision,'statements',d.statements,'activities',d.activity_scope)
 from public.registration_risk_disclosures d where d.id=s.risk_disclosure_id),
 'risksAcknowledged',exists(select 1 from public.registration_risk_acknowledgements where disclosure_id=s.risk_disclosure_id and registration_private.owns_record(uid,user_id)),
 $patch$);
 execute definition;

 select pg_get_functiondef('registration_private.eligibility(uuid,uuid)'::regprocedure) into definition;
 marker:='if not exists(select 1 from public.registration_guardian_reviews';
 if position(marker in definition)=0 then raise exception 'Missing guardian eligibility'; end if;
 definition:=replace(definition,marker,'if not (s.annual_waiver and registration_private.waiver_complete(p_trip,p_user)) and not exists(select 1 from public.registration_guardian_reviews');
 execute definition;

 select pg_get_functiondef('public.get_trip_guardian_requests()'::regprocedure) into definition;
 definition:=replace(definition,'w.id=s.waiver_id','w.id=registration_private.trip_waiver(t.id)');
 definition:=replace(definition,'''waiverTitle'',w.title','''waiverId'',w.id,''waiverTitle'',w.title');
 execute definition;

 select pg_get_functiondef('public.save_registration_settings(uuid,integer,jsonb)'::regprocedure) into definition;
 marker:='waiver:=s.waiver_id;';
 if position(marker in definition)=0 then raise exception 'Missing settings waiver'; end if;
 definition:=replace(definition,marker,$patch$
 if s.annual_waiver and coalesce(trim(p_data->>'waiverBody'),'')<>'' then raise exception 'Configure the annual UNLV template in annual waiver settings.'; end if;
 waiver:=s.waiver_id;$patch$);
 definition:=replace(definition,'and waiver is null then','and waiver is null and not s.annual_waiver then');
 execute definition;
end $migration$;
revoke all on function registration_private.waiver_reason(uuid,uuid),registration_private.requirements(uuid,uuid),registration_private.legacy_requirements(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function registration_private.waiver_reason(uuid,uuid),registration_private.requirements(uuid,uuid),registration_private.legacy_requirements(uuid,uuid) to postgres;
