-- Complete a review without falsely recording a Zelle payment.
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

  perform pg_advisory_xact_lock(
    hashtextextended('complimentary-membership:' || p_user_id::text, 42)
  );

  select applications.membership_access_override_id
  into v_override_id
  from public.membership_applications applications
  join public.membership_access_overrides overrides
    on overrides.id = applications.membership_access_override_id
  where applications.user_id = p_user_id
    and applications.status = 'confirmed'
    and overrides.revoked_at is null
    and overrides.starts_at <= now()
    and (overrides.ends_at is null or overrides.ends_at > now());

  if v_override_id is not null then
    return v_override_id;
  end if;

  if public.has_membership_access(p_user_id) then
    raise exception 'account already has membership access';
  end if;

  if exists (
    select 1 from public.membership_applications applications
    where applications.user_id = p_user_id
      and applications.guardian_consent not in ('not_required', 'confirmed')
  ) then
    raise exception 'guardian consent must be complete before membership activation';
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

revoke execute on function public.grant_application_complimentary_membership(
  uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.grant_application_complimentary_membership(
  uuid, uuid, text
) to service_role;
