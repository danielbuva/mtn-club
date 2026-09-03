-- Part-one administration system: RBAC, operational settings, Zelle review,
-- mailing-list consent, trip lifecycle, and an append-only activity trail.

do $$ begin
  create type public.admin_permission_scope as enum ('assigned', 'all');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.trip_lifecycle_status as enum (
    'published',
    'canceled',
    'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.zelle_payment_status as enum (
    'claimed',
    'confirmed',
    'rejected',
    'reversed'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name text not null check (length(trim(name)) between 2 and 80),
  description text,
  is_super_admin boolean not null default false,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_roles_single_super_admin
  on public.admin_roles (is_super_admin)
  where is_super_admin;

create table if not exists public.admin_capabilities (
  key text primary key check (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  resource text not null,
  action text not null,
  label text not null,
  supports_assigned_scope boolean not null default false,
  is_active boolean not null default true,
  phase smallint not null default 1 check (phase in (1, 2)),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_role_grants (
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  capability_key text not null references public.admin_capabilities(key) on delete cascade,
  scope public.admin_permission_scope not null default 'all',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (role_id, capability_key)
);

create table if not exists public.admin_user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index if not exists admin_user_roles_role_id_idx
  on public.admin_user_roles(role_id);

create table if not exists public.club_terms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create unique index if not exists club_terms_single_active
  on public.club_terms(is_active)
  where is_active;

create table if not exists public.club_admin_settings (
  id boolean primary key default true check (id),
  dues_amount_cents integer not null default 2500 check (dues_amount_cents > 0),
  currency text not null default 'usd' check (length(currency) = 3),
  time_zone text not null default 'America/Los_Angeles',
  non_admin_upcoming_trip_limit integer not null default 2
    check (non_admin_upcoming_trip_limit between 0 and 20),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_zelle_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd' check (length(currency) = 3),
  status public.zelle_payment_status not null default 'claimed',
  claim_source text not null default 'membership_page'
    check (claim_source in ('membership_signup', 'membership_page', 'admin')),
  claimed_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  internal_note text check (internal_note is null or length(internal_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'claimed' and reviewed_at is null)
    or (status <> 'claimed' and reviewed_at is not null)
  )
);

create unique index if not exists membership_zelle_one_claimed_per_user
  on public.membership_zelle_payments(user_id)
  where status = 'claimed';

create index if not exists membership_zelle_user_created_idx
  on public.membership_zelle_payments(user_id, created_at desc);

alter table public.membership_entitlements
  alter column payment_id drop not null,
  add column if not exists zelle_payment_id uuid unique
    references public.membership_zelle_payments(id) on delete restrict;

do $$ begin
  alter table public.membership_entitlements
    add constraint membership_entitlements_exactly_one_payment
    check (num_nonnulls(payment_id, zelle_payment_id) = 1);
exception when duplicate_object then null;
end $$;

-- The legacy application constraint required every confirmed Zelle signup to
-- point at an access override. Confirmed Zelle payments now create an
-- entitlement instead, so replace that portion of the invariant.
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.membership_applications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%membership_access_override_id%'
  loop
    execute format(
      'alter table public.membership_applications drop constraint %I',
      v_constraint.conname
    );
  end loop;
end $$;

alter table public.membership_applications
  add constraint membership_applications_confirmation_state check (
    (status = 'confirmed'
      and dues_payment_claimed
      and guardian_consent in ('not_required', 'confirmed')
      and confirmed_at is not null
      and confirmed_by is not null)
    or (status <> 'confirmed'
      and confirmed_at is null
      and confirmed_by is null
      and membership_access_override_id is null)
  );

create table if not exists public.mailing_list_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null check (
    length(trim(email)) between 3 and 320 and position('@' in email) > 1
  ),
  subscribed boolean not null default false,
  consent_source text not null
    check (consent_source in ('membership_signup', 'account_settings', 'admin')),
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (subscribed and subscribed_at is not null and unsubscribed_at is null)
    or (not subscribed and unsubscribed_at is not null)
  )
);

create index if not exists mailing_list_subscribed_idx
  on public.mailing_list_subscriptions(subscribed, subscribed_at desc);

create table if not exists public.mailing_list_consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  subscribed boolean not null,
  consent_source text not null
    check (consent_source in ('membership_signup', 'account_settings', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists mailing_list_consent_user_created_idx
  on public.mailing_list_consent_events(user_id, created_at desc);

create table if not exists public.admin_activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  subject_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  summary text not null,
  before_data jsonb,
  after_data jsonb,
  result text not null default 'succeeded'
    check (result in ('succeeded', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_created_idx
  on public.admin_activity_events(created_at desc);

create table if not exists public.account_deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  requested_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'auth_deleted', 'completed', 'failed')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists account_deletion_one_per_user
  on public.account_deletion_jobs(user_id);

alter table public.trips
  add column if not exists lifecycle_status public.trip_lifecycle_status
    not null default 'published',
  add column if not exists canceled_at timestamptz,
  add column if not exists canceled_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz;

alter table public.club_hosts
  add column if not exists role_key text,
  add column if not exists is_active boolean not null default true,
  add column if not exists display_order integer not null default 0;

create index if not exists club_hosts_active_order_idx
  on public.club_hosts(is_active, display_order, public_name);

insert into public.admin_roles (key, name, description, is_super_admin, is_system)
values
  ('super_admin', 'Super Admin', 'Protected identity and authorization access.', true, true),
  ('president', 'President', 'Club president.', false, true),
  ('community_director', 'Community Director', 'Community and communications leadership.', false, true),
  ('gear_manager', 'Gear Manager', 'Gear and equipment leadership.', false, true),
  ('treasurer', 'Treasurer', 'Membership dues and financial operations.', false, true),
  ('scheduling_liaison', 'Scheduling Liaison', 'Trip and calendar scheduling.', false, true),
  ('trip_leader', 'Trip Leader', 'Trip planning and leadership.', false, true)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  is_super_admin = excluded.is_super_admin,
  is_system = excluded.is_system;

insert into public.admin_capabilities
  (key, resource, action, label, supports_assigned_scope, is_active, phase)
values
  ('overview.read', 'overview', 'read', 'View overview', false, true, 1),
  ('trips.read', 'trips', 'read', 'View trips', true, true, 1),
  ('trips.create', 'trips', 'create', 'Create trips', false, true, 1),
  ('trips.update', 'trips', 'update', 'Edit trips', true, true, 1),
  ('trips.delete', 'trips', 'delete', 'Cancel and archive trips', true, true, 1),
  ('trips.official', 'trips', 'official', 'Set official status', true, true, 1),
  ('membership.read', 'membership', 'read', 'View membership', false, true, 1),
  ('membership.update', 'membership', 'update', 'Manage membership', false, true, 1),
  ('membership.confirm_payment', 'membership', 'confirm_payment', 'Review Zelle payments', false, true, 1),
  ('membership.confirm_guardian', 'membership', 'confirm_guardian', 'Confirm guardian consent', false, true, 1),
  ('accounts.read', 'accounts', 'read', 'View accounts', false, true, 1),
  ('accounts.update', 'accounts', 'update', 'Manage accounts', false, true, 1),
  ('analytics.read', 'analytics', 'read', 'View analytics', false, true, 1),
  ('mailing_list.read', 'mailing_list', 'read', 'View mailing list', false, true, 1),
  ('mailing_list.export', 'mailing_list', 'export', 'Export mailing list', false, true, 1),
  ('gallery.read', 'gallery', 'read', 'View gallery admin', false, true, 1),
  ('gallery.create', 'gallery', 'create', 'Upload gallery photos', false, true, 1),
  ('gallery.update', 'gallery', 'update', 'Edit gallery photos', false, true, 1),
  ('gallery.delete', 'gallery', 'delete', 'Delete gallery photos', false, true, 1),
  ('leadership.read', 'leadership', 'read', 'View leadership', false, true, 1),
  ('settings.read', 'settings', 'read', 'View settings', false, true, 1),
  ('settings.update', 'settings', 'update', 'Edit settings', false, true, 1),
  ('rsvps.read', 'rsvps', 'read', 'View RSVPs', true, false, 2),
  ('rsvps.update', 'rsvps', 'update', 'Manage RSVPs', true, false, 2),
  ('carpools.read', 'carpools', 'read', 'View carpools', true, false, 2),
  ('carpools.update', 'carpools', 'update', 'Manage carpools', true, false, 2),
  ('attendance.update', 'attendance', 'update', 'Manage attendance', true, false, 2),
  ('announcements.update', 'announcements', 'update', 'Manage announcements', false, false, 2),
  ('gear.update', 'gear', 'update', 'Manage gear closet', false, false, 2)
on conflict (key) do update set
  resource = excluded.resource,
  action = excluded.action,
  label = excluded.label,
  supports_assigned_scope = excluded.supports_assigned_scope,
  is_active = excluded.is_active,
  phase = excluded.phase;

insert into public.admin_role_grants (role_id, capability_key, scope)
select roles.id, capabilities.key, 'all'::public.admin_permission_scope
from public.admin_roles roles
cross join public.admin_capabilities capabilities
where roles.key <> 'super_admin'
  and capabilities.phase = 1
  and capabilities.is_active
on conflict (role_id, capability_key) do nothing;

insert into public.admin_user_roles (user_id, role_id, assigned_by)
select users.id, roles.id, users.id
from auth.users users
cross join public.admin_roles roles
where lower(users.email) in (
  'valded5@unlv.nevada.edu',
  'welcometochilis666@aol.com'
)
and roles.key = 'super_admin'
on conflict (user_id, role_id) do nothing;

update public.club_terms set is_active = false, updated_at = now()
where is_active and name <> 'Fall 2026';

insert into public.club_terms (name, starts_on, ends_on, is_active)
values ('Fall 2026', date '2026-09-01', date '2026-12-10', true)
on conflict (name) do update set
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  is_active = excluded.is_active;

insert into public.club_admin_settings (id)
values (true)
on conflict (id) do nothing;

-- Keep old trip-credit hosts, but remove them from the active leadership page.
update public.club_hosts
set is_active = false
where lower(public_name) in (
  'alex wright',
  'lilly czerwinski',
  'alyssa moreno callaway'
);

insert into public.club_hosts
  (public_name, club_title, role_key, is_active, display_order)
values
  ('Dax Whitaker', 'President', 'president', true, 10),
  ('Sophia Pascual', 'Community Director', 'community_director', true, 20),
  ('Alyssa Callaway', 'Gear Manager', 'gear_manager', true, 30),
  ('Wyatt Diaz Gomez', 'Treasurer', 'treasurer', true, 40),
  ('Kelsy Iniguez', 'Scheduling Liaison', 'scheduling_liaison', true, 50),
  ('Joanna Hunter', 'Trip Leader', 'trip_leader', true, 60),
  ('Joy Johnson', 'Trip Leader', 'trip_leader', true, 70)
on conflict ((lower(public_name))) do update set
  club_title = excluded.club_title,
  role_key = excluded.role_key,
  is_active = true,
  display_order = excluded.display_order;

create or replace function public.is_super_admin(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select p_uid is not null
    and not exists (
      select 1 from public.membership_account_restrictions restrictions
      where restrictions.user_id = p_uid
        and restrictions.restriction in ('suspended', 'banned')
    )
    and exists (
      select 1
      from public.admin_user_roles assignments
      join public.admin_roles roles on roles.id = assignments.role_id
      where assignments.user_id = p_uid and roles.is_super_admin
    );
$$;

create or replace function public.admin_capability_scope(
  p_uid uuid,
  p_capability_key text
)
returns public.admin_permission_scope
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select case
    when public.is_super_admin(p_uid) then 'all'::public.admin_permission_scope
    when exists (
      select 1 from public.membership_account_restrictions restrictions
      where restrictions.user_id = p_uid
        and restrictions.restriction in ('suspended', 'banned')
    ) then null
    else (
      select case
        when bool_or(grants.scope = 'all') then 'all'::public.admin_permission_scope
        when bool_or(grants.scope = 'assigned') then 'assigned'::public.admin_permission_scope
        else null
      end
      from public.admin_user_roles assignments
      join public.admin_roles roles on roles.id = assignments.role_id
      join public.admin_role_grants grants on grants.role_id = roles.id
      join public.admin_capabilities capabilities
        on capabilities.key = grants.capability_key
      where assignments.user_id = p_uid
        and grants.capability_key = p_capability_key
        and capabilities.is_active
    )
  end;
$$;

create or replace function public.has_admin_capability(
  p_uid uuid,
  p_capability_key text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.admin_capability_scope(p_uid, p_capability_key) is not null;
$$;

create or replace function public.has_trip_admin_capability(
  p_uid uuid,
  p_capability_key text,
  p_trip_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select case public.admin_capability_scope(p_uid, p_capability_key)
    when 'all' then true
    when 'assigned' then exists (
      select 1 from public.trip_leaders leaders
      where leaders.trip_id = p_trip_id and leaders.user_id = p_uid
    )
    else false
  end;
$$;

create or replace function public.is_staff_or_admin(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_admin_capability(p_uid, 'overview.read');
$$;

create or replace function public.set_super_admin_assignment(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_assign boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_role_id uuid;
  v_super_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if not public.is_super_admin(p_actor_user_id) then
    raise exception 'super admin access required';
  end if;
  select id into v_role_id from public.admin_roles where is_super_admin;
  if v_role_id is null then raise exception 'super admin role missing'; end if;

  perform pg_advisory_xact_lock(hashtextextended('super_admin_assignment', 41));
  if p_assign then
    insert into public.admin_user_roles (user_id, role_id, assigned_by)
    values (p_target_user_id, v_role_id, p_actor_user_id)
    on conflict (user_id, role_id) do nothing;
  else
    if p_actor_user_id = p_target_user_id then
      raise exception 'self-removal is not allowed';
    end if;
    select count(*) into v_super_count
    from public.admin_user_roles where role_id = v_role_id;
    if v_super_count <= 1 then raise exception 'cannot remove the final super admin'; end if;
    delete from public.admin_user_roles
    where user_id = p_target_user_id and role_id = v_role_id;
  end if;

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id, summary
  ) values (
    p_actor_user_id, p_target_user_id,
    case when p_assign then 'super_admin_assigned' else 'super_admin_removed' end,
    'account', p_target_user_id::text,
    case when p_assign then 'Super-admin access assigned.' else 'Super-admin access removed.' end
  );
end;
$$;

create or replace function public.record_admin_activity(
  p_actor_user_id uuid,
  p_subject_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_summary text,
  p_before_data jsonb default null,
  p_after_data jsonb default null,
  p_result text default 'succeeded'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid;
begin
  if auth.role() <> 'service_role'
    and auth.uid() is distinct from p_actor_user_id then
    raise exception 'activity actor mismatch';
  end if;

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id,
    summary, before_data, after_data, result
  ) values (
    p_actor_user_id, p_subject_user_id, p_action, p_resource_type,
    p_resource_id, p_summary, p_before_data, p_after_data, p_result
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.audit_authenticated_content_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_row jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_id text := coalesce(v_row->>'id', v_row->>'user_id');
  v_summary text;
  v_safe jsonb;
begin
  if auth.uid() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_table_name = 'trips' then
    v_summary := 'Trip ' || lower(tg_op) || ': ' || coalesce(v_row->>'title', 'Untitled trip');
    v_safe := jsonb_build_object(
      'title', v_row->>'title',
      'starts_at', v_row->>'starts_at',
      'is_official', v_row->'is_official',
      'lifecycle_status', v_row->>'lifecycle_status'
    );
  elsif tg_table_name = 'gallery_photos' then
    v_summary := 'Gallery photo ' || lower(tg_op) || ': ' || coalesce(v_row->>'title', 'Untitled photo');
    v_safe := jsonb_build_object(
      'title', v_row->>'title',
      'is_published', v_row->'is_published',
      'sort_order', v_row->'sort_order'
    );
  else
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  insert into public.admin_activity_events (
    actor_user_id, action, resource_type, resource_id, summary, after_data
  ) values (
    auth.uid(), tg_table_name || '_' || lower(tg_op), tg_table_name,
    v_id, v_summary, v_safe
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trips_audit_authenticated_change on public.trips;
create trigger trips_audit_authenticated_change
after insert or update or delete on public.trips
for each row execute function public.audit_authenticated_content_change();

drop trigger if exists gallery_audit_authenticated_change on public.gallery_photos;
create trigger gallery_audit_authenticated_change
after insert or update or delete on public.gallery_photos
for each row execute function public.audit_authenticated_content_change();

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
  if not exists (
    select 1 from public.membership_applications applications
    where applications.user_id = auth.uid()
      and applications.status = 'submitted'
  ) then
    raise exception 'submitted membership application required';
  end if;

  select dues_amount_cents into v_amount
  from public.club_admin_settings where id;

  insert into public.membership_zelle_payments (
    user_id, amount_cents, status, claim_source
  ) values (
    auth.uid(), coalesce(v_amount, 2500), 'claimed', 'membership_page'
  )
  on conflict (user_id) where status = 'claimed'
  do update set claimed_at = now(), updated_at = now()
  returning id into v_id;

  update public.membership_applications
  set dues_payment_claimed = true, dues_claimed_at = now(), updated_at = now()
  where user_id = auth.uid();

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id, summary
  ) values (
    auth.uid(), auth.uid(), 'payment_claimed', 'membership_zelle_payment',
    v_id::text, 'Member reported a Zelle dues payment.'
  );
  return v_id;
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
  v_start timestamptz;
  v_end timestamptz;
begin
  if not exists (
    select 1 from public.membership_applications applications
    where applications.user_id = p_user_id
      and applications.status = 'submitted'
      and applications.guardian_consent in ('not_required', 'confirmed')
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
  set status = 'confirmed', confirmed_at = now(), confirmed_by = v_payment.reviewed_by,
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

  select * into v_payment from public.membership_zelle_payments
  where id = p_payment_id for update;
  if not found then raise exception 'payment not found'; end if;
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

  update public.membership_applications set
    status = 'submitted', dues_payment_claimed = false, dues_claimed_at = null,
    confirmed_at = null, confirmed_by = null,
    membership_access_override_id = null, updated_at = now()
  where user_id = v_payment.user_id;

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

create or replace function public.set_mailing_list_subscription(
  p_email text,
  p_subscribed boolean,
  p_source text default 'account_settings'
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  if p_source <> 'account_settings' then raise exception 'invalid consent source'; end if;
  if length(trim(p_email)) < 3 or position('@' in p_email) <= 1 then
    raise exception 'valid email required';
  end if;

  insert into public.mailing_list_subscriptions (
    user_id, email, subscribed, consent_source, subscribed_at, unsubscribed_at
  ) values (
    auth.uid(), lower(trim(p_email)), p_subscribed, p_source,
    case when p_subscribed then now() else null end,
    case when p_subscribed then null else now() end
  )
  on conflict (user_id) do update set
    email = excluded.email,
    subscribed = excluded.subscribed,
    consent_source = excluded.consent_source,
    subscribed_at = case
      when excluded.subscribed then coalesce(
        public.mailing_list_subscriptions.subscribed_at, now()
      ) else null end,
    unsubscribed_at = case when excluded.subscribed then null else now() end,
    updated_at = now();

  insert into public.mailing_list_consent_events (
    user_id, email, subscribed, consent_source
  ) values (
    auth.uid(), lower(trim(p_email)), p_subscribed, p_source
  );

  insert into public.admin_activity_events (
    actor_user_id, subject_user_id, action, resource_type, resource_id, summary
  ) values (
    auth.uid(), auth.uid(),
    case when p_subscribed then 'mailing_list_subscribed' else 'mailing_list_unsubscribed' end,
    'mailing_list_subscription', auth.uid()::text,
    case when p_subscribed then 'Member joined the mailing list.' else 'Member left the mailing list.' end
  );
end;
$$;

create or replace function public.enforce_unofficial_trip_limit()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if new.created_by is null then return new; end if;

  if new.is_official then
    if not public.has_admin_capability(new.created_by, 'trips.official') then
      raise exception 'official trip permission required';
    end if;
    return new;
  end if;

  if public.has_admin_capability(new.created_by, 'trips.create') then
    return new;
  end if;

  if not public.is_active_member(new.created_by)
    or public.is_banned(new.created_by)
    or exists (
      select 1 from public.membership_account_restrictions restrictions
      where restrictions.user_id = new.created_by
        and restrictions.restriction in ('suspended', 'banned')
    ) then
    raise exception 'active unrestricted membership required';
  end if;

  if new.lifecycle_status <> 'published' or new.starts_at <= now() then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.created_by::text, 11));
  select non_admin_upcoming_trip_limit into v_limit
  from public.club_admin_settings where id;
  select count(*) into v_count
  from public.trips trips
  where trips.created_by = new.created_by
    and not trips.is_official
    and trips.lifecycle_status = 'published'
    and trips.starts_at > now()
    and (tg_op = 'INSERT' or trips.id <> new.id);

  if v_count >= coalesce(v_limit, 2) then
    raise exception 'unofficial upcoming trip limit reached';
  end if;
  return new;
end;
$$;

drop trigger if exists trips_enforce_unofficial_limit on public.trips;
create trigger trips_enforce_unofficial_limit
before insert or update of starts_at, is_official, lifecycle_status, created_by
on public.trips
for each row execute function public.enforce_unofficial_trip_limit();

create or replace function public.can_manage_trip(p_trip_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_trip_admin_capability(p_uid, 'trips.update', p_trip_id)
    or exists (
      select 1 from public.trips
      where id = p_trip_id
        and created_by = p_uid
        and not is_official
        and public.is_active_member(p_uid)
        and not public.is_banned(p_uid)
    );
$$;

drop policy if exists trips_insert_unofficial_or_staff_official on public.trips;
create policy trips_insert_unofficial_or_staff_official
on public.trips for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    public.has_admin_capability((select auth.uid()), 'trips.create')
    or public.is_active_member((select auth.uid()))
  )
  and (
    not is_official
    or public.has_admin_capability((select auth.uid()), 'trips.official')
  )
);

do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'trips'
      and cmd in ('UPDATE', 'DELETE')
  loop
    execute format('drop policy if exists %I on public.trips', v_policy.policyname);
  end loop;
end $$;

create policy trips_update_capability_or_own_unofficial
on public.trips for update to authenticated
using (
  public.has_trip_admin_capability((select auth.uid()), 'trips.update', id)
  or (
    created_by = (select auth.uid())
    and not is_official
    and public.is_active_member((select auth.uid()))
    and not public.is_banned((select auth.uid()))
  )
)
with check (
  (
    public.has_trip_admin_capability((select auth.uid()), 'trips.update', id)
    or (
      created_by = (select auth.uid())
      and not is_official
      and public.is_active_member((select auth.uid()))
      and not public.is_banned((select auth.uid()))
    )
  )
  and (
    not is_official
    or public.has_admin_capability((select auth.uid()), 'trips.official')
  )
);

create policy trips_delete_empty_tests_super_only
on public.trips for delete to authenticated
using (
  public.is_super_admin((select auth.uid()))
  and lifecycle_status <> 'published'
  and not exists (
    select 1 from public.trip_rsvps where trip_id = trips.id
  )
  and not exists (
    select 1 from public.trip_attendance where trip_id = trips.id
  )
);

drop policy if exists club_hosts_staff_insert on public.club_hosts;
drop policy if exists club_hosts_staff_update on public.club_hosts;
drop policy if exists club_hosts_staff_delete on public.club_hosts;
create policy club_hosts_leadership_insert on public.club_hosts for insert to authenticated
with check (public.is_super_admin((select auth.uid())));
create policy club_hosts_leadership_update on public.club_hosts for update to authenticated
using (public.is_super_admin((select auth.uid())))
with check (public.is_super_admin((select auth.uid())));
create policy club_hosts_leadership_delete on public.club_hosts for delete to authenticated
using (public.is_super_admin((select auth.uid())));

drop policy if exists trip_hosts_staff_manage on public.trip_hosts;
drop policy if exists trip_hosts_staff_insert on public.trip_hosts;
drop policy if exists trip_hosts_staff_update on public.trip_hosts;
drop policy if exists trip_hosts_staff_delete on public.trip_hosts;
create policy trip_hosts_capability_insert on public.trip_hosts for insert to authenticated
with check (public.has_trip_admin_capability((select auth.uid()), 'trips.update', trip_id));
create policy trip_hosts_capability_update on public.trip_hosts for update to authenticated
using (public.has_trip_admin_capability((select auth.uid()), 'trips.update', trip_id))
with check (public.has_trip_admin_capability((select auth.uid()), 'trips.update', trip_id));
create policy trip_hosts_capability_delete on public.trip_hosts for delete to authenticated
using (public.has_trip_admin_capability((select auth.uid()), 'trips.update', trip_id));

do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'trip_leaders'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
  loop
    execute format('drop policy if exists %I on public.trip_leaders', v_policy.policyname);
  end loop;
end $$;

create policy trip_leaders_capability_insert on public.trip_leaders for insert to authenticated
with check (public.has_trip_admin_capability((select auth.uid()), 'trips.update', trip_id));
create policy trip_leaders_capability_update on public.trip_leaders for update to authenticated
using (public.has_trip_admin_capability((select auth.uid()), 'trips.update', trip_id))
with check (public.has_trip_admin_capability((select auth.uid()), 'trips.update', trip_id));
create policy trip_leaders_capability_delete on public.trip_leaders for delete to authenticated
using (public.has_trip_admin_capability((select auth.uid()), 'trips.update', trip_id));

drop policy if exists schedule_review_items_staff_manage on public.schedule_review_items;
create policy schedule_review_items_capability_manage
on public.schedule_review_items for all to authenticated
using (public.has_admin_capability((select auth.uid()), 'trips.update'))
with check (public.has_admin_capability((select auth.uid()), 'trips.update'));

drop policy if exists trip_drafts_insert_own on public.trip_drafts;
create policy trip_drafts_insert_own on public.trip_drafts for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.profiles where user_id = (select auth.uid()))
  and (
    not is_official
    or public.has_admin_capability((select auth.uid()), 'trips.official')
  )
);

drop policy if exists trip_drafts_select_own on public.trip_drafts;
create policy trip_drafts_select_own_or_all_admin
on public.trip_drafts for select to authenticated
using (
  created_by = (select auth.uid())
  or public.admin_capability_scope((select auth.uid()), 'trips.read') = 'all'
);

drop policy if exists trip_drafts_update_own on public.trip_drafts;
create policy trip_drafts_update_own_or_all_admin on public.trip_drafts for update to authenticated
using (
  created_by = (select auth.uid())
  or public.admin_capability_scope((select auth.uid()), 'trips.update') = 'all'
)
with check (
  (
    created_by = (select auth.uid())
    or public.admin_capability_scope((select auth.uid()), 'trips.update') = 'all'
  )
  and (
    not is_official
    or public.has_admin_capability((select auth.uid()), 'trips.official')
  )
);

drop policy if exists trip_drafts_delete_own on public.trip_drafts;
create policy trip_drafts_delete_own_or_all_admin on public.trip_drafts for delete to authenticated
using (
  created_by = (select auth.uid())
  or public.admin_capability_scope((select auth.uid()), 'trips.delete') = 'all'
);

drop policy if exists gallery_photos_read_published_or_staff on public.gallery_photos;
create policy gallery_photos_read_published
on public.gallery_photos for select to anon, authenticated
using (is_published);

create policy gallery_photos_admin_read
on public.gallery_photos for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'gallery.read'));

drop policy if exists gallery_photos_staff_insert on public.gallery_photos;
create policy gallery_photos_staff_insert
on public.gallery_photos for insert to authenticated
with check (
  public.has_admin_capability((select auth.uid()), 'gallery.create')
  and uploaded_by = (select auth.uid())
);

drop policy if exists gallery_photos_staff_update on public.gallery_photos;
create policy gallery_photos_staff_update
on public.gallery_photos for update to authenticated
using (public.has_admin_capability((select auth.uid()), 'gallery.update'))
with check (public.has_admin_capability((select auth.uid()), 'gallery.update'));

drop policy if exists gallery_photos_staff_delete on public.gallery_photos;
create policy gallery_photos_staff_delete
on public.gallery_photos for delete to authenticated
using (public.has_admin_capability((select auth.uid()), 'gallery.delete'));

drop policy if exists club_gallery_staff_insert on storage.objects;
create policy club_gallery_capability_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'club_gallery'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
  and public.has_admin_capability((select auth.uid()), 'gallery.create')
);

drop policy if exists club_gallery_staff_update on storage.objects;
create policy club_gallery_capability_update
on storage.objects for update to authenticated
using (
  bucket_id = 'club_gallery'
  and public.has_admin_capability((select auth.uid()), 'gallery.update')
)
with check (
  bucket_id = 'club_gallery'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
  and public.has_admin_capability((select auth.uid()), 'gallery.update')
);

drop policy if exists club_gallery_staff_delete on storage.objects;
create policy club_gallery_capability_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'club_gallery'
  and public.has_admin_capability((select auth.uid()), 'gallery.delete')
);

drop policy if exists club_gallery_read_published on storage.objects;
create policy club_gallery_read_published
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'club_gallery'
  and exists (
    select 1 from public.gallery_photos
    where gallery_photos.storage_path = storage.objects.name
      and gallery_photos.is_published
  )
);

create policy club_gallery_capability_read
on storage.objects for select to authenticated
using (
  bucket_id = 'club_gallery'
  and public.has_admin_capability((select auth.uid()), 'gallery.read')
);

-- Backfill declarations as claims only. Existing confirmed applications remain
-- untouched by this insert and can be reconciled explicitly by leadership.
insert into public.membership_zelle_payments (
  user_id, amount_cents, currency, status, claim_source, claimed_at
)
select applications.user_id, settings.dues_amount_cents, settings.currency,
  'claimed', 'membership_signup',
  coalesce(applications.dues_claimed_at, applications.created_at)
from public.membership_applications applications
cross join public.club_admin_settings settings
where applications.dues_payment_claimed
  and applications.status = 'submitted'
  and not exists (
    select 1 from public.membership_zelle_payments payments
    where payments.user_id = applications.user_id and payments.status = 'claimed'
  );

alter table public.admin_roles enable row level security;
alter table public.admin_capabilities enable row level security;
alter table public.admin_role_grants enable row level security;
alter table public.admin_user_roles enable row level security;
alter table public.club_terms enable row level security;
alter table public.club_admin_settings enable row level security;
alter table public.membership_zelle_payments enable row level security;
alter table public.mailing_list_subscriptions enable row level security;
alter table public.mailing_list_consent_events enable row level security;
alter table public.admin_activity_events enable row level security;
alter table public.account_deletion_jobs enable row level security;

create policy admin_roles_admin_read on public.admin_roles for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'leadership.read'));
create policy admin_capabilities_admin_read on public.admin_capabilities for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'leadership.read'));
create policy admin_role_grants_admin_read on public.admin_role_grants for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'leadership.read'));
create policy admin_user_roles_admin_read on public.admin_user_roles for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'leadership.read'));
create policy club_terms_admin_read on public.club_terms for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'settings.read'));
create policy club_settings_admin_read on public.club_admin_settings for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'settings.read'));
create policy zelle_own_read on public.membership_zelle_payments for select to authenticated
using (user_id = (select auth.uid()));
create policy zelle_admin_read on public.membership_zelle_payments for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'membership.read'));
create policy mailing_own_read on public.mailing_list_subscriptions for select to authenticated
using (user_id = (select auth.uid()));
create policy mailing_admin_read on public.mailing_list_subscriptions for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'mailing_list.read'));
create policy mailing_consent_own_read on public.mailing_list_consent_events for select to authenticated
using (user_id = (select auth.uid()));
create policy mailing_consent_admin_read on public.mailing_list_consent_events for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'mailing_list.read'));
create policy activity_admin_read on public.admin_activity_events for select to authenticated
using (public.has_admin_capability((select auth.uid()), 'overview.read'));
create policy deletion_jobs_super_read on public.account_deletion_jobs for select to authenticated
using (public.is_super_admin((select auth.uid())));

grant select on public.admin_roles, public.admin_capabilities,
  public.admin_role_grants, public.admin_user_roles, public.club_terms,
  public.club_admin_settings, public.membership_zelle_payments,
  public.mailing_list_subscriptions, public.mailing_list_consent_events,
  public.admin_activity_events,
  public.account_deletion_jobs to authenticated;
grant all on public.admin_roles, public.admin_capabilities,
  public.admin_role_grants, public.admin_user_roles, public.club_terms,
  public.club_admin_settings, public.membership_zelle_payments,
  public.mailing_list_subscriptions, public.mailing_list_consent_events,
  public.admin_activity_events,
  public.account_deletion_jobs to service_role;

revoke execute on function public.is_super_admin(uuid) from public, anon;
revoke execute on function public.admin_capability_scope(uuid, text) from public, anon;
revoke execute on function public.has_admin_capability(uuid, text) from public, anon;
revoke execute on function public.has_trip_admin_capability(uuid, text, uuid) from public, anon;
grant execute on function public.is_super_admin(uuid) to authenticated, service_role;
grant execute on function public.admin_capability_scope(uuid, text) to authenticated, service_role;
grant execute on function public.has_admin_capability(uuid, text) to authenticated, service_role;
grant execute on function public.has_trip_admin_capability(uuid, text, uuid) to authenticated, service_role;
revoke execute on function public.set_super_admin_assignment(uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.set_super_admin_assignment(uuid, uuid, boolean)
  to service_role;
revoke execute on function public.record_admin_activity(uuid, uuid, text, text, text, text, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.record_admin_activity(uuid, uuid, text, text, text, text, jsonb, jsonb, text)
  to service_role;
revoke execute on function public.claim_zelle_membership_payment() from public, anon;
grant execute on function public.claim_zelle_membership_payment() to authenticated;
revoke execute on function public.activate_confirmed_zelle_membership(uuid)
  from public, anon, authenticated;
grant execute on function public.activate_confirmed_zelle_membership(uuid) to service_role;
revoke execute on function public.review_zelle_membership_payment(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_zelle_membership_payment(uuid, uuid, text, text)
  to service_role;
revoke execute on function public.reverse_zelle_membership_payment(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.reverse_zelle_membership_payment(uuid, uuid, text)
  to service_role;
revoke execute on function public.set_mailing_list_subscription(text, boolean, text)
  from public, anon;
grant execute on function public.set_mailing_list_subscription(text, boolean, text)
  to authenticated;

-- No client can mutate the audit trail. Server-side service operations and the
-- narrowly-scoped functions above are the only writers.
revoke insert, update, delete on public.admin_activity_events from authenticated;
