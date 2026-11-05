-- Every callable grant path must enforce the same age/consent/restriction policy.
begin;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$
declare
  reviewer uuid := gen_random_uuid();
  role_id uuid := gen_random_uuid();
  member uuid;
  application_minor uuid := gen_random_uuid();
  account_minor uuid := gen_random_uuid();
  unknown_age uuid := gen_random_uuid();
  unverified uuid := gen_random_uuid();
  restricted uuid := gen_random_uuid();
  withdrawn uuid := gen_random_uuid();
  payment uuid;
  attempt uuid;
  review_id uuid;
  result record;
  command text;
begin
  insert into auth.users(id,email,email_confirmed_at)
  select id,id || '@example.test',now() from unnest(array[
    reviewer,application_minor,account_minor,unknown_age,unverified,restricted,withdrawn
  ]) id;
  insert into public.admin_roles(id,key,name,is_super_admin)
  values(role_id,'activation_' || replace(role_id::text,'-','_'),'Test reviewer',true) on conflict do nothing;
  insert into public.admin_user_roles(user_id,role_id)
    select reviewer,id from public.admin_roles where is_super_admin;
  insert into public.account_age_declarations(user_id,is_18_or_older) values
    (account_minor,false),(restricted,true),(withdrawn,true),(unverified,true);
  update auth.users set email_confirmed_at=null where id=unverified;
  insert into public.membership_applications(
    user_id,full_name,contact_email,age_status,guardian_consent,primary_interest,status
  ) values
    (application_minor,'Minor applicant','minor@example.test','minor','pending','Hiking','submitted'),
    (withdrawn,'Withdrawn applicant','withdrawn@example.test','adult','not_required','Hiking','withdrawn');
  insert into public.membership_account_restrictions(user_id,restriction,restricted_at)
  values(restricted,'suspended',now());

  if has_function_privilege('anon','public.membership_activation_ineligibility(uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.membership_activation_ineligibility(uuid)','EXECUTE') then
    raise exception 'Eligibility helper must remain internal';
  end if;

  foreach member in array array[application_minor,account_minor,unknown_age,unverified,restricted,withdrawn] loop
    -- Both complimentary paths and the legacy confirmation RPC must reject.
    foreach command in array array[
      format('select public.grant_complimentary_membership_access(%L,%L,365,%L)',reviewer,member,'Test scholarship'),
      format('select public.grant_application_complimentary_membership(%L,%L,%L)',reviewer,member,'Test scholarship'),
      format('select public.confirm_zelle_membership_application(%L,%L)',member,reviewer)
    ] loop
      begin
        execute command;
        raise exception 'Ineligible grant succeeded';
      exception when others then
        if sqlerrm not in (
          'guardian consent must be complete before membership activation',
          'age declaration required before membership activation',
          'account email must be confirmed before membership activation',
          'restricted account cannot receive membership access',
          'withdrawn application cannot receive membership access'
        ) then raise; end if;
      end;
    end loop;

    payment := public.set_zelle_membership_payment_status(member,reviewer,'confirmed',null);
    if public.activate_confirmed_zelle_membership(member)
      or public.review_zelle_membership_payment(payment,reviewer,'confirmed',null) then
      raise exception 'Ineligible Zelle payment activated';
    end if;

    attempt := gen_random_uuid();
    insert into public.membership_checkout_attempts(
      id,user_id,status,stripe_checkout_session_id,stripe_price_id,
      amount_cents,currency,test_mode,expires_at
    ) values(attempt,member,'open','cs_' || attempt,'price_test',2500,'usd',true,now()+interval '1 hour');
    select * into result from public.process_membership_checkout_event(
      'evt_' || attempt,'checkout.session.completed',true,attempt,member,
      'cs_' || attempt,'pi_' || attempt,'cus_test',2500,'usd',now(),null
    );
    if not result.review_required or result.entitlement_id is not null then
      raise exception 'Ineligible Stripe checkout activated';
    end if;
    select id into review_id from public.membership_review_items where payment_id=result.payment_id;
    begin
      perform public.approve_membership_review_item(review_id,reviewer);
      raise exception 'Ineligible Stripe approval activated';
    exception when others then
      if sqlerrm <> public.membership_activation_ineligibility(member) then raise; end if;
    end;
    if exists(select 1 from public.membership_entitlements where user_id=member)
      or exists(select 1 from public.membership_access_overrides where user_id=member)
      or exists(select 1 from public.memberships where user_id=member and status='active') then
      raise exception 'Ineligible member received access';
    end if;
  end loop;

  -- A declaration of adulthood cannot override the application's minor status.
  insert into public.account_age_declarations(user_id,is_18_or_older) values(application_minor,true);
  if public.membership_activation_ineligibility(application_minor) not like 'guardian consent%' then
    raise exception 'Conflicting age declaration bypassed guardian consent';
  end if;
  perform public.confirm_membership_guardian_consent(application_minor,reviewer);
  if not public.has_membership_access(application_minor) then
    raise exception 'Consent did not activate the accepted Zelle payment';
  end if;
end;
$$;
rollback;
