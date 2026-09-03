-- Officer resolution of duplicate-payment review items.

create or replace function public.approve_membership_review_item(
  p_review_id uuid,
  p_reviewer_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_review public.membership_review_items%rowtype;
  v_payment public.membership_payments%rowtype;
  v_restriction public.membership_restriction := 'normal';
  v_latest_end timestamptz;
  v_start timestamptz;
  v_end timestamptz;
  v_entitlement_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into v_review
  from public.membership_review_items
  where id = p_review_id
  for update;
  if not found or v_review.status <> 'pending' then
    raise exception 'pending review item not found';
  end if;

  select * into v_payment
  from public.membership_payments
  where id = v_review.payment_id
  for update;
  if not found or v_payment.status <> 'review_required' then
    raise exception 'reviewable payment not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_payment.user_id::text, 0));

  select restriction into v_restriction
  from public.membership_account_restrictions
  where user_id = v_payment.user_id
  for update;
  if coalesce(v_restriction, 'normal') <> 'normal' then
    raise exception 'restricted account cannot receive an entitlement';
  end if;

  if exists (
    select 1
    from public.membership_entitlements
    where payment_id = v_payment.id
  ) then
    raise exception 'payment already has an entitlement';
  end if;

  select max(ends_at) into v_latest_end
  from public.membership_entitlements
  where user_id = v_payment.user_id
    and revoked_at is null;

  v_start := greatest(
    coalesce(v_payment.paid_at, v_payment.created_at),
    coalesce(v_latest_end, coalesce(v_payment.paid_at, v_payment.created_at))
  );
  v_end := (
    (v_start at time zone 'America/Los_Angeles') + interval '1 year'
  ) at time zone 'America/Los_Angeles';

  insert into public.membership_entitlements (
    user_id,
    payment_id,
    starts_at,
    ends_at
  )
  values (v_payment.user_id, v_payment.id, v_start, v_end)
  returning id into v_entitlement_id;

  update public.membership_payments
  set status = 'paid', updated_at = now()
  where id = v_payment.id;
  update public.membership_checkout_attempts
  set status = 'completed', checkout_url = null, updated_at = now()
  where id = v_payment.checkout_attempt_id;
  update public.membership_review_items
  set
    status = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    updated_at = now()
  where id = p_review_id;

  return v_entitlement_id;
end;
$$;

revoke execute on function public.approve_membership_review_item(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.approve_membership_review_item(uuid, uuid)
  to service_role;
;
