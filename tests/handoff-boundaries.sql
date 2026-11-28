begin;
do $$
#variable_conflict use_variable
declare
  officer uuid:=gen_random_uuid();
  newcomer uuid:=gen_random_uuid();
  secondary uuid:=gen_random_uuid();
  gallery_trip uuid:=gen_random_uuid();
  contact uuid;
  result jsonb;
  original_count integer;
begin
  insert into auth.users(id,email) values
    (officer,officer||'@example.test'),(newcomer,newcomer||'@example.test'),
    (secondary,secondary||'@example.test');
  insert into public.admin_user_roles(user_id,role_id)
    select officer,id from public.admin_roles where is_super_admin;

  perform set_config('request.jwt.claim.sub',newcomer::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  if public.get_my_admin_capability_scopes() is distinct from '{}'::jsonb then
    raise exception 'An ordinary account has admin scopes';
  end if;
  begin
    perform public.get_admin_membership_queue('review',1);
    raise exception 'An ordinary account can read the membership queue';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub',officer::text,true);
  original_count:=(public.get_admin_membership_queue('review',1)->'counts'->>'review')::integer;
  insert into auth.users(id,email,created_at)
    select gen_random_uuid(), 'handoff-'||gen_random_uuid()||'@example.test', now()-interval '1 day'
    from generate_series(1,1050);
  result:=public.get_admin_membership_queue('review',42);
  if (result->'counts'->>'review')::int<>original_count+1050
    or jsonb_array_length(result->'rows')<>25 or (result->>'page')::int<>42 then
    raise exception 'Membership pagination lost results beyond the API row cap';
  end if;
  if public.get_my_admin_capability_scopes()->>'membership.read' is distinct from 'all' then
    raise exception 'Missing officer scope';
  end if;

  insert into public.guardian_contacts(participant_id,full_name,email,relationship,created_by)
    values(secondary,'Test Guardian','merge-guardian@example.test','Parent','participant') returning id into contact;
  perform set_config('request.jwt.claim.role','service_role',true);
  result:=public.merge_accounts(officer,newcomer,secondary,true);
  if (result->'counts'->>'secondary_guardian_contacts_participant_id')::int is distinct from 1 then
    raise exception 'Merge preview omitted guardian records';
  end if;
  perform public.merge_accounts(officer,newcomer,secondary,false);
  delete from auth.users where id=secondary;
  if not registration_private.owns_record(newcomer,secondary)
    or (select participant_id from public.guardian_contacts where id=contact) is distinct from secondary then
    raise exception 'Merge lost guardian history or original attribution';
  end if;

  if (select public from storage.buckets where id='club_gallery') is distinct from false then
    raise exception 'Gallery bucket is not private';
  end if;
  insert into public.trips(id,title,starts_at,ends_at,created_by,visibility)
    values(gallery_trip,'Restricted gallery trip',now()+interval '2 days',now()+interval '3 days',officer,'leaders');
  insert into public.gallery_photos(storage_path,title,alt_text,uploaded_by,is_published,trip_id)
    values('test/restricted.jpg','Restricted','Fixture',officer,true,gallery_trip),
          ('test/draft.jpg','Draft','Fixture',officer,false,null),
          ('test/public.jpg','Public','Fixture',officer,true,null);
  insert into storage.objects(bucket_id,name) values
    ('club_gallery','test/restricted.jpg'),('club_gallery','test/draft.jpg'),('club_gallery','test/public.jpg');

  perform set_config('request.jwt.claim.role','anon',true);
  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if (select array_agg(name order by name) from storage.objects where bucket_id='club_gallery')
    is distinct from array['test/public.jpg']::text[] then
    raise exception 'Anonymous storage access does not match gallery publication and visibility';
  end if;
end $$;
rollback;
