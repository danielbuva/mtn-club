-- Zelle membership applications, provisional read access, and officer confirmation.

do $$ begin
  create type public.membership_application_status as enum (
    'submitted',
    'confirmed',
    'withdrawn'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_age_status as enum ('adult', 'minor');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.guardian_consent_status as enum (
    'not_required',
    'pending',
    'confirmed'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.membership_applications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (
    length(trim(full_name)) between 2 and 120
  ),
  contact_email text not null check (
    length(trim(contact_email)) between 3 and 320
    and position('@' in contact_email) > 1
  ),
  age_status public.membership_age_status not null,
  guardian_consent public.guardian_consent_status not null,
  dues_payment_claimed boolean not null default false,
  dues_claimed_at timestamptz,
  primary_interest text not null check (
    length(trim(primary_interest)) between 2 and 120
  ),
  experience_notes text check (
    experience_notes is null or length(experience_notes) <= 2000
  ),
  status public.membership_application_status not null default 'submitted',
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete restrict,
  membership_access_override_id uuid unique references public.membership_access_overrides(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (dues_payment_claimed and dues_claimed_at is not null)
    or (not dues_payment_claimed and dues_claimed_at is null)
  ),
  check (
    (age_status = 'adult' and guardian_consent = 'not_required')
    or (age_status = 'minor' and guardian_consent in ('pending', 'confirmed'))
  ),
  check (
    (status = 'confirmed'
      and dues_payment_claimed
      and guardian_consent in ('not_required', 'confirmed')
      and confirmed_at is not null
      and confirmed_by is not null
      and membership_access_override_id is not null)
    or (status <> 'confirmed'
      and confirmed_at is null
      and confirmed_by is null
      and membership_access_override_id is null)
  )
);

drop trigger if exists membership_applications_set_updated_at
  on public.membership_applications;
create trigger membership_applications_set_updated_at
before update on public.membership_applications
for each row execute function public.set_updated_at();

alter table public.membership_applications enable row level security;
revoke all on public.membership_applications from public, anon, authenticated;
grant all on public.membership_applications to service_role;

create or replace function public.get_my_membership_application()
returns table (
  full_name text,
  contact_email text,
  age_status text,
  guardian_consent text,
  dues_payment_claimed boolean,
  primary_interest text,
  experience_notes text,
  application_status text,
  confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    applications.full_name,
    applications.contact_email,
    applications.age_status::text,
    applications.guardian_consent::text,
    applications.dues_payment_claimed,
    applications.primary_interest,
    applications.experience_notes,
    applications.status::text,
    applications.confirmed_at,
    applications.created_at,
    applications.updated_at
  from public.membership_applications applications
  where applications.user_id = auth.uid();
$$;

revoke execute on function public.get_my_membership_application()
  from public, anon;
grant execute on function public.get_my_membership_application()
  to authenticated;

create or replace function public.has_provisional_membership_access()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    auth.uid() is not null
    and coalesce(
      (
        select restrictions.restriction = 'normal'
        from public.membership_account_restrictions restrictions
        where restrictions.user_id = auth.uid()
      ),
      true
    )
    and exists (
      select 1
      from public.membership_applications applications
      where applications.user_id = auth.uid()
        and applications.status = 'submitted'
        and applications.dues_payment_claimed
        and applications.guardian_consent in ('not_required', 'confirmed')
    );
$$;

revoke execute on function public.has_provisional_membership_access()
  from public, anon;
grant execute on function public.has_provisional_membership_access()
  to authenticated;

create or replace function public.can_view_trip_readonly(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    public.can_view_trip(p_trip_id, auth.uid())
    or (
      public.has_provisional_membership_access()
      and exists (
        select 1
        from public.trips trips
        where trips.id = p_trip_id
          and trips.visibility = 'members'
      )
    );
$$;

revoke execute on function public.can_view_trip_readonly(uuid)
  from public, anon;
grant execute on function public.can_view_trip_readonly(uuid)
  to authenticated;

drop policy if exists trips_select_by_visibility_or_access on public.trips;
create policy trips_select_by_visibility_or_access
on public.trips for select
using (
  visibility in ('public', 'minimal')
  or (auth.uid() is not null and public.can_view_trip_readonly(id))
);

drop policy if exists trip_private_select_allowed on public.trip_private;
create policy trip_private_select_allowed
on public.trip_private for select
using (
  not public.is_banned(auth.uid())
  and public.can_view_trip_readonly(trip_id)
);

drop policy if exists trip_comments_select_if_can_view on public.trip_comments;
create policy trip_comments_select_if_can_view
on public.trip_comments for select
using (public.can_view_trip_readonly(trip_id));

drop policy if exists trip_carpools_select_if_can_view on public.trip_carpools;
create policy trip_carpools_select_if_can_view
on public.trip_carpools for select
using (public.can_view_trip_readonly(trip_id));

drop function if exists public.get_my_membership_access();
create function public.get_my_membership_access()
returns table (
  restriction text,
  access_active boolean,
  provisional_access boolean,
  expires_at timestamptz,
  override_active boolean
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with account as (
    select coalesce(
      (
        select restrictions.restriction
        from public.membership_account_restrictions restrictions
        where restrictions.user_id = auth.uid()
      ),
      'normal'::public.membership_restriction
    ) as restriction
  ), entitlement as (
    select max(ends_at) as expires_at
    from public.membership_entitlements
    where user_id = auth.uid()
      and revoked_at is null
      and starts_at <= now()
      and ends_at > now()
  ), access_override as (
    select exists (
      select 1
      from public.membership_access_overrides
      where user_id = auth.uid()
        and revoked_at is null
        and starts_at <= now()
        and (ends_at is null or ends_at > now())
    ) as is_active
  )
  select
    account.restriction::text,
    account.restriction = 'normal'
      and (entitlement.expires_at is not null or access_override.is_active),
    account.restriction = 'normal'
      and public.has_provisional_membership_access(),
    entitlement.expires_at,
    access_override.is_active
  from account, entitlement, access_override;
$$;

revoke execute on function public.get_my_membership_access()
  from public, anon;
grant execute on function public.get_my_membership_access()
  to authenticated;

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
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  if not exists (
    select 1
    from public.memberships reviewers
    where reviewers.user_id = p_reviewer_id
      and reviewers.role in ('staff', 'leadership', 'admin')
      and reviewers.status not in ('suspended', 'banned')
  ) then
    raise exception 'officer access required';
  end if;

  update public.membership_applications
  set guardian_consent = 'confirmed', updated_at = now()
  where user_id = p_user_id
    and age_status = 'minor'
    and status = 'submitted';

  if not found then
    raise exception 'reviewable minor application not found';
  end if;
end;
$$;

revoke execute on function public.confirm_membership_guardian_consent(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.confirm_membership_guardian_consent(uuid, uuid)
  to service_role;

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

  if not exists (
    select 1
    from public.memberships reviewers
    where reviewers.user_id = p_reviewer_id
      and reviewers.role in ('staff', 'leadership', 'admin')
      and reviewers.status not in ('suspended', 'banned')
  ) then
    raise exception 'officer access required';
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
    user_id,
    starts_at,
    ends_at,
    reason,
    granted_by
  ) values (
    p_user_id,
    v_grant_start,
    v_grant_end,
    'Zelle dues confirmed by club leadership.',
    p_reviewer_id
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
    user_id,
    status,
    role,
    joined_on,
    member_since
  ) values (
    p_user_id,
    'active',
    'regular',
    current_date,
    current_date
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

comment on table public.membership_applications is
  'Account-linked Zelle membership applications. A payment claim grants provisional read access only; officer confirmation creates the full 12-month access grant.';
