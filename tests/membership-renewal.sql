-- New payments create new terms; initial application completion is permanent.
begin;
select set_config('request.jwt.claim.role','service_role',true);
do $$
declare
  reviewer uuid := gen_random_uuid();
  role_id uuid := gen_random_uuid();
  member uuid := gen_random_uuid();
  first_payment uuid;
  renewal uuid;
  term_end timestamptz;
  first_confirmed_at timestamptz;
begin
  insert into auth.users(id,email,email_confirmed_at) values
    (reviewer,reviewer || '@example.test',now()),(member,member || '@example.test',now());
  insert into public.admin_roles(id,key,name,is_super_admin)
  values(role_id,'renewal_' || replace(role_id::text,'-','_'),'Test reviewer',true) on conflict do nothing;
  insert into public.admin_user_roles(user_id,role_id)
    select reviewer,id from public.admin_roles where is_super_admin;
  insert into public.membership_applications(
    user_id,full_name,contact_email,age_status,guardian_consent,primary_interest
  ) values(member,'Renewing member','renewal@example.test','adult','not_required','Hiking');
  first_payment := public.set_zelle_membership_payment_status(member,reviewer,'confirmed',null);
  select confirmed_at into first_confirmed_at from public.membership_applications where user_id=member;
  -- Model a completed term without changing the completed application.
  update public.membership_entitlements set starts_at=now()-interval '2 years',ends_at=now()-interval '1 year'
    where zelle_payment_id=first_payment;
  update public.membership_zelle_payments set created_at=now()-interval '2 years' where id=first_payment;

  begin
    perform public.set_zelle_membership_payment_status(member,reviewer,'confirmed',null);
    raise exception 'Reconfirmation reused an expired payment';
  exception when others then
    if sqlerrm <> 'new payment claim required for renewal' then raise; end if;
  end;
  if public.review_zelle_membership_payment(first_payment,reviewer,'confirmed',null) then
    raise exception 'Expired old claim reported new activation';
  end if;
  if (select count(*) from public.membership_entitlements where user_id=member) <> 1 then
    raise exception 'Reconfirmation created a term without payment';
  end if;

  perform set_config('request.jwt.claim.sub',member::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  renewal := public.claim_zelle_membership_payment();
  if renewal=first_payment or renewal <> public.claim_zelle_membership_payment() then
    raise exception 'Renewal must be a new, idempotent payment claim';
  end if;
  if not exists(select 1 from public.membership_applications
    where user_id=member and status='confirmed' and confirmed_at=first_confirmed_at) then
    raise exception 'Renewal reopened the initial application';
  end if;
  perform set_config('request.jwt.claim.role','service_role',true);
  if public.set_zelle_membership_payment_status(member,reviewer,'confirmed','New renewal dues') <> renewal then
    raise exception 'Officer reconfirmed the old payment instead of the renewal';
  end if;
  if not public.has_membership_access(member) then raise exception 'Renewal did not activate'; end if;
  select ends_at into term_end from public.membership_entitlements where zelle_payment_id=renewal;
  if term_end is distinct from (((now() at time zone 'America/Los_Angeles')+interval '1 year') at time zone 'America/Los_Angeles') then
    raise exception 'Renewal did not create a new full calendar-year term';
  end if;
  perform public.review_zelle_membership_payment(renewal,reviewer,'confirmed',null);
  perform public.set_zelle_membership_payment_status(member,reviewer,'confirmed',null);
  if (select count(*) from public.membership_entitlements where user_id=member) <> 2 then
    raise exception 'Renewal confirmation retry duplicated a term';
  end if;
  perform set_config('request.jwt.claim.role','authenticated',true);
  begin
    perform public.claim_zelle_membership_payment();
    raise exception 'Active member claimed an early renewal';
  exception when others then
    if sqlerrm <> 'membership renewal opens after current access expires' then raise; end if;
  end;

  -- A rejected renewal does not change the old application or consume a term.
  update public.membership_entitlements set starts_at=now()-interval '2 years',ends_at=now()-interval '1 year'
    where zelle_payment_id=renewal;
  renewal := public.claim_zelle_membership_payment();
  perform set_config('request.jwt.claim.role','service_role',true);
  perform public.review_zelle_membership_payment(renewal,reviewer,'rejected','Payment not matched');
  perform set_config('request.jwt.claim.role','authenticated',true);
  first_payment := public.claim_zelle_membership_payment();
  if renewal=first_payment then raise exception 'Rejected claim was reused'; end if;
  if (select count(*) from public.membership_entitlements where user_id=member) <> 2 then
    raise exception 'Rejected claim created access';
  end if;
  perform set_config('request.jwt.claim.role','service_role',true);
  -- The legacy RPC also confirms the new claim rather than reusing an old payment.
  term_end := public.confirm_zelle_membership_application(member,reviewer);
  if not exists(select 1 from public.membership_entitlements
    where zelle_payment_id=first_payment and ends_at=term_end) then
    raise exception 'Legacy confirmation did not consume the new claim';
  end if;
  perform public.reverse_zelle_membership_payment(first_payment,reviewer,'Test renewal reversal');
  if public.has_membership_access(member) then raise exception 'Reversed renewal retained access'; end if;
  if not exists(select 1 from public.membership_applications
    where user_id=member and status='confirmed' and confirmed_at=first_confirmed_at) then
    raise exception 'Renewal reversal undid completed onboarding';
  end if;
  perform set_config('request.jwt.claim.role','authenticated',true);
  if first_payment=public.claim_zelle_membership_payment() then
    raise exception 'Reversed payment was reused as a claim';
  end if;
end;
$$;
rollback;
