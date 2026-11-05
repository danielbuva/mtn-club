-- Aggregate inside Postgres so PostgREST's max_rows cannot truncate totals.
-- This helper is private and callable only by the guarded public RPCs' owner.
create or replace function registration_private.admin_membership_counts(
  p_term_start date, p_term_end date
) returns jsonb
language sql stable security definer set search_path = '' as $$
  with grants as (
    select user_id, starts_at, ends_at, revoked_at,
      payment_id is not null or zelle_payment_id is not null as paid
    from public.membership_entitlements
    union all
    select user_id, starts_at, ends_at, revoked_at, false
    from public.membership_access_overrides
  ), members as (
    select g.user_id, min(g.starts_at) as first_activation,
      bool_or(g.revoked_at is null and g.starts_at <= now()
        and (g.ends_at is null or g.ends_at > now())
        and not exists (select 1 from public.membership_account_restrictions r
          where r.user_id = g.user_id and r.restriction <> 'normal')) as active,
      bool_or(g.paid and g.revoked_at is null and g.starts_at <= now()
        and (g.ends_at is null or g.ends_at > now())
        and not exists (select 1 from public.membership_account_restrictions r
          where r.user_id = g.user_id and r.restriction <> 'normal')) as paid
    from grants g group by g.user_id
  )
  select jsonb_build_object(
    'activeMembers', count(*) filter (where active),
    'paidMembers', count(*) filter (where paid),
    'newMembers', count(*) filter (where first_activation >= p_term_start::timestamp at time zone 'UTC'
      and first_activation < (p_term_end + 1)::timestamp at time zone 'UTC')
  ) from members;
$$;
revoke all on function registration_private.admin_membership_counts(date, date) from public, anon, authenticated, service_role;

create or replace function public.get_admin_analytics_totals(p_range_start timestamptz default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_admin_capability(auth.uid(), 'analytics.read') then
    raise exception 'Analytics permission required.' using errcode = '42501';
  end if;
  return registration_private.admin_membership_counts(null, null) || (
    with trips as (
      select * from public.trips where p_range_start is null or starts_at >= p_range_start
    ), activities as (
      select tag as activity, count(*) as count
      from trips t cross join lateral (select distinct unnest(t.activity_tags) as tag) tags
      group by tag
    ), payments as (
      select count(*) as count, coalesce(sum(amount_cents), 0) as revenue
      from public.membership_zelle_payments
      where status = 'confirmed' and (p_range_start is null or reviewed_at >= p_range_start)
    ), mailing as (
      select * from public.mailing_list_subscriptions
      where p_range_start is null or subscribed_at >= p_range_start or unsubscribed_at >= p_range_start
    )
    select jsonb_build_object(
      'accounts', (select count(*) from auth.users),
      'applications', (select count(*) from public.membership_applications
        where p_range_start is null or created_at >= p_range_start),
      'confirmedDues', (select count from payments),
      'confirmedRevenue', (select revenue from payments),
      'trips', (select count(*) from trips),
      'publishedTrips', (select count(*) from trips where lifecycle_status = 'published'),
      'canceledTrips', (select count(*) from trips where lifecycle_status = 'canceled'),
      'archivedTrips', (select count(*) from trips where lifecycle_status = 'archived'),
      'tripActivities', coalesce((select jsonb_agg(to_jsonb(a) order by a.count desc, a.activity) from activities a), '[]'::jsonb),
      'mailingOptIns', (select count(*) from mailing where subscribed),
      'mailingOptOuts', (select count(*) from mailing where not subscribed)
    )
  );
end;
$$;
revoke all on function public.get_admin_analytics_totals(timestamptz) from public, anon, service_role;
grant execute on function public.get_admin_analytics_totals(timestamptz) to authenticated;

create or replace function public.get_admin_overview_totals()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare term public.club_terms%rowtype;
begin
  if auth.uid() is null or not public.has_admin_capability(auth.uid(), 'overview.read') then
    raise exception 'Overview permission required.' using errcode = '42501';
  end if;
  select * into term from public.club_terms where is_active;
  return registration_private.admin_membership_counts(term.starts_on, term.ends_on) || (
    with upcoming as (
      select * from public.trips where starts_at >= now() and lifecycle_status = 'published'
    ), next_trip as (
      select * from upcoming where is_official
        and not exists (select 1 from unnest(activity_tags) tag where lower(tag) = 'meetup')
      order by starts_at, id limit 1
    )
    select jsonb_build_object(
      'termName', coalesce(term.name, 'Current term'),
      'upcomingTrips', (select count(*) from upcoming),
      'pendingPayments', (select count(*) from public.membership_zelle_payments where status = 'claimed'),
      'pendingGuardians', (select count(*) from public.membership_applications
        where status = 'submitted' and guardian_consent = 'pending'),
      'pendingSchedule', (select count(*) from public.schedule_review_items where status = 'pending'),
      'pendingDeletions', (select count(*) from public.account_deletion_jobs
        where status in ('pending', 'auth_deleted', 'failed')),
      'inactiveHostTrips', (select count(*) from upcoming t where exists (
        select 1 from public.trip_hosts c join public.club_hosts h on h.id = c.host_id
        where c.trip_id = t.id and not h.is_active)),
      'incompleteTrips', (select count(*) from upcoming t
        where nullif(trim(t.location_public), '') is null
          or nullif(trim(t.description_public), '') is null
          or not exists (select 1 from public.trip_hosts c where c.trip_id = t.id)),
      'nextTrip', (select jsonb_build_object(
        'id', t.id, 'title', t.title, 'startsAt', t.starts_at, 'endsAt', t.ends_at,
        'location', t.location_public, 'capacity', t.capacity, 'isAllDay', t.is_all_day,
        'hosts', coalesce((select jsonb_agg(h.public_name order by c.sort_order, h.id)
          from public.trip_hosts c join public.club_hosts h on h.id = c.host_id
          where c.trip_id = t.id and nullif(h.public_name, '') is not null), '[]'::jsonb)
      ) from next_trip t)
    )
  );
end;
$$;
revoke all on function public.get_admin_overview_totals() from public, anon, service_role;
grant execute on function public.get_admin_overview_totals() to authenticated;
