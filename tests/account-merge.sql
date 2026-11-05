begin;
-- Late failure deliberately occurs after registration, payment and draft writes.
create function pg_temp.fail_account_merge() returns trigger language plpgsql as $$
begin
  if current_setting('test.fail_account_merge',true)='on' then raise exception 'Injected late merge failure'; end if;
  return old;
end $$;
create trigger test_merge_failure before delete on public.profiles for each row execute function pg_temp.fail_account_merge();
create function pg_temp.merge_snapshot() returns jsonb language plpgsql as $$
declare r record; rows jsonb; result jsonb:='{}'; begin
  for r in select schemaname,tablename from pg_tables where schemaname in ('public','storage','trip_write_private') order by schemaname,tablename loop
    execute format('select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),''[]'') from %I.%I t',r.schemaname,r.tablename) into rows;
    result:=result||jsonb_build_object(r.schemaname||'.'||r.tablename,rows);
  end loop;
  return result||jsonb_build_object('auth_users',(select jsonb_agg(to_jsonb(u) order by id) from auth.users u));
end $$;
do $$
#variable_conflict use_variable
declare
  actor uuid:=gen_random_uuid(); primary_id uuid:=gen_random_uuid(); secondary_id uuid:=gen_random_uuid(); privileged uuid:=gen_random_uuid();
  role_id uuid:=gen_random_uuid(); tid uuid:=gen_random_uuid(); draft uuid:=gen_random_uuid(); receipt uuid:=gen_random_uuid(); activity uuid:=gen_random_uuid();
  checkout uuid:=gen_random_uuid(); payment uuid:=gen_random_uuid(); zelle uuid:=gen_random_uuid(); entitlement uuid:=gen_random_uuid();
  override_id uuid:=gen_random_uuid(); waiver uuid:=gen_random_uuid(); signature uuid:=gen_random_uuid(); disclosure uuid:=gen_random_uuid();
  snapshot jsonb; result jsonb; item record; n bigint; before_events bigint;
begin
  insert into auth.users(id,email) values(actor,actor||'@example.test'),(primary_id,primary_id||'@example.test'),
    (secondary_id,secondary_id||'@example.test'),(privileged,privileged||'@example.test');
  select id into strict role_id from public.admin_roles where is_super_admin;
  insert into public.admin_user_roles(user_id,role_id) values(actor,role_id),(privileged,role_id);
  perform set_config('request.jwt.claim.sub',actor::text,true);
  perform set_config('request.jwt.claim.role','service_role',true);
  insert into public.profiles(user_id,display_name) values(primary_id,'Retained member'),(secondary_id,'Source member');
  insert into public.profile_private(user_id,phone,notification_settings) values(primary_id,null,'{"email":false,"tripReminders":false}'),
    (secondary_id,'5551234567','{"email":true,"general":false}');
  insert into public.memberships(user_id,status) values(primary_id,'inactive'),(secondary_id,'active');
  insert into public.membership_applications(user_id,full_name,contact_email,age_status,guardian_consent,primary_interest)
    values(primary_id,'Primary Member',primary_id||'@example.test','adult','not_required','Hiking'),
    (secondary_id,'Source Member',secondary_id||'@example.test','minor','confirmed','Climbing');
  insert into public.account_age_declarations(user_id,is_18_or_older) values(primary_id,true),(secondary_id,false);
  insert into public.user_preferences(user_id,trip_email_notifications) values(primary_id,true),(secondary_id,false);
  insert into public.mailing_list_subscriptions(user_id,email,subscribed,consent_source,subscribed_at,unsubscribed_at)
    values(primary_id,primary_id||'@example.test',true,'account_settings',now(),null),
      (secondary_id,secondary_id||'@example.test',false,'account_settings',null,now());
  insert into public.mailing_list_consent_events(user_id,email,subscribed,consent_source)
    values(secondary_id,secondary_id||'@example.test',false,'account_settings');
  insert into public.profile_email_consent_events(user_id,preferences) values(secondary_id,'{"email":true,"general":false}');
  insert into public.trips(id,title,starts_at,ends_at,created_by,canceled_by)
    values(tid,'Merge fixture trip',now()+interval '2 days',now()+interval '3 days',actor,secondary_id);
  insert into public.trip_drafts(id,created_by,title) values(draft,secondary_id,'Do not cascade this draft');
  insert into trip_write_private.draft_publications(draft_id,draft_owner_id,published_by,trip_id)
    values(receipt,secondary_id,secondary_id,tid);
  insert into public.trip_leaders(trip_id,user_id) values(tid,primary_id),(tid,secondary_id) on conflict do nothing;
  insert into public.trip_update_followers(trip_id,user_id) values(tid,primary_id),(tid,secondary_id);
  insert into public.trip_favorites(trip_id,user_id) values(tid,primary_id),(tid,secondary_id);
  insert into public.trip_rsvps(trip_id,user_id,status,registration_state)
    values(tid,primary_id,'going','confirmed'),(tid,secondary_id,'going','confirmed');
  insert into public.registration_responses(trip_id,user_id,form_version,answers)
    values(tid,primary_id,1,'{}'),(tid,secondary_id,2,'{"experience":true}');
  insert into public.registration_offers(trip_id,user_id,issued_by,expires_at,status)
    values(tid,secondary_id,actor,now()+interval '1 day','accepted');
  insert into public.trip_attendance(trip_id,user_id,attended) values(tid,primary_id,false),(tid,secondary_id,true);
  insert into public.trip_comments(trip_id,user_id,body) values(tid,secondary_id,'Keep this comment');
  insert into public.trip_carpools(trip_id,user_id,kind) values(tid,secondary_id,'offer');
  insert into public.activities(id,slug,name) values(activity,'merge-'||activity,'Merge fixture activity');
  insert into public.user_interests(user_id,activity_id,experience_level) values(primary_id,activity,2),(secondary_id,activity,5);
  insert into public.user_waivers(user_id,waiver_key,version,signature_name)
    values(primary_id,'merge-fixture','1','Retained Member'),(secondary_id,'merge-fixture','1','Source Member'),(secondary_id,'merge-other','1','Source Member');
  insert into public.membership_checkout_attempts(id,user_id,stripe_price_id,test_mode,expires_at)
    values(checkout,secondary_id,'fixture',true,now()+interval '1 day'),(gen_random_uuid(),primary_id,'fixture',true,now()+interval '1 day');
  insert into public.membership_payments(id,user_id,checkout_attempt_id,stripe_checkout_session_id,amount_cents,currency,status,test_mode)
    values(payment,secondary_id,checkout,'merge-'||payment,2500,'usd','paid',true);
  insert into public.membership_zelle_payments(id,user_id,amount_cents,status,reviewed_at,reviewed_by)
    values(zelle,secondary_id,2500,'confirmed',now(),actor);
  insert into public.membership_zelle_payments(user_id,amount_cents) values(primary_id,2500),(secondary_id,2500);
  insert into public.membership_entitlements(id,user_id,payment_id,starts_at,ends_at)
    values(entitlement,secondary_id,payment,now(),now()+interval '1 year');
  insert into public.membership_entitlements(user_id,zelle_payment_id,starts_at,ends_at)
    values(secondary_id,zelle,now()+interval '1 year',now()+interval '2 years');
  insert into public.membership_access_overrides(id,user_id,reason,granted_by)
    values(override_id,secondary_id,'Merge fixture access',actor);
  insert into public.membership_review_items(user_id,payment_id,reason_code,reason_detail)
    values(secondary_id,payment,'fixture','Keep this review');
  insert into public.gallery_photos(storage_path,title,alt_text,uploaded_by)
    values('merge-fixture/'||secondary_id,'Merge photo','Fixture photo',secondary_id);
  insert into public.announcements(slug,title,starts_at,ends_at,created_by,updated_by)
    values('merge-'||secondary_id,'Merge announcement',now(),now()+interval '1 day',secondary_id,secondary_id);
  insert into public.club_hosts(public_name,club_title,linked_user_id)
    values('Merge host '||secondary_id,'Member',secondary_id);
  insert into public.schedule_review_items(schedule_key,scheduled_date,reason,reviewed_by) values('merge-'||secondary_id,current_date,'Fixture review',secondary_id);
  insert into public.admin_activity_events(actor_user_id,subject_user_id,action,resource_type,summary)
    values(secondary_id,secondary_id,'fixture','account','Keep this history');
  insert into public.registration_waivers(id,trip_id,version,title,body) values(waiver,tid,1,'Fixture waiver','Synthetic evidence');
  insert into public.registration_signatures(id,trip_id,user_id,original_signer_id,waiver_id,signature_name)
    values(signature,tid,secondary_id,secondary_id,waiver,'Original signer');
  insert into public.registration_guardian_reviews(trip_id,user_id,waiver_id,reviewer_id,evidence,document_details)
    values(tid,secondary_id,waiver,actor,'Synthetic guardian evidence','{"guardianName":"Original Guardian"}');
  insert into public.registration_guardian_evidence(trip_id,user_id,waiver_id,reviewer_id,evidence,document_details)
    values(tid,secondary_id,waiver,actor,'Immutable guardian evidence','{"guardianName":"Original Guardian"}');
  insert into public.registration_annual_guardian_requests(user_id,waiver_id) values(secondary_id,waiver);
  insert into public.registration_risk_disclosures(id,trip_id,revision,statements,activity_scope,created_by)
    values(disclosure,tid,1,array['Fixture risk'],array['hiking'],actor);
  insert into public.registration_risk_acknowledgements(disclosure_id,user_id) values(disclosure,secondary_id);
  insert into public.registration_events(trip_id,user_id,actor_id,kind) values(tid,secondary_id,secondary_id,'fixture');
  insert into public.registration_notifications(trip_id,user_id,kind,dedupe_key)
    values(tid,secondary_id,'fixture','fixture:'||secondary_id);

  update public.trips set created_by=secondary_id where id=tid;
  insert into public.membership_account_restrictions(user_id,restriction,restricted_at,updated_by)
    values(primary_id,'normal',null,actor),(secondary_id,'suspended',now(),actor);

  insert into storage.buckets(id,name,owner,owner_id) values('merge-'||secondary_id,'Merge bucket',secondary_id,secondary_id::text);
  insert into storage.objects(id,bucket_id,name,owner,owner_id) values(gen_random_uuid(),'merge-'||secondary_id,'fixture.jpg',secondary_id,secondary_id::text);
  update public.admin_user_roles set assigned_by=secondary_id where user_id=actor;
  insert into public.club_admin_settings(id,updated_by) values(true,secondary_id) on conflict(id) do update set updated_by=excluded.updated_by;
  -- Grant boundary: service RPC succeeds despite deliberately restricted tables.
  if has_function_privilege('authenticated','public.merge_accounts(uuid,uuid,uuid,boolean)','execute')
    or has_function_privilege('anon','public.merge_accounts(uuid,uuid,uuid,boolean)','execute')
    or has_function_privilege('authenticated','public.complete_account_merge(uuid,uuid,uuid)','execute')
    or has_function_privilege('anon','public.complete_account_merge(uuid,uuid,uuid)','execute')
    or has_table_privilege('service_role','public.account_merge_jobs','select') then
    raise exception 'Merge RPC or snapshot grants are too broad';
  end if;
  begin perform public.merge_accounts(primary_id,primary_id,secondary_id,false); raise exception 'Unauthorized actor merged';
    exception when insufficient_privilege then null; end;
  begin perform public.merge_accounts(actor,primary_id,primary_id,false); raise exception 'Self merge accepted';
    exception when invalid_parameter_value then null; end;
  begin perform public.merge_accounts(actor,primary_id,privileged,false); raise exception 'Privileged secondary merged';
    exception when invalid_parameter_value then if sqlerrm not like '%privileged role%' then raise; end if; end;
  insert into public.memberships(user_id,role) values(privileged,'staff');
  delete from public.admin_user_roles where user_id=privileged;
  begin perform public.merge_accounts(actor,primary_id,privileged,false); raise exception 'Legacy officer merged';
    exception when invalid_parameter_value then if sqlerrm not like '%privileged role%' then raise; end if; end;

  snapshot:=pg_temp.merge_snapshot();
  execute 'set local role service_role';
  result:=public.merge_accounts(actor,primary_id,secondary_id,true);
  execute 'reset role';
  if result->>'status'<>'preview' or snapshot<>pg_temp.merge_snapshot() then raise exception 'Preview wrote data'; end if;
  perform set_config('test.fail_account_merge','on',true);
  begin
    perform public.merge_accounts(actor,primary_id,secondary_id,false);
    raise exception 'Injected failure did not run';
  exception when others then if sqlerrm<>'Injected late merge failure' then raise; end if; end;
  if snapshot<>pg_temp.merge_snapshot() then raise exception 'Failed merge left partial changes'; end if;
  perform set_config('test.fail_account_merge','off',true);
  execute 'set local role service_role';
  result:=public.merge_accounts(actor,primary_id,secondary_id,false);
  execute 'reset role';
  if result->>'status'<>'pending_auth_delete' then raise exception 'Missing resumable merge state'; end if;
  if not exists(select 1 from trip_write_private.draft_publications
      where draft_id=receipt and draft_owner_id=primary_id and published_by=primary_id)
    or not exists(select 1 from public.account_merge_jobs where secondary_user_id=secondary_id
      and secondary_snapshot->'draft_publications'->0->>'published_by'=secondary_id::text) then
    raise exception 'Publication receipt ownership or original attribution lost';
  end if;
  if exists(select 1 from public.profiles where user_id=secondary_id)
    or not exists(select 1 from public.trip_drafts where id=draft and created_by=primary_id)
    or (select phone from public.profile_private where user_id=primary_id)<>'5551234567'
    or (select display_name from public.profiles where user_id=primary_id)<>'Retained member' then
    raise exception 'Profile/private/draft transfer lost data';
  end if;
  if (select count(*) from public.membership_entitlements where user_id=primary_id)<>2
    or not exists(select 1 from public.membership_access_overrides where id=override_id and user_id=primary_id)
    or not exists(select 1 from public.membership_account_restrictions where user_id=primary_id and restriction='suspended')
    or not exists(select 1 from public.membership_applications where user_id=primary_id and age_status='minor' and guardian_consent='pending') then
    raise exception 'Canonical membership or conservative restrictions lost';
  end if;
  if (select trip_email_notifications from public.user_preferences where user_id=primary_id)
    or (select subscribed from public.mailing_list_subscriptions where user_id=primary_id)
    or (select notification_settings->>'email' from public.profile_private where user_id=primary_id)<>'false'
    or (select notification_settings->>'tripReminders' from public.profile_private where user_id=primary_id)<>'false' then
    raise exception 'Merge lost opt-outs';
  end if;
  if not exists(select 1 from storage.objects where bucket_id='merge-'||secondary_id and owner=primary_id and owner_id=primary_id::text)
    or not exists(select 1 from storage.buckets where id='merge-'||secondary_id and owner=primary_id and owner_id=primary_id::text)
    or (select count(*) from public.trip_update_followers where trip_id=tid and user_id=primary_id)<>1 then
    raise exception 'Media ownership or followed trips lost';
  end if;
  if (select count(*) from public.trip_rsvps where trip_id=tid)<>1
    or (select count(*) from public.trip_leaders where trip_id=tid and user_id=primary_id)<>1
    or not exists(select 1 from public.trip_attendance where trip_id=tid and user_id=primary_id and not attended)
    or (select count(*) from public.user_waivers where user_id=primary_id)<>2
    or (select count(*) from public.membership_zelle_payments where user_id=primary_id)<>3
    or not exists(select 1 from public.membership_checkout_attempts where id=checkout and status='review_required') then
    raise exception 'Collision resolution lost rows';
  end if;
  if (select answers from public.registration_responses where trip_id=tid and user_id=primary_id)<>'{}'::jsonb
    or not exists(select 1 from public.account_merge_jobs where secondary_user_id=secondary_id
      and secondary_snapshot->'registration_responses'->0->'answers'='{"experience":true}'::jsonb) then
    raise exception 'Conflicting form resolution lost primary values or secondary archive';
  end if;
  -- Any newly introduced application FK will make this assertion fail if its
  -- secondary rows were seeded but not handled by the merge.
  for item in select c.conrelid::regclass as table_name,a.attname as column_name
    from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.contype='f' and c.connamespace='public'::regnamespace
      and c.confrelid in ('auth.users'::regclass,'public.profiles'::regclass) loop
    execute format('select count(*) from %s where %I=$1',item.table_name,item.column_name) into n using secondary_id;
    if n<>0 then raise exception 'Unmoved secondary FK: %.%',item.table_name,item.column_name; end if;
  end loop;
  begin insert into public.profiles(user_id,display_name) values(secondary_id,'Recreated'); raise exception 'Merged profile recreated';
    exception when invalid_parameter_value then null; end;
  begin insert into public.trip_comments(trip_id,user_id,body) values(tid,secondary_id,'Late write'); raise exception 'Merged ownership recreated';
    exception when invalid_parameter_value then null; end;
  begin insert into storage.objects(id,bucket_id,name,owner_id) values(gen_random_uuid(),'merge-'||secondary_id,'late.jpg',secondary_id::text);
    raise exception 'Merged media ownership recreated'; exception when invalid_parameter_value then null; end;
  select count(*) into before_events from public.registration_events;
  result:=public.merge_accounts(actor,primary_id,secondary_id,false);
  if result->>'resumed'<>'true' or before_events<>(select count(*) from public.registration_events) then raise exception 'Retry repeated transfers'; end if;
  begin perform public.complete_account_merge(actor,primary_id,secondary_id); raise exception 'Premature completion accepted';
    exception when invalid_parameter_value then null; end;
  -- Simulate the separate auth API hard deletion, then an interrupted completion.
  delete from auth.users where id=secondary_id;
  result:=public.merge_accounts(actor,primary_id,secondary_id,false);
  if result->>'status'<>'pending_auth_delete' then raise exception 'Deleted auth user cannot resume'; end if;
  perform public.complete_account_merge(actor,primary_id,secondary_id);
  perform public.complete_account_merge(actor,primary_id,secondary_id);
  result:=public.merge_accounts(actor,primary_id,secondary_id,false);
  if result->>'status'<>'completed' then raise exception 'Completion not idempotent'; end if;
  if not exists(select 1 from public.registration_signatures where id=signature and user_id=secondary_id and original_signer_id=secondary_id)
    or not registration_private.owns_record(primary_id,secondary_id)
    or not exists(select 1 from public.registration_guardian_evidence where user_id=secondary_id)
    or not exists(select 1 from public.registration_risk_acknowledgements where user_id=secondary_id)
    or not exists(select 1 from public.profile_email_consent_events where user_id=secondary_id)
    or not exists(select 1 from public.registration_annual_guardian_requests where user_id=secondary_id) then
    raise exception 'Auth deletion lost immutable evidence or retained ownership';
  end if;
  raise notice 'Atomic merge, complete ownership, rollback, grants, privileged rejection, evidence, and resumable auth checks passed';
end $$;
do $$
declare actor uuid; primary_id uuid:=gen_random_uuid(); secondary_id uuid:=gen_random_uuid(); draft uuid:=gen_random_uuid(); begin
  select ur.user_id into actor from public.admin_user_roles ur join public.admin_roles r on r.id=ur.role_id where r.is_super_admin limit 1;
  insert into auth.users(id,email) values(primary_id,null),(secondary_id,secondary_id||'@example.test');
  insert into public.profiles(user_id,display_name,username) values(secondary_id,'Inherited profile','inherited-'||secondary_id);
  insert into public.profile_private(user_id,phone) values(secondary_id,'5557654321');
  insert into public.trip_drafts(id,created_by,title) values(draft,secondary_id,'Inherited draft');
  insert into public.memberships(user_id,status) values(secondary_id,'inactive');
  insert into public.mailing_list_subscriptions(user_id,email,subscribed,consent_source,unsubscribed_at)
    values(secondary_id,secondary_id||'@example.test',false,'account_settings',now());
  perform public.merge_accounts(actor,primary_id,secondary_id,false);
  if not exists(select 1 from public.profiles where user_id=primary_id and display_name='Inherited profile')
    or not exists(select 1 from public.profile_private where user_id=primary_id and phone='5557654321')
    or not exists(select 1 from public.trip_drafts where id=draft and created_by=primary_id)
    or not exists(select 1 from public.memberships where user_id=primary_id and status='inactive') then
    raise exception 'Missing primary singleton transfer failed';
  end if;
  delete from auth.users where id=secondary_id;
  perform public.complete_account_merge(actor,primary_id,secondary_id);
end $$;
rollback;
