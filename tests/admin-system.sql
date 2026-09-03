-- Transactional integration checks for the part-one admin foundation.
-- Run after applying all migrations to a disposable Supabase database that
-- contains both bootstrap accounts and at least one ordinary test account.

begin;
select set_config('request.jwt.claim.role', 'service_role', true);

do $$
declare
  v_bootstrap_a uuid;
  v_bootstrap_b uuid;
  v_member uuid;
  v_trip_leader_role uuid;
  v_president_role uuid;
  v_first_trip uuid;
  v_payment uuid;
  v_entitlement_count integer;
  v_failed boolean := false;
begin
  select id into v_bootstrap_a from auth.users
  where lower(email) = 'valded5@unlv.nevada.edu';
  select id into v_bootstrap_b from auth.users
  where lower(email) = 'welcometochilis666@aol.com';
  select id into v_member from auth.users
  where id not in (v_bootstrap_a, v_bootstrap_b)
  order by created_at limit 1;

  if v_bootstrap_a is null or v_bootstrap_b is null or v_member is null then
    raise exception 'Admin integration tests require both bootstrap accounts and one regular account';
  end if;
  if not public.is_super_admin(v_bootstrap_a)
    or not public.is_super_admin(v_bootstrap_b) then
    raise exception 'Bootstrap super-admin assignment failed';
  end if;

  select id into v_trip_leader_role from public.admin_roles where key = 'trip_leader';
  select id into v_president_role from public.admin_roles where key = 'president';
  delete from public.admin_user_roles where user_id = v_member;
  update public.admin_role_grants set scope = 'assigned'
  where role_id = v_trip_leader_role and capability_key = 'trips.update';
  insert into public.admin_user_roles (user_id, role_id, assigned_by)
  values (v_member, v_trip_leader_role, v_bootstrap_a);
  if public.admin_capability_scope(v_member, 'trips.update') <> 'assigned' then
    raise exception 'Assigned role scope was not resolved';
  end if;

  update public.admin_role_grants set scope = 'all'
  where role_id = v_president_role and capability_key = 'trips.update';
  insert into public.admin_user_roles (user_id, role_id, assigned_by)
  values (v_member, v_president_role, v_bootstrap_a);
  if public.admin_capability_scope(v_member, 'trips.update') <> 'all' then
    raise exception 'Multiple role scopes did not resolve to their union';
  end if;

  delete from public.admin_user_roles where user_id = v_member;
  if public.admin_capability_scope(v_member, 'trips.update') is not null then
    raise exception 'Missing grants did not resolve to no access';
  end if;
  insert into public.admin_user_roles (user_id, role_id, assigned_by)
  values (v_member, v_trip_leader_role, v_bootstrap_a);

  insert into public.membership_account_restrictions (
    user_id, restriction, internal_reason, restricted_at, updated_by
  ) values (
    v_member, 'suspended', 'Admin integration test', now(), v_bootstrap_a
  ) on conflict (user_id) do update set
    restriction = excluded.restriction,
    internal_reason = excluded.internal_reason,
    restricted_at = excluded.restricted_at,
    updated_by = excluded.updated_by;
  if public.admin_capability_scope(v_member, 'trips.update') is not null then
    raise exception 'Suspension did not block administrative authority';
  end if;

  begin
    perform public.set_super_admin_assignment(v_bootstrap_a, v_bootstrap_a, false);
  exception when others then
    v_failed := true;
  end;
  if not v_failed then raise exception 'Super admin could remove itself'; end if;

  v_failed := false;
  begin
    perform public.set_admin_account_restriction(
      v_bootstrap_a, v_bootstrap_a, 'suspended', 'self restriction test'
    );
  exception when others then
    v_failed := true;
  end;
  if not v_failed then raise exception 'Super admin could suspend itself'; end if;

  if not exists (
    select 1 from public.admin_list_accounts(
      v_bootstrap_a, null, null, null, null, null, false, 1, 25
    )
  ) then
    raise exception 'Server-paginated account listing returned no accounts';
  end if;

  update public.membership_account_restrictions set
    restriction = 'normal', internal_reason = null, restricted_at = null
  where user_id = v_member;
  delete from public.admin_user_roles where user_id = v_member;
  insert into public.memberships (user_id, status, role)
  values (v_member, 'active', 'regular')
  on conflict (user_id) do update set status = 'active', role = 'regular';
  update public.club_admin_settings set non_admin_upcoming_trip_limit = 1 where id;

  insert into public.trips (
    created_by, title, starts_at, ends_at, visibility, is_official,
    lifecycle_status
  ) values (
    v_member, 'Admin limit test one', now() + interval '10 days',
    now() + interval '10 days 2 hours', 'public', false, 'published'
  ) returning id into v_first_trip;

  v_failed := false;
  begin
    insert into public.trips (
      created_by, title, starts_at, ends_at, visibility, is_official,
      lifecycle_status
    ) values (
      v_member, 'Admin limit test two', now() + interval '11 days',
      now() + interval '11 days 2 hours', 'public', false, 'published'
    );
  exception when others then
    v_failed := true;
  end;
  if not v_failed then raise exception 'Unofficial trip limit was not enforced'; end if;

  delete from public.membership_entitlements where user_id = v_member;
  delete from public.membership_zelle_payments where user_id = v_member;
  delete from public.membership_applications where user_id = v_member;
  insert into public.membership_applications (
    user_id, full_name, contact_email, age_status, guardian_consent,
    dues_payment_claimed, dues_claimed_at, primary_interest
  ) values (
    v_member, 'Admin Test Member', 'member-test@example.com', 'adult',
    'not_required', true, now(), 'hiking'
  );
  v_payment := public.set_zelle_membership_payment_status(
    v_member, v_bootstrap_a, 'confirmed', 'integration test'
  );
  select count(*) into v_entitlement_count
  from public.membership_entitlements where zelle_payment_id = v_payment;
  if v_entitlement_count <> 1 or not exists (
    select 1 from public.membership_applications
    where user_id = v_member and status = 'confirmed'
  ) then
    raise exception 'Confirmed Zelle payment did not activate membership';
  end if;
  if exists (
    select 1 from public.membership_entitlements
    where zelle_payment_id = v_payment
      and ends_at <> starts_at + interval '12 months'
  ) then
    raise exception 'Zelle entitlement was not exactly 12 months';
  end if;
  perform public.review_zelle_membership_payment(
    v_payment, v_bootstrap_a, 'confirmed', 'duplicate request'
  );
  if (select count(*) from public.membership_entitlements where zelle_payment_id = v_payment) <> 1 then
    raise exception 'Duplicate confirmation created another entitlement';
  end if;
  perform public.reverse_zelle_membership_payment(
    v_payment, v_bootstrap_a, 'Integration reversal'
  );
  if not exists (
    select 1 from public.membership_entitlements
    where zelle_payment_id = v_payment and revoked_at is not null
  ) then
    raise exception 'Zelle reversal did not revoke its entitlement';
  end if;
  v_payment := public.set_zelle_membership_payment_status(
    v_member, v_bootstrap_a, 'claimed', 'pending review test'
  );
  if not exists (
    select 1 from public.membership_zelle_payments
    where id = v_payment and status = 'claimed'
  ) then
    raise exception 'Admin could not set an unclaimed payment to pending';
  end if;
  v_payment := public.set_zelle_membership_payment_status(
    v_member, v_bootstrap_a, 'rejected', 'rejection test'
  );
  if not exists (
    select 1 from public.membership_zelle_payments
    where id = v_payment and status = 'rejected'
  ) then
    raise exception 'Admin could not reject a pending payment';
  end if;

  update public.membership_applications set
    age_status = 'minor', guardian_consent = 'pending',
    dues_payment_claimed = true, dues_claimed_at = now()
  where user_id = v_member;
  v_payment := public.set_zelle_membership_payment_status(
    v_member, v_bootstrap_a, 'confirmed', 'guardian-order test'
  );
  if exists (
    select 1 from public.membership_entitlements where zelle_payment_id = v_payment
  ) then
    raise exception 'Minor membership activated before guardian consent';
  end if;
  perform public.confirm_membership_guardian_consent(v_member, v_bootstrap_a);
  if not exists (
    select 1 from public.membership_entitlements where zelle_payment_id = v_payment
  ) then
    raise exception 'Guardian consent did not activate confirmed payment';
  end if;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_member::text, true);
  perform public.set_mailing_list_subscription('member-test@example.com', true, 'account_settings');
  perform public.set_mailing_list_subscription('member-test@example.com', false, 'account_settings');
  if (select count(*) from public.mailing_list_consent_events where user_id = v_member) <> 2 then
    raise exception 'Mailing-list consent history was not append-only';
  end if;
end $$;

rollback;
