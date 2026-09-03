create or replace function public.admin_list_accounts(
  p_actor_user_id uuid,
  p_search text default null,
  p_membership_state text default null,
  p_role_name text default null,
  p_restriction text default null,
  p_mailing text default null,
  p_needs_attention boolean default false,
  p_page integer default 1,
  p_page_size integer default 25
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  membership_state text,
  membership_role text,
  leadership_roles text[],
  restriction text,
  mailing_subscribed boolean,
  deletion_status text,
  deletion_error text,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;
  if not public.has_admin_capability(p_actor_user_id, 'accounts.read') then
    raise exception 'account read permission required';
  end if;

  return query
  with account_rows as (
    select
      users.id as user_id,
      users.email::text as email,
      profiles.display_name,
      case
        when coalesce(restrictions.restriction::text, 'normal') <> 'normal'
          then restrictions.restriction::text
        when public.has_membership_access(users.id) then 'active'
        when memberships.status::text = 'active' then 'inactive'
        else coalesce(memberships.status::text, 'none')
      end as membership_state,
      memberships.role::text as membership_role,
      coalesce(role_names.names, array[]::text[]) as leadership_roles,
      coalesce(restrictions.restriction::text, 'normal') as restriction,
      coalesce(subscriptions.subscribed, false) as mailing_subscribed,
      deletion_jobs.status as deletion_status,
      deletion_jobs.last_error as deletion_error
    from auth.users users
    left join public.profiles profiles on profiles.user_id = users.id
    left join public.memberships memberships on memberships.user_id = users.id
    left join public.membership_account_restrictions restrictions
      on restrictions.user_id = users.id
    left join public.mailing_list_subscriptions subscriptions
      on subscriptions.user_id = users.id
    left join public.account_deletion_jobs deletion_jobs
      on deletion_jobs.user_id = users.id
      and deletion_jobs.status in ('pending', 'auth_deleted', 'failed')
    left join lateral (
      select array_agg(roles.name order by roles.name) as names
      from public.admin_user_roles assignments
      join public.admin_roles roles on roles.id = assignments.role_id
      where assignments.user_id = users.id
    ) role_names on true
  ), filtered as (
    select * from account_rows rows
    where (
      nullif(trim(p_search), '') is null
      or lower(concat_ws(' ', rows.email, rows.display_name))
        like '%' || lower(trim(p_search)) || '%'
    )
      and (p_membership_state is null or rows.membership_state = p_membership_state)
      and (p_role_name is null or p_role_name = any(rows.leadership_roles))
      and (p_restriction is null or rows.restriction = p_restriction)
      and (
        p_mailing is null
        or (p_mailing = 'subscribed' and rows.mailing_subscribed)
        or (p_mailing = 'unsubscribed' and not rows.mailing_subscribed)
      )
      and (not p_needs_attention or rows.deletion_status is not null)
  )
  select
    rows.user_id,
    rows.email,
    rows.display_name,
    rows.membership_state,
    rows.membership_role,
    rows.leadership_roles,
    rows.restriction,
    rows.mailing_subscribed,
    rows.deletion_status,
    rows.deletion_error,
    count(*) over() as total_count
  from filtered rows
  order by lower(coalesce(rows.display_name, rows.email, rows.user_id::text))
  limit greatest(1, least(p_page_size, 100))
  offset (greatest(p_page, 1) - 1) * greatest(1, least(p_page_size, 100));
end;
$$;

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
  v_starts_at timestamptz := now();
  v_ends_at timestamptz;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;
  if not public.has_admin_capability(p_actor_user_id, 'membership.update') then
    raise exception 'membership update permission required';
  end if;
  if p_days < 1 or p_days > 730 then
    raise exception 'days must be between 1 and 730';
  end if;
  if length(trim(p_reason)) < 3 or length(trim(p_reason)) > 500 then
    raise exception 'a reason between 3 and 500 characters is required';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'account not found';
  end if;

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

create or replace function public.set_admin_account_restriction(
  p_actor_user_id uuid,
  p_user_id uuid,
  p_restriction public.membership_restriction,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_is_target_super boolean;
  v_other_active_supers integer;
  v_before public.membership_restriction;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;
  if not public.has_admin_capability(p_actor_user_id, 'accounts.update') then
    raise exception 'account update permission required';
  end if;
  if p_restriction <> 'normal' and p_user_id = p_actor_user_id then
    raise exception 'self-restriction is not allowed';
  end if;

  select exists (
    select 1
    from public.admin_user_roles assignments
    join public.admin_roles roles on roles.id = assignments.role_id
    where assignments.user_id = p_user_id and roles.is_super_admin
  ) into v_is_target_super;

  if v_is_target_super and p_restriction <> 'normal' then
    if not public.is_super_admin(p_actor_user_id) then
      raise exception 'super admin access required';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('super_admin_restriction', 41));
    select count(*) into v_other_active_supers
    from public.admin_user_roles assignments
    join public.admin_roles roles on roles.id = assignments.role_id
    left join public.membership_account_restrictions restrictions
      on restrictions.user_id = assignments.user_id
    where roles.is_super_admin
      and assignments.user_id <> p_user_id
      and coalesce(
        restrictions.restriction,
        'normal'::public.membership_restriction
      ) = 'normal'::public.membership_restriction;
    if v_other_active_supers < 1 then
      raise exception 'cannot restrict the final active super admin';
    end if;
  end if;

  select restriction into v_before
  from public.membership_account_restrictions
  where user_id = p_user_id;

  insert into public.membership_account_restrictions (
    user_id, restriction, internal_reason, restricted_at, updated_by, updated_at
  ) values (
    p_user_id,
    p_restriction,
    case when p_restriction = 'normal' then null else coalesce(nullif(trim(p_reason), ''), 'Updated by leadership.') end,
    case when p_restriction = 'normal' then null else now() end,
    p_actor_user_id,
    now()
  ) on conflict (user_id) do update set
    restriction = excluded.restriction,
    internal_reason = excluded.internal_reason,
    restricted_at = excluded.restricted_at,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id,
    summary, before_data, after_data
  ) values (
    p_actor_user_id, p_user_id, 'account_' || p_restriction::text,
    'account', p_user_id::text,
    'Account restriction changed to ' || p_restriction::text || '.',
    jsonb_build_object('restriction', coalesce(v_before::text, 'normal')),
    jsonb_build_object('restriction', p_restriction::text)
  );
end;
$$;

revoke execute on function public.admin_list_accounts(
  uuid, text, text, text, text, text, boolean, integer, integer
) from public, anon, authenticated;
grant execute on function public.admin_list_accounts(
  uuid, text, text, text, text, text, boolean, integer, integer
) to service_role;

revoke execute on function public.grant_complimentary_membership_access(
  uuid, uuid, integer, text
) from public, anon, authenticated;
grant execute on function public.grant_complimentary_membership_access(
  uuid, uuid, integer, text
) to service_role;

revoke execute on function public.set_admin_account_restriction(
  uuid, uuid, public.membership_restriction, text
) from public, anon, authenticated;
grant execute on function public.set_admin_account_restriction(
  uuid, uuid, public.membership_restriction, text
) to service_role;

-- Administrative activity is written by trusted server operations or database
-- triggers. Authenticated clients must not be able to manufacture audit events.
revoke execute on function public.record_admin_activity(
  uuid, uuid, text, text, text, text, jsonb, jsonb, text
) from authenticated;
