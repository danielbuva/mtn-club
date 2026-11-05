-- Stripe still creates and stacks terms and supports review after consent.
begin;
select set_config('request.jwt.claim.role','service_role',true);
do $$
declare
  reviewer uuid := gen_random_uuid();
  role_id uuid := gen_random_uuid();
  member uuid := gen_random_uuid();
  attempt uuid;
  review_id uuid;
  result record;
  first_end timestamptz;
  i integer;
begin
  insert into auth.users(id,email,email_confirmed_at) values(reviewer,reviewer || '@example.test',now()),(member,member || '@example.test',now());
  insert into public.admin_roles(id,key,name,is_super_admin)
    values(role_id,'stripe_' || replace(role_id::text,'-','_'),'Test reviewer',true) on conflict do nothing;
  insert into public.admin_user_roles(user_id,role_id)
    select reviewer,id from public.admin_roles where is_super_admin;
  insert into public.account_age_declarations(user_id,is_18_or_older) values(member,true);
  for i in 1..2 loop
    attempt := gen_random_uuid();
    insert into public.membership_checkout_attempts(
      id,user_id,status,stripe_checkout_session_id,stripe_price_id,
      amount_cents,currency,test_mode,expires_at
    ) values(attempt,member,'open','cs_' || attempt,'price_test',2500,'usd',true,now()+interval '1 hour');
    select * into result from public.process_membership_checkout_event(
      'evt_' || attempt,'checkout.session.completed',true,attempt,member,
      'cs_' || attempt,'pi_' || attempt,'cus_test',2500,'usd',now(),null
    );
    if i=1 then
      if result.review_required or result.entitlement_id is null then raise exception 'Eligible Stripe payment failed'; end if;
      select ends_at into first_end from public.membership_entitlements where id=result.entitlement_id;
    else
      if not result.review_required then raise exception 'Duplicate payment review was bypassed'; end if;
      select id into review_id from public.membership_review_items where payment_id=result.payment_id;
      perform public.approve_membership_review_item(review_id,reviewer);
      if not exists(select 1 from public.membership_entitlements
        where payment_id=result.payment_id and starts_at=first_end and ends_at>first_end) then
        raise exception 'Stripe approval failed to stack a new term';
      end if;
    end if;
    select * into result from public.process_membership_checkout_event(
      'evt_' || attempt,'checkout.session.completed',true,attempt,member,
      'cs_' || attempt,'pi_' || attempt,'cus_test',2500,'usd',now(),null
    );
    if not result.duplicate_event then raise exception 'Stripe retry lost idempotency'; end if;
  end loop;
  if (select count(*) from public.membership_entitlements where user_id=member) <> 2 then
    raise exception 'Stripe retries duplicated terms';
  end if;
end;
$$;
rollback;
