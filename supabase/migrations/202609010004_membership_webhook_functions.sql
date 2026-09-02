-- Atomic webhook processing for one-time Checkout, refunds, and disputes.

create or replace function public.process_membership_checkout_event(
  p_event_id text,
  p_event_type text,
  p_test_mode boolean,
  p_attempt_id uuid,
  p_user_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_customer_id text,
  p_amount_cents integer,
  p_currency text,
  p_paid_at timestamptz,
  p_receipt_url text
)
returns table (
  payment_id uuid,
  entitlement_id uuid,
  review_required boolean,
  duplicate_event boolean
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_attempt public.membership_checkout_attempts%rowtype;
  v_event_status public.webhook_processing_status;
  v_restriction public.membership_restriction := 'normal';
  v_payment_id uuid;
  v_entitlement_id uuid;
  v_latest_end timestamptz;
  v_grant_start timestamptz;
  v_grant_end timestamptz;
  v_duplicate_recent boolean;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select status into v_event_status
  from public.stripe_webhook_events
  where stripe_event_id = p_event_id
  for update;

  if found and v_event_status = 'succeeded' then
    select payments.id, entitlements.id
    into v_payment_id, v_entitlement_id
    from public.membership_payments payments
    left join public.membership_entitlements entitlements
      on entitlements.payment_id = payments.id
    where payments.stripe_checkout_session_id = p_checkout_session_id;

    return query select v_payment_id, v_entitlement_id, false, true;
    return;
  elsif found then
    update public.stripe_webhook_events
    set
      status = 'processing',
      attempt_count = attempt_count + 1,
      last_error = null,
      processed_at = null,
      updated_at = now()
    where stripe_event_id = p_event_id;
  else
    insert into public.stripe_webhook_events (
      stripe_event_id,
      event_type,
      test_mode,
      status
    )
    values (p_event_id, p_event_type, p_test_mode, 'processing');
  end if;

  select * into v_attempt
  from public.membership_checkout_attempts
  where id = p_attempt_id
  for update;

  if not found
    or v_attempt.user_id <> p_user_id
    or v_attempt.stripe_checkout_session_id <> p_checkout_session_id
    or v_attempt.test_mode <> p_test_mode
    or v_attempt.amount_cents <> p_amount_cents
    or v_attempt.currency <> lower(p_currency)
  then
    raise exception 'checkout attempt validation failed';
  end if;

  select restriction into v_restriction
  from public.membership_account_restrictions
  where user_id = p_user_id
  for update;
  v_restriction := coalesce(v_restriction, 'normal');

  select payments.id, entitlements.id
  into v_payment_id, v_entitlement_id
  from public.membership_payments payments
  left join public.membership_entitlements entitlements
    on entitlements.payment_id = payments.id
  where payments.stripe_checkout_session_id = p_checkout_session_id;

  if found then
    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;
    return query select v_payment_id, v_entitlement_id, false, true;
    return;
  end if;

  select exists (
    select 1
    from public.membership_payments
    where user_id = p_user_id
      and status = 'paid'
      and paid_at >= p_paid_at - interval '24 hours'
      and paid_at <= p_paid_at + interval '24 hours'
  ) into v_duplicate_recent;

  if v_restriction <> 'normal' or v_duplicate_recent then
    insert into public.membership_payments (
      user_id,
      checkout_attempt_id,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      stripe_customer_id,
      amount_cents,
      currency,
      status,
      test_mode,
      paid_at,
      receipt_url
    )
    values (
      p_user_id,
      p_attempt_id,
      p_checkout_session_id,
      p_payment_intent_id,
      p_customer_id,
      p_amount_cents,
      lower(p_currency),
      'review_required',
      p_test_mode,
      p_paid_at,
      p_receipt_url
    )
    returning id into v_payment_id;

    update public.membership_checkout_attempts
    set status = 'review_required', updated_at = now()
    where id = p_attempt_id;

    insert into public.membership_review_items (
      user_id,
      payment_id,
      reason_code,
      reason_detail
    )
    values (
      p_user_id,
      v_payment_id,
      case
        when v_restriction <> 'normal' then 'restricted_account_payment'
        else 'duplicate_payment_24h'
      end,
      case
        when v_restriction <> 'normal'
          then 'Payment completed while the account was suspended or banned. No entitlement was granted.'
        else 'A second distinct payment completed within 24 hours. Officer approval or refund is required.'
      end
    );

    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;

    return query select v_payment_id, null::uuid, true, false;
    return;
  end if;

  insert into public.membership_payments (
    user_id,
    checkout_attempt_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    stripe_customer_id,
    amount_cents,
    currency,
    status,
    test_mode,
    paid_at,
    receipt_url
  )
  values (
    p_user_id,
    p_attempt_id,
    p_checkout_session_id,
    p_payment_intent_id,
    p_customer_id,
    p_amount_cents,
    lower(p_currency),
    'paid',
    p_test_mode,
    p_paid_at,
    p_receipt_url
  )
  returning id into v_payment_id;

  select max(ends_at) into v_latest_end
  from public.membership_entitlements
  where user_id = p_user_id
    and revoked_at is null;

  v_grant_start := greatest(p_paid_at, coalesce(v_latest_end, p_paid_at));
  v_grant_end := (
    (v_grant_start at time zone 'America/Los_Angeles') + interval '1 year'
  ) at time zone 'America/Los_Angeles';

  insert into public.membership_entitlements (
    user_id,
    payment_id,
    starts_at,
    ends_at
  )
  values (p_user_id, v_payment_id, v_grant_start, v_grant_end)
  returning id into v_entitlement_id;

  update public.membership_checkout_attempts
  set status = 'completed', checkout_url = null, updated_at = now()
  where id = p_attempt_id;

  update public.stripe_webhook_events
  set status = 'succeeded', processed_at = now(), updated_at = now()
  where stripe_event_id = p_event_id;

  return query select v_payment_id, v_entitlement_id, false, false;
end;
$$;

create or replace function public.process_membership_refund_event(
  p_event_id text,
  p_event_type text,
  p_test_mode boolean,
  p_payment_intent_id text,
  p_amount_refunded integer,
  p_refund_recorded_at timestamptz
)
returns table (review_required boolean, entitlement_revoked boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payment public.membership_payments%rowtype;
  v_entitlement public.membership_entitlements%rowtype;
  v_has_later_grant boolean := false;
  v_is_full_refund boolean;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into v_payment
  from public.membership_payments
  where stripe_payment_intent_id = p_payment_intent_id
  for update;
  if not found then
    raise exception 'membership payment not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_payment.user_id::text, 0));

  insert into public.stripe_webhook_events (
    stripe_event_id,
    event_type,
    test_mode,
    status
  )
  values (p_event_id, p_event_type, p_test_mode, 'processing')
  on conflict (stripe_event_id) do update
  set
    status = case
      when stripe_webhook_events.status = 'succeeded'
        then stripe_webhook_events.status
      else 'processing'
    end,
    attempt_count = stripe_webhook_events.attempt_count + 1,
    last_error = null,
    updated_at = now();

  if (
    select status = 'succeeded'
    from public.stripe_webhook_events
    where stripe_event_id = p_event_id
  ) then
    return query select false, false;
    return;
  end if;

  select * into v_entitlement
  from public.membership_entitlements
  where payment_id = v_payment.id
  for update;

  v_is_full_refund := p_amount_refunded >= v_payment.amount_cents;

  if not v_is_full_refund then
    update public.membership_payments
    set
      status = 'partially_refunded',
      updated_at = now()
    where id = v_payment.id;

    insert into public.membership_review_items (
      user_id,
      payment_id,
      reason_code,
      reason_detail
    )
    values (
      v_payment.user_id,
      v_payment.id,
      'partial_refund',
      'Refund requires officer review before changing access.'
    );

    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;
    return query select true, false;
    return;
  end if;

  if v_entitlement.id is null then
    update public.membership_payments
    set status = 'refunded', updated_at = now()
    where id = v_payment.id;
    update public.membership_review_items
    set status = 'refunded', updated_at = now()
    where payment_id = v_payment.id
      and status = 'refund_requested';
    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;
    return query select exists (
      select 1
      from public.membership_review_items
      where payment_id = v_payment.id
        and status = 'pending'
    ), false;
    return;
  end if;

  select exists (
    select 1
    from public.membership_entitlements later
    where later.user_id = v_payment.user_id
      and later.id <> v_entitlement.id
      and later.revoked_at is null
      and later.starts_at >= v_entitlement.ends_at
  ) into v_has_later_grant;

  if v_has_later_grant then
    update public.membership_payments
    set status = 'review_required', updated_at = now()
    where id = v_payment.id;
    insert into public.membership_review_items (
      user_id,
      payment_id,
      reason_code,
      reason_detail
    )
    values (
      v_payment.user_id,
      v_payment.id,
      'stacked_renewal_refund',
      'A later entitlement depends on this refunded term. Officer review is required.'
    );
    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;
    return query select true, false;
    return;
  end if;

  update public.membership_payments
  set status = 'refunded', updated_at = now()
  where id = v_payment.id;
  update public.membership_entitlements
  set
    revoked_at = p_refund_recorded_at,
    revoked_reason = 'Full Stripe refund of the latest independent grant.'
  where id = v_entitlement.id
    and revoked_at is null;
  update public.stripe_webhook_events
  set status = 'succeeded', processed_at = now(), updated_at = now()
  where stripe_event_id = p_event_id;
  return query select false, true;
end;
$$;

create or replace function public.process_membership_dispute_event(
  p_event_id text,
  p_event_type text,
  p_test_mode boolean,
  p_payment_intent_id text,
  p_dispute_recorded_at timestamptz
)
returns table (review_required boolean, access_suspended boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payment public.membership_payments%rowtype;
  v_entitlement public.membership_entitlements%rowtype;
  v_currently_provides_access boolean := false;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into v_payment
  from public.membership_payments
  where stripe_payment_intent_id = p_payment_intent_id
  for update;
  if not found then
    raise exception 'membership payment not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_payment.user_id::text, 0));

  insert into public.stripe_webhook_events (
    stripe_event_id,
    event_type,
    test_mode,
    status
  )
  values (p_event_id, p_event_type, p_test_mode, 'processing')
  on conflict (stripe_event_id) do update
  set
    attempt_count = stripe_webhook_events.attempt_count + 1,
    status = case
      when stripe_webhook_events.status = 'succeeded'
        then stripe_webhook_events.status
      else 'processing'
    end,
    last_error = null,
    updated_at = now();

  if (
    select status = 'succeeded'
    from public.stripe_webhook_events
    where stripe_event_id = p_event_id
  ) then
    return query select false, false;
    return;
  end if;

  select * into v_entitlement
  from public.membership_entitlements
  where payment_id = v_payment.id
  for update;

  v_currently_provides_access :=
    v_entitlement.id is not null
    and v_entitlement.revoked_at is null
    and v_entitlement.starts_at <= p_dispute_recorded_at
    and v_entitlement.ends_at > p_dispute_recorded_at;

  update public.membership_payments
  set
    status = case
      when v_currently_provides_access
        then 'disputed'::public.membership_payment_status
      else 'review_required'::public.membership_payment_status
    end,
    updated_at = now()
  where id = v_payment.id;

  if v_currently_provides_access then
    insert into public.membership_account_restrictions (
      user_id,
      restriction,
      internal_reason,
      restricted_at
    )
    values (
      v_payment.user_id,
      'suspended',
      'Automatic suspension: the payment currently providing access is disputed.',
      p_dispute_recorded_at
    )
    on conflict (user_id) do update
    set
      restriction = 'suspended',
      internal_reason = excluded.internal_reason,
      restricted_at = excluded.restricted_at,
      updated_at = now();
  end if;

  insert into public.membership_review_items (
    user_id,
    payment_id,
    reason_code,
    reason_detail
  )
  values (
    v_payment.user_id,
    v_payment.id,
    case
      when v_currently_provides_access then 'current_entitlement_dispute'
      else 'future_or_inactive_entitlement_dispute'
    end,
    case
      when v_currently_provides_access
        then 'Access was suspended because this disputed payment currently provides access.'
      else 'The disputed grant is not currently providing access; no automatic suspension was applied.'
    end
  );

  update public.stripe_webhook_events
  set status = 'succeeded', processed_at = now(), updated_at = now()
  where stripe_event_id = p_event_id;
  return query select true, v_currently_provides_access;
end;
$$;

revoke execute on function public.process_membership_checkout_event(
  text, text, boolean, uuid, uuid, text, text, text, integer, text,
  timestamptz, text
) from public, anon, authenticated;
revoke execute on function public.process_membership_refund_event(
  text, text, boolean, text, integer, timestamptz
) from public, anon, authenticated;
revoke execute on function public.process_membership_dispute_event(
  text, text, boolean, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.process_membership_checkout_event(
  text, text, boolean, uuid, uuid, text, text, text, integer, text,
  timestamptz, text
) to service_role;
grant execute on function public.process_membership_refund_event(
  text, text, boolean, text, integer, timestamptz
) to service_role;
grant execute on function public.process_membership_dispute_event(
  text, text, boolean, text, timestamptz
) to service_role;
