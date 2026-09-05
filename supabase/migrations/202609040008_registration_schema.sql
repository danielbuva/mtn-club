-- Registration is deliberately closed until each environment passes its runbook.
alter table public.club_admin_settings add column registration_enabled boolean not null default false;
create schema if not exists registration_private;
revoke all on schema registration_private from public, anon, authenticated, service_role;

create table public.registration_waivers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id),
  version integer not null check (version > 0),
  title text not null check (length(title) between 1 and 200),
  body text not null check (length(body) between 1 and 100000),
  created_at timestamptz not null default now(),
  unique (trip_id, version)
);
create table public.trip_registration_settings (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  enabled boolean not null default false,
  eligibility text not null default 'members' check (eligibility in ('members', 'account')),
  emergency_required boolean not null default false,
  waiver_required boolean not null default false,
  waiver_id uuid references public.registration_waivers(id),
  questions jsonb not null default '[]' check (jsonb_typeof(questions) = 'array'),
  form_version integer not null default 1,
  offer_hours integer not null default 24 check (offer_hours between 1 and 168),
  revision integer not null default 0,
  locked_at timestamptz
);
insert into public.trip_registration_settings (trip_id, emergency_required, waiver_required)
select id, is_official, is_official from public.trips;

alter table public.trip_rsvps
  add column registration_state text not null default 'none'
    check (registration_state in ('none','confirmed','waitlisted','offered','cancelled','removed_by_organizer','legacy_review')),
  add column registered_at timestamptz,
  add column queued_at timestamptz,
  add column revision integer not null default 0;
update public.trip_rsvps set
  registration_state = case status when 'going' then 'confirmed' when 'waitlisted' then 'waitlisted'
    when 'not_going' then 'cancelled' when 'removed' then 'cancelled' else 'legacy_review' end,
  registered_at = created_at,
  queued_at = case when status = 'waitlisted' then created_at end;
-- Legacy-only trips need one initial configuration; new submissions freeze it.
create index registration_queue on public.trip_rsvps(trip_id, registration_state, queued_at, user_id);

create table public.registration_responses (
  trip_id uuid not null,
  user_id uuid not null,
  form_version integer not null,
  answers jsonb not null default '{}' check (jsonb_typeof(answers) = 'object'),
  emergency_contact jsonb not null default '{}' check (jsonb_typeof(emergency_contact) = 'object'),
  updated_at timestamptz not null default now(),
  primary key(trip_id, user_id),
  foreign key(trip_id,user_id) references public.trip_rsvps(trip_id,user_id)
);
create table public.registration_signatures (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id),
  user_id uuid not null references auth.users(id),
  original_signer_id uuid not null,
  waiver_id uuid not null references public.registration_waivers(id),
  signature_name text not null check (length(trim(signature_name)) between 2 and 200),
  signed_at timestamptz not null default now(),
  unique(user_id, waiver_id)
);
create table public.registration_guardian_reviews (
  trip_id uuid not null references public.trips(id),
  user_id uuid not null references auth.users(id),
  waiver_id uuid references public.registration_waivers(id),
  reviewer_id uuid not null,
  evidence text not null check (length(trim(evidence)) between 5 and 2000),
  reviewed_at timestamptz not null default now(),
  primary key(trip_id, user_id)
);
create table public.registration_offers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null,
  issued_by uuid not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  resolved_at timestamptz,
  status text not null default 'pending' check(status in ('pending','accepted','declined','expired','revoked')),
  foreign key(trip_id,user_id) references public.trip_rsvps(trip_id,user_id)
);
create unique index registration_one_offer on public.registration_offers(trip_id,user_id) where status = 'pending';
create index registration_offer_expiry on public.registration_offers(expires_at) where status = 'pending';
create table public.registration_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id),
  user_id uuid,
  actor_id uuid,
  kind text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index registration_event_trip on public.registration_events(trip_id,created_at);
create table public.registration_requests (
  actor_id uuid not null,
  request_id uuid not null,
  trip_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);
create table public.registration_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.registration_events(id),
  trip_id uuid not null references public.trips(id),
  user_id uuid not null references auth.users(id),
  kind text not null,
  dedupe_key text not null unique,
  status text not null default 'pending' check(status in ('pending','sending','sent','delivered','bounced','failed','suppressed','obsolete')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_token uuid,
  provider_id text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index registration_notification_ready on public.registration_notifications(next_attempt_at) where status in ('pending','sending');
create table public.registration_delivery_events (
  id text primary key,
  received_at timestamptz not null default now()
);
create table public.registration_worker_health (
  id boolean primary key default true check(id),
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_error text
);
insert into public.registration_worker_health(id) values(true);

-- Existing adult declarations remain valid; minors get a protected false record.
alter table public.account_age_declarations drop constraint if exists account_age_declarations_is_18_or_older_check;
alter table public.account_age_declarations drop constraint if exists account_age_declarations_source_check;
alter table public.account_age_declarations add constraint account_age_declarations_source_check
check(source in ('email_signup','oauth_signup','membership_application','trip_registration'));

-- All writes below go through authenticated commands, including server/service code.
revoke insert,update,delete on public.trip_rsvps, public.trip_attendance, public.user_waivers
from authenticated;
do $$ declare t text; begin
  foreach t in array array['registration_waivers','trip_registration_settings','registration_responses',
    'registration_signatures','registration_guardian_reviews','registration_offers','registration_events',
    'registration_requests','registration_notifications','registration_delivery_events','registration_worker_health'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated, service_role',t);
  end loop;
end $$;

create function registration_private.immutable_document() returns trigger language plpgsql as $$
begin raise exception 'Signed documents and registration history are immutable'; end $$;
create trigger registration_waiver_immutable before update or delete on public.registration_waivers
for each row execute function registration_private.immutable_document();
create trigger registration_signature_immutable before update or delete on public.registration_signatures
for each row execute function registration_private.immutable_document();
create trigger registration_event_immutable before update or delete on public.registration_events
for each row execute function registration_private.immutable_document();

create function registration_private.initialize_trip() returns trigger language plpgsql security definer
set search_path = '' as $$ begin
  insert into public.trip_registration_settings(trip_id,emergency_required,waiver_required)
  values(new.id,new.is_official,new.is_official);
  return new;
end $$;
create trigger registration_initialize after insert on public.trips
for each row execute function registration_private.initialize_trip();

create table public.registration_account_merges (
 secondary_id uuid primary key,
 primary_id uuid not null references auth.users(id),
 merged_at timestamptz not null default now(),
 check(secondary_id<>primary_id)
);
alter table public.registration_account_merges enable row level security;
revoke all on public.registration_account_merges from public,anon,authenticated,service_role;
