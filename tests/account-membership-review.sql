-- Run after migrations against a disposable database. All fixtures roll back.
begin;
select set_config('request.jwt.claim.role', 'service_role', true);

do $$
declare
  v_reviewer uuid := gen_random_uuid();
  v_role uuid := gen_random_uuid();
  v_account uuid := gen_random_uuid();
  v_minor uuid := gen_random_uuid();
  v_application uuid := gen_random_uuid();
  v_payment uuid;
begin
  insert into auth.users (id, email, email_confirmed_at) values
    (v_reviewer, v_reviewer || '@example.com', now()),
    (v_account, v_account || '@example.com', now()),
    (v_minor, v_minor || '@example.com', now()),
    (v_application, v_application || '@example.com', now());
  -- This fixture also runs against a schema-only sandbox with no seeded roles.
  insert into public.admin_roles (id, key, name, is_super_admin)
    values (v_role, 'test_' || replace(v_role::text, '-', '_'), 'Test reviewer', true);
  insert into public.admin_user_roles (user_id, role_id)
    values (v_reviewer, v_role);

  if has_function_privilege('anon', 'public.activate_confirmed_zelle_membership(uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.activate_confirmed_zelle_membership(uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.set_zelle_membership_payment_status(uuid,uuid,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.set_zelle_membership_payment_status(uuid,uuid,text,text)', 'EXECUTE') then
    raise exception 'Membership payment functions must remain server-only';
  end if;
  begin
    perform public.set_zelle_membership_payment_status(v_account, v_account, 'confirmed', null);
    raise exception 'Reviewer without permission was accepted';
  exception when others then
    if sqlerrm <> 'payment review permission required' then raise; end if;
  end;

  perform public.set_zelle_membership_payment_status(
    v_account, v_reviewer, 'claimed', null
  );
  if exists (select 1 from public.membership_entitlements where user_id = v_account) then
    raise exception 'Pending payment granted membership';
  end if;
  perform public.set_zelle_membership_payment_status(
    v_account, v_reviewer, 'rejected', null
  );
  if exists (select 1 from public.membership_entitlements where user_id = v_account) then
    raise exception 'Rejected payment granted membership';
  end if;
  v_payment := public.set_zelle_membership_payment_status(
    v_account, v_reviewer, 'confirmed', null
  );
  if not exists (
    select 1 from public.memberships where user_id = v_account and status = 'active'
  ) or not exists (
    select 1 from public.membership_entitlements
    where user_id = v_account and zelle_payment_id = v_payment
      and ends_at > starts_at and revoked_at is null
  ) then raise exception 'Account without application was not activated'; end if;
  perform public.set_zelle_membership_payment_status(
    v_account, v_reviewer, 'confirmed', null
  );
  if (select count(*) from public.membership_entitlements where user_id = v_account) <> 1 then
    raise exception 'Repeated confirmation duplicated membership';
  end if;

  insert into public.membership_applications (
    user_id, full_name, contact_email, age_status, guardian_consent,
    primary_interest, dues_payment_claimed
  ) values
    (v_minor, 'Minor applicant', v_minor || '@example.com', 'minor', 'pending', 'Hiking', false),
    (v_application, 'Adult applicant', v_application || '@example.com', 'adult', 'not_required', 'Hiking', false);
  perform public.set_zelle_membership_payment_status(
    v_minor, v_reviewer, 'confirmed', null
  );
  if exists (select 1 from public.membership_entitlements where user_id = v_minor) then
    raise exception 'Minor activated before guardian consent';
  end if;
  perform public.confirm_membership_guardian_consent(v_minor, v_reviewer);
  if not exists (select 1 from public.membership_entitlements where user_id = v_minor) then
    raise exception 'Minor not activated after payment and guardian consent';
  end if;
  perform public.set_zelle_membership_payment_status(
    v_application, v_reviewer, 'confirmed', null
  );
  if not exists (
    select 1 from public.membership_applications
    where user_id = v_application and status = 'confirmed'
  ) then raise exception 'Admin confirmation requires an applicant payment claim'; end if;
end;
$$;
rollback;
