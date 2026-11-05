-- Cross-branch ownership, publication and renewal behavior in the final schema.
begin;
do $$
#variable_conflict use_variable
declare
  actor uuid := gen_random_uuid();
  primary_id uuid := gen_random_uuid();
  secondary_id uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  account_role uuid := gen_random_uuid();
  source_trip uuid := gen_random_uuid();
  official_trip uuid := gen_random_uuid();
  primary_trip uuid := gen_random_uuid();
  receipt uuid := gen_random_uuid();
  first_payment uuid := gen_random_uuid();
  second_payment uuid := gen_random_uuid();
  claim uuid;
  result jsonb;
  expires timestamptz;
begin
  insert into auth.users(id,email,email_confirmed_at)
    select id,id||'@example.test',now() from unnest(array[actor,primary_id,secondary_id,outsider]) id;
  insert into public.profiles(user_id,display_name)
    select id,'Reconciliation fixture' from unnest(array[actor,primary_id,secondary_id,outsider]) id on conflict do nothing;
  insert into public.admin_roles(id,key,name)
    values(account_role,'reconcile_'||replace(account_role::text,'-','_'),'Account management only');
  insert into public.admin_role_grants(role_id,capability_key,scope) values(account_role,'accounts.update','all');
  insert into public.admin_user_roles(user_id,role_id) values(actor,account_role);
  insert into public.membership_access_overrides(user_id,reason,granted_by)
    values(primary_id,'Reconciliation membership',actor),(outsider,'Reconciliation membership',actor);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform public.submit_membership_signup(secondary_id,'Completed Source',secondary_id||'@example.test',
    'adult',true,'Hiking',null,false);
  select id into strict claim from public.membership_zelle_payments where user_id=secondary_id and status='claimed';
  insert into public.membership_zelle_payments(id,user_id,amount_cents,status,reviewed_at,created_at)
    values(first_payment,secondary_id,2500,'confirmed',now()-interval '2 years',now()-interval '2 years'),
      (second_payment,secondary_id,2500,'confirmed',now()-interval '1 year',now()-interval '1 year');
  insert into public.membership_entitlements(user_id,zelle_payment_id,starts_at,ends_at) values
    (secondary_id,first_payment,now()-interval '2 years',now()-interval '1 year'),
    (secondary_id,second_payment,now()-interval '1 year',now()-interval '1 day');
  -- Maintenance seeds history above today's creation limit, including an
  -- official trip whose creator has no current official permission.
  perform set_config('request.jwt.claim.sub','',true);
  insert into public.trips(id,title,created_by,visibility,is_official,starts_at,ends_at) values
    (source_trip,'Inherited leaders trip',secondary_id,'leaders',false,now()+interval '2 days',now()+interval '3 days'),
    (official_trip,'Inherited official leaders trip',secondary_id,'leaders',true,now()+interval '4 days',now()+interval '5 days'),
    (primary_trip,'Existing primary trip',primary_id,'members',false,now()+interval '6 days',now()+interval '7 days');
  insert into trip_write_private.draft_publications(draft_id,draft_owner_id,published_by,trip_id)
    values(receipt,secondary_id,secondary_id,source_trip);
  update public.club_admin_settings set non_admin_upcoming_trip_limit=1 where id;
  insert into public.membership_account_restrictions(user_id,restriction,restricted_at)
    values(primary_id,'suspended',now());
  perform set_config('request.jwt.claim.sub',actor::text,true);
  if public.has_admin_capability(actor,'trips.update') or public.has_admin_capability(actor,'trips.official') then
    raise exception 'Fixture actor unexpectedly has trip authority';
  end if;
  -- Exercise the narrow merge exception with a current actor in a trusted SQL
  -- session, rather than relying on the blanket no-actor/service import bypass.
  result := public.merge_accounts(actor,primary_id,secondary_id,false);
  if result->>'status'<>'pending_auth_delete'
    or result->'counts'->>'secondary_draft_publications_draft_owner_id'<>'1'
    or result->'counts'->>'secondary_draft_publications_published_by'<>'1'
    or (select count(*) from public.trips where created_by=primary_id)<>3
    or not exists(select 1 from public.trips where id=official_trip and is_official and visibility='leaders') then
    raise exception 'Merge revalidated creation/official limits or lost trip ownership';
  end if;
  if not exists(select 1 from public.membership_applications where user_id=primary_id and signup_completed_at is not null)
    or (select count(*) from public.membership_entitlements where user_id=primary_id)<>2
    or (select count(*) from public.membership_zelle_payments where user_id=primary_id)<>3
    or not exists(select 1 from trip_write_private.draft_publications
      where draft_id=receipt and draft_owner_id=primary_id and published_by=primary_id) then
    raise exception 'Merge lost signup checkpoint, renewal history or publication receipt';
  end if;
  -- The primary inherits assignment-based access, never creator-only access to
  -- an unassigned official leaders trip. Other ordinary members remain denied.
  if not public.can_view_trip(source_trip,primary_id)
    or public.can_view_trip(official_trip,primary_id)
    or public.can_view_trip(source_trip,outsider) then
    raise exception 'Merge broadened leaders visibility';
  end if;
  -- Only creation eligibility is bypassed: the current account-only actor still
  -- cannot change a transferred trip's schedule or promote it afterward.
  begin
    update public.trips set starts_at=starts_at+interval '1 hour' where id=source_trip;
    raise exception 'Account manager gained trip management authority';
  exception when raise_exception then
    if sqlerrm<>'Trip management permission required.' then raise; end if;
  end;
  -- New private rows receive the same merged-identity guard as public tables.
  begin
    insert into trip_write_private.draft_publications(draft_id,draft_owner_id,published_by,trip_id)
      values(gen_random_uuid(),secondary_id,actor,official_trip);
    raise exception 'Recreated merged receipt ownership';
  exception when invalid_parameter_value then null; end;
  begin
    update trip_write_private.draft_publications set published_by=secondary_id where draft_id=receipt;
    raise exception 'Recreated merged publisher access';
  exception when invalid_parameter_value then null; end;
  perform set_config('request.jwt.claim.sub',secondary_id::text,true);
  set local role authenticated;
  begin
    perform public.get_published_trip_for_draft(receipt);
    raise exception 'Stale secondary session read a receipt';
  exception when raise_exception then
    if sqlerrm<>'Sign in with an eligible retained account.' then raise; end if;
  end;
  begin
    perform public.publish_trip_draft(receipt,'{}',null,'{}','{}','{}','{}',false,false);
    raise exception 'Stale secondary session retried publication';
  exception when raise_exception then
    if sqlerrm<>'Sign in with an eligible retained account.' then raise; end if;
  end;
  reset role;
  delete from public.membership_account_restrictions where user_id=primary_id;
  perform set_config('request.jwt.claim.sub',primary_id::text,true);
  set local role authenticated;
  if public.get_published_trip_for_draft(receipt) is distinct from source_trip
    or public.publish_trip_draft(receipt,'{}',null,'{}','{}','{}','{}',false,false) is distinct from source_trip then
    raise exception 'Retained account lost idempotent publication access';
  end if;
  perform set_config('request.jwt.claim.sub',outsider::text,true);
  if public.get_published_trip_for_draft(receipt) is not null then raise exception 'Receipt leaked to ordinary member'; end if;
  reset role;
  -- Expired, consumed payments remain history. Confirm the transferred claim
  -- once with payment permission to create exactly one new payment-backed term.
  insert into public.admin_role_grants(role_id,capability_key,scope) values(account_role,'membership.confirm_payment','all');
  perform set_config('request.jwt.claim.role','service_role',true);
  set local role service_role;
  expires := public.confirm_zelle_membership_application(primary_id,actor);
  if expires is distinct from public.confirm_zelle_membership_application(primary_id,actor) then
    raise exception 'Confirmation retry changed the inherited renewal term';
  end if;
  reset role;
  if expires<=now()
    or (select count(*) from public.membership_entitlements where user_id=primary_id)<>3
    or not exists(select 1 from public.membership_entitlements where user_id=primary_id and zelle_payment_id=claim)
    or exists(select 1 from public.membership_entitlements where user_id=secondary_id) then
    raise exception 'Merged renewal reused old payments or lost ownership';
  end if;
  delete from auth.users where id=secondary_id;
  perform public.complete_account_merge(actor,primary_id,secondary_id);
  if not exists(select 1 from trip_write_private.draft_publications
    where draft_id=receipt and draft_owner_id=primary_id and published_by=primary_id) then
    raise exception 'Auth cleanup lost publication receipt';
  end if;
end $$;
rollback;
