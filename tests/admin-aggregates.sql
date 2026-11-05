-- Scale and authorization regressions; run only in the harness's disposable DB.
begin;
do $$
declare
  owner_id uuid := gen_random_uuid();
  analyst uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  overview_role uuid := gen_random_uuid();
  analytics_role uuid := gen_random_uuid();
  member_ids uuid[];
  trip_ids uuid[];
  next_id uuid := gen_random_uuid();
  meetup_id uuid := gen_random_uuid();
  hidden_id uuid := gen_random_uuid();
  h uuid := gen_random_uuid();
  before_analytics jsonb;
  before_overview jsonb;
  analytics jsonb;
  overview jsonb;
  filtered jsonb;
  visible_overview jsonb;
  visible_analytics jsonb;
  k text;
begin
  insert into auth.users(id, email) values
    (owner_id, owner_id || '@example.test'), (analyst, analyst || '@example.test'), (outsider, outsider || '@example.test');
  insert into public.admin_roles(id, key, name) values
    (overview_role, 'overview_' || replace(overview_role::text, '-', '_'), 'Overview only'),
    (analytics_role, 'analytics_' || replace(analytics_role::text, '-', '_'), 'Analytics only');
  insert into public.admin_capabilities(key, resource, action, label) values
    ('overview.read', 'overview', 'read', 'Overview'), ('analytics.read', 'analytics', 'read', 'Analytics')
    on conflict do nothing;
  insert into public.admin_role_grants(role_id, capability_key, scope) values
    (overview_role, 'overview.read', 'all'), (analytics_role, 'analytics.read', 'all');
  insert into public.admin_user_roles(user_id, role_id) values (owner_id, overview_role), (analyst, analytics_role);
  update public.club_terms set is_active = false;
  insert into public.club_terms(name, starts_on, ends_on, is_active)
    values ('Scale regression', current_date - 30, current_date + 30, true);

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  set local role authenticated;
  begin
    perform public.get_admin_analytics_totals();
    raise exception 'Nonadmin read analytics';
  exception when insufficient_privilege then null; end;
  begin
    perform public.get_admin_overview_totals();
    raise exception 'Nonadmin read overview';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  begin
    perform public.get_admin_analytics_totals();
    raise exception 'Overview permission exposed analytics';
  exception when insufficient_privilege then null; end;
  before_overview := public.get_admin_overview_totals();
  perform set_config('request.jwt.claim.sub', analyst::text, true);
  begin
    perform public.get_admin_overview_totals();
    raise exception 'Analytics permission exposed overview';
  exception when insufficient_privilege then null; end;
  before_analytics := public.get_admin_analytics_totals();
  reset role;
  if has_function_privilege('anon', 'public.get_admin_analytics_totals(timestamptz)', 'execute')
    or has_function_privilege('anon', 'public.get_admin_overview_totals()', 'execute')
    or has_function_privilege('authenticated', 'registration_private.admin_membership_counts(date,date)', 'execute') then
    raise exception 'Aggregate function privileges too broad';
  end if;

  select array_agg(gen_random_uuid()) into member_ids from generate_series(1, 1005);
  insert into auth.users(id, email) select id, id || '@example.test' from unnest(member_ids) id;
  insert into public.membership_zelle_payments(user_id, amount_cents, status, reviewed_at)
    select id, 2500, 'confirmed', now() from unnest(member_ids) id;
  insert into public.membership_entitlements(user_id, zelle_payment_id, starts_at, ends_at)
    select p.user_id, p.id, now() - interval '1 day', now() + interval '10 days'
    from public.membership_zelle_payments p where p.user_id = any(member_ids);
  insert into public.membership_account_restrictions(user_id, restriction, restricted_at)
    values (member_ids[1], 'suspended', now()), (member_ids[2], 'banned', now());
  update public.membership_entitlements set revoked_at = now(), revoked_reason = 'Regression' where user_id = member_ids[3];
  update public.membership_entitlements set starts_at = now() - interval '2 days', ends_at = now() - interval '1 day' where user_id = member_ids[4];
  update public.membership_entitlements set starts_at = now() + interval '1 day' where user_id = member_ids[5];
  -- Duplicates, blocked overrides, override-only access and historical first activation.
  insert into public.membership_access_overrides(user_id, starts_at, ends_at, reason, granted_by) values
    (member_ids[1], now() - interval '1 day', null, 'Regression', owner_id),
    (member_ids[6], now() - interval '100 days', null, 'Regression', owner_id),
    (member_ids[6], now() - interval '1 day', null, 'Regression', owner_id),
    (outsider, now() - interval '1 day', null, 'Regression', owner_id);
  insert into public.membership_zelle_payments(user_id, amount_cents)
    select id, 2500 from unnest(member_ids) id;
  insert into public.membership_applications(user_id, full_name, contact_email, age_status, guardian_consent, primary_interest)
    select id, 'Regression member', id || '@example.test', 'minor', 'pending', 'Hiking' from unnest(member_ids) id;
  insert into public.mailing_list_subscriptions(user_id, email, subscribed, consent_source, subscribed_at)
    select id, id || '@example.test', true, 'admin', now() from unnest(member_ids) id;
  insert into public.schedule_review_items(schedule_key, scheduled_date, reason)
    select id::text, current_date, 'Regression' from unnest(member_ids) id;
  insert into public.account_deletion_jobs(user_id, requested_by)
    select id, owner_id from unnest(member_ids) id;

  -- More than both the old overview's 100 trip limit and the API's 1000 row limit.
  -- Seed system-owned trips without impersonating an end-user creator.
  perform set_config('request.jwt.claim.sub', '', true);
  select array_agg(gen_random_uuid()) into trip_ids from generate_series(1, 1005);
  insert into public.trips(id, title, starts_at, ends_at, created_by, is_official, location_public, description_public, activity_tags)
    select id, 'Scale regression', now() + interval '2 days', now() + interval '3 days', null, false, 'Trailhead', 'Description', array['hiking', 'hiking', 'outdoor']
    from unnest(trip_ids) id;
  insert into public.club_hosts(id, public_name, club_title, is_active) values(h, 'Inactive regression host', 'Host', false);
  insert into public.trip_hosts(trip_id, host_id, credited_title) select id, h, 'Host' from unnest(trip_ids) id;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  overview := public.get_admin_overview_totals();
  perform set_config('request.jwt.claim.sub', analyst::text, true);
  analytics := public.get_admin_analytics_totals();
  if (analytics->>'accounts')::bigint - (before_analytics->>'accounts')::bigint <> 1005
    or (analytics->>'confirmedDues')::bigint - (before_analytics->>'confirmedDues')::bigint <> 1005
    or (analytics->>'confirmedRevenue')::bigint - (before_analytics->>'confirmedRevenue')::bigint <> 2512500 then
    raise exception 'Account/payment aggregates truncated: %', analytics;
  end if;
  foreach k in array array['applications', 'trips', 'publishedTrips', 'mailingOptIns'] loop
    if (analytics->>k)::bigint - (before_analytics->>k)::bigint <> 1005 then
      raise exception 'Analytics aggregate % truncated', k;
    end if;
  end loop;
  foreach k in array array['upcomingTrips', 'pendingPayments', 'pendingGuardians', 'pendingSchedule', 'pendingDeletions', 'inactiveHostTrips'] loop
    if (overview->>k)::bigint - (before_overview->>k)::bigint <> 1005 then
      raise exception 'Overview aggregate % truncated', k;
    end if;
  end loop;
  if (overview->>'incompleteTrips')::bigint <> (before_overview->>'incompleteTrips')::bigint then
    raise exception 'Complete trips classified as incomplete';
  end if;
  if (overview->>'activeMembers')::bigint - (before_overview->>'activeMembers')::bigint <> 1001
    or (overview->>'paidMembers')::bigint - (before_overview->>'paidMembers')::bigint <> 1000
    or (overview->>'newMembers')::bigint - (before_overview->>'newMembers')::bigint <> 1005
    or analytics->>'activeMembers' <> overview->>'activeMembers'
    or analytics->>'paidMembers' <> overview->>'paidMembers' then
    raise exception 'Membership classification incorrect: %', overview;
  end if;
  if (select (a->>'count')::bigint from jsonb_array_elements(analytics->'tripActivities') a where a->>'activity' = 'hiking')
    - coalesce((select (a->>'count')::bigint from jsonb_array_elements(before_analytics->'tripActivities') a where a->>'activity' = 'hiking'), 0) <> 1005 then
    raise exception 'Activity counts truncated or duplicate tags counted twice';
  end if;
  filtered := public.get_admin_analytics_totals(now() + interval '1 day');
  if (filtered->>'applications')::bigint <> 0 or (filtered->>'confirmedDues')::bigint <> 0
    or (filtered->>'confirmedRevenue')::bigint <> 0 or (filtered->>'mailingOptIns')::bigint <> 0
    or (filtered->>'trips')::bigint < 1005 then
    raise exception 'Analytics date range not respected';
  end if;
  reset role;
  -- Next trip selection excludes meetups and reads only the selected trip's hosts.
  perform set_config('request.jwt.claim.sub', '', true);
  insert into public.trips(id, title, starts_at, ends_at, is_official, activity_tags) values
    (meetup_id, 'Meetup', now() + interval '1 second', now() + interval '1 hour', true, array['Meetup']),
    (next_id, 'Next official trip', now() + interval '2 seconds', now() + interval '1 hour', true, array['hiking']);
  insert into public.trip_hosts(trip_id, host_id, credited_title) values(next_id, h, 'Host');
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  overview := public.get_admin_overview_totals();
  if overview->'nextTrip'->>'id' <> next_id::text
    or overview->'nextTrip'->'hosts' <> '["Inactive regression host"]'::jsonb
    or (overview->>'incompleteTrips')::bigint - (before_overview->>'incompleteTrips')::bigint <> 2 then
    raise exception 'Next trip or incomplete trip aggregation incorrect: %', overview;
  end if;
  reset role;
  -- Neither dashboard capability exposes leaders-only counts, tags or nextTrip.
  visible_overview := overview;
  perform set_config('request.jwt.claim.sub', analyst::text, true);
  set local role authenticated;
  visible_analytics := public.get_admin_analytics_totals();
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  insert into public.trips(id, title, visibility, starts_at, ends_at, is_official, activity_tags)
    values(hidden_id, 'Confidential leaders trip', 'leaders', now()+interval '1 second',
      now()+interval '1 hour', true, array['confidential-activity']);
  -- Assigned scope without an assignment must also stay closed.
  insert into public.admin_role_grants(role_id, capability_key, scope) values
    (overview_role, 'trips.read', 'assigned'), (analytics_role, 'trips.read', 'assigned');
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  overview := public.get_admin_overview_totals();
  perform set_config('request.jwt.claim.sub', analyst::text, true);
  analytics := public.get_admin_analytics_totals();
  reset role;
  if overview <> visible_overview or analytics <> visible_analytics then
    raise exception 'Unassigned dashboard role learned about a leaders trip';
  end if;
  insert into public.trip_leaders(trip_id,user_id) values(hidden_id,owner_id),(hidden_id,analyst);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  overview := public.get_admin_overview_totals();
  perform set_config('request.jwt.claim.sub', analyst::text, true);
  analytics := public.get_admin_analytics_totals();
  reset role;
  if (overview->>'upcomingTrips')::bigint <> (visible_overview->>'upcomingTrips')::bigint + 1
    or overview->'nextTrip'->>'id' <> hidden_id::text
    or (analytics->>'trips')::bigint <> (visible_analytics->>'trips')::bigint + 1
    or not exists(select 1 from jsonb_array_elements(analytics->'tripActivities') a
      where a->>'activity'='confidential-activity' and a->>'count'='1') then
    raise exception 'Assigned dashboard role lost authorized leaders aggregates';
  end if;
  delete from public.trip_leaders where trip_id=hidden_id;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  overview := public.get_admin_overview_totals();
  perform set_config('request.jwt.claim.sub', analyst::text, true);
  analytics := public.get_admin_analytics_totals();
  reset role;
  if overview <> visible_overview or analytics <> visible_analytics then
    raise exception 'Removed leaders retained aggregate access';
  end if;
  -- Restricted and unauthenticated identities cannot call the RPCs either.
  insert into public.membership_account_restrictions(user_id, restriction, restricted_at)
    values (analyst, 'suspended', now());
  perform set_config('request.jwt.claim.sub', analyst::text, true);
  set local role authenticated;
  begin perform public.get_admin_analytics_totals(); raise exception 'Restricted admin read analytics';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub', '', true);
  begin perform public.get_admin_analytics_totals(); raise exception 'Unauthenticated read analytics';
  exception when insufficient_privilege then null; end;
  begin perform public.get_admin_overview_totals(); raise exception 'Unauthenticated read overview';
  exception when insufficient_privilege then null; end;
  reset role;
  delete from public.membership_account_restrictions where user_id = analyst;
  perform set_config('request.jwt.claim.sub', analyst::text, true);
  -- Revoking the matching capability immediately denies each RPC.
  delete from public.admin_user_roles where user_id in (owner_id, analyst);
  set local role authenticated;
  begin perform public.get_admin_analytics_totals(); raise exception 'Removed admin read analytics';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  begin perform public.get_admin_overview_totals(); raise exception 'Removed admin read overview';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;
rollback;
