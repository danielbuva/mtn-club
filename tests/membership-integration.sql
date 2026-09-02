-- Transactional integration tests for the membership database functions.
-- Requires the production-equivalent schema and at least one auth user.
-- Every test record is rolled back.

begin;

select set_config('request.jwt.claim.role', 'service_role', true);

do $$
declare
  v_user uuid;
  v_attempt_1 uuid := gen_random_uuid();
  v_attempt_2 uuid := gen_random_uuid();
  v_attempt_3 uuid := gen_random_uuid();
  v_attempt_4 uuid := gen_random_uuid();
  v_payment_1 uuid;
  v_payment_2 uuid;
  v_payment_3 uuid;
  v_entitlement_1 uuid;
  v_entitlement_2 uuid;
  v_review_id uuid;
  v_result record;
  v_count integer;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  select user_id into v_user
  from public.membership_access_overrides
  order by created_at
  limit 1;

  if v_user is null then
    raise exception 'Membership integration test requires one existing auth user';
  end if;

  if (
    (('2028-02-29 17:00:00-08'::timestamptz at time zone 'America/Los_Angeles') + interval '1 year')
    at time zone 'America/Los_Angeles'
  ) <> '2029-02-28 17:00:00-08'::timestamptz then
    raise exception 'Leap-day calendar-year arithmetic failed';
  end if;

  insert into public.membership_checkout_attempts (
    id, user_id, status, stripe_checkout_session_id, stripe_price_id,
    amount_cents, currency, test_mode, expires_at
  ) values (
    v_attempt_1, v_user, 'open', 'cs_test_codex_happy_1',
    'price_test_membership', 2500, 'usd', true, '2026-01-15 11:00:00-08'
  );

  select * into v_result
  from public.process_membership_checkout_event(
    'evt_codex_happy_1', 'checkout.session.completed', true,
    v_attempt_1, v_user, 'cs_test_codex_happy_1', 'pi_codex_happy_1',
    'cus_codex_test', 2500, 'usd', '2026-01-15 10:00:00-08', null
  );

  if v_result.review_required or v_result.duplicate_event
    or v_result.payment_id is null or v_result.entitlement_id is null then
    raise exception 'Happy-path checkout did not create one entitlement';
  end if;

  v_payment_1 := v_result.payment_id;
  v_entitlement_1 := v_result.entitlement_id;

  select starts_at, ends_at into v_starts_at, v_ends_at
  from public.membership_entitlements
  where id = v_entitlement_1;

  if v_starts_at <> '2026-01-15 10:00:00-08'::timestamptz
    or v_ends_at <> '2027-01-15 10:00:00-08'::timestamptz then
    raise exception 'Initial entitlement term is incorrect: % to %', v_starts_at, v_ends_at;
  end if;

  if not exists (
    select 1 from public.membership_checkout_attempts
    where id = v_attempt_1 and status = 'completed' and checkout_url is null
  ) or not exists (
    select 1 from public.stripe_webhook_events
    where stripe_event_id = 'evt_codex_happy_1' and status = 'succeeded'
  ) then
    raise exception 'Checkout attempt or webhook state was not finalized';
  end if;

  select * into v_result
  from public.process_membership_checkout_event(
    'evt_codex_happy_1', 'checkout.session.completed', true,
    v_attempt_1, v_user, 'cs_test_codex_happy_1', 'pi_codex_happy_1',
    'cus_codex_test', 2500, 'usd', '2026-01-15 10:00:00-08', null
  );

  if not v_result.duplicate_event then
    raise exception 'Duplicate webhook event was not idempotent';
  end if;

  select count(*) into v_count
  from public.membership_payments
  where stripe_checkout_session_id = 'cs_test_codex_happy_1';
  if v_count <> 1 then
    raise exception 'Duplicate event created more than one payment';
  end if;

  insert into public.membership_checkout_attempts (
    id, user_id, status, stripe_checkout_session_id, stripe_price_id,
    amount_cents, currency, test_mode, expires_at
  ) values (
    v_attempt_2, v_user, 'open', 'cs_test_codex_renewal',
    'price_test_membership', 2500, 'usd', true, '2026-03-01 11:00:00-08'
  );

  select * into v_result
  from public.process_membership_checkout_event(
    'evt_codex_renewal', 'checkout.session.completed', true,
    v_attempt_2, v_user, 'cs_test_codex_renewal', 'pi_codex_renewal',
    'cus_codex_test', 2500, 'usd', '2026-03-01 10:00:00-08', null
  );
  v_payment_2 := v_result.payment_id;
  v_entitlement_2 := v_result.entitlement_id;

  select starts_at, ends_at into v_starts_at, v_ends_at
  from public.membership_entitlements
  where id = v_entitlement_2;
  if v_starts_at <> '2027-01-15 10:00:00-08'::timestamptz
    or v_ends_at <> '2028-01-15 10:00:00-08'::timestamptz then
    raise exception 'Early renewal did not preserve unused time: % to %', v_starts_at, v_ends_at;
  end if;

  insert into public.membership_checkout_attempts (
    id, user_id, status, stripe_checkout_session_id, stripe_price_id,
    amount_cents, currency, test_mode, expires_at
  ) values (
    v_attempt_3, v_user, 'open', 'cs_test_codex_duplicate_24h',
    'price_test_membership', 2500, 'usd', true, '2026-03-01 13:00:00-08'
  );

  select * into v_result
  from public.process_membership_checkout_event(
    'evt_codex_duplicate_24h', 'checkout.session.completed', true,
    v_attempt_3, v_user, 'cs_test_codex_duplicate_24h', 'pi_codex_duplicate_24h',
    'cus_codex_test', 2500, 'usd', '2026-03-01 12:00:00-08', null
  );
  v_payment_3 := v_result.payment_id;

  if not v_result.review_required or v_result.entitlement_id is not null
    or not exists (
      select 1 from public.membership_review_items
      where payment_id = v_payment_3
        and reason_code = 'duplicate_payment_24h'
        and status = 'pending'
    ) then
    raise exception 'Second payment inside 24 hours did not enter review';
  end if;

  select id into v_review_id
  from public.membership_review_items
  where payment_id = v_payment_3 and status = 'pending';

  perform public.approve_membership_review_item(v_review_id, v_user);

  select starts_at, ends_at into v_starts_at, v_ends_at
  from public.membership_entitlements
  where payment_id = v_payment_3;
  if v_starts_at <> '2028-01-15 10:00:00-08'::timestamptz
    or v_ends_at <> '2029-01-15 10:00:00-08'::timestamptz then
    raise exception 'Approved duplicate did not stack after the latest term';
  end if;

  select * into v_result
  from public.process_membership_refund_event(
    'evt_codex_partial_refund', 'charge.refunded', true,
    'pi_codex_happy_1', 1000, '2026-09-01 10:00:00-07'
  );
  if not v_result.review_required or v_result.entitlement_revoked then
    raise exception 'Partial refund did not enter review without revocation';
  end if;

  select * into v_result
  from public.process_membership_refund_event(
    'evt_codex_stacked_refund', 'charge.refunded', true,
    'pi_codex_happy_1', 2500, '2026-09-01 11:00:00-07'
  );
  if not v_result.review_required or v_result.entitlement_revoked then
    raise exception 'Stacked-renewal refund did not enter review';
  end if;

  select * into v_result
  from public.process_membership_refund_event(
    'evt_codex_latest_refund', 'charge.refunded', true,
    'pi_codex_duplicate_24h', 2500, '2026-09-01 12:00:00-07'
  );
  if v_result.review_required or not v_result.entitlement_revoked
    or not exists (
      select 1 from public.membership_entitlements
      where payment_id = v_payment_3 and revoked_at is not null
    ) then
    raise exception 'Latest independent full refund did not revoke its grant';
  end if;

  select * into v_result
  from public.process_membership_dispute_event(
    'evt_codex_future_dispute', 'charge.dispute.created', true,
    'pi_codex_renewal', '2026-09-01 13:00:00-07'
  );
  if not v_result.review_required or v_result.access_suspended then
    raise exception 'Future entitlement dispute should enter review without suspension';
  end if;

  select * into v_result
  from public.process_membership_dispute_event(
    'evt_codex_current_dispute', 'charge.dispute.created', true,
    'pi_codex_happy_1', '2026-09-01 14:00:00-07'
  );
  if not v_result.review_required or not v_result.access_suspended
    or not exists (
      select 1 from public.membership_account_restrictions
      where user_id = v_user and restriction = 'suspended'
    ) or public.has_membership_access(v_user) then
    raise exception 'Current entitlement dispute did not suspend access';
  end if;

  update public.membership_account_restrictions
  set restriction = 'normal', restricted_at = null, internal_reason = null
  where user_id = v_user;

  insert into public.membership_checkout_attempts (
    id, user_id, status, stripe_checkout_session_id, stripe_price_id,
    amount_cents, currency, test_mode, expires_at
  ) values (
    v_attempt_4, v_user, 'open', 'cs_test_codex_restricted',
    'price_test_membership', 2500, 'usd', true, '2031-01-01 11:00:00-08'
  );
  insert into public.membership_account_restrictions (
    user_id, restriction, internal_reason, restricted_at
  ) values (
    v_user, 'banned', 'Integration test restriction', '2031-01-01 09:00:00-08'
  ) on conflict (user_id) do update set
    restriction = excluded.restriction,
    internal_reason = excluded.internal_reason,
    restricted_at = excluded.restricted_at;

  select * into v_result
  from public.process_membership_checkout_event(
    'evt_codex_restricted', 'checkout.session.completed', true,
    v_attempt_4, v_user, 'cs_test_codex_restricted', 'pi_codex_restricted',
    'cus_codex_test', 2500, 'usd', '2031-01-01 10:00:00-08', null
  );
  if not v_result.review_required or v_result.entitlement_id is not null
    or not exists (
      select 1 from public.membership_review_items
      where payment_id = v_result.payment_id
        and reason_code = 'restricted_account_payment'
    ) then
    raise exception 'Restricted account payment did not enter review';
  end if;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user::text, true);
  select count(*) into v_count
  from public.get_my_membership_payment_history();
  if v_count <> 4 then
    raise exception 'Safe history did not return exactly the current user payments: %', v_count;
  end if;

  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  select count(*) into v_count
  from public.get_my_membership_payment_history();
  if v_count <> 0 then
    raise exception 'Safe history exposed another user payment';
  end if;
end
$$;

select 'membership integration tests passed' as result;

rollback;
