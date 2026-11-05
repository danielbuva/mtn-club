-- A single eligibility policy for every paid or complimentary activation path.
-- No age evidence is treated conservatively: complete an age declaration first.
create or replace function public.membership_activation_ineligibility(p_user_id uuid)
returns text
language sql
stable
set search_path = public, auth, pg_temp
as $$
  select case
    when not exists (select 1 from auth.users where id = p_user_id)
      then 'account not found'
    when not exists (select 1 from auth.users where id = p_user_id and email_confirmed_at is not null)
      then 'account email must be confirmed before membership activation'
    when exists (select 1 from public.membership_account_restrictions
      where user_id = p_user_id and restriction <> 'normal')
      then 'restricted account cannot receive membership access'
    when exists (select 1 from public.membership_applications
      where user_id = p_user_id and status = 'withdrawn')
      then 'withdrawn application cannot receive membership access'
    when (exists (select 1 from public.account_age_declarations
        where user_id = p_user_id and not is_18_or_older)
      or exists (select 1 from public.membership_applications
        where user_id = p_user_id and age_status = 'minor'))
      and not exists (select 1 from public.membership_applications
        where user_id = p_user_id and age_status = 'minor'
          and guardian_consent = 'confirmed')
      then 'guardian consent must be complete before membership activation'
    when not exists (select 1 from public.account_age_declarations
        where user_id = p_user_id)
      and not exists (select 1 from public.membership_applications
        where user_id = p_user_id)
      then 'age declaration required before membership activation'
    else null
  end;
$$;
revoke execute on function public.membership_activation_ineligibility(uuid)
  from public, anon, authenticated;
grant execute on function public.membership_activation_ineligibility(uuid) to service_role;


create or replace function public.grant_complimentary_membership_access(
  p_actor_user_id uuid,
  p_user_id uuid,
  p_days integer,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_override_id uuid;
  v_ineligible text;
  v_starts_at timestamptz := now();
  v_ends_at timestamptz;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;
  if not public.has_admin_capability(p_actor_user_id, 'membership.update') then
    raise exception 'membership update permission required';
  end if;
  if p_days is null or p_days < 1 or p_days > 730 then
    raise exception 'days must be between 1 and 730';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 3 or length(trim(p_reason)) > 500 then
    raise exception 'a reason between 3 and 500 characters is required';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'account not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  v_ineligible := public.membership_activation_ineligibility(p_user_id);
  if v_ineligible is not null then raise exception '%', v_ineligible; end if;

  v_ends_at := v_starts_at + make_interval(days => p_days);
  insert into public.membership_access_overrides (
    user_id, starts_at, ends_at, reason, granted_by
  ) values (
    p_user_id, v_starts_at, v_ends_at, trim(p_reason), p_actor_user_id
  ) returning id into v_override_id;

  insert into public.memberships (user_id, status, role, member_since)
  values (p_user_id, 'active', 'regular', v_starts_at::date)
  on conflict (user_id) do update set
    status = 'active',
    member_since = coalesce(public.memberships.member_since, excluded.member_since),
    updated_at = now();

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id,
    summary, after_data
  ) values (
    p_actor_user_id, p_user_id, 'membership_access_granted',
    'membership_access_override', v_override_id::text,
    'Complimentary membership access granted.',
    jsonb_build_object('days', p_days, 'ends_at', v_ends_at)
  );

  return v_override_id;
end;
$$;

create or replace function public.grant_application_complimentary_membership(
  p_actor_user_id uuid,
  p_user_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_override_id uuid;
  v_ineligible text;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;
  if not public.has_admin_capability(p_actor_user_id, 'membership.update') then
    raise exception 'membership update permission required';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 3
    or length(trim(p_reason)) > 500 then
    raise exception 'a complimentary-access reason between 3 and 500 characters is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  v_ineligible := public.membership_activation_ineligibility(p_user_id);
  if v_ineligible is not null then raise exception '%', v_ineligible; end if;

  select overrides.id
  into v_override_id
  from public.membership_access_overrides overrides
  where overrides.user_id = p_user_id
    and overrides.revoked_at is null
    and overrides.starts_at <= now()
    and (overrides.ends_at is null or overrides.ends_at > now())
  order by overrides.starts_at desc
  limit 1;

  if v_override_id is not null then
    return v_override_id;
  end if;

  if public.has_membership_access(p_user_id) then
    raise exception 'account already has membership access';
  end if;

  v_override_id := public.grant_complimentary_membership_access(
    p_actor_user_id,
    p_user_id,
    365,
    trim(p_reason)
  );

  update public.membership_applications
  set status = 'confirmed',
      confirmed_at = coalesce(confirmed_at, now()),
      confirmed_by = p_actor_user_id,
      membership_access_override_id = v_override_id,
      updated_at = now()
  where user_id = p_user_id;

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id,
    summary, after_data
  ) values (
    p_actor_user_id, p_user_id, 'membership_application_completed_complimentary',
    'membership_application', p_user_id::text,
    'Membership application completed with complimentary access.',
    jsonb_build_object(
      'access_override_id', v_override_id,
      'payment_confirmed', false,
      'reason', trim(p_reason)
    )
  );

  return v_override_id;
end;
$$;

create or replace function public.activate_confirmed_zelle_membership(
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payment public.membership_zelle_payments%rowtype;
  v_reviewer_id uuid;
  v_start timestamptz;
  v_end timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if public.membership_activation_ineligibility(p_user_id) is not null then
    return false;
  end if;

  for v_payment in
    select *
    from public.membership_zelle_payments payments
    where payments.user_id = p_user_id and payments.status = 'confirmed'
      and not exists (select 1 from public.membership_entitlements entitlements
        where entitlements.zelle_payment_id = payments.id)
    order by payments.reviewed_at, payments.created_at, payments.id
    for update of payments
  loop
    select greatest(now(), coalesce(max(term_end), now())) into v_start
    from (
      select ends_at as term_end
      from public.membership_entitlements
      where user_id = p_user_id and revoked_at is null
      union all
      select ends_at
      from public.membership_access_overrides
      where user_id = p_user_id and revoked_at is null and ends_at is not null
    ) terms;
    v_end := ((v_start at time zone 'America/Los_Angeles') + interval '1 year')
      at time zone 'America/Los_Angeles';

    insert into public.membership_entitlements (
      user_id, payment_id, zelle_payment_id, starts_at, ends_at
    ) values (p_user_id, null, v_payment.id, v_start, v_end);
  end loop;

  if not exists (select 1 from public.membership_entitlements
    where user_id = p_user_id and zelle_payment_id is not null
      and revoked_at is null and ends_at > now()) then return false; end if;

  select payments.reviewed_by into v_reviewer_id
  from public.membership_zelle_payments payments
  join public.membership_entitlements entitlements on entitlements.zelle_payment_id = payments.id
  where payments.user_id = p_user_id and entitlements.revoked_at is null
    and entitlements.ends_at > now()
  order by entitlements.starts_at desc
  limit 1;

  update public.membership_applications
  set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now()),
      dues_payment_claimed = true,
      dues_claimed_at = coalesce(dues_claimed_at, now()),
      confirmed_by = coalesce(confirmed_by, v_reviewer_id),
      membership_access_override_id = null, updated_at = now()
  where user_id = p_user_id;

  insert into public.memberships (user_id, status, role, joined_on, member_since)
  values (p_user_id, 'active', 'regular', current_date, current_date)
  on conflict (user_id) do update set
    status = 'active',
    member_since = coalesce(public.memberships.member_since, current_date),
    updated_at = now();

  return true;
end;
$$;

create or replace function public.claim_zelle_membership_payment()
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid;
  v_amount integer;
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  if exists (select 1 from public.membership_account_restrictions
    where user_id = auth.uid() and restriction <> 'normal') then
    raise exception 'restricted account cannot claim membership payment';
  end if;
  if exists (select 1 from public.membership_applications
    where user_id = auth.uid() and status = 'withdrawn') then
    raise exception 'withdrawn application cannot claim membership payment';
  end if;
  if not exists (select 1 from public.membership_applications
      where user_id = auth.uid() and status in ('submitted', 'confirmed'))
    and not exists (select 1 from public.membership_entitlements where user_id = auth.uid())
    and not exists (select 1 from public.membership_access_overrides where user_id = auth.uid()) then
    raise exception 'membership application required';
  end if;
  -- There is no existing early-renewal window. Renew only after access expires.
  if exists (select 1 from public.membership_entitlements
      where user_id = auth.uid() and revoked_at is null and ends_at > now())
    or exists (select 1 from public.membership_access_overrides
      where user_id = auth.uid() and revoked_at is null
        and (ends_at is null or ends_at > now())) then
    raise exception 'membership renewal opens after current access expires';
  end if;
  if exists (select 1 from public.membership_zelle_payments payments
    where payments.user_id = auth.uid() and payments.status = 'confirmed'
      and not exists (select 1 from public.membership_entitlements
        where zelle_payment_id = payments.id)) then
    raise exception 'confirmed payment is awaiting activation; contact club leadership';
  end if;

  select dues_amount_cents into v_amount
  from public.club_admin_settings where id;

  insert into public.membership_zelle_payments (
    user_id, amount_cents, status, claim_source, created_at
  ) values (
    auth.uid(), coalesce(v_amount, 2500), 'claimed', 'membership_page', clock_timestamp()
  )
  on conflict (user_id) where status = 'claimed'
  do update set claimed_at = now(), updated_at = now()
  returning id into v_id;

  update public.membership_applications
  set dues_payment_claimed = true, dues_claimed_at = now(), updated_at = now()
  where user_id = auth.uid() and status = 'submitted';

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id, summary
  ) values (
    auth.uid(), auth.uid(), 'payment_claimed', 'membership_zelle_payment',
    v_id::text, 'Member reported a Zelle dues payment.'
  );
  return v_id;
end;
$$;

create or replace function public.set_zelle_membership_payment_status(
  p_user_id uuid,
  p_reviewer_id uuid,
  p_desired_status text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payment public.membership_zelle_payments%rowtype;
  v_payment_id uuid;
  v_amount_cents integer;
  v_currency text;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;
  if not public.has_admin_capability(
    p_reviewer_id,
    'membership.confirm_payment'
  ) then
    raise exception 'payment review permission required';
  end if;
  if p_desired_status not in ('claimed', 'confirmed', 'rejected') then
    raise exception 'invalid payment status';
  end if;
  if not exists (
    select 1
    from auth.users users
    where users.id = p_user_id
  ) then
    raise exception 'account not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select * into v_payment
  from public.membership_zelle_payments payments
  where payments.user_id = p_user_id
    and payments.status <> 'reversed'
  order by (payments.status = 'claimed') desc, payments.created_at desc, payments.id desc
  limit 1
  for update;

  if found and v_payment.status = 'confirmed' then
    if p_desired_status = 'confirmed' then
      -- A retry can reconcile a payment blocked earlier by consent/restrictions.
      -- A consumed, expired payment is never a new renewal claim.
      if exists (select 1 from public.membership_entitlements
        where zelle_payment_id = v_payment.id)
        and not public.has_membership_access(p_user_id) then
        raise exception 'new payment claim required for renewal';
      end if;
      perform public.activate_confirmed_zelle_membership(p_user_id);
      update public.membership_zelle_payments
      set internal_note = nullif(trim(p_note), ''), updated_at = now()
      where id = v_payment.id;
      return v_payment.id;
    end if;
    if not public.is_super_admin(p_reviewer_id) then
      raise exception 'super admin access required to change an accepted payment';
    end if;
    perform public.reverse_zelle_membership_payment(
      v_payment.id,
      p_reviewer_id,
      coalesce(nullif(trim(p_note), ''), 'Payment status changed by an administrator.')
    );
    v_payment.id := null;
  elsif found and v_payment.status::text = p_desired_status then
    update public.membership_zelle_payments
    set internal_note = nullif(trim(p_note), ''), updated_at = now()
    where id = v_payment.id;
    return v_payment.id;
  end if;

  if v_payment.id is null or v_payment.status <> 'claimed' then
    select settings.dues_amount_cents, settings.currency
    into v_amount_cents, v_currency
    from public.club_admin_settings settings
    where settings.id;

    insert into public.membership_zelle_payments (
      user_id,
      amount_cents,
      currency,
      status,
      claim_source,
      internal_note,
      created_at
    ) values (
      p_user_id,
      coalesce(v_amount_cents, 2500),
      coalesce(v_currency, 'usd'),
      'claimed',
      'admin',
      nullif(trim(p_note), ''),
      clock_timestamp()
    )
    returning id into v_payment_id;
  else
    v_payment_id := v_payment.id;
  end if;

  if p_desired_status <> 'claimed' then
    perform public.review_zelle_membership_payment(
      v_payment_id,
      p_reviewer_id,
      p_desired_status,
      p_note
    );
  end if;

  return v_payment_id;
end;
$$;

create or replace function public.review_zelle_membership_payment(
  p_payment_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payment public.membership_zelle_payments%rowtype;
  v_activated boolean := false;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if not public.has_admin_capability(p_reviewer_id, 'membership.confirm_payment') then
    raise exception 'payment review permission required';
  end if;
  if p_decision not in ('confirmed', 'rejected') then
    raise exception 'invalid payment decision';
  end if;

  select * into v_payment from public.membership_zelle_payments where id = p_payment_id;
  if not found then raise exception 'payment not found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_payment.user_id::text, 0));

  select * into v_payment from public.membership_zelle_payments
  where id = p_payment_id for update;
  if not found then raise exception 'payment not found'; end if;
  if v_payment.status = 'confirmed' and p_decision = 'confirmed' then
    return public.activate_confirmed_zelle_membership(v_payment.user_id);
  end if;
  if v_payment.status <> 'claimed' then
    return exists (
      select 1 from public.membership_zelle_payments
      where id = p_payment_id and status::text = p_decision
    );
  end if;

  update public.membership_zelle_payments set
    status = p_decision::public.zelle_payment_status,
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    internal_note = nullif(trim(p_note), ''),
    updated_at = now()
  where id = p_payment_id;

  if p_decision = 'confirmed' then
    v_activated := public.activate_confirmed_zelle_membership(v_payment.user_id);
  else
    update public.membership_applications set
      dues_payment_claimed = false, dues_claimed_at = null, updated_at = now()
    where user_id = v_payment.user_id and status = 'submitted';
  end if;

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id, summary,
    after_data
  ) values (
    p_reviewer_id, v_payment.user_id, 'payment_' || p_decision,
    'membership_zelle_payment', p_payment_id::text,
    case when p_decision = 'confirmed'
      then 'Zelle dues payment confirmed.'
      else 'Zelle dues payment rejected.' end,
    jsonb_build_object('status', p_decision, 'membership_activated', v_activated)
  );
  return v_activated;
end;
$$;

create or replace function public.reverse_zelle_membership_payment(
  p_payment_id uuid,
  p_reviewer_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payment public.membership_zelle_payments%rowtype;
  v_has_access boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if not public.is_super_admin(p_reviewer_id) then
    raise exception 'super admin access required';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'reversal reason required';
  end if;

  select * into v_payment from public.membership_zelle_payments where id = p_payment_id;
  if not found then raise exception 'payment not found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_payment.user_id::text, 0));

  select * into v_payment from public.membership_zelle_payments
  where id = p_payment_id for update;
  if not found then raise exception 'payment not found'; end if;
  if v_payment.status = 'reversed' then return true; end if;
  if v_payment.status <> 'confirmed' then
    raise exception 'only confirmed payments can be reversed';
  end if;

  update public.membership_zelle_payments set
    status = 'reversed',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    internal_note = trim(p_reason),
    updated_at = now()
  where id = p_payment_id;

  update public.membership_entitlements set
    revoked_at = coalesce(revoked_at, now()),
    revoked_reason = coalesce(revoked_reason, trim(p_reason))
  where zelle_payment_id = p_payment_id;

  select exists (
    select 1 from public.membership_entitlements
    where user_id = v_payment.user_id
      and revoked_at is null and starts_at <= now() and ends_at > now()
    union all
    select 1 from public.membership_access_overrides
    where user_id = v_payment.user_id
      and revoked_at is null and starts_at <= now()
      and (ends_at is null or ends_at > now())
  ) into v_has_access;

  if not v_has_access then
    update public.memberships set status = 'pending', updated_at = now()
    where user_id = v_payment.user_id;
  end if;

  -- Reversing a term does not undo completed onboarding or its consent evidence.
  update public.membership_applications set
    dues_payment_claimed = false, dues_claimed_at = null, updated_at = now()
  where user_id = v_payment.user_id and status = 'submitted';

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id,
    summary, after_data
  ) values (
    p_reviewer_id, v_payment.user_id, 'payment_reversed',
    'membership_zelle_payment', p_payment_id::text,
    'Confirmed Zelle payment and its membership entitlement were reversed.',
    jsonb_build_object('status', 'reversed', 'reason', trim(p_reason))
  );
  return true;
end;
$$;

create or replace function public.confirm_membership_guardian_consent(
  p_user_id uuid,
  p_reviewer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if not public.has_admin_capability(p_reviewer_id, 'membership.confirm_guardian') then
    raise exception 'guardian review permission required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.membership_applications
  set guardian_consent = 'confirmed', updated_at = now()
  where user_id = p_user_id and age_status = 'minor' and status = 'submitted';
  if not found then raise exception 'reviewable minor application not found'; end if;

  perform public.activate_confirmed_zelle_membership(p_user_id);
  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id, summary
  ) values (
    p_reviewer_id, p_user_id, 'guardian_consent_confirmed',
    'membership_application', p_user_id::text, 'Guardian consent confirmed.'
  );
end;
$$;

-- Retain the old RPC signature, but route it through payment-backed terms.
create or replace function public.confirm_zelle_membership_application(
  p_user_id uuid, p_reviewer_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payment_id uuid;
  v_ineligible text;
  v_end timestamptz;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if not public.has_admin_capability(p_reviewer_id, 'membership.confirm_payment') then
    raise exception 'payment review permission required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  v_ineligible := public.membership_activation_ineligibility(p_user_id);
  if v_ineligible is not null then raise exception '%', v_ineligible; end if;
  v_payment_id := public.set_zelle_membership_payment_status(
    p_user_id, p_reviewer_id, 'confirmed', null
  );
  select ends_at into v_end from public.membership_entitlements
  where zelle_payment_id = v_payment_id and revoked_at is null;
  return v_end;
end;
$$;


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
  v_ineligible text;
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

  v_ineligible := public.membership_activation_ineligibility(p_user_id);

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

  if v_ineligible is not null or v_duplicate_recent then
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
        when v_ineligible = 'restricted account cannot receive membership access' then 'restricted_account_payment'
        when v_ineligible is not null then 'activation_ineligible'
        else 'duplicate_payment_24h'
      end,
      case
        when v_ineligible is not null
          then v_ineligible || '. No entitlement was granted.'
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
  v_ineligible text;
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

  v_ineligible := public.membership_activation_ineligibility(v_payment.user_id);
  if v_ineligible is not null then raise exception '%', v_ineligible; end if;

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

-- CREATE OR REPLACE retains the existing ACLs. Explicitly retain API boundaries.
revoke execute on function public.grant_complimentary_membership_access(uuid,uuid,integer,text),
  public.grant_application_complimentary_membership(uuid,uuid,text),
  public.activate_confirmed_zelle_membership(uuid),
  public.set_zelle_membership_payment_status(uuid,uuid,text,text),
  public.review_zelle_membership_payment(uuid,uuid,text,text),
  public.reverse_zelle_membership_payment(uuid,uuid,text),
  public.confirm_membership_guardian_consent(uuid,uuid),
  public.confirm_zelle_membership_application(uuid,uuid),
  public.approve_membership_review_item(uuid,uuid),
  public.process_membership_checkout_event(text,text,boolean,uuid,uuid,text,text,text,integer,text,timestamptz,text)
  from public, anon, authenticated;
grant execute on function public.grant_complimentary_membership_access(uuid,uuid,integer,text),
  public.grant_application_complimentary_membership(uuid,uuid,text),
  public.activate_confirmed_zelle_membership(uuid),
  public.set_zelle_membership_payment_status(uuid,uuid,text,text),
  public.review_zelle_membership_payment(uuid,uuid,text,text),
  public.reverse_zelle_membership_payment(uuid,uuid,text),
  public.confirm_membership_guardian_consent(uuid,uuid),
  public.confirm_zelle_membership_application(uuid,uuid),
  public.approve_membership_review_item(uuid,uuid),
  public.process_membership_checkout_event(text,text,boolean,uuid,uuid,text,text,text,integer,text,timestamptz,text)
  to service_role;
revoke execute on function public.claim_zelle_membership_payment() from public, anon;
grant execute on function public.claim_zelle_membership_payment() to authenticated;
