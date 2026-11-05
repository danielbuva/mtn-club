-- Happy path, replay, optional fields, and server-only permissions.
begin;
insert into public.club_admin_settings(id) values (true) on conflict (id) do nothing;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$
declare
  adult uuid := gen_random_uuid();
  minor uuid := gen_random_uuid();
  before_replay jsonb;
  result uuid;
begin
  insert into auth.users(id,email) values
    (adult, adult || '@example.test'), (minor, minor || '@example.test');
  if has_function_privilege('anon', 'public.submit_membership_signup(uuid,text,text,public.membership_age_status,boolean,text,text,boolean)', 'execute')
    or has_function_privilege('authenticated', 'public.submit_membership_signup(uuid,text,text,public.membership_age_status,boolean,text,text,boolean)', 'execute') then
    raise exception 'Signup RPC must be server-only';
  end if;
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  begin
    perform public.submit_membership_signup(adult, 'Adult Applicant', adult || '@example.test', 'adult', true, '["Hiking"]', 'Some experience', true);
    raise exception 'Member JWT accepted';
  exception when others then
    if sqlerrm <> 'service role required' then raise; end if;
  end;
  perform set_config('request.jwt.claim.role', 'service_role', true);
  result := public.submit_membership_signup(adult, 'Adult Applicant', adult || '@example.test', 'adult', true, '["Hiking"]', 'Some experience', true);
  if result <> adult or not exists (
    select 1 from public.membership_applications a
    join public.profiles p using(user_id)
    join public.memberships m using(user_id)
    join public.account_age_declarations d using(user_id)
    join public.mailing_list_subscriptions s using(user_id)
    join public.mailing_list_consent_events c using(user_id)
    join public.membership_zelle_payments z using(user_id)
    where a.user_id = adult and a.signup_completed_at is not null
      and a.status = 'submitted' and a.guardian_consent = 'not_required'
      and a.primary_interest = '["Hiking"]' and a.experience_notes = 'Some experience'
      and p.first_name = 'Adult' and p.last_name = 'Applicant'
      and m.status = 'pending' and m.role = 'regular'
      and d.is_18_or_older and d.source = 'membership_application'
      and s.subscribed and c.subscribed and z.status = 'claimed'
      and z.claimed_at = a.dues_claimed_at
      and z.amount_cents = (select dues_amount_cents from public.club_admin_settings where id)
      and z.currency = (select currency from public.club_admin_settings where id)
  ) then raise exception 'Signup did not persist every required record'; end if;
  if exists (select 1 from public.membership_entitlements where user_id = adult) then
    raise exception 'Signup must not activate membership';
  end if;
  select to_jsonb(a) into before_replay from public.membership_applications a where user_id = adult;
  result := public.submit_membership_signup(adult, 'Changed Name', adult || '@example.test', 'minor', false, '["Camping"]', null, false);
  if result <> adult or before_replay is distinct from (select to_jsonb(a) from public.membership_applications a where user_id = adult)
    or (select count(*) from public.membership_zelle_payments where user_id = adult) <> 1
    or (select count(*) from public.mailing_list_consent_events where user_id = adult) <> 1
    or (select count(*) from public.admin_activity_events where subject_user_id = adult and action = 'membership_application_submitted') <> 1 then
    raise exception 'Completed retry changed or duplicated records';
  end if;
  perform public.submit_membership_signup(minor, 'Minor', minor || '@example.test', 'minor', false, '["Camping"]', null, false);
  if not exists (select 1 from public.membership_applications where user_id = minor
      and guardian_consent = 'pending' and not dues_payment_claimed and signup_completed_at is not null)
    or exists (select 1 from public.membership_zelle_payments where user_id = minor)
    or exists (select 1 from public.account_age_declarations where user_id = minor)
    or exists (select 1 from public.mailing_list_subscriptions where user_id = minor)
    or exists (select 1 from public.mailing_list_consent_events where user_id = minor) then
    raise exception 'Minor/unpaid/opt-out signup persisted incorrect records';
  end if;
end;
$$;
rollback;
