begin;
set local timezone = 'UTC';

do $$ begin
  if registration_private.waiver_business_date('2035-07-01 06:30:00+00') <> date '2035-06-30'
    or registration_private.waiver_business_date('2035-01-02 07:30:00+00') <> date '2035-01-01'
    or registration_private.waiver_business_date('2035-07-01 07:00:00+00') <> date '2035-07-01'
  then raise exception 'Business dates must follow Pacific midnight in summer and winter'; end if;
  if has_function_privilege('authenticated','registration_private.waiver_today()','execute')
    or has_function_privilege('anon','registration_private.waiver_business_date(timestamptz)','execute')
  then raise exception 'Business clock helpers must remain private'; end if;
end $$;

-- Test-only clock: 23:30 Pacific on June 30, when UTC has already entered July 1
-- and the next waiver year. Rollback restores the production clock and all data.
create or replace function registration_private.waiver_today() returns date
language sql stable set search_path='' as $$
  select registration_private.waiver_business_date(
    (make_date(extract(year from now())::int + 10, 7, 1)::timestamp at time zone 'UTC')
    + interval '6 hours 30 minutes');
$$;

do $$
#variable_conflict use_variable
declare
  owner_id uuid := gen_random_uuid(); adult_id uuid := gen_random_uuid();
  minor_id uuid := gen_random_uuid(); trip_id uuid := gen_random_uuid();
  waiver_id uuid; signature_id uuid; guardian_id uuid; role_id uuid;
  business_day date := registration_private.waiver_today();
  trip_start timestamptz := (business_day + time '23:45') at time zone 'America/Los_Angeles';
  data jsonb := '{"waiverAgreed":true,"signatureName":"Test Participant",
    "signerDetails":{"phone":"7025550100","address":"123 Test Street",
    "emergencyAddress":"456 Test Street","birthDate":"1990-01-01",
    "initials":["TP","TP","TP","TP","TP","TP","TP"]},
    "emergencyContact":{"name":"Test Contact","phone":"7025550101","relationship":"Friend"}}';
  view jsonb; zone text;
begin
  insert into auth.users(id,email) values
    (owner_id,owner_id||'@example.test'),(adult_id,adult_id||'@example.test'),(minor_id,minor_id||'@example.test');
  select id into role_id from public.admin_roles where is_super_admin;
  insert into public.admin_user_roles(user_id,role_id) values(owner_id,role_id);
  insert into public.account_age_declarations(user_id,is_18_or_older) values(adult_id,true),(minor_id,false);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  waiver_id := public.create_annual_waiver(jsonb_build_object(
    'event','Pacific calendar regression','sponsor','UNLV Mountain Club',
    'effectiveFrom',make_date(extract(year from business_day)::int - 1,7,1),
    'activities',jsonb_build_array('hiking'),'risks','Hiking can involve falls, serious injury, and death.'));
  perform public.publish_annual_waiver(waiver_id,'Local regression fixture review');
  insert into public.trips(id,title,starts_at,ends_at,time_zone,created_by)
    values(trip_id,'Pacific evening regression',trip_start,null,'Pacific/Kiritimati',owner_id);
  insert into public.trip_registration_settings(trip_id,annual_waiver,waiver_required)
    values(trip_id,true,true) on conflict on constraint trip_registration_settings_pkey do update set annual_waiver=true,waiver_required=true;
  perform public.save_trip_informed_risks(trip_id,0,array['Uneven trail surfaces.'],array['hiking']);

  perform set_config('request.jwt.claim.sub',adult_id::text,true);
  signature_id := public.sign_annual_waiver(waiver_id,gen_random_uuid(),data);
  if not exists(select 1 from public.registration_signatures where id=signature_id
    and valid_from=business_day and valid_until=business_day)
  then raise exception '23:30 Pacific signature must begin on the same evening, not UTC tomorrow'; end if;

  foreach zone in array array['UTC','Asia/Tokyo','America/Los_Angeles'] loop
    perform set_config('timezone',zone,true);
    view := public.get_annual_waivers();
    if (view->'current'->>'id')::uuid is distinct from waiver_id
      or (view->>'signatureId')::uuid is distinct from signature_id
      or registration_private.trip_waiver(trip_id) is distinct from waiver_id
      or not registration_private.waiver_complete(trip_id,adult_id)
      or registration_private.waiver_reason(trip_id,adult_id) is not null
    then raise exception 'Same-evening coverage must agree across session and trip display zones: %',zone; end if;
  end loop;

  update public.trips set ends_at=trip_start + interval '30 minutes' where id=trip_id;
  if registration_private.waiver_complete(trip_id,adult_id)
  then raise exception 'Coverage must expire when an overnight trip crosses Pacific midnight'; end if;
  update public.trips set ends_at=null where id=trip_id;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  perform public.save_trip_informed_risks(trip_id,1,array['No additional risk disclosure.'],array['none']);
  if not registration_private.waiver_complete(trip_id,adult_id)
  then raise exception 'An explicit none risk choice must preserve independent annual waiver coverage'; end if;

  -- Guardian requests, review queues, and validity use the same business date.
  perform set_config('request.jwt.claim.sub',minor_id::text,true);
  perform public.request_annual_guardian_review(waiver_id);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  view := public.get_annual_guardian_requests();
  if not exists(select 1 from jsonb_array_elements(view) x where x->>'userId'=minor_id::text)
  then raise exception 'Pacific evening guardian request missing from queue'; end if;
  guardian_id := public.verify_annual_guardian(waiver_id,minor_id,jsonb_build_object(
    'guardianDocument',jsonb_build_object('guardianName','Test Guardian','reference','Local retained document',
      'signedOn',business_day,'verified',true),'evidence','Local identity and authority review'));
  if not exists(select 1 from public.registration_signatures where id=guardian_id and valid_from=business_day)
    or not registration_private.waiver_complete(trip_id,minor_id)
  then raise exception 'Guardian verification must cover the same Pacific evening'; end if;
end $$;

rollback;
