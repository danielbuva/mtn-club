-- Inject a failure after profile, membership, application, age, and mailing writes.
begin;
insert into public.club_admin_settings(id) values (true) on conflict (id) do nothing;
create function public.test_fail_signup_payment() returns trigger
language plpgsql as $$ begin raise exception 'simulated signup payment failure'; end; $$;
create trigger test_fail_signup_payment before insert on public.membership_zelle_payments
  for each row execute function public.test_fail_signup_payment();
select set_config('request.jwt.claim.role', 'service_role', true);
do $$
declare
  applicant uuid := gen_random_uuid();
begin
  insert into auth.users(id,email) values (applicant, applicant || '@example.test');
  insert into public.profiles(user_id,display_name) values (applicant, 'Original profile');
  begin
    perform public.submit_membership_signup(applicant, 'Test Applicant', applicant || '@example.test', 'adult', true, '["Hiking"]', null, true);
    raise exception 'Injected failure did not fire';
  exception when others then
    if sqlerrm <> 'simulated signup payment failure' then raise; end if;
  end;
  if not exists (select 1 from auth.users where id = applicant)
    or (select display_name from public.profiles where user_id = applicant) <> 'Original profile'
    or exists (select 1 from public.memberships where user_id = applicant)
    or exists (select 1 from public.membership_applications where user_id = applicant)
    or exists (select 1 from public.account_age_declarations where user_id = applicant)
    or exists (select 1 from public.mailing_list_subscriptions where user_id = applicant)
    or exists (select 1 from public.mailing_list_consent_events where user_id = applicant)
    or exists (select 1 from public.membership_zelle_payments where user_id = applicant)
    or exists (select 1 from public.admin_activity_events where subject_user_id = applicant) then
    raise exception 'Failed signup left partial writes or deleted/changed existing account data';
  end if;
  execute 'drop trigger test_fail_signup_payment on public.membership_zelle_payments';
  perform public.submit_membership_signup(applicant, 'Test Applicant', applicant || '@example.test', 'adult', true, '["Hiking"]', null, true);
  if not exists (select 1 from public.membership_applications where user_id = applicant and signup_completed_at is not null)
    or (select count(*) from public.membership_zelle_payments where user_id = applicant) <> 1 then
    raise exception 'Retry after rollback did not succeed';
  end if;
end;
$$;
rollback;
