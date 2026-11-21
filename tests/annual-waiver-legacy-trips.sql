-- Upcoming trips created before the annual waiver must stop asking for a per-trip signature
-- once a published annual document covers them. Rollback restores all data.
begin;

do $$
#variable_conflict use_variable
declare
  owner_id uuid := gen_random_uuid(); annual_adult uuid := gen_random_uuid();
  legacy_adult uuid := gen_random_uuid(); unsigned_adult uuid := gen_random_uuid();
  covered_trip uuid := gen_random_uuid(); out_of_scope_trip uuid := gen_random_uuid();
  past_trip uuid := gen_random_uuid(); legacy_waiver uuid; annual uuid; role_id uuid;
  business_day date := registration_private.waiver_today(); revision_before integer;
  data jsonb := '{"waiverAgreed":true,"signatureName":"Test Participant",
    "signerDetails":{"phone":"7025550100","address":"123 Test Street",
    "emergencyAddress":"456 Test Street","birthDate":"1990-01-01",
    "initials":["TP","TP","TP","TP","TP","TP","TP"]},
    "emergencyContact":{"name":"Test Contact","phone":"7025550101","relationship":"Friend"}}';
begin
  insert into auth.users(id,email) values (owner_id,owner_id||'@example.test'),
    (annual_adult,annual_adult||'@example.test'),(legacy_adult,legacy_adult||'@example.test'),
    (unsigned_adult,unsigned_adult||'@example.test');
  select id into role_id from public.admin_roles where is_super_admin;
  insert into public.admin_user_roles(user_id,role_id) values(owner_id,role_id);
  insert into public.account_age_declarations(user_id,is_18_or_older)
    values(annual_adult,true),(legacy_adult,true),(unsigned_adult,true);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);

  insert into public.trips(id,title,starts_at,ends_at,time_zone,created_by) values
    (covered_trip,'Legacy hike',now()+interval '1 hour',null,'America/Los_Angeles',owner_id),
    (out_of_scope_trip,'Legacy paddle',now()+interval '1 hour',null,'America/Los_Angeles',owner_id),
    (past_trip,'Past legacy hike',now()-interval '1 day',null,'America/Los_Angeles',owner_id);
  insert into public.registration_waivers(trip_id,version,title,body)
    values(covered_trip,1,'Trip waiver','Legacy per-trip waiver text.') returning id into legacy_waiver;
  -- Recreate the pre-annual state: per-trip waiver assignments on every trip.
  update public.trip_registration_settings set annual_waiver=false,waiver_required=true,
    waiver_id=case when trip_id=covered_trip then legacy_waiver end
    where trip_id in (covered_trip,out_of_scope_trip,past_trip);
  insert into public.registration_signatures(trip_id,user_id,original_signer_id,waiver_id,signature_name)
    values(covered_trip,legacy_adult,legacy_adult,legacy_waiver,'Legacy Signer');
  insert into public.registration_risk_disclosures(trip_id,revision,statements,activity_scope,created_by)
    values(past_trip,1,array['Uneven trail surfaces.'],array['hiking'],owner_id);
  update public.trip_registration_settings set risk_disclosure_id=(select id from public.registration_risk_disclosures where trip_id=past_trip)
    where trip_id=past_trip;

  -- With no published annual document, saving risks keeps the per-trip waiver.
  perform public.save_trip_informed_risks(covered_trip,0,array['Uneven trail surfaces.'],array['hiking']);
  perform public.save_trip_informed_risks(out_of_scope_trip,0,array['Cold water.'],array['kayaking']);
  if (select annual_waiver from public.trip_registration_settings where trip_id=covered_trip)
  then raise exception 'A trip must keep its legacy waiver until an annual document is published'; end if;

  select revision into revision_before from public.trip_registration_settings where trip_id=covered_trip;
  annual := public.create_annual_waiver(jsonb_build_object(
    'event','Legacy trip regression','sponsor','UNLV Mountain Club',
    'effectiveFrom',make_date(extract(year from business_day)::int
      - case when extract(month from business_day)<7 then 1 else 0 end,7,1),
    'activities',jsonb_build_array('hiking'),'risks','Hiking can involve falls, serious injury, and death.'));
  perform public.publish_annual_waiver(annual,'Local regression fixture review');

  if not (select annual_waiver from public.trip_registration_settings where trip_id=covered_trip)
    or (select revision from public.trip_registration_settings where trip_id=covered_trip)<>revision_before+1
    or not exists(select 1 from public.registration_events where trip_id=covered_trip and kind='annual_waiver_adopted')
  then raise exception 'Publishing must move a covered upcoming trip onto the annual waiver'; end if;
  if (select annual_waiver from public.trip_registration_settings where trip_id=out_of_scope_trip)
  then raise exception 'A trip outside the annual scope must keep its legacy waiver'; end if;
  if (select annual_waiver from public.trip_registration_settings where trip_id=past_trip)
    or registration_private.adopt_annual_waiver(past_trip)
  then raise exception 'Past trips must keep their historical waiver assignment'; end if;

  -- Signing once from profile settings covers the trip; no per-trip signature is requested.
  perform set_config('request.jwt.claim.sub',annual_adult::text,true);
  perform public.sign_annual_waiver(annual,gen_random_uuid(),data);
  if not registration_private.waiver_complete(covered_trip,annual_adult)
    or registration_private.waiver_reason(covered_trip,annual_adult) is not null
    or 'Read and sign the required waiver.'=any(registration_private.requirements(covered_trip,annual_adult))
    or (public.get_trip_registration(covered_trip)->>'waiverSigned')::boolean is distinct from true
  then raise exception 'An annual signature must cover a formerly legacy upcoming trip'; end if;

  -- A per-trip signature collected before the switch keeps counting for that trip only.
  if not registration_private.waiver_complete(covered_trip,legacy_adult)
  then raise exception 'Existing per-trip signatures must remain valid after adoption'; end if;
  if registration_private.waiver_complete(covered_trip,unsigned_adult)
    or registration_private.waiver_reason(covered_trip,unsigned_adult) is null
  then raise exception 'Members without any signature must still be asked to sign'; end if;

  if has_function_privilege('authenticated','registration_private.adopt_annual_waiver(uuid)','execute')
    or has_function_privilege('anon','registration_private.published_annual_waiver_for_trip(uuid)','execute')
  then raise exception 'Annual adoption helpers must remain private'; end if;
end $$;

rollback;
