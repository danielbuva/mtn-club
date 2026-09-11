-- Classify the reviewed upcoming calendar without changing waiver assignments.
do $$
declare item record; disclosure uuid; owner_id uuid;
begin
 for item in select * from (values
('771c7bce-afc2-44de-acf5-5b5268ff1bbb'::uuid,ARRAY['hiking']::text[],ARRAY['Hiking involves uneven ground, falls, exertion, sun exposure, dehydration, and changing weather.']::text[]),
('cca5d558-bcd9-4782-8332-12d5297aeab5'::uuid,ARRAY['hiking']::text[],ARRAY['Hiking involves uneven ground, falls, exertion, sun exposure, dehydration, and changing weather.']::text[]),
('15e6aef4-8857-4e93-9805-b88b174f98f0'::uuid,ARRAY['hiking']::text[],ARRAY['Hiking involves uneven ground, falls, exertion, sun exposure, dehydration, and changing weather.','Low light can make footing and route finding difficult. Bring a headlamp and prepare for changing temperatures.']::text[]),
('0788541e-fe06-4d91-9dc4-0ca127943930'::uuid,ARRAY['bouldering']::text[],ARRAY['Bouldering involves unroped falls and uneven landings that can cause serious injury.','Low light can make footing and route finding difficult. Bring a headlamp and prepare for changing temperatures.']::text[]),
('c53fc55d-edae-4af5-af7d-35be3f06d4bd'::uuid,ARRAY['camping']::text[],ARRAY['Camping involves outdoor exposure, temperature changes, wildlife, and limited nearby services.']::text[]),
('3f4e847a-16f4-4ab2-80bc-f072909615d6'::uuid,ARRAY['hiking']::text[],ARRAY['Hiking involves uneven ground, falls, exertion, sun exposure, dehydration, and changing weather.']::text[]),
('48988fe8-122d-4e91-ad57-c765611d0906'::uuid,ARRAY['camping','rock climbing']::text[],ARRAY['Camping involves outdoor exposure, temperature changes, wildlife, and limited nearby services. Rock climbing involves falls, falling rock, and equipment or technique failures that can cause serious injury or death.']::text[]),
('040661b0-3de7-441b-b19b-4ae0f4e58bf9'::uuid,ARRAY['camping','rock climbing','hiking']::text[],ARRAY['Camping involves outdoor exposure, temperature changes, wildlife, and limited nearby services. Rock climbing involves falls, falling rock, and equipment or technique failures that can cause serious injury or death. Hiking involves uneven ground, falls, exertion, sun exposure, dehydration, and changing weather.']::text[]),
('3c0c4001-2a6e-4831-8da8-a582e8abf41d'::uuid,ARRAY['camping','rock climbing']::text[],ARRAY['Camping involves outdoor exposure, temperature changes, wildlife, and limited nearby services. Rock climbing involves falls, falling rock, and equipment or technique failures that can cause serious injury or death.']::text[]),
('40000000-0000-4000-8000-000000000001'::uuid,ARRAY['hiking']::text[],ARRAY['Hiking involves uneven ground, falls, exertion, sun exposure, dehydration, and changing weather.']::text[]),
('40000000-0000-4000-8000-000000000002'::uuid,ARRAY['bouldering']::text[],ARRAY['Bouldering involves unroped falls and uneven landings that can cause serious injury.']::text[]),
('40000000-0000-4000-8000-000000000004'::uuid,ARRAY['hiking']::text[],ARRAY['Hiking involves uneven ground, falls, exertion, sun exposure, dehydration, and changing weather.']::text[])
 ) as reviewed(trip_id,activities,statements) loop
  select t.created_by into owner_id from public.trips t join public.trip_registration_settings s on s.trip_id=t.id
  where t.id=item.trip_id and t.starts_at>now() and s.risk_disclosure_id is null for update of t,s;
  if not found then continue; end if;
  -- Imported production trips have no creator; this backfill was requested by Dani.
  owner_id := coalesce(owner_id,(select user_id from public.profiles where user_id='d72bae41-af94-443f-b63c-664f2d22d64e'::uuid));
  if owner_id is null then raise exception 'Trip % needs a disclosure owner',item.trip_id; end if;
  insert into public.registration_risk_disclosures(trip_id,revision,statements,activity_scope,created_by)
  select item.trip_id,coalesce(max(revision),0)+1,item.statements,item.activities,owner_id
  from public.registration_risk_disclosures where trip_id=item.trip_id returning id into disclosure;
  update public.trip_registration_settings set risk_disclosure_id=disclosure,revision=revision+1 where trip_id=item.trip_id;
  perform registration_private.event(item.trip_id,null,'informed_risks_updated',jsonb_build_object('disclosureId',disclosure,'source','classify_upcoming_trip_risks migration'));
 end loop;
end $$;
