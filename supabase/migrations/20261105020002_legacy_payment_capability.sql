-- This service-only compatibility RPC survived the admin capability rollout.
-- A legacy membership officer role must not bypass configured payment access.
create or replace function public.confirm_zelle_membership_application(
  p_user_id uuid,
  p_reviewer_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_application public.membership_applications%rowtype;
  v_restriction public.membership_restriction := 'normal';
  v_latest_end timestamptz;
  v_grant_start timestamptz;
  v_grant_end timestamptz;
  v_override_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  if not public.has_admin_capability(p_reviewer_id, 'membership.confirm_payment') then
    raise exception 'payment review permission required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select * into v_application
  from public.membership_applications
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'membership application not found';
  end if;

  if v_application.status = 'confirmed' then
    select ends_at into v_grant_end
    from public.membership_access_overrides
    where id = v_application.membership_access_override_id;
    return v_grant_end;
  end if;

  if not v_application.dues_payment_claimed then
    raise exception 'applicant has not marked dues as paid';
  end if;

  if v_application.guardian_consent not in ('not_required', 'confirmed') then
    raise exception 'guardian consent is still required';
  end if;

  if not exists (
    select 1 from auth.users users
    where users.id = p_user_id and users.email_confirmed_at is not null
  ) then
    raise exception 'applicant email is not confirmed';
  end if;

  select restriction into v_restriction
  from public.membership_account_restrictions
  where user_id = p_user_id
  for update;
  v_restriction := coalesce(v_restriction, 'normal');

  if v_restriction <> 'normal' then
    raise exception 'restricted accounts cannot be confirmed';
  end if;

  select max(term_end) into v_latest_end
  from (
    select entitlements.ends_at as term_end
    from public.membership_entitlements entitlements
    where entitlements.user_id = p_user_id
      and entitlements.revoked_at is null
    union all
    select overrides.ends_at as term_end
    from public.membership_access_overrides overrides
    where overrides.user_id = p_user_id
      and overrides.revoked_at is null
      and overrides.ends_at is not null
  ) terms;

  v_grant_start := greatest(now(), coalesce(v_latest_end, now()));
  v_grant_end := (
    (v_grant_start at time zone 'America/Los_Angeles') + interval '1 year'
  ) at time zone 'America/Los_Angeles';

  insert into public.membership_access_overrides (
    user_id, starts_at, ends_at, reason, granted_by
  ) values (
    p_user_id, v_grant_start, v_grant_end,
    'Zelle dues confirmed by club leadership.', p_reviewer_id
  )
  returning id into v_override_id;

  update public.membership_applications
  set
    status = 'confirmed',
    confirmed_at = now(),
    confirmed_by = p_reviewer_id,
    membership_access_override_id = v_override_id,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.memberships (
    user_id, status, role, joined_on, member_since
  ) values (
    p_user_id, 'active', 'regular', current_date, current_date
  )
  on conflict (user_id) do update
  set
    status = 'active',
    member_since = coalesce(public.memberships.member_since, current_date),
    updated_at = now();

  return v_grant_end;
end;
$$;

revoke execute on function public.confirm_zelle_membership_application(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.confirm_zelle_membership_application(uuid, uuid)
  to service_role;
