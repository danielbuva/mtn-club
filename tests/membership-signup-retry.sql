-- Reconcile legacy parallel-write failures without changing later user/reviewer choices.
begin;
insert into public.club_admin_settings(id) values (true) on conflict (id) do nothing;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$
declare
  applicant uuid := gen_random_uuid();
  reviewed uuid := gen_random_uuid();
  consent_only uuid := gen_random_uuid();
  subscriber_only uuid := gen_random_uuid();
  original_claimed_at timestamptz := now() - interval '1 day';
begin
  insert into auth.users(id,email) values
    (applicant, applicant || '@example.test'), (reviewed, reviewed || '@example.test'),
    (consent_only, consent_only || '@example.test'), (subscriber_only, subscriber_only || '@example.test');
  insert into public.membership_applications (
    user_id, full_name, contact_email, age_status, guardian_consent,
    primary_interest, dues_payment_claimed, dues_claimed_at
  ) values
    (applicant, 'Original Applicant', applicant || '@example.test', 'adult', 'not_required', 'Hiking', true, original_claimed_at),
    (reviewed, 'Reviewed Minor', reviewed || '@example.test', 'minor', 'confirmed', 'Camping', true, original_claimed_at);
  insert into public.profiles(user_id,display_name) values (applicant, 'Later preferred name');
  insert into public.memberships(user_id,status,role) values (applicant, 'suspended', 'staff');
  insert into public.mailing_list_subscriptions(user_id,email,subscribed,consent_source,unsubscribed_at)
    values (applicant, applicant || '@example.test', false, 'account_settings', now());
  insert into public.membership_zelle_payments(user_id,amount_cents,status,reviewed_at,claim_source)
    values (reviewed, 2500, 'rejected', now(), 'membership_signup');
  insert into public.mailing_list_consent_events(user_id,email,subscribed,consent_source)
    values (consent_only, consent_only || '@example.test', true, 'membership_signup');
  insert into public.mailing_list_subscriptions(user_id,email,subscribed,consent_source,subscribed_at)
    values (subscriber_only, subscriber_only || '@example.test', true, 'membership_signup', now());

  perform public.submit_membership_signup(applicant, 'Different Applicant', applicant || '@example.test', 'minor', false, '["Camping"]', null, true);
  if not exists (select 1 from public.membership_applications where user_id = applicant
      and signup_completed_at is not null and full_name = 'Original Applicant' and age_status = 'adult' and primary_interest = 'Hiking')
    or not exists (select 1 from public.profiles where user_id = applicant and display_name = 'Later preferred name' and first_name = 'Original')
    or not exists (select 1 from public.memberships where user_id = applicant and status = 'suspended' and role = 'staff')
    or not exists (select 1 from public.account_age_declarations where user_id = applicant)
    or not exists (select 1 from public.membership_zelle_payments where user_id = applicant and status = 'claimed' and membership_zelle_payments.claimed_at = original_claimed_at)
    or exists (select 1 from public.mailing_list_subscriptions where user_id = applicant and subscribed)
    or exists (select 1 from public.mailing_list_consent_events where user_id = applicant) then
    raise exception 'Legacy retry failed to repair missing data or overwrote existing decisions';
  end if;
  perform public.submit_membership_signup(reviewed, 'Changed Name', reviewed || '@example.test', 'adult', true, '["Hiking"]', null, false);
  if (select count(*) from public.membership_zelle_payments where user_id = reviewed) <> 1
    or not exists (select 1 from public.membership_zelle_payments where user_id = reviewed and status = 'rejected')
    or not exists (select 1 from public.membership_applications where user_id = reviewed and guardian_consent = 'confirmed')
    or exists (select 1 from public.account_age_declarations where user_id = reviewed) then
    raise exception 'Retry undid payment/guardian review or changed age';
  end if;
  perform public.submit_membership_signup(consent_only, 'Consent Only', consent_only || '@example.test', 'adult', false, '["Hiking"]', null, false);
  perform public.submit_membership_signup(subscriber_only, 'Subscription Only', subscriber_only || '@example.test', 'adult', false, '["Hiking"]', null, false);
  if (select count(*) from public.mailing_list_subscriptions where user_id in (consent_only, subscriber_only) and subscribed) <> 2
    or (select count(*) from public.mailing_list_consent_events where user_id in (consent_only, subscriber_only) and subscribed) <> 2 then
    raise exception 'Retry failed to reconcile either half of legacy mailing consent';
  end if;
end;
$$;
rollback;
