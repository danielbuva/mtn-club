


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."admin_permission_scope" AS ENUM (
    'assigned',
    'all'
);


ALTER TYPE "public"."admin_permission_scope" OWNER TO "postgres";


CREATE TYPE "public"."carpool_kind" AS ENUM (
    'offer',
    'need'
);


ALTER TYPE "public"."carpool_kind" OWNER TO "postgres";


CREATE TYPE "public"."club_role" AS ENUM (
    'regular',
    'staff',
    'leadership',
    'admin'
);


ALTER TYPE "public"."club_role" OWNER TO "postgres";


CREATE TYPE "public"."guardian_consent_status" AS ENUM (
    'not_required',
    'pending',
    'confirmed'
);


ALTER TYPE "public"."guardian_consent_status" OWNER TO "postgres";


CREATE TYPE "public"."membership_age_status" AS ENUM (
    'adult',
    'minor'
);


ALTER TYPE "public"."membership_age_status" OWNER TO "postgres";


CREATE TYPE "public"."membership_application_status" AS ENUM (
    'submitted',
    'confirmed',
    'withdrawn'
);


ALTER TYPE "public"."membership_application_status" OWNER TO "postgres";


CREATE TYPE "public"."membership_checkout_status" AS ENUM (
    'open',
    'completed',
    'expired',
    'canceled',
    'failed',
    'review_required'
);


ALTER TYPE "public"."membership_checkout_status" OWNER TO "postgres";


CREATE TYPE "public"."membership_payment_status" AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded',
    'partially_refunded',
    'disputed',
    'review_required'
);


ALTER TYPE "public"."membership_payment_status" OWNER TO "postgres";


CREATE TYPE "public"."membership_restriction" AS ENUM (
    'normal',
    'suspended',
    'banned'
);


ALTER TYPE "public"."membership_restriction" OWNER TO "postgres";


CREATE TYPE "public"."membership_review_status" AS ENUM (
    'pending',
    'approved',
    'refund_requested',
    'refunded',
    'dismissed'
);


ALTER TYPE "public"."membership_review_status" OWNER TO "postgres";


CREATE TYPE "public"."membership_status" AS ENUM (
    'active',
    'inactive',
    'pending',
    'past_due',
    'canceled',
    'suspended',
    'banned'
);


ALTER TYPE "public"."membership_status" OWNER TO "postgres";


CREATE TYPE "public"."trip_difficulty" AS ENUM (
    'beginner',
    'intermediate',
    'hard',
    'expert'
);


ALTER TYPE "public"."trip_difficulty" OWNER TO "postgres";


CREATE TYPE "public"."trip_lifecycle_status" AS ENUM (
    'published',
    'canceled',
    'archived'
);


ALTER TYPE "public"."trip_lifecycle_status" OWNER TO "postgres";


CREATE TYPE "public"."trip_rsvp_status" AS ENUM (
    'going',
    'maybe',
    'not_going',
    'invited',
    'removed',
    'waitlisted'
);


ALTER TYPE "public"."trip_rsvp_status" OWNER TO "postgres";


CREATE TYPE "public"."trip_visibility" AS ENUM (
    'public',
    'members',
    'minimal'
);


ALTER TYPE "public"."trip_visibility" OWNER TO "postgres";


CREATE TYPE "public"."webhook_processing_status" AS ENUM (
    'processing',
    'succeeded',
    'failed'
);


ALTER TYPE "public"."webhook_processing_status" OWNER TO "postgres";


CREATE TYPE "public"."zelle_payment_status" AS ENUM (
    'claimed',
    'confirmed',
    'rejected',
    'reversed'
);


ALTER TYPE "public"."zelle_payment_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activate_confirmed_zelle_membership"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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
  set status = 'confirmed', confirmed_at = now(),
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


ALTER FUNCTION "public"."activate_confirmed_zelle_membership"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_capability_scope"("p_uid" "uuid", "p_capability_key" "text") RETURNS "public"."admin_permission_scope"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."admin_capability_scope"("p_uid" "uuid", "p_capability_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_accounts"("p_actor_user_id" "uuid", "p_search" "text" DEFAULT NULL::"text", "p_membership_state" "text" DEFAULT NULL::"text", "p_role_name" "text" DEFAULT NULL::"text", "p_restriction" "text" DEFAULT NULL::"text", "p_mailing" "text" DEFAULT NULL::"text", "p_needs_attention" boolean DEFAULT false, "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 25) RETURNS TABLE("user_id" "uuid", "email" "text", "display_name" "text", "membership_state" "text", "membership_role" "text", "leadership_roles" "text"[], "restriction" "text", "mailing_subscribed" boolean, "deletion_status" "text", "deletion_error" "text", "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."admin_list_accounts"("p_actor_user_id" "uuid", "p_search" "text", "p_membership_state" "text", "p_role_name" "text", "p_restriction" "text", "p_mailing" "text", "p_needs_attention" boolean, "p_page" integer, "p_page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_membership_review_item"("p_review_id" "uuid", "p_reviewer_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_review public.membership_review_items%rowtype;
  v_payment public.membership_payments%rowtype;
  v_restriction public.membership_restriction := 'normal';
  v_latest_end timestamptz;
  v_start timestamptz;
  v_end timestamptz;
  v_entitlement_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into v_review
  from public.membership_review_items
  where id = p_review_id
  for update;
  if not found or v_review.status <> 'pending' then
    raise exception 'pending review item not found';
  end if;

  select * into v_payment
  from public.membership_payments
  where id = v_review.payment_id
  for update;
  if not found or v_payment.status <> 'review_required' then
    raise exception 'reviewable payment not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_payment.user_id::text, 0));

  select restriction into v_restriction
  from public.membership_account_restrictions
  where user_id = v_payment.user_id
  for update;
  if coalesce(v_restriction, 'normal') <> 'normal' then
    raise exception 'restricted account cannot receive an entitlement';
  end if;

  if exists (
    select 1
    from public.membership_entitlements
    where payment_id = v_payment.id
  ) then
    raise exception 'payment already has an entitlement';
  end if;

  select max(ends_at) into v_latest_end
  from public.membership_entitlements
  where user_id = v_payment.user_id
    and revoked_at is null;

  v_start := greatest(
    coalesce(v_payment.paid_at, v_payment.created_at),
    coalesce(v_latest_end, coalesce(v_payment.paid_at, v_payment.created_at))
  );
  v_end := (
    (v_start at time zone 'America/Los_Angeles') + interval '1 year'
  ) at time zone 'America/Los_Angeles';

  insert into public.membership_entitlements (
    user_id,
    payment_id,
    starts_at,
    ends_at
  )
  values (v_payment.user_id, v_payment.id, v_start, v_end)
  returning id into v_entitlement_id;

  update public.membership_payments
  set status = 'paid', updated_at = now()
  where id = v_payment.id;
  update public.membership_checkout_attempts
  set status = 'completed', checkout_url = null, updated_at = now()
  where id = v_payment.checkout_attempt_id;
  update public.membership_review_items
  set
    status = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    updated_at = now()
  where id = p_review_id;

  return v_entitlement_id;
end;
$$;


ALTER FUNCTION "public"."approve_membership_review_item"("p_review_id" "uuid", "p_reviewer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_authenticated_content_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."audit_authenticated_content_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_trip"("p_trip_id" "uuid", "p_uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."can_manage_trip"("p_trip_id" "uuid", "p_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_trip"("p_trip_id" "uuid", "p_uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.trips t
    where t.id = p_trip_id
      and (
        t.visibility in ('public','minimal')
        or public.is_staff_or_admin(p_uid)
        or public.is_active_member(p_uid)
        or exists (select 1 from public.trip_leaders tl where tl.trip_id = t.id and tl.user_id = p_uid)
        or exists (
          select 1 from public.trip_rsvps r
          where r.trip_id = t.id and r.user_id = p_uid and r.status <> 'removed'
        )
      )
  );
$$;


ALTER FUNCTION "public"."can_view_trip"("p_trip_id" "uuid", "p_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_trip_private"("p_trip_id" "uuid", "p_uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select
    public.is_staff_or_admin(p_uid)
    or public.is_active_member(p_uid)
    or exists (select 1 from public.trip_leaders tl where tl.trip_id = p_trip_id and tl.user_id = p_uid)
    or exists (
      select 1 from public.trip_rsvps r
      where r.trip_id = p_trip_id
        and r.user_id = p_uid
        and r.status in ('invited','going','maybe','waitlisted')
    );
$$;


ALTER FUNCTION "public"."can_view_trip_private"("p_trip_id" "uuid", "p_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_trip_readonly"("p_trip_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."can_view_trip_readonly"("p_trip_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_zelle_membership_payment"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."claim_zelle_membership_payment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_membership_guardian_consent"("p_user_id" "uuid", "p_reviewer_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."confirm_membership_guardian_consent"("p_user_id" "uuid", "p_reviewer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_zelle_membership_application"("p_user_id" "uuid", "p_reviewer_id" "uuid") RETURNS timestamp with time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."confirm_zelle_membership_application"("p_user_id" "uuid", "p_reviewer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_unofficial_trip_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."enforce_unofficial_trip_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_membership_access"() RETURNS TABLE("restriction" "text", "access_active" boolean, "provisional_access" boolean, "expires_at" timestamp with time zone, "override_active" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."get_my_membership_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_membership_application"() RETURNS TABLE("full_name" "text", "contact_email" "text", "age_status" "text", "guardian_consent" "text", "dues_payment_claimed" boolean, "primary_interest" "text", "experience_notes" "text", "application_status" "text", "confirmed_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."get_my_membership_application"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_membership_payment_history"() RETURNS TABLE("payment_date" timestamp with time zone, "amount_cents" integer, "currency" "text", "public_status" "text", "granted_starts_at" timestamp with time zone, "granted_ends_at" timestamp with time zone, "receipt_url" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."get_my_membership_payment_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_complimentary_membership_access"("p_actor_user_id" "uuid", "p_user_id" "uuid", "p_days" integer, "p_reason" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."grant_complimentary_membership_access"("p_actor_user_id" "uuid", "p_user_id" "uuid", "p_days" integer, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_admin_capability"("p_uid" "uuid", "p_capability_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
  select public.admin_capability_scope(p_uid, p_capability_key) is not null;
$$;


ALTER FUNCTION "public"."has_admin_capability"("p_uid" "uuid", "p_capability_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_membership_access"("p_uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."has_membership_access"("p_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_provisional_membership_access"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."has_provisional_membership_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_trip_admin_capability"("p_uid" "uuid", "p_capability_key" "text", "p_trip_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
  select case public.admin_capability_scope(p_uid, p_capability_key)
    when 'all' then true
    when 'assigned' then exists (
      select 1 from public.trip_leaders leaders
      where leaders.trip_id = p_trip_id and leaders.user_id = p_uid
    )
    else false
  end;
$$;


ALTER FUNCTION "public"."has_trip_admin_capability"("p_uid" "uuid", "p_capability_key" "text", "p_trip_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_active_member"("p_uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
  select public.has_membership_access(p_uid);
$$;


ALTER FUNCTION "public"."is_active_member"("p_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_banned"("p_uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = p_uid
      and m.status = 'banned'
  );
$$;


ALTER FUNCTION "public"."is_banned"("p_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff_or_admin"("p_uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
  select public.has_admin_capability(p_uid, 'overview.read');
$$;


ALTER FUNCTION "public"."is_staff_or_admin"("p_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"("p_uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."is_super_admin"("p_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_membership_checkout_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_attempt_id" "uuid", "p_user_id" "uuid", "p_checkout_session_id" "text", "p_payment_intent_id" "text", "p_customer_id" "text", "p_amount_cents" integer, "p_currency" "text", "p_paid_at" timestamp with time zone, "p_receipt_url" "text") RETURNS TABLE("payment_id" "uuid", "entitlement_id" "uuid", "review_required" boolean, "duplicate_event" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_attempt public.membership_checkout_attempts%rowtype;
  v_event_status public.webhook_processing_status;
  v_restriction public.membership_restriction := 'normal';
  v_payment_id uuid;
  v_entitlement_id uuid;
  v_latest_end timestamptz;
  v_grant_start timestamptz;
  v_grant_end timestamptz;
  v_duplicate_recent boolean;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select status into v_event_status
  from public.stripe_webhook_events
  where stripe_event_id = p_event_id
  for update;

  if found and v_event_status = 'succeeded' then
    select payments.id, entitlements.id
    into v_payment_id, v_entitlement_id
    from public.membership_payments payments
    left join public.membership_entitlements entitlements
      on entitlements.payment_id = payments.id
    where payments.stripe_checkout_session_id = p_checkout_session_id;

    return query select v_payment_id, v_entitlement_id, false, true;
    return;
  elsif found then
    update public.stripe_webhook_events
    set
      status = 'processing',
      attempt_count = attempt_count + 1,
      last_error = null,
      processed_at = null,
      updated_at = now()
    where stripe_event_id = p_event_id;
  else
    insert into public.stripe_webhook_events (
      stripe_event_id,
      event_type,
      test_mode,
      status
    )
    values (p_event_id, p_event_type, p_test_mode, 'processing');
  end if;

  select * into v_attempt
  from public.membership_checkout_attempts
  where id = p_attempt_id
  for update;

  if not found
    or v_attempt.user_id <> p_user_id
    or v_attempt.stripe_checkout_session_id <> p_checkout_session_id
    or v_attempt.test_mode <> p_test_mode
    or v_attempt.amount_cents <> p_amount_cents
    or v_attempt.currency <> lower(p_currency)
  then
    raise exception 'checkout attempt validation failed';
  end if;

  select restriction into v_restriction
  from public.membership_account_restrictions
  where user_id = p_user_id
  for update;
  v_restriction := coalesce(v_restriction, 'normal');

  select payments.id, entitlements.id
  into v_payment_id, v_entitlement_id
  from public.membership_payments payments
  left join public.membership_entitlements entitlements
    on entitlements.payment_id = payments.id
  where payments.stripe_checkout_session_id = p_checkout_session_id;

  if found then
    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;
    return query select v_payment_id, v_entitlement_id, false, true;
    return;
  end if;

  select exists (
    select 1
    from public.membership_payments
    where user_id = p_user_id
      and status = 'paid'
      and paid_at >= p_paid_at - interval '24 hours'
      and paid_at <= p_paid_at + interval '24 hours'
  ) into v_duplicate_recent;

  if v_restriction <> 'normal' or v_duplicate_recent then
    insert into public.membership_payments (
      user_id,
      checkout_attempt_id,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      stripe_customer_id,
      amount_cents,
      currency,
      status,
      test_mode,
      paid_at,
      receipt_url
    )
    values (
      p_user_id,
      p_attempt_id,
      p_checkout_session_id,
      p_payment_intent_id,
      p_customer_id,
      p_amount_cents,
      lower(p_currency),
      'review_required',
      p_test_mode,
      p_paid_at,
      p_receipt_url
    )
    returning id into v_payment_id;

    update public.membership_checkout_attempts
    set status = 'review_required', updated_at = now()
    where id = p_attempt_id;

    insert into public.membership_review_items (
      user_id,
      payment_id,
      reason_code,
      reason_detail
    )
    values (
      p_user_id,
      v_payment_id,
      case
        when v_restriction <> 'normal' then 'restricted_account_payment'
        else 'duplicate_payment_24h'
      end,
      case
        when v_restriction <> 'normal'
          then 'Payment completed while the account was suspended or banned. No entitlement was granted.'
        else 'A second distinct payment completed within 24 hours. Officer approval or refund is required.'
      end
    );

    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;

    return query select v_payment_id, null::uuid, true, false;
    return;
  end if;

  insert into public.membership_payments (
    user_id,
    checkout_attempt_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    stripe_customer_id,
    amount_cents,
    currency,
    status,
    test_mode,
    paid_at,
    receipt_url
  )
  values (
    p_user_id,
    p_attempt_id,
    p_checkout_session_id,
    p_payment_intent_id,
    p_customer_id,
    p_amount_cents,
    lower(p_currency),
    'paid',
    p_test_mode,
    p_paid_at,
    p_receipt_url
  )
  returning id into v_payment_id;

  select max(ends_at) into v_latest_end
  from public.membership_entitlements
  where user_id = p_user_id
    and revoked_at is null;

  v_grant_start := greatest(p_paid_at, coalesce(v_latest_end, p_paid_at));
  v_grant_end := (
    (v_grant_start at time zone 'America/Los_Angeles') + interval '1 year'
  ) at time zone 'America/Los_Angeles';

  insert into public.membership_entitlements (
    user_id,
    payment_id,
    starts_at,
    ends_at
  )
  values (p_user_id, v_payment_id, v_grant_start, v_grant_end)
  returning id into v_entitlement_id;

  update public.membership_checkout_attempts
  set status = 'completed', checkout_url = null, updated_at = now()
  where id = p_attempt_id;

  update public.stripe_webhook_events
  set status = 'succeeded', processed_at = now(), updated_at = now()
  where stripe_event_id = p_event_id;

  return query select v_payment_id, v_entitlement_id, false, false;
end;
$$;


ALTER FUNCTION "public"."process_membership_checkout_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_attempt_id" "uuid", "p_user_id" "uuid", "p_checkout_session_id" "text", "p_payment_intent_id" "text", "p_customer_id" "text", "p_amount_cents" integer, "p_currency" "text", "p_paid_at" timestamp with time zone, "p_receipt_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_membership_dispute_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_payment_intent_id" "text", "p_dispute_recorded_at" timestamp with time zone) RETURNS TABLE("review_required" boolean, "access_suspended" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_payment public.membership_payments%rowtype;
  v_entitlement public.membership_entitlements%rowtype;
  v_currently_provides_access boolean := false;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into v_payment
  from public.membership_payments
  where stripe_payment_intent_id = p_payment_intent_id
  for update;
  if not found then
    raise exception 'membership payment not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_payment.user_id::text, 0));

  insert into public.stripe_webhook_events (
    stripe_event_id,
    event_type,
    test_mode,
    status
  )
  values (p_event_id, p_event_type, p_test_mode, 'processing')
  on conflict (stripe_event_id) do update
  set
    attempt_count = stripe_webhook_events.attempt_count + 1,
    status = case
      when stripe_webhook_events.status = 'succeeded'
        then stripe_webhook_events.status
      else 'processing'
    end,
    last_error = null,
    updated_at = now();

  if (
    select status = 'succeeded'
    from public.stripe_webhook_events
    where stripe_event_id = p_event_id
  ) then
    return query select false, false;
    return;
  end if;

  select * into v_entitlement
  from public.membership_entitlements
  where payment_id = v_payment.id
  for update;

  v_currently_provides_access :=
    v_entitlement.id is not null
    and v_entitlement.revoked_at is null
    and v_entitlement.starts_at <= p_dispute_recorded_at
    and v_entitlement.ends_at > p_dispute_recorded_at;

  update public.membership_payments
  set
    status = case
      when v_currently_provides_access
        then 'disputed'::public.membership_payment_status
      else 'review_required'::public.membership_payment_status
    end,
    updated_at = now()
  where id = v_payment.id;

  if v_currently_provides_access then
    insert into public.membership_account_restrictions (
      user_id,
      restriction,
      internal_reason,
      restricted_at
    )
    values (
      v_payment.user_id,
      'suspended',
      'Automatic suspension: the payment currently providing access is disputed.',
      p_dispute_recorded_at
    )
    on conflict (user_id) do update
    set
      restriction = 'suspended',
      internal_reason = excluded.internal_reason,
      restricted_at = excluded.restricted_at,
      updated_at = now();
  end if;

  insert into public.membership_review_items (
    user_id,
    payment_id,
    reason_code,
    reason_detail
  )
  values (
    v_payment.user_id,
    v_payment.id,
    case
      when v_currently_provides_access then 'current_entitlement_dispute'
      else 'future_or_inactive_entitlement_dispute'
    end,
    case
      when v_currently_provides_access
        then 'Access was suspended because this disputed payment currently provides access.'
      else 'The disputed grant is not currently providing access; no automatic suspension was applied.'
    end
  );

  update public.stripe_webhook_events
  set status = 'succeeded', processed_at = now(), updated_at = now()
  where stripe_event_id = p_event_id;
  return query select true, v_currently_provides_access;
end;
$$;


ALTER FUNCTION "public"."process_membership_dispute_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_payment_intent_id" "text", "p_dispute_recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_membership_refund_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_payment_intent_id" "text", "p_amount_refunded" integer, "p_refund_recorded_at" timestamp with time zone) RETURNS TABLE("review_required" boolean, "entitlement_revoked" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_payment public.membership_payments%rowtype;
  v_entitlement public.membership_entitlements%rowtype;
  v_has_later_grant boolean := false;
  v_is_full_refund boolean;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into v_payment
  from public.membership_payments
  where stripe_payment_intent_id = p_payment_intent_id
  for update;
  if not found then
    raise exception 'membership payment not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_payment.user_id::text, 0));

  insert into public.stripe_webhook_events (
    stripe_event_id,
    event_type,
    test_mode,
    status
  )
  values (p_event_id, p_event_type, p_test_mode, 'processing')
  on conflict (stripe_event_id) do update
  set
    status = case
      when stripe_webhook_events.status = 'succeeded'
        then stripe_webhook_events.status
      else 'processing'
    end,
    attempt_count = stripe_webhook_events.attempt_count + 1,
    last_error = null,
    updated_at = now();

  if (
    select status = 'succeeded'
    from public.stripe_webhook_events
    where stripe_event_id = p_event_id
  ) then
    return query select false, false;
    return;
  end if;

  select * into v_entitlement
  from public.membership_entitlements
  where payment_id = v_payment.id
  for update;

  v_is_full_refund := p_amount_refunded >= v_payment.amount_cents;

  if not v_is_full_refund then
    update public.membership_payments
    set
      status = 'partially_refunded',
      updated_at = now()
    where id = v_payment.id;

    insert into public.membership_review_items (
      user_id,
      payment_id,
      reason_code,
      reason_detail
    )
    values (
      v_payment.user_id,
      v_payment.id,
      'partial_refund',
      'Refund requires officer review before changing access.'
    );

    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;
    return query select true, false;
    return;
  end if;

  if v_entitlement.id is null then
    update public.membership_payments
    set status = 'refunded', updated_at = now()
    where id = v_payment.id;
    update public.membership_review_items
    set status = 'refunded', updated_at = now()
    where payment_id = v_payment.id
      and status = 'refund_requested';
    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;
    return query select exists (
      select 1
      from public.membership_review_items
      where payment_id = v_payment.id
        and status = 'pending'
    ), false;
    return;
  end if;

  select exists (
    select 1
    from public.membership_entitlements later
    where later.user_id = v_payment.user_id
      and later.id <> v_entitlement.id
      and later.revoked_at is null
      and later.starts_at >= v_entitlement.ends_at
  ) into v_has_later_grant;

  if v_has_later_grant then
    update public.membership_payments
    set status = 'review_required', updated_at = now()
    where id = v_payment.id;
    insert into public.membership_review_items (
      user_id,
      payment_id,
      reason_code,
      reason_detail
    )
    values (
      v_payment.user_id,
      v_payment.id,
      'stacked_renewal_refund',
      'A later entitlement depends on this refunded term. Officer review is required.'
    );
    update public.stripe_webhook_events
    set status = 'succeeded', processed_at = now(), updated_at = now()
    where stripe_event_id = p_event_id;
    return query select true, false;
    return;
  end if;

  update public.membership_payments
  set status = 'refunded', updated_at = now()
  where id = v_payment.id;
  update public.membership_entitlements
  set
    revoked_at = p_refund_recorded_at,
    revoked_reason = 'Full Stripe refund of the latest independent grant.'
  where id = v_entitlement.id
    and revoked_at is null;
  update public.stripe_webhook_events
  set status = 'succeeded', processed_at = now(), updated_at = now()
  where stripe_event_id = p_event_id;
  return query select false, true;
end;
$$;


ALTER FUNCTION "public"."process_membership_refund_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_payment_intent_id" "text", "p_amount_refunded" integer, "p_refund_recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_admin_activity"("p_actor_user_id" "uuid", "p_subject_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_summary" "text", "p_before_data" "jsonb" DEFAULT NULL::"jsonb", "p_after_data" "jsonb" DEFAULT NULL::"jsonb", "p_result" "text" DEFAULT 'succeeded'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."record_admin_activity"("p_actor_user_id" "uuid", "p_subject_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_summary" "text", "p_before_data" "jsonb", "p_after_data" "jsonb", "p_result" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reverse_zelle_membership_payment"("p_payment_id" "uuid", "p_reviewer_id" "uuid", "p_reason" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."reverse_zelle_membership_payment"("p_payment_id" "uuid", "p_reviewer_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."review_zelle_membership_payment"("p_payment_id" "uuid", "p_reviewer_id" "uuid", "p_decision" "text", "p_note" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."review_zelle_membership_payment"("p_payment_id" "uuid", "p_reviewer_id" "uuid", "p_decision" "text", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_admin_account_restriction"("p_actor_user_id" "uuid", "p_user_id" "uuid", "p_restriction" "public"."membership_restriction", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."set_admin_account_restriction"("p_actor_user_id" "uuid", "p_user_id" "uuid", "p_restriction" "public"."membership_restriction", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_mailing_list_subscription"("p_email" "text", "p_subscribed" boolean, "p_source" "text" DEFAULT 'account_settings'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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
    case when p_subscribed
      then 'mailing_list_subscribed'
      else 'mailing_list_unsubscribed' end,
    'mailing_list_subscription', auth.uid()::text,
    case when p_subscribed
      then 'Member joined the mailing list.'
      else 'Member left the mailing list.' end
  );
end;
$$;


ALTER FUNCTION "public"."set_mailing_list_subscription"("p_email" "text", "p_subscribed" boolean, "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_super_admin_assignment"("p_actor_user_id" "uuid", "p_target_user_id" "uuid", "p_assign" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."set_super_admin_assignment"("p_actor_user_id" "uuid", "p_target_user_id" "uuid", "p_assign" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_zelle_membership_payment_status"("p_user_id" "uuid", "p_reviewer_id" "uuid", "p_desired_status" "text", "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
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
    from public.membership_applications applications
    where applications.user_id = p_user_id
  ) then
    raise exception 'membership application not found';
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


ALTER FUNCTION "public"."set_zelle_membership_payment_status"("p_user_id" "uuid", "p_reviewer_id" "uuid", "p_desired_status" "text", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."try_uuid"("p" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if p is null or p = '' then return null; end if;
  return p::uuid;
exception when others then
  return null;
end;
$$;


ALTER FUNCTION "public"."try_uuid"("p" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."account_deletion_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "account_deletion_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'auth_deleted'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."account_deletion_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid",
    "subject_user_id" "uuid",
    "action" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "text",
    "summary" "text" NOT NULL,
    "before_data" "jsonb",
    "after_data" "jsonb",
    "result" "text" DEFAULT 'succeeded'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_activity_events_result_check" CHECK (("result" = ANY (ARRAY['succeeded'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."admin_activity_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_capabilities" (
    "key" "text" NOT NULL,
    "resource" "text" NOT NULL,
    "action" "text" NOT NULL,
    "label" "text" NOT NULL,
    "supports_assigned_scope" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "phase" smallint DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_capabilities_key_check" CHECK (("key" ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'::"text")),
    CONSTRAINT "admin_capabilities_phase_check" CHECK (("phase" = ANY (ARRAY[1, 2])))
);


ALTER TABLE "public"."admin_capabilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_role_grants" (
    "role_id" "uuid" NOT NULL,
    "capability_key" "text" NOT NULL,
    "scope" "public"."admin_permission_scope" DEFAULT 'all'::"public"."admin_permission_scope" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_role_grants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_super_admin" boolean DEFAULT false NOT NULL,
    "is_system" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_roles_key_check" CHECK (("key" ~ '^[a-z][a-z0-9_]*$'::"text")),
    CONSTRAINT "admin_roles_name_check" CHECK ((("length"(TRIM(BOTH FROM "name")) >= 2) AND ("length"(TRIM(BOTH FROM "name")) <= 80)))
);


ALTER TABLE "public"."admin_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_admin_settings" (
    "id" boolean DEFAULT true NOT NULL,
    "dues_amount_cents" integer DEFAULT 2500 NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "time_zone" "text" DEFAULT 'America/Los_Angeles'::"text" NOT NULL,
    "non_admin_upcoming_trip_limit" integer DEFAULT 2 NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "club_admin_settings_currency_check" CHECK (("length"("currency") = 3)),
    CONSTRAINT "club_admin_settings_dues_amount_cents_check" CHECK (("dues_amount_cents" > 0)),
    CONSTRAINT "club_admin_settings_id_check" CHECK ("id"),
    CONSTRAINT "club_admin_settings_non_admin_upcoming_trip_limit_check" CHECK ((("non_admin_upcoming_trip_limit" >= 0) AND ("non_admin_upcoming_trip_limit" <= 20)))
);


ALTER TABLE "public"."club_admin_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_hosts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "public_name" "text" NOT NULL,
    "club_title" "text" NOT NULL,
    "linked_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role_key" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "club_hosts_club_title_check" CHECK (("length"(TRIM(BOTH FROM "club_title")) > 0)),
    CONSTRAINT "club_hosts_public_name_check" CHECK (("length"(TRIM(BOTH FROM "public_name")) > 0))
);


ALTER TABLE "public"."club_hosts" OWNER TO "postgres";


COMMENT ON TABLE "public"."club_hosts" IS 'Public event credits only. Rows do not grant trip-management permissions.';



CREATE TABLE IF NOT EXISTS "public"."club_terms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "starts_on" "date" NOT NULL,
    "ends_on" "date" NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "club_terms_check" CHECK (("ends_on" >= "starts_on"))
);


ALTER TABLE "public"."club_terms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gallery_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "storage_path" "text" NOT NULL,
    "title" "text" NOT NULL,
    "alt_text" "text" NOT NULL,
    "caption" "text",
    "trip_id" "uuid",
    "taken_on" "date",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "gallery_photos_alt_text_check" CHECK (("length"(TRIM(BOTH FROM "alt_text")) > 0)),
    CONSTRAINT "gallery_photos_sort_order_check" CHECK (("sort_order" >= 0)),
    CONSTRAINT "gallery_photos_storage_path_check" CHECK (("length"(TRIM(BOTH FROM "storage_path")) > 0)),
    CONSTRAINT "gallery_photos_title_check" CHECK (("length"(TRIM(BOTH FROM "title")) > 0))
);


ALTER TABLE "public"."gallery_photos" OWNER TO "postgres";


COMMENT ON COLUMN "public"."gallery_photos"."alt_text" IS 'Required description used as the public image alternative text.';



COMMENT ON COLUMN "public"."gallery_photos"."is_published" IS 'Only published metadata is visible to non-staff visitors.';



CREATE TABLE IF NOT EXISTS "public"."mailing_list_consent_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "subscribed" boolean NOT NULL,
    "consent_source" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mailing_list_consent_events_consent_source_check" CHECK (("consent_source" = ANY (ARRAY['membership_signup'::"text", 'account_settings'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."mailing_list_consent_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mailing_list_subscriptions" (
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "subscribed" boolean DEFAULT false NOT NULL,
    "consent_source" "text" NOT NULL,
    "subscribed_at" timestamp with time zone,
    "unsubscribed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mailing_list_subscriptions_check" CHECK ((("subscribed" AND ("subscribed_at" IS NOT NULL) AND ("unsubscribed_at" IS NULL)) OR ((NOT "subscribed") AND ("unsubscribed_at" IS NOT NULL)))),
    CONSTRAINT "mailing_list_subscriptions_consent_source_check" CHECK (("consent_source" = ANY (ARRAY['membership_signup'::"text", 'account_settings'::"text", 'admin'::"text"]))),
    CONSTRAINT "mailing_list_subscriptions_email_check" CHECK (((("length"(TRIM(BOTH FROM "email")) >= 3) AND ("length"(TRIM(BOTH FROM "email")) <= 320)) AND (POSITION(('@'::"text") IN ("email")) > 1)))
);


ALTER TABLE "public"."mailing_list_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."membership_access_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "starts_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ends_at" timestamp with time zone,
    "reason" "text" NOT NULL,
    "granted_by" "uuid" NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "revoke_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "membership_access_overrides_check" CHECK ((("ends_at" IS NULL) OR ("ends_at" > "starts_at"))),
    CONSTRAINT "membership_access_overrides_check1" CHECK (((("revoked_at" IS NULL) AND ("revoked_by" IS NULL) AND ("revoke_reason" IS NULL)) OR (("revoked_at" IS NOT NULL) AND ("revoked_by" IS NOT NULL) AND ("revoke_reason" IS NOT NULL)))),
    CONSTRAINT "membership_access_overrides_reason_check" CHECK (("length"(TRIM(BOTH FROM "reason")) > 0))
);


ALTER TABLE "public"."membership_access_overrides" OWNER TO "postgres";


COMMENT ON TABLE "public"."membership_access_overrides" IS 'Explicit access independent of club role. Role alone does not grant paid access.';



CREATE TABLE IF NOT EXISTS "public"."membership_account_restrictions" (
    "user_id" "uuid" NOT NULL,
    "restriction" "public"."membership_restriction" DEFAULT 'normal'::"public"."membership_restriction" NOT NULL,
    "internal_reason" "text",
    "restricted_at" timestamp with time zone,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "membership_account_restrictions_check" CHECK (((("restriction" = 'normal'::"public"."membership_restriction") AND ("restricted_at" IS NULL)) OR (("restriction" <> 'normal'::"public"."membership_restriction") AND ("restricted_at" IS NOT NULL))))
);


ALTER TABLE "public"."membership_account_restrictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."membership_applications" (
    "user_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "contact_email" "text" NOT NULL,
    "age_status" "public"."membership_age_status" NOT NULL,
    "guardian_consent" "public"."guardian_consent_status" NOT NULL,
    "dues_payment_claimed" boolean DEFAULT false NOT NULL,
    "dues_claimed_at" timestamp with time zone,
    "primary_interest" "text" NOT NULL,
    "experience_notes" "text",
    "status" "public"."membership_application_status" DEFAULT 'submitted'::"public"."membership_application_status" NOT NULL,
    "confirmed_at" timestamp with time zone,
    "confirmed_by" "uuid",
    "membership_access_override_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "membership_applications_check" CHECK ((("dues_payment_claimed" AND ("dues_claimed_at" IS NOT NULL)) OR ((NOT "dues_payment_claimed") AND ("dues_claimed_at" IS NULL)))),
    CONSTRAINT "membership_applications_check1" CHECK (((("age_status" = 'adult'::"public"."membership_age_status") AND ("guardian_consent" = 'not_required'::"public"."guardian_consent_status")) OR (("age_status" = 'minor'::"public"."membership_age_status") AND ("guardian_consent" = ANY (ARRAY['pending'::"public"."guardian_consent_status", 'confirmed'::"public"."guardian_consent_status"]))))),
    CONSTRAINT "membership_applications_confirmation_state" CHECK (((("status" = 'confirmed'::"public"."membership_application_status") AND "dues_payment_claimed" AND ("guardian_consent" = ANY (ARRAY['not_required'::"public"."guardian_consent_status", 'confirmed'::"public"."guardian_consent_status"])) AND ("confirmed_at" IS NOT NULL) AND ("confirmed_by" IS NOT NULL)) OR (("status" <> 'confirmed'::"public"."membership_application_status") AND ("confirmed_at" IS NULL) AND ("confirmed_by" IS NULL) AND ("membership_access_override_id" IS NULL)))),
    CONSTRAINT "membership_applications_contact_email_check" CHECK (((("length"(TRIM(BOTH FROM "contact_email")) >= 3) AND ("length"(TRIM(BOTH FROM "contact_email")) <= 320)) AND (POSITION(('@'::"text") IN ("contact_email")) > 1))),
    CONSTRAINT "membership_applications_experience_notes_check" CHECK ((("experience_notes" IS NULL) OR ("length"("experience_notes") <= 2000))),
    CONSTRAINT "membership_applications_full_name_check" CHECK ((("length"(TRIM(BOTH FROM "full_name")) >= 2) AND ("length"(TRIM(BOTH FROM "full_name")) <= 120))),
    CONSTRAINT "membership_applications_primary_interest_check" CHECK ((("length"(TRIM(BOTH FROM "primary_interest")) >= 2) AND ("length"(TRIM(BOTH FROM "primary_interest")) <= 120)))
);


ALTER TABLE "public"."membership_applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."membership_applications" IS 'Account-linked Zelle membership applications. A payment claim grants provisional read access only; officer confirmation creates the full 12-month access grant.';



CREATE TABLE IF NOT EXISTS "public"."membership_checkout_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."membership_checkout_status" DEFAULT 'open'::"public"."membership_checkout_status" NOT NULL,
    "stripe_checkout_session_id" "text",
    "checkout_url" "text",
    "stripe_price_id" "text" NOT NULL,
    "amount_cents" integer DEFAULT 2500 NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "test_mode" boolean NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "membership_checkout_attempts_amount_cents_check" CHECK (("amount_cents" = 2500)),
    CONSTRAINT "membership_checkout_attempts_currency_check" CHECK (("currency" = 'usd'::"text"))
);


ALTER TABLE "public"."membership_checkout_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."membership_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_id" "uuid",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoked_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "zelle_payment_id" "uuid",
    CONSTRAINT "membership_entitlements_check" CHECK (("ends_at" > "starts_at")),
    CONSTRAINT "membership_entitlements_check1" CHECK (((("revoked_at" IS NULL) AND ("revoked_reason" IS NULL)) OR (("revoked_at" IS NOT NULL) AND ("revoked_reason" IS NOT NULL)))),
    CONSTRAINT "membership_entitlements_exactly_one_payment" CHECK (("num_nonnulls"("payment_id", "zelle_payment_id") = 1))
);


ALTER TABLE "public"."membership_entitlements" OWNER TO "postgres";


COMMENT ON TABLE "public"."membership_entitlements" IS 'Immutable paid access grants. Revocation is recorded rather than deleting a grant.';



CREATE TABLE IF NOT EXISTS "public"."membership_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "checkout_attempt_id" "uuid" NOT NULL,
    "stripe_checkout_session_id" "text" NOT NULL,
    "stripe_payment_intent_id" "text",
    "stripe_customer_id" "text",
    "amount_cents" integer NOT NULL,
    "currency" "text" NOT NULL,
    "status" "public"."membership_payment_status" NOT NULL,
    "test_mode" boolean NOT NULL,
    "paid_at" timestamp with time zone,
    "receipt_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "membership_payments_amount_cents_check" CHECK (("amount_cents" > 0)),
    CONSTRAINT "membership_payments_currency_check" CHECK (("length"("currency") = 3))
);


ALTER TABLE "public"."membership_payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."membership_payments" IS 'Service-only Stripe reconciliation data; clients use the safe payment-history RPC.';



CREATE TABLE IF NOT EXISTS "public"."membership_review_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_id" "uuid",
    "reason_code" "text" NOT NULL,
    "reason_detail" "text" NOT NULL,
    "status" "public"."membership_review_status" DEFAULT 'pending'::"public"."membership_review_status" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "membership_review_items_check" CHECK (((("status" = 'pending'::"public"."membership_review_status") AND ("reviewed_at" IS NULL) AND ("reviewed_by" IS NULL)) OR (("status" <> 'pending'::"public"."membership_review_status") AND ("reviewed_at" IS NOT NULL) AND ("reviewed_by" IS NOT NULL))))
);


ALTER TABLE "public"."membership_review_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."membership_zelle_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "status" "public"."zelle_payment_status" DEFAULT 'claimed'::"public"."zelle_payment_status" NOT NULL,
    "claim_source" "text" DEFAULT 'membership_page'::"text" NOT NULL,
    "claimed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "internal_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "membership_zelle_payments_amount_cents_check" CHECK (("amount_cents" > 0)),
    CONSTRAINT "membership_zelle_payments_check" CHECK (((("status" = 'claimed'::"public"."zelle_payment_status") AND ("reviewed_at" IS NULL)) OR (("status" <> 'claimed'::"public"."zelle_payment_status") AND ("reviewed_at" IS NOT NULL)))),
    CONSTRAINT "membership_zelle_payments_claim_source_check" CHECK (("claim_source" = ANY (ARRAY['membership_signup'::"text", 'membership_page'::"text", 'admin'::"text"]))),
    CONSTRAINT "membership_zelle_payments_currency_check" CHECK (("length"("currency") = 3)),
    CONSTRAINT "membership_zelle_payments_internal_note_check" CHECK ((("internal_note" IS NULL) OR ("length"("internal_note") <= 1000)))
);


ALTER TABLE "public"."membership_zelle_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "user_id" "uuid" NOT NULL,
    "status" "public"."membership_status" DEFAULT 'pending'::"public"."membership_status" NOT NULL,
    "role" "public"."club_role" DEFAULT 'regular'::"public"."club_role" NOT NULL,
    "joined_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "member_since" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_private" (
    "user_id" "uuid" NOT NULL,
    "phone" "text",
    "birthday" "date",
    "emergency_contact" "jsonb",
    "gear_profile" "jsonb",
    "carpool_profile" "jsonb",
    "general_waiver_signed_at" timestamp with time zone,
    "general_waiver_version" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "privacy_settings" "jsonb",
    "travel_profile" "jsonb",
    "skills_certs" "jsonb",
    "interests_preferences" "jsonb",
    "notification_settings" "jsonb"
);


ALTER TABLE "public"."profile_private" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "pronouns" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_review_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_key" "text" NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "schedule_review_items_check" CHECK (((("status" = 'pending'::"text") AND ("reviewed_at" IS NULL)) OR (("status" <> 'pending'::"text") AND ("reviewed_at" IS NOT NULL)))),
    CONSTRAINT "schedule_review_items_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."schedule_review_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_webhook_events" (
    "stripe_event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "test_mode" boolean NOT NULL,
    "status" "public"."webhook_processing_status" DEFAULT 'processing'::"public"."webhook_processing_status" NOT NULL,
    "attempt_count" integer DEFAULT 1 NOT NULL,
    "last_error" "text",
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "stripe_webhook_events_attempt_count_check" CHECK (("attempt_count" > 0))
);


ALTER TABLE "public"."stripe_webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_attendance" (
    "trip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "attended" boolean,
    "responded_at" timestamp with time zone,
    "feedback" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_carpools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "public"."carpool_kind" NOT NULL,
    "seats" integer,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_carpools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text",
    "short_summary" "text",
    "activity_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "time_zone" "text",
    "primary_location_name" "text",
    "meeting_location_name" "text",
    "location_notes" "text",
    "overview_what" "text",
    "overview_where" "text",
    "overview_weather" "text",
    "overview_equipment" "text",
    "overview_carpool_need_gear" "text",
    "visibility" "public"."trip_visibility" DEFAULT 'members'::"public"."trip_visibility" NOT NULL,
    "difficulty" "public"."trip_difficulty",
    "max_participants" integer,
    "is_official" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_favorites" (
    "trip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_hosts" (
    "trip_id" "uuid" NOT NULL,
    "host_id" "uuid" NOT NULL,
    "credited_title" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "trip_hosts_credited_title_check" CHECK (("length"(TRIM(BOTH FROM "credited_title")) > 0)),
    CONSTRAINT "trip_hosts_sort_order_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "public"."trip_hosts" OWNER TO "postgres";


COMMENT ON TABLE "public"."trip_hosts" IS 'Public event host credits, separate from authenticated trip_leaders.';



CREATE TABLE IF NOT EXISTS "public"."trip_leaders" (
    "trip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_leaders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_private" (
    "trip_id" "uuid" NOT NULL,
    "location_private" "text",
    "lat" double precision,
    "lng" double precision,
    "meetup_point" "text",
    "description_private" "text",
    "weather_notes" "text",
    "required_gear" "text"[],
    "recommended_gear" "text"[],
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_private" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_rsvps" (
    "trip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."trip_rsvp_status" NOT NULL,
    "note" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_rsvps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_tag_options" (
    "tag" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_tag_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_waivers" (
    "trip_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_waivers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visibility" "public"."trip_visibility" DEFAULT 'public'::"public"."trip_visibility" NOT NULL,
    "is_official" boolean DEFAULT false NOT NULL,
    "title" "text" NOT NULL,
    "activity_id" "uuid",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "time_zone" "text" DEFAULT 'America/Los_Angeles'::"text" NOT NULL,
    "location_public" "text",
    "description_public" "text",
    "difficulty" "public"."trip_difficulty",
    "capacity" integer,
    "waitlist_enabled" boolean DEFAULT true NOT NULL,
    "rsvp_deadline" timestamp with time zone,
    "cover_image_path" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "overview_what" "text",
    "overview_where" "text",
    "overview_weather" "text",
    "overview_equipment" "text",
    "overview_carpool_need_gear" "text",
    "activity_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_all_day" boolean DEFAULT false NOT NULL,
    "schedule_key" "text",
    "lifecycle_status" "public"."trip_lifecycle_status" DEFAULT 'published'::"public"."trip_lifecycle_status" NOT NULL,
    "canceled_at" timestamp with time zone,
    "canceled_by" "uuid",
    "archived_at" timestamp with time zone,
    CONSTRAINT "trips_capacity_check" CHECK ((("capacity" IS NULL) OR ("capacity" > 0))),
    CONSTRAINT "trips_time_ok" CHECK (("ends_at" > "starts_at"))
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


COMMENT ON COLUMN "public"."trips"."is_all_day" IS 'When true, clients render calendar dates without a clock time.';



CREATE TABLE IF NOT EXISTS "public"."user_interests" (
    "user_id" "uuid" NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "experience_level" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_interests_experience_level_check" CHECK ((("experience_level" >= 0) AND ("experience_level" <= 10)))
);


ALTER TABLE "public"."user_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "trip_email_notifications" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_waivers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "waiver_key" "text" NOT NULL,
    "version" "text" NOT NULL,
    "signed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signature_name" "text"
);


ALTER TABLE "public"."user_waivers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waiver_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."waiver_templates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."account_deletion_jobs"
    ADD CONSTRAINT "account_deletion_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."admin_activity_events"
    ADD CONSTRAINT "admin_activity_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_capabilities"
    ADD CONSTRAINT "admin_capabilities_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."admin_role_grants"
    ADD CONSTRAINT "admin_role_grants_pkey" PRIMARY KEY ("role_id", "capability_key");



ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_user_roles"
    ADD CONSTRAINT "admin_user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."club_admin_settings"
    ADD CONSTRAINT "club_admin_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_hosts"
    ADD CONSTRAINT "club_hosts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_terms"
    ADD CONSTRAINT "club_terms_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."club_terms"
    ADD CONSTRAINT "club_terms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_photos"
    ADD CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_photos"
    ADD CONSTRAINT "gallery_photos_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."mailing_list_consent_events"
    ADD CONSTRAINT "mailing_list_consent_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mailing_list_subscriptions"
    ADD CONSTRAINT "mailing_list_subscriptions_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."membership_access_overrides"
    ADD CONSTRAINT "membership_access_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_account_restrictions"
    ADD CONSTRAINT "membership_account_restrictions_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."membership_applications"
    ADD CONSTRAINT "membership_applications_membership_access_override_id_key" UNIQUE ("membership_access_override_id");



ALTER TABLE ONLY "public"."membership_applications"
    ADD CONSTRAINT "membership_applications_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."membership_checkout_attempts"
    ADD CONSTRAINT "membership_checkout_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_checkout_attempts"
    ADD CONSTRAINT "membership_checkout_attempts_stripe_checkout_session_id_key" UNIQUE ("stripe_checkout_session_id");



ALTER TABLE ONLY "public"."membership_entitlements"
    ADD CONSTRAINT "membership_entitlements_payment_id_key" UNIQUE ("payment_id");



ALTER TABLE ONLY "public"."membership_entitlements"
    ADD CONSTRAINT "membership_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_entitlements"
    ADD CONSTRAINT "membership_entitlements_zelle_payment_id_key" UNIQUE ("zelle_payment_id");



ALTER TABLE ONLY "public"."membership_payments"
    ADD CONSTRAINT "membership_payments_checkout_attempt_id_key" UNIQUE ("checkout_attempt_id");



ALTER TABLE ONLY "public"."membership_payments"
    ADD CONSTRAINT "membership_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_payments"
    ADD CONSTRAINT "membership_payments_stripe_checkout_session_id_key" UNIQUE ("stripe_checkout_session_id");



ALTER TABLE ONLY "public"."membership_payments"
    ADD CONSTRAINT "membership_payments_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");



ALTER TABLE ONLY "public"."membership_review_items"
    ADD CONSTRAINT "membership_review_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_zelle_payments"
    ADD CONSTRAINT "membership_zelle_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profile_private"
    ADD CONSTRAINT "profile_private_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."schedule_review_items"
    ADD CONSTRAINT "schedule_review_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_review_items"
    ADD CONSTRAINT "schedule_review_items_schedule_key_key" UNIQUE ("schedule_key");



ALTER TABLE ONLY "public"."stripe_webhook_events"
    ADD CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("stripe_event_id");



ALTER TABLE ONLY "public"."trip_attendance"
    ADD CONSTRAINT "trip_attendance_pkey" PRIMARY KEY ("trip_id", "user_id");



ALTER TABLE ONLY "public"."trip_carpools"
    ADD CONSTRAINT "trip_carpools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_comments"
    ADD CONSTRAINT "trip_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_drafts"
    ADD CONSTRAINT "trip_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_favorites"
    ADD CONSTRAINT "trip_favorites_pkey" PRIMARY KEY ("trip_id", "user_id");



ALTER TABLE ONLY "public"."trip_hosts"
    ADD CONSTRAINT "trip_hosts_pkey" PRIMARY KEY ("trip_id", "host_id");



ALTER TABLE ONLY "public"."trip_leaders"
    ADD CONSTRAINT "trip_leaders_pkey" PRIMARY KEY ("trip_id", "user_id");



ALTER TABLE ONLY "public"."trip_private"
    ADD CONSTRAINT "trip_private_pkey" PRIMARY KEY ("trip_id");



ALTER TABLE ONLY "public"."trip_rsvps"
    ADD CONSTRAINT "trip_rsvps_pkey" PRIMARY KEY ("trip_id", "user_id");



ALTER TABLE ONLY "public"."trip_tag_options"
    ADD CONSTRAINT "trip_tag_options_pkey" PRIMARY KEY ("tag");



ALTER TABLE ONLY "public"."trip_waivers"
    ADD CONSTRAINT "trip_waivers_pkey" PRIMARY KEY ("trip_id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_pkey" PRIMARY KEY ("user_id", "activity_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_waivers"
    ADD CONSTRAINT "user_waivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_waivers"
    ADD CONSTRAINT "user_waivers_user_id_waiver_key_version_key" UNIQUE ("user_id", "waiver_key", "version");



ALTER TABLE ONLY "public"."waiver_templates"
    ADD CONSTRAINT "waiver_templates_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."waiver_templates"
    ADD CONSTRAINT "waiver_templates_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "account_deletion_one_per_user" ON "public"."account_deletion_jobs" USING "btree" ("user_id");



CREATE INDEX "admin_activity_created_idx" ON "public"."admin_activity_events" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "admin_roles_single_super_admin" ON "public"."admin_roles" USING "btree" ("is_super_admin") WHERE "is_super_admin";



CREATE INDEX "admin_user_roles_role_id_idx" ON "public"."admin_user_roles" USING "btree" ("role_id");



CREATE INDEX "club_hosts_active_order_idx" ON "public"."club_hosts" USING "btree" ("is_active", "display_order", "public_name");



CREATE INDEX "club_hosts_linked_user_id_idx" ON "public"."club_hosts" USING "btree" ("linked_user_id");



CREATE UNIQUE INDEX "club_hosts_public_name_unique" ON "public"."club_hosts" USING "btree" ("lower"("public_name"));



CREATE UNIQUE INDEX "club_terms_single_active" ON "public"."club_terms" USING "btree" ("is_active") WHERE "is_active";



CREATE INDEX "gallery_photos_public_order_idx" ON "public"."gallery_photos" USING "btree" ("is_published", "sort_order", "taken_on" DESC, "created_at" DESC);



CREATE INDEX "gallery_photos_trip_id_idx" ON "public"."gallery_photos" USING "btree" ("trip_id");



CREATE INDEX "gallery_photos_uploaded_by_idx" ON "public"."gallery_photos" USING "btree" ("uploaded_by");



CREATE INDEX "idx_trip_rsvps_trip" ON "public"."trip_rsvps" USING "btree" ("trip_id");



CREATE INDEX "idx_trip_rsvps_user" ON "public"."trip_rsvps" USING "btree" ("user_id");



CREATE INDEX "idx_trips_starts_at" ON "public"."trips" USING "btree" ("starts_at");



CREATE INDEX "idx_trips_visibility" ON "public"."trips" USING "btree" ("visibility");



CREATE INDEX "mailing_list_consent_user_created_idx" ON "public"."mailing_list_consent_events" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "mailing_list_subscribed_idx" ON "public"."mailing_list_subscriptions" USING "btree" ("subscribed", "subscribed_at" DESC);



CREATE INDEX "membership_access_overrides_granted_by_idx" ON "public"."membership_access_overrides" USING "btree" ("granted_by");



CREATE INDEX "membership_access_overrides_revoked_by_idx" ON "public"."membership_access_overrides" USING "btree" ("revoked_by");



CREATE INDEX "membership_access_overrides_user_idx" ON "public"."membership_access_overrides" USING "btree" ("user_id", "starts_at", "ends_at");



CREATE INDEX "membership_account_restrictions_updated_by_idx" ON "public"."membership_account_restrictions" USING "btree" ("updated_by");



CREATE UNIQUE INDEX "membership_checkout_one_open_per_user" ON "public"."membership_checkout_attempts" USING "btree" ("user_id") WHERE ("status" = 'open'::"public"."membership_checkout_status");



CREATE INDEX "membership_entitlements_user_term_idx" ON "public"."membership_entitlements" USING "btree" ("user_id", "ends_at" DESC);



CREATE INDEX "membership_payments_user_paid_at_idx" ON "public"."membership_payments" USING "btree" ("user_id", "paid_at" DESC);



CREATE INDEX "membership_review_items_payment_id_idx" ON "public"."membership_review_items" USING "btree" ("payment_id");



CREATE INDEX "membership_review_items_queue_idx" ON "public"."membership_review_items" USING "btree" ("status", "created_at");



CREATE INDEX "membership_review_items_reviewed_by_idx" ON "public"."membership_review_items" USING "btree" ("reviewed_by");



CREATE INDEX "membership_review_items_user_id_idx" ON "public"."membership_review_items" USING "btree" ("user_id");



CREATE UNIQUE INDEX "membership_zelle_one_claimed_per_user" ON "public"."membership_zelle_payments" USING "btree" ("user_id") WHERE ("status" = 'claimed'::"public"."zelle_payment_status");



CREATE INDEX "membership_zelle_user_created_idx" ON "public"."membership_zelle_payments" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "schedule_review_items_reviewed_by_idx" ON "public"."schedule_review_items" USING "btree" ("reviewed_by");



CREATE INDEX "trip_drafts_created_by_updated_at_idx" ON "public"."trip_drafts" USING "btree" ("created_by", "updated_at" DESC);



CREATE INDEX "trip_hosts_host_id_idx" ON "public"."trip_hosts" USING "btree" ("host_id");



CREATE UNIQUE INDEX "trips_schedule_key_unique" ON "public"."trips" USING "btree" ("schedule_key") WHERE ("schedule_key" IS NOT NULL);



CREATE OR REPLACE TRIGGER "club_hosts_set_updated_at" BEFORE UPDATE ON "public"."club_hosts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "gallery_audit_authenticated_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."gallery_photos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_authenticated_content_change"();



CREATE OR REPLACE TRIGGER "gallery_photos_set_updated_at" BEFORE UPDATE ON "public"."gallery_photos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "membership_account_restrictions_set_updated_at" BEFORE UPDATE ON "public"."membership_account_restrictions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "membership_applications_set_updated_at" BEFORE UPDATE ON "public"."membership_applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "membership_checkout_attempts_set_updated_at" BEFORE UPDATE ON "public"."membership_checkout_attempts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "membership_payments_set_updated_at" BEFORE UPDATE ON "public"."membership_payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "membership_review_items_set_updated_at" BEFORE UPDATE ON "public"."membership_review_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "schedule_review_items_set_updated_at" BEFORE UPDATE ON "public"."schedule_review_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "stripe_webhook_events_set_updated_at" BEFORE UPDATE ON "public"."stripe_webhook_events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_memberships_updated_at" BEFORE UPDATE ON "public"."memberships" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_profile_private_updated_at" BEFORE UPDATE ON "public"."profile_private" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_trip_attendance_updated_at" BEFORE UPDATE ON "public"."trip_attendance" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_trip_carpools_updated_at" BEFORE UPDATE ON "public"."trip_carpools" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_trip_comments_updated_at" BEFORE UPDATE ON "public"."trip_comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_trip_private_updated_at" BEFORE UPDATE ON "public"."trip_private" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_trip_rsvps_updated_at" BEFORE UPDATE ON "public"."trip_rsvps" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_trip_waivers_updated_at" BEFORE UPDATE ON "public"."trip_waivers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_trips_updated_at" BEFORE UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trips_audit_authenticated_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."audit_authenticated_content_change"();



CREATE OR REPLACE TRIGGER "trips_enforce_unofficial_limit" BEFORE INSERT OR UPDATE OF "starts_at", "is_official", "lifecycle_status", "created_by" ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_unofficial_trip_limit"();



ALTER TABLE ONLY "public"."account_deletion_jobs"
    ADD CONSTRAINT "account_deletion_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."account_deletion_jobs"
    ADD CONSTRAINT "account_deletion_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."admin_activity_events"
    ADD CONSTRAINT "admin_activity_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_activity_events"
    ADD CONSTRAINT "admin_activity_events_subject_user_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_role_grants"
    ADD CONSTRAINT "admin_role_grants_capability_key_fkey" FOREIGN KEY ("capability_key") REFERENCES "public"."admin_capabilities"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_role_grants"
    ADD CONSTRAINT "admin_role_grants_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_user_roles"
    ADD CONSTRAINT "admin_user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_user_roles"
    ADD CONSTRAINT "admin_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_user_roles"
    ADD CONSTRAINT "admin_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_admin_settings"
    ADD CONSTRAINT "club_admin_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."club_hosts"
    ADD CONSTRAINT "club_hosts_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gallery_photos"
    ADD CONSTRAINT "gallery_photos_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gallery_photos"
    ADD CONSTRAINT "gallery_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."mailing_list_consent_events"
    ADD CONSTRAINT "mailing_list_consent_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mailing_list_subscriptions"
    ADD CONSTRAINT "mailing_list_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."membership_access_overrides"
    ADD CONSTRAINT "membership_access_overrides_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_access_overrides"
    ADD CONSTRAINT "membership_access_overrides_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_access_overrides"
    ADD CONSTRAINT "membership_access_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."membership_account_restrictions"
    ADD CONSTRAINT "membership_account_restrictions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."membership_account_restrictions"
    ADD CONSTRAINT "membership_account_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."membership_applications"
    ADD CONSTRAINT "membership_applications_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_applications"
    ADD CONSTRAINT "membership_applications_membership_access_override_id_fkey" FOREIGN KEY ("membership_access_override_id") REFERENCES "public"."membership_access_overrides"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_applications"
    ADD CONSTRAINT "membership_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."membership_checkout_attempts"
    ADD CONSTRAINT "membership_checkout_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."membership_entitlements"
    ADD CONSTRAINT "membership_entitlements_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."membership_payments"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_entitlements"
    ADD CONSTRAINT "membership_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_entitlements"
    ADD CONSTRAINT "membership_entitlements_zelle_payment_id_fkey" FOREIGN KEY ("zelle_payment_id") REFERENCES "public"."membership_zelle_payments"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_payments"
    ADD CONSTRAINT "membership_payments_checkout_attempt_id_fkey" FOREIGN KEY ("checkout_attempt_id") REFERENCES "public"."membership_checkout_attempts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_payments"
    ADD CONSTRAINT "membership_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_review_items"
    ADD CONSTRAINT "membership_review_items_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."membership_payments"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_review_items"
    ADD CONSTRAINT "membership_review_items_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_review_items"
    ADD CONSTRAINT "membership_review_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_zelle_payments"
    ADD CONSTRAINT "membership_zelle_payments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."membership_zelle_payments"
    ADD CONSTRAINT "membership_zelle_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_private"
    ADD CONSTRAINT "profile_private_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_review_items"
    ADD CONSTRAINT "schedule_review_items_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trip_attendance"
    ADD CONSTRAINT "trip_attendance_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_attendance"
    ADD CONSTRAINT "trip_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_carpools"
    ADD CONSTRAINT "trip_carpools_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_carpools"
    ADD CONSTRAINT "trip_carpools_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_comments"
    ADD CONSTRAINT "trip_comments_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_comments"
    ADD CONSTRAINT "trip_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_drafts"
    ADD CONSTRAINT "trip_drafts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_favorites"
    ADD CONSTRAINT "trip_favorites_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_favorites"
    ADD CONSTRAINT "trip_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_hosts"
    ADD CONSTRAINT "trip_hosts_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."club_hosts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."trip_hosts"
    ADD CONSTRAINT "trip_hosts_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_leaders"
    ADD CONSTRAINT "trip_leaders_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_leaders"
    ADD CONSTRAINT "trip_leaders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_private"
    ADD CONSTRAINT "trip_private_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_rsvps"
    ADD CONSTRAINT "trip_rsvps_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_rsvps"
    ADD CONSTRAINT "trip_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_waivers"
    ADD CONSTRAINT "trip_waivers_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_canceled_by_fkey" FOREIGN KEY ("canceled_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_waivers"
    ADD CONSTRAINT "user_waivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."account_deletion_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_select_all" ON "public"."activities" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "activities_update_staff" ON "public"."activities" FOR UPDATE TO "authenticated" USING ("public"."is_staff_or_admin"("auth"."uid"())) WITH CHECK ("public"."is_staff_or_admin"("auth"."uid"()));



CREATE POLICY "activities_write_staff" ON "public"."activities" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_staff_or_admin"("auth"."uid"()));



CREATE POLICY "activity_admin_read" ON "public"."admin_activity_events" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'overview.read'::"text"));



ALTER TABLE "public"."admin_activity_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_capabilities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_capabilities_admin_read" ON "public"."admin_capabilities" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'leadership.read'::"text"));



ALTER TABLE "public"."admin_role_grants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_role_grants_admin_read" ON "public"."admin_role_grants" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'leadership.read'::"text"));



ALTER TABLE "public"."admin_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_roles_admin_read" ON "public"."admin_roles" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'leadership.read'::"text"));



ALTER TABLE "public"."admin_user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_user_roles_admin_read" ON "public"."admin_user_roles" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'leadership.read'::"text"));



ALTER TABLE "public"."club_admin_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_hosts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "club_hosts_leadership_delete" ON "public"."club_hosts" FOR DELETE TO "authenticated" USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "club_hosts_leadership_insert" ON "public"."club_hosts" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "club_hosts_leadership_update" ON "public"."club_hosts" FOR UPDATE TO "authenticated" USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "club_hosts_public_read" ON "public"."club_hosts" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "club_settings_admin_read" ON "public"."club_admin_settings" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'settings.read'::"text"));



ALTER TABLE "public"."club_terms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "club_terms_admin_read" ON "public"."club_terms" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'settings.read'::"text"));



CREATE POLICY "deletion_jobs_super_read" ON "public"."account_deletion_jobs" FOR SELECT TO "authenticated" USING ("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."gallery_photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gallery_photos_admin_read" ON "public"."gallery_photos" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'gallery.read'::"text"));



CREATE POLICY "gallery_photos_read_published" ON "public"."gallery_photos" FOR SELECT TO "authenticated", "anon" USING ("is_published");



CREATE POLICY "gallery_photos_staff_delete" ON "public"."gallery_photos" FOR DELETE TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'gallery.delete'::"text"));



CREATE POLICY "gallery_photos_staff_insert" ON "public"."gallery_photos" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'gallery.create'::"text") AND ("uploaded_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "gallery_photos_staff_update" ON "public"."gallery_photos" FOR UPDATE TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'gallery.update'::"text")) WITH CHECK ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'gallery.update'::"text"));



CREATE POLICY "mailing_admin_read" ON "public"."mailing_list_subscriptions" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'mailing_list.read'::"text"));



CREATE POLICY "mailing_consent_admin_read" ON "public"."mailing_list_consent_events" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'mailing_list.read'::"text"));



CREATE POLICY "mailing_consent_own_read" ON "public"."mailing_list_consent_events" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."mailing_list_consent_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mailing_list_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mailing_own_read" ON "public"."mailing_list_subscriptions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."membership_access_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_account_restrictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_checkout_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_review_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_zelle_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "memberships_insert_self_pending" ON "public"."memberships" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND ("status" = 'pending'::"public"."membership_status") AND ("role" = 'regular'::"public"."club_role")));



CREATE POLICY "memberships_select_self_or_staff" ON "public"."memberships" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_staff_or_admin"("auth"."uid"())));



CREATE POLICY "memberships_update_staff_only" ON "public"."memberships" FOR UPDATE TO "authenticated" USING ("public"."is_staff_or_admin"("auth"."uid"())) WITH CHECK ("public"."is_staff_or_admin"("auth"."uid"()));



ALTER TABLE "public"."profile_private" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profile_private_insert_self" ON "public"."profile_private" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "profile_private_select_self_or_staff" ON "public"."profile_private" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_staff_or_admin"("auth"."uid"())));



CREATE POLICY "profile_private_update_self_or_staff" ON "public"."profile_private" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_staff_or_admin"("auth"."uid"()))) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_staff_or_admin"("auth"."uid"())));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_self" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_select_all" ON "public"."profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "profiles_update_self_or_staff" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_staff_or_admin"("auth"."uid"()))) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_staff_or_admin"("auth"."uid"())));



ALTER TABLE "public"."schedule_review_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schedule_review_items_capability_manage" ON "public"."schedule_review_items" TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text")) WITH CHECK ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text"));



ALTER TABLE "public"."stripe_webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_attendance" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_attendance_insert_self" ON "public"."trip_attendance" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (NOT "public"."is_banned"("auth"."uid"())) AND "public"."is_active_member"("auth"."uid"()) AND "public"."can_view_trip"("trip_id", "auth"."uid"())));



CREATE POLICY "trip_attendance_select_self_or_manager" ON "public"."trip_attendance" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."can_manage_trip"("trip_id", "auth"."uid"())));



CREATE POLICY "trip_attendance_update_self" ON "public"."trip_attendance" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (NOT "public"."is_banned"("auth"."uid"())) AND "public"."is_active_member"("auth"."uid"()))) WITH CHECK ((("user_id" = "auth"."uid"()) AND (NOT "public"."is_banned"("auth"."uid"())) AND "public"."is_active_member"("auth"."uid"())));



ALTER TABLE "public"."trip_carpools" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_carpools_delete_self_or_manager" ON "public"."trip_carpools" FOR DELETE TO "authenticated" USING (("public"."can_manage_trip"("trip_id", "auth"."uid"()) OR (("user_id" = "auth"."uid"()) AND (NOT "public"."is_banned"("auth"."uid"())) AND "public"."is_active_member"("auth"."uid"()))));



CREATE POLICY "trip_carpools_insert_self" ON "public"."trip_carpools" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (NOT "public"."is_banned"("auth"."uid"())) AND "public"."is_active_member"("auth"."uid"()) AND "public"."can_view_trip"("trip_id", "auth"."uid"())));



CREATE POLICY "trip_carpools_select_if_can_view" ON "public"."trip_carpools" FOR SELECT USING ("public"."can_view_trip_readonly"("trip_id"));



CREATE POLICY "trip_carpools_update_self_or_manager" ON "public"."trip_carpools" FOR UPDATE TO "authenticated" USING (((NOT "public"."is_banned"("auth"."uid"())) AND ("public"."can_manage_trip"("trip_id", "auth"."uid"()) OR (("user_id" = "auth"."uid"()) AND "public"."is_active_member"("auth"."uid"()))))) WITH CHECK (((NOT "public"."is_banned"("auth"."uid"())) AND ("public"."can_manage_trip"("trip_id", "auth"."uid"()) OR (("user_id" = "auth"."uid"()) AND "public"."is_active_member"("auth"."uid"())))));



ALTER TABLE "public"."trip_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_comments_delete_staff" ON "public"."trip_comments" FOR DELETE TO "authenticated" USING ("public"."is_staff_or_admin"("auth"."uid"()));



CREATE POLICY "trip_comments_insert_memberish" ON "public"."trip_comments" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (NOT "public"."is_banned"("auth"."uid"())) AND "public"."can_view_trip"("trip_id", "auth"."uid"()) AND ("public"."is_active_member"("auth"."uid"()) OR "public"."can_manage_trip"("trip_id", "auth"."uid"()))));



CREATE POLICY "trip_comments_select_if_can_view" ON "public"."trip_comments" FOR SELECT USING ("public"."can_view_trip_readonly"("trip_id"));



CREATE POLICY "trip_comments_update_self_or_staff" ON "public"."trip_comments" FOR UPDATE TO "authenticated" USING (("public"."can_manage_trip"("trip_id", "auth"."uid"()) OR (("user_id" = "auth"."uid"()) AND (NOT "public"."is_banned"("auth"."uid"())) AND "public"."is_active_member"("auth"."uid"())))) WITH CHECK (("public"."can_manage_trip"("trip_id", "auth"."uid"()) OR (("user_id" = "auth"."uid"()) AND (NOT "public"."is_banned"("auth"."uid"())) AND "public"."is_active_member"("auth"."uid"()))));



ALTER TABLE "public"."trip_drafts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_drafts_delete_own_or_all_admin" ON "public"."trip_drafts" FOR DELETE TO "authenticated" USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("public"."admin_capability_scope"(( SELECT "auth"."uid"() AS "uid"), 'trips.delete'::"text") = 'all'::"public"."admin_permission_scope")));



CREATE POLICY "trip_drafts_insert_own" ON "public"."trip_drafts" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) AND ((NOT "is_official") OR "public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.official'::"text"))));



CREATE POLICY "trip_drafts_select_own_or_all_admin" ON "public"."trip_drafts" FOR SELECT TO "authenticated" USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("public"."admin_capability_scope"(( SELECT "auth"."uid"() AS "uid"), 'trips.read'::"text") = 'all'::"public"."admin_permission_scope")));



CREATE POLICY "trip_drafts_update_own_or_all_admin" ON "public"."trip_drafts" FOR UPDATE TO "authenticated" USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("public"."admin_capability_scope"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text") = 'all'::"public"."admin_permission_scope"))) WITH CHECK (((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("public"."admin_capability_scope"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text") = 'all'::"public"."admin_permission_scope")) AND ((NOT "is_official") OR "public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.official'::"text"))));



ALTER TABLE "public"."trip_favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_favorites_delete_self" ON "public"."trip_favorites" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "trip_favorites_insert_self" ON "public"."trip_favorites" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."can_view_trip"("trip_id", "auth"."uid"())));



CREATE POLICY "trip_favorites_select_self" ON "public"."trip_favorites" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."trip_hosts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_hosts_capability_delete" ON "public"."trip_hosts" FOR DELETE TO "authenticated" USING ("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "trip_id"));



CREATE POLICY "trip_hosts_capability_insert" ON "public"."trip_hosts" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "trip_id"));



CREATE POLICY "trip_hosts_capability_update" ON "public"."trip_hosts" FOR UPDATE TO "authenticated" USING ("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "trip_id")) WITH CHECK ("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "trip_id"));



CREATE POLICY "trip_hosts_public_read" ON "public"."trip_hosts" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."trips"
  WHERE (("trips"."id" = "trip_hosts"."trip_id") AND ("trips"."visibility" = ANY (ARRAY['public'::"public"."trip_visibility", 'minimal'::"public"."trip_visibility"]))))));



ALTER TABLE "public"."trip_leaders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_leaders_capability_delete" ON "public"."trip_leaders" FOR DELETE TO "authenticated" USING ("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "trip_id"));



CREATE POLICY "trip_leaders_capability_insert" ON "public"."trip_leaders" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "trip_id"));



CREATE POLICY "trip_leaders_capability_update" ON "public"."trip_leaders" FOR UPDATE TO "authenticated" USING ("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "trip_id")) WITH CHECK ("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "trip_id"));



CREATE POLICY "trip_leaders_select_if_can_view_trip" ON "public"."trip_leaders" FOR SELECT TO "authenticated" USING ("public"."can_view_trip"("trip_id", "auth"."uid"()));



ALTER TABLE "public"."trip_private" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_private_insert_manage" ON "public"."trip_private" FOR INSERT TO "authenticated" WITH CHECK (((NOT "public"."is_banned"("auth"."uid"())) AND "public"."can_manage_trip"("trip_id", "auth"."uid"())));



CREATE POLICY "trip_private_select_allowed" ON "public"."trip_private" FOR SELECT USING (((NOT "public"."is_banned"("auth"."uid"())) AND "public"."can_view_trip_readonly"("trip_id")));



CREATE POLICY "trip_private_update_manage" ON "public"."trip_private" FOR UPDATE TO "authenticated" USING ("public"."can_manage_trip"("trip_id", "auth"."uid"())) WITH CHECK ("public"."can_manage_trip"("trip_id", "auth"."uid"()));



ALTER TABLE "public"."trip_rsvps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_rsvps_insert_self_basic_or_manager_any" ON "public"."trip_rsvps" FOR INSERT TO "authenticated" WITH CHECK (((NOT "public"."is_banned"("auth"."uid"())) AND ("public"."can_manage_trip"("trip_id", "auth"."uid"()) OR (("user_id" = "auth"."uid"()) AND "public"."is_active_member"("auth"."uid"()) AND "public"."can_view_trip"("trip_id", "auth"."uid"()) AND ("status" = ANY (ARRAY['going'::"public"."trip_rsvp_status", 'maybe'::"public"."trip_rsvp_status", 'not_going'::"public"."trip_rsvp_status"]))))));



CREATE POLICY "trip_rsvps_select_self_or_manager" ON "public"."trip_rsvps" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."can_manage_trip"("trip_id", "auth"."uid"())));



CREATE POLICY "trip_rsvps_update_self_or_manager" ON "public"."trip_rsvps" FOR UPDATE TO "authenticated" USING (((NOT "public"."is_banned"("auth"."uid"())) AND ("public"."can_manage_trip"("trip_id", "auth"."uid"()) OR (("user_id" = "auth"."uid"()) AND "public"."is_active_member"("auth"."uid"()))))) WITH CHECK (((NOT "public"."is_banned"("auth"."uid"())) AND ("public"."can_manage_trip"("trip_id", "auth"."uid"()) OR (("user_id" = "auth"."uid"()) AND "public"."is_active_member"("auth"."uid"()) AND ("status" = ANY (ARRAY['going'::"public"."trip_rsvp_status", 'maybe'::"public"."trip_rsvp_status", 'not_going'::"public"."trip_rsvp_status"]))))));



ALTER TABLE "public"."trip_tag_options" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_tag_options_delete_staff_plus" ON "public"."trip_tag_options" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."status" = 'active'::"public"."membership_status") AND ("m"."role" = ANY (ARRAY['staff'::"public"."club_role", 'leadership'::"public"."club_role", 'admin'::"public"."club_role"]))))));



CREATE POLICY "trip_tag_options_insert_staff_plus" ON "public"."trip_tag_options" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."status" = 'active'::"public"."membership_status") AND ("m"."role" = ANY (ARRAY['staff'::"public"."club_role", 'leadership'::"public"."club_role", 'admin'::"public"."club_role"]))))));



CREATE POLICY "trip_tag_options_select_staff_plus" ON "public"."trip_tag_options" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."status" = 'active'::"public"."membership_status") AND ("m"."role" = ANY (ARRAY['staff'::"public"."club_role", 'leadership'::"public"."club_role", 'admin'::"public"."club_role"]))))));



CREATE POLICY "trip_tag_options_update_staff_plus" ON "public"."trip_tag_options" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."status" = 'active'::"public"."membership_status") AND ("m"."role" = ANY (ARRAY['staff'::"public"."club_role", 'leadership'::"public"."club_role", 'admin'::"public"."club_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."status" = 'active'::"public"."membership_status") AND ("m"."role" = ANY (ARRAY['staff'::"public"."club_role", 'leadership'::"public"."club_role", 'admin'::"public"."club_role"]))))));



ALTER TABLE "public"."trip_waivers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_waivers_select_private_access" ON "public"."trip_waivers" FOR SELECT TO "authenticated" USING ("public"."can_view_trip_private"("trip_id", "auth"."uid"()));



CREATE POLICY "trip_waivers_update_manage" ON "public"."trip_waivers" FOR UPDATE TO "authenticated" USING ("public"."can_manage_trip"("trip_id", "auth"."uid"())) WITH CHECK ("public"."can_manage_trip"("trip_id", "auth"."uid"()));



CREATE POLICY "trip_waivers_write_manage" ON "public"."trip_waivers" FOR INSERT TO "authenticated" WITH CHECK ("public"."can_manage_trip"("trip_id", "auth"."uid"()));



ALTER TABLE "public"."trips" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trips_delete_empty_tests_super_only" ON "public"."trips" FOR DELETE TO "authenticated" USING (("public"."is_super_admin"(( SELECT "auth"."uid"() AS "uid")) AND ("lifecycle_status" <> 'published'::"public"."trip_lifecycle_status") AND (NOT (EXISTS ( SELECT 1
   FROM "public"."trip_rsvps"
  WHERE ("trip_rsvps"."trip_id" = "trips"."id")))) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."trip_attendance"
  WHERE ("trip_attendance"."trip_id" = "trips"."id"))))));



CREATE POLICY "trips_insert_unofficial_or_staff_official" ON "public"."trips" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.create'::"text") OR "public"."is_active_member"(( SELECT "auth"."uid"() AS "uid"))) AND ((NOT "is_official") OR "public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.official'::"text"))));



CREATE POLICY "trips_select_authenticated_by_access" ON "public"."trips" FOR SELECT TO "authenticated" USING ("public"."can_view_trip_readonly"("id"));



CREATE POLICY "trips_select_public" ON "public"."trips" FOR SELECT TO "authenticated", "anon" USING (("visibility" = ANY (ARRAY['public'::"public"."trip_visibility", 'minimal'::"public"."trip_visibility"])));



CREATE POLICY "trips_update_capability_or_own_unofficial" ON "public"."trips" FOR UPDATE TO "authenticated" USING (("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "id") OR (("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND (NOT "is_official") AND "public"."is_active_member"(( SELECT "auth"."uid"() AS "uid")) AND (NOT "public"."is_banned"(( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((("public"."has_trip_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.update'::"text", "id") OR (("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND (NOT "is_official") AND "public"."is_active_member"(( SELECT "auth"."uid"() AS "uid")) AND (NOT "public"."is_banned"(( SELECT "auth"."uid"() AS "uid"))))) AND ((NOT "is_official") OR "public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'trips.official'::"text"))));



ALTER TABLE "public"."user_interests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_interests_delete_self" ON "public"."user_interests" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_interests_select_self" ON "public"."user_interests" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_interests_update_self" ON "public"."user_interests" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "user_interests_write_self" ON "public"."user_interests" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_prefs_select_self" ON "public"."user_preferences" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_prefs_update_self" ON "public"."user_preferences" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "user_prefs_upsert_self" ON "public"."user_preferences" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_waivers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_waivers_insert_self" ON "public"."user_waivers" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "user_waivers_select_self_or_staff" ON "public"."user_waivers" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_staff_or_admin"("auth"."uid"())));



ALTER TABLE "public"."waiver_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "waiver_templates_select_all" ON "public"."waiver_templates" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "waiver_templates_update_staff" ON "public"."waiver_templates" FOR UPDATE TO "authenticated" USING ("public"."is_staff_or_admin"("auth"."uid"())) WITH CHECK ("public"."is_staff_or_admin"("auth"."uid"()));



CREATE POLICY "waiver_templates_write_staff" ON "public"."waiver_templates" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_staff_or_admin"("auth"."uid"()));



CREATE POLICY "zelle_admin_read" ON "public"."membership_zelle_payments" FOR SELECT TO "authenticated" USING ("public"."has_admin_capability"(( SELECT "auth"."uid"() AS "uid"), 'membership.read'::"text"));



CREATE POLICY "zelle_own_read" ON "public"."membership_zelle_payments" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."activate_confirmed_zelle_membership"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."activate_confirmed_zelle_membership"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_capability_scope"("p_uid" "uuid", "p_capability_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_capability_scope"("p_uid" "uuid", "p_capability_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_capability_scope"("p_uid" "uuid", "p_capability_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_accounts"("p_actor_user_id" "uuid", "p_search" "text", "p_membership_state" "text", "p_role_name" "text", "p_restriction" "text", "p_mailing" "text", "p_needs_attention" boolean, "p_page" integer, "p_page_size" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_accounts"("p_actor_user_id" "uuid", "p_search" "text", "p_membership_state" "text", "p_role_name" "text", "p_restriction" "text", "p_mailing" "text", "p_needs_attention" boolean, "p_page" integer, "p_page_size" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."approve_membership_review_item"("p_review_id" "uuid", "p_reviewer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_membership_review_item"("p_review_id" "uuid", "p_reviewer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_view_trip_readonly"("p_trip_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_view_trip_readonly"("p_trip_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."claim_zelle_membership_payment"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_zelle_membership_payment"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."confirm_membership_guardian_consent"("p_user_id" "uuid", "p_reviewer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_membership_guardian_consent"("p_user_id" "uuid", "p_reviewer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."confirm_zelle_membership_application"("p_user_id" "uuid", "p_reviewer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_zelle_membership_application"("p_user_id" "uuid", "p_reviewer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_my_membership_access"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_membership_access"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_my_membership_application"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_membership_application"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_my_membership_payment_history"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_membership_payment_history"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."grant_complimentary_membership_access"("p_actor_user_id" "uuid", "p_user_id" "uuid", "p_days" integer, "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."grant_complimentary_membership_access"("p_actor_user_id" "uuid", "p_user_id" "uuid", "p_days" integer, "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_admin_capability"("p_uid" "uuid", "p_capability_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_admin_capability"("p_uid" "uuid", "p_capability_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_admin_capability"("p_uid" "uuid", "p_capability_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_membership_access"("p_uid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_membership_access"("p_uid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_provisional_membership_access"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_provisional_membership_access"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."has_trip_admin_capability"("p_uid" "uuid", "p_capability_key" "text", "p_trip_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_trip_admin_capability"("p_uid" "uuid", "p_capability_key" "text", "p_trip_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_trip_admin_capability"("p_uid" "uuid", "p_capability_key" "text", "p_trip_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_active_member"("p_uid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_active_member"("p_uid" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_active_member"("p_uid" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_super_admin"("p_uid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_super_admin"("p_uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("p_uid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_membership_checkout_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_attempt_id" "uuid", "p_user_id" "uuid", "p_checkout_session_id" "text", "p_payment_intent_id" "text", "p_customer_id" "text", "p_amount_cents" integer, "p_currency" "text", "p_paid_at" timestamp with time zone, "p_receipt_url" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_membership_checkout_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_attempt_id" "uuid", "p_user_id" "uuid", "p_checkout_session_id" "text", "p_payment_intent_id" "text", "p_customer_id" "text", "p_amount_cents" integer, "p_currency" "text", "p_paid_at" timestamp with time zone, "p_receipt_url" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_membership_dispute_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_payment_intent_id" "text", "p_dispute_recorded_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_membership_dispute_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_payment_intent_id" "text", "p_dispute_recorded_at" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_membership_refund_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_payment_intent_id" "text", "p_amount_refunded" integer, "p_refund_recorded_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_membership_refund_event"("p_event_id" "text", "p_event_type" "text", "p_test_mode" boolean, "p_payment_intent_id" "text", "p_amount_refunded" integer, "p_refund_recorded_at" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_admin_activity"("p_actor_user_id" "uuid", "p_subject_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_summary" "text", "p_before_data" "jsonb", "p_after_data" "jsonb", "p_result" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_admin_activity"("p_actor_user_id" "uuid", "p_subject_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_summary" "text", "p_before_data" "jsonb", "p_after_data" "jsonb", "p_result" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reverse_zelle_membership_payment"("p_payment_id" "uuid", "p_reviewer_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reverse_zelle_membership_payment"("p_payment_id" "uuid", "p_reviewer_id" "uuid", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."review_zelle_membership_payment"("p_payment_id" "uuid", "p_reviewer_id" "uuid", "p_decision" "text", "p_note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."review_zelle_membership_payment"("p_payment_id" "uuid", "p_reviewer_id" "uuid", "p_decision" "text", "p_note" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_admin_account_restriction"("p_actor_user_id" "uuid", "p_user_id" "uuid", "p_restriction" "public"."membership_restriction", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_admin_account_restriction"("p_actor_user_id" "uuid", "p_user_id" "uuid", "p_restriction" "public"."membership_restriction", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_mailing_list_subscription"("p_email" "text", "p_subscribed" boolean, "p_source" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_mailing_list_subscription"("p_email" "text", "p_subscribed" boolean, "p_source" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."set_super_admin_assignment"("p_actor_user_id" "uuid", "p_target_user_id" "uuid", "p_assign" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_super_admin_assignment"("p_actor_user_id" "uuid", "p_target_user_id" "uuid", "p_assign" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."set_zelle_membership_payment_status"("p_user_id" "uuid", "p_reviewer_id" "uuid", "p_desired_status" "text", "p_note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_zelle_membership_payment_status"("p_user_id" "uuid", "p_reviewer_id" "uuid", "p_desired_status" "text", "p_note" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."try_uuid"("p" "text") FROM PUBLIC;


















GRANT SELECT ON TABLE "public"."account_deletion_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."account_deletion_jobs" TO "service_role";



GRANT SELECT ON TABLE "public"."activities" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."activities" TO "authenticated";



GRANT SELECT ON TABLE "public"."admin_activity_events" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_events" TO "service_role";



GRANT SELECT ON TABLE "public"."admin_capabilities" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_capabilities" TO "service_role";



GRANT SELECT ON TABLE "public"."admin_role_grants" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_role_grants" TO "service_role";



GRANT SELECT ON TABLE "public"."admin_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_roles" TO "service_role";



GRANT SELECT ON TABLE "public"."admin_user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_user_roles" TO "service_role";



GRANT SELECT ON TABLE "public"."club_admin_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."club_admin_settings" TO "service_role";



GRANT SELECT ON TABLE "public"."club_hosts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."club_hosts" TO "authenticated";
GRANT ALL ON TABLE "public"."club_hosts" TO "service_role";



GRANT SELECT ON TABLE "public"."club_terms" TO "authenticated";
GRANT ALL ON TABLE "public"."club_terms" TO "service_role";



GRANT SELECT ON TABLE "public"."gallery_photos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."gallery_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_photos" TO "service_role";



GRANT SELECT ON TABLE "public"."mailing_list_consent_events" TO "authenticated";
GRANT ALL ON TABLE "public"."mailing_list_consent_events" TO "service_role";



GRANT SELECT ON TABLE "public"."mailing_list_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."mailing_list_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."membership_access_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."membership_account_restrictions" TO "service_role";



GRANT ALL ON TABLE "public"."membership_applications" TO "service_role";



GRANT ALL ON TABLE "public"."membership_checkout_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."membership_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."membership_payments" TO "service_role";



GRANT ALL ON TABLE "public"."membership_review_items" TO "service_role";



GRANT SELECT ON TABLE "public"."membership_zelle_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_zelle_payments" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."memberships" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."memberships" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profile_private" TO "authenticated";



GRANT SELECT ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."schedule_review_items" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_review_items" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_attendance" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_carpools" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_comments" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_drafts" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_favorites" TO "authenticated";



GRANT SELECT ON TABLE "public"."trip_hosts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_hosts" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_hosts" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_leaders" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_private" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_rsvps" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_tag_options" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_waivers" TO "authenticated";



GRANT SELECT ON TABLE "public"."trips" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trips" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trips" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_interests" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_preferences" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_waivers" TO "authenticated";



GRANT SELECT ON TABLE "public"."waiver_templates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."waiver_templates" TO "authenticated";


































