-- Include ordinary auth accounts in the existing officer payment workflow.

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
  v_start timestamptz;
  v_end timestamptz;
begin
  -- Accounts without a separate application are eligible for payment review.
  -- Existing applications retain their withdrawal and guardian-consent gates.
  if exists (
    select 1 from public.membership_applications applications
    where applications.user_id = p_user_id
      and (applications.status <> 'submitted'
        or applications.guardian_consent not in ('not_required', 'confirmed'))
  ) then return false; end if;

  select * into v_payment
  from public.membership_zelle_payments payments
  where payments.user_id = p_user_id and payments.status = 'confirmed'
  order by payments.reviewed_at desc
  limit 1;
  if not found then return false; end if;

  if exists (
    select 1 from public.membership_entitlements entitlements
    where entitlements.zelle_payment_id = v_payment.id
  ) then return true; end if;

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

  update public.membership_applications
  set status = 'confirmed', confirmed_at = now(),
      dues_payment_claimed = true,
      dues_claimed_at = coalesce(dues_claimed_at, now()),
      confirmed_by = v_payment.reviewed_by,
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

  perform pg_advisory_xact_lock(
    hashtextextended('zelle-payment-status:' || p_user_id::text, 41)
  );

  select * into v_payment
  from public.membership_zelle_payments payments
  where payments.user_id = p_user_id
    and payments.status <> 'reversed'
  order by payments.created_at desc
  limit 1
  for update;

  if found and v_payment.status = 'confirmed' then
    if p_desired_status = 'confirmed' then
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
      internal_note
    ) values (
      p_user_id,
      coalesce(v_amount_cents, 2500),
      coalesce(v_currency, 'usd'),
      'claimed',
      'admin',
      nullif(trim(p_note), '')
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

-- Explicitly protect both functions, including environments whose default
-- privileges grant execution to API roles when functions are first created.
revoke execute on function public.activate_confirmed_zelle_membership(uuid)
  from public, anon, authenticated;
grant execute on function public.activate_confirmed_zelle_membership(uuid)
  to service_role;

revoke execute on function public.set_zelle_membership_payment_status(
  uuid,
  uuid,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.set_zelle_membership_payment_status(
  uuid,
  uuid,
  text,
  text
) to service_role;
