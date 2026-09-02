-- Governed one-time membership payments and derived access.

do $$ begin
  create type public.membership_restriction as enum ('normal', 'suspended', 'banned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_payment_status as enum (
    'pending',
    'paid',
    'failed',
    'refunded',
    'partially_refunded',
    'disputed',
    'review_required'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_checkout_status as enum (
    'open',
    'completed',
    'expired',
    'canceled',
    'failed',
    'review_required'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.webhook_processing_status as enum (
    'processing',
    'succeeded',
    'failed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_review_status as enum (
    'pending',
    'approved',
    'refund_requested',
    'refunded',
    'dismissed'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.membership_account_restrictions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  restriction public.membership_restriction not null default 'normal',
  internal_reason text,
  restricted_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (restriction = 'normal' and restricted_at is null)
    or (restriction <> 'normal' and restricted_at is not null)
  )
);

create table if not exists public.membership_checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.membership_checkout_status not null default 'open',
  stripe_checkout_session_id text unique,
  checkout_url text,
  stripe_price_id text not null,
  amount_cents integer not null default 2500 check (amount_cents = 2500),
  currency text not null default 'usd' check (currency = 'usd'),
  test_mode boolean not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists membership_checkout_one_open_per_user
  on public.membership_checkout_attempts(user_id)
  where status = 'open';

create table if not exists public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  checkout_attempt_id uuid not null unique
    references public.membership_checkout_attempts(id) on delete restrict,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null check (length(currency) = 3),
  status public.membership_payment_status not null,
  test_mode boolean not null,
  paid_at timestamptz,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists membership_payments_user_paid_at_idx
  on public.membership_payments(user_id, paid_at desc);

create table if not exists public.membership_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  payment_id uuid not null unique
    references public.membership_payments(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    (revoked_at is null and revoked_reason is null)
    or (revoked_at is not null and revoked_reason is not null)
  )
);

create index if not exists membership_entitlements_user_term_idx
  on public.membership_entitlements(user_id, ends_at desc);

create table if not exists public.membership_access_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  reason text not null check (length(trim(reason)) > 0),
  granted_by uuid not null references auth.users(id) on delete restrict,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  revoke_reason text,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (
    (revoked_at is null and revoked_by is null and revoke_reason is null)
    or (
      revoked_at is not null
      and revoked_by is not null
      and revoke_reason is not null
    )
  )
);

create index if not exists membership_access_overrides_user_idx
  on public.membership_access_overrides(user_id, starts_at, ends_at);

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  test_mode boolean not null,
  status public.webhook_processing_status not null default 'processing',
  attempt_count integer not null default 1 check (attempt_count > 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  payment_id uuid references public.membership_payments(id) on delete restrict,
  reason_code text not null,
  reason_detail text not null,
  status public.membership_review_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status <> 'pending' and reviewed_at is not null and reviewed_by is not null)
  )
);

create index if not exists membership_review_items_queue_idx
  on public.membership_review_items(status, created_at);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'membership_account_restrictions',
    'membership_checkout_attempts',
    'membership_payments',
    'stripe_webhook_events',
    'membership_review_items'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

alter table public.membership_account_restrictions enable row level security;
alter table public.membership_checkout_attempts enable row level security;
alter table public.membership_payments enable row level security;
alter table public.membership_entitlements enable row level security;
alter table public.membership_access_overrides enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.membership_review_items enable row level security;

revoke all on public.membership_account_restrictions from anon, authenticated;
revoke all on public.membership_checkout_attempts from anon, authenticated;
revoke all on public.membership_payments from anon, authenticated;
revoke all on public.membership_entitlements from anon, authenticated;
revoke all on public.membership_access_overrides from anon, authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;
revoke all on public.membership_review_items from anon, authenticated;

grant all on public.membership_account_restrictions to service_role;
grant all on public.membership_checkout_attempts to service_role;
grant all on public.membership_payments to service_role;
grant all on public.membership_entitlements to service_role;
grant all on public.membership_access_overrides to service_role;
grant all on public.stripe_webhook_events to service_role;
grant all on public.membership_review_items to service_role;

create or replace function public.has_membership_access(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    p_uid is not null
    and coalesce(
      (
        select restriction = 'normal'
        from public.membership_account_restrictions
        where user_id = p_uid
      ),
      true
    )
    and (
      exists (
        select 1
        from public.membership_entitlements
        where user_id = p_uid
          and revoked_at is null
          and starts_at <= now()
          and ends_at > now()
      )
      or exists (
        select 1
        from public.membership_access_overrides
        where user_id = p_uid
          and revoked_at is null
          and starts_at <= now()
          and (ends_at is null or ends_at > now())
      )
    );
$$;

create or replace function public.is_active_member(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_membership_access(p_uid);
$$;

revoke execute on function public.has_membership_access(uuid)
  from public, anon, authenticated;
revoke execute on function public.is_active_member(uuid)
  from public, anon, authenticated;
grant execute on function public.has_membership_access(uuid) to service_role;
grant execute on function public.is_active_member(uuid) to service_role;

insert into public.membership_access_overrides (
  user_id,
  reason,
  granted_by
)
select
  memberships.user_id,
  'Explicit access migrated for a current club staff role.',
  memberships.user_id
from public.memberships
where memberships.role in ('staff', 'leadership', 'admin')
  and memberships.status not in ('suspended', 'banned')
  and not exists (
    select 1
    from public.membership_access_overrides existing
    where existing.user_id = memberships.user_id
      and existing.revoked_at is null
      and existing.reason = 'Explicit access migrated for a current club staff role.'
  );

create or replace function public.get_my_membership_payment_history()
returns table (
  payment_date timestamptz,
  amount_cents integer,
  currency text,
  public_status text,
  granted_starts_at timestamptz,
  granted_ends_at timestamptz,
  receipt_url text
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    payments.paid_at,
    payments.amount_cents,
    upper(payments.currency),
    payments.status::text,
    entitlements.starts_at,
    entitlements.ends_at,
    payments.receipt_url
  from public.membership_payments payments
  left join public.membership_entitlements entitlements
    on entitlements.payment_id = payments.id
  where payments.user_id = auth.uid()
  order by payments.created_at desc;
$$;

revoke execute on function public.get_my_membership_payment_history()
  from public, anon;
grant execute on function public.get_my_membership_payment_history()
  to authenticated;

create or replace function public.get_my_membership_access()
returns table (
  restriction text,
  access_active boolean,
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
        select membership_account_restrictions.restriction
        from public.membership_account_restrictions
        where membership_account_restrictions.user_id = auth.uid()
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
    entitlement.expires_at,
    access_override.is_active
  from account, entitlement, access_override;
$$;

revoke execute on function public.get_my_membership_access()
  from public, anon;
grant execute on function public.get_my_membership_access()
  to authenticated;

comment on table public.membership_entitlements is
  'Immutable paid access grants. Revocation is recorded rather than deleting a grant.';
comment on table public.membership_access_overrides is
  'Explicit access independent of club role. Role alone does not grant paid access.';
comment on table public.membership_payments is
  'Service-only Stripe reconciliation data; clients use the safe payment-history RPC.';
