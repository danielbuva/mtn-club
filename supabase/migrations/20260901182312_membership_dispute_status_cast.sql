-- Keep the dispute handler's conditional assignment typed as the payment enum.

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

revoke execute on function public.process_membership_dispute_event(
  text, text, boolean, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.process_membership_dispute_event(
  text, text, boolean, text, timestamptz
) to service_role;
;
