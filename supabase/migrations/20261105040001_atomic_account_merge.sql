-- Durable identities: signed evidence must survive auth deletion unchanged. The
-- existing registration_account_merges/owns_record mapping gives the retained
-- account access without rewriting signer, guardian, risk, or consent history.
alter table public.registration_signatures drop constraint if exists registration_signatures_user_id_fkey;
alter table public.registration_guardian_evidence drop constraint if exists registration_guardian_evidence_user_id_fkey;
alter table public.registration_risk_acknowledgements drop constraint if exists registration_risk_acknowledgements_user_id_fkey;
alter table public.registration_annual_guardian_requests drop constraint if exists registration_annual_guardian_requests_user_id_fkey;

create table public.account_merge_jobs (
  secondary_user_id uuid primary key,
  primary_user_id uuid not null,
  actor_user_id uuid not null,
  status text not null default 'pending_auth_delete' check (status in ('pending_auth_delete','completed')),
  counts jsonb not null,
  -- Preserve discarded singleton/collision values for officer reconciliation.
  -- These contain private data and are deliberately inaccessible via table grants.
  secondary_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (secondary_user_id <> primary_user_id)
);
alter table public.account_merge_jobs enable row level security;
revoke all on public.account_merge_jobs from public, anon, authenticated, service_role;
create index account_merge_pending_primary on public.account_merge_jobs(primary_user_id) where status='pending_auth_delete';

-- Preserve ownership transfers without reapplying trip-creation eligibility.
CREATE OR REPLACE FUNCTION "public"."enforce_unofficial_trip_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = ''
    AS $$
declare
  v_limit integer;
  v_count integer;
begin
  -- A service-authorized account merge changes ownership without creating a
  -- trip or expanding its official status. Preserve drafts/trips even when the
  -- retained account inherits a restriction or already exceeds the trip limit.
  if tg_op = 'UPDATE'
    and (to_jsonb(new) - 'created_by' - 'updated_at') = (to_jsonb(old) - 'created_by' - 'updated_at')
    and exists(select 1 from public.registration_account_merges
      where secondary_id=old.created_by and primary_id=new.created_by) then
    return new;
  end if;
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

create or replace function public.merge_accounts(
  p_actor uuid, p_primary uuid, p_secondary uuid, p_dry_run boolean default true
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
  item record;
  n bigint;
  counts jsonb := '{}';
  snapshot jsonb := '{}';
  left_row jsonb;
  right_row jsonb;
  merged jsonb;
  assignments text;
  existing public.account_merge_jobs;
begin
  if p_primary is null or p_secondary is null or p_primary=p_secondary then
    raise exception 'Choose two different accounts.' using errcode='22023';
  end if;
  if p_actor is null or not public.has_admin_capability(p_actor,'accounts.update') then
    raise exception 'Account management permission required.' using errcode='42501';
  end if;
  -- Match the existing registration/preference command lock order.
  for uid in select u from unnest(array[p_primary,p_secondary]) u order by u loop
    perform pg_advisory_xact_lock(hashtextextended('email-preferences:'||uid,0));
  end loop;
  for uid in select u from unnest(array[p_primary,p_secondary]) u order by u loop
    perform pg_advisory_xact_lock(hashtextextended('registration-account:'||uid,0));
  end loop;
  perform id from auth.users where id in (p_primary,p_secondary) order by id for update;
  if exists(select 1 from public.registration_account_merges where secondary_id=p_primary) then
    raise exception 'The primary account was already merged. Use its retained account.' using errcode='22023';
  end if;
  select * into existing from public.account_merge_jobs where secondary_user_id=p_secondary for update;
  if found then
    if existing.primary_user_id<>p_primary then
      raise exception 'This secondary account was merged into a different account. Use the recorded primary account.' using errcode='22023';
    end if;
    return jsonb_build_object('counts',existing.counts,'status',existing.status,'resumed',true);
  end if;
  if (select count(*) from auth.users where id in (p_primary,p_secondary))<>2 then
    raise exception 'An account was not found. Refresh the account list and select two existing accounts.' using errcode='22023';
  end if;
  -- Even inactive/suspended officers must have roles explicitly removed first.
  perform user_id from public.memberships where user_id in (p_primary,p_secondary) order by user_id for update;
  if exists(select 1 from public.admin_user_roles where user_id=p_secondary)
    or exists(select 1 from public.memberships where user_id=p_secondary and role<>'regular') then
    raise exception 'The secondary account holds a privileged role. Remove its roles before merging, or retain that account as primary.' using errcode='22023';
  end if;
  if exists(select 1 from public.account_deletion_jobs where user_id in (p_primary,p_secondary)) then
    raise exception 'An account has an account-deletion job. Resolve the deletion job before merging.' using errcode='22023';
  end if;
  if exists(select 1 from public.account_merge_jobs where primary_user_id in (p_primary,p_secondary) and status='pending_auth_delete') then
    raise exception 'Finish the pending auth cleanup for these accounts before starting another merge.' using errcode='22023';
  end if;

  -- Inventory includes every application FK to auth.users/profiles, composite
  -- registration ownership, plus UUID provenance columns without FKs. Immutable
  -- history/provenance stays under the original UUID and the durable alias map.
  for item in select * from (values
    ('profiles','user_id'),('profile_private','user_id'),('memberships','user_id'),
    ('membership_applications','user_id'),('membership_applications','confirmed_by'),
    ('membership_account_restrictions','user_id'),('membership_account_restrictions','updated_by'),
    ('user_preferences','user_id'),('account_age_declarations','user_id'),
    ('mailing_list_subscriptions','user_id'),('mailing_list_consent_events','user_id'),
    ('profile_email_consent_events','user_id'),('membership_checkout_attempts','user_id'),
    ('membership_payments','user_id'),('membership_zelle_payments','user_id'),('membership_zelle_payments','reviewed_by'),
    ('membership_entitlements','user_id'),('membership_access_overrides','user_id'),
    ('membership_access_overrides','granted_by'),('membership_access_overrides','revoked_by'),
    ('membership_review_items','user_id'),('membership_review_items','reviewed_by'),
    ('trips','created_by'),('trips','canceled_by'),('trip_drafts','created_by'),
    ('trip_leaders','user_id'),('trip_rsvps','user_id'),('trip_favorites','user_id'),
    ('trip_attendance','user_id'),('trip_carpools','user_id'),('trip_comments','user_id'),('trip_update_followers','user_id'),
    ('user_interests','user_id'),('user_waivers','user_id'),
    ('registration_responses','user_id'),('registration_offers','user_id'),('registration_offers','issued_by'),
    ('registration_guardian_reviews','user_id'),('registration_guardian_reviews','reviewer_id'),
    ('registration_notifications','user_id'),('registration_signatures','user_id'),('registration_signatures','original_signer_id'),
    ('registration_guardian_evidence','user_id'),('registration_guardian_evidence','reviewer_id'),
    ('registration_annual_guardian_requests','user_id'),('registration_risk_acknowledgements','user_id'),
    ('registration_events','user_id'),('registration_events','actor_id'),('registration_requests','actor_id'),
    ('registration_waiver_requests','actor_id'),('registration_waiver_publications','published_by'),
    ('registration_waiver_withdrawals','withdrawn_by'),('registration_risk_disclosures','created_by'),
    ('gallery_photos','uploaded_by'),('announcements','created_by'),('announcements','updated_by'),
    ('club_hosts','linked_user_id'),('club_admin_settings','updated_by'),('schedule_review_items','reviewed_by'),
    ('admin_user_roles','user_id'),('admin_user_roles','assigned_by'),('admin_activity_events','actor_user_id'),('admin_activity_events','subject_user_id'),
    ('registration_account_merges','primary_id'),('registration_account_merges','secondary_id'),
    ('account_deletion_jobs','user_id'),('account_deletion_jobs','requested_by')
  ) inventory(table_name,column_name) loop
    execute format('select count(*) from public.%I where %I=$1',item.table_name,item.column_name) into n using p_secondary;
    counts:=counts||jsonb_build_object('secondary_'||item.table_name||'_'||item.column_name,n);
  end loop;
  for item in select c.relname as table_name,a.attname as column_name from pg_attribute a
    join pg_class c on c.oid=a.attrelid join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='storage' and c.relname in ('objects','buckets') and c.relkind in ('r','p')
      and a.attname in ('owner','owner_id') and not a.attisdropped loop
    execute format('select count(*) from storage.%I where %I::text=$1',item.table_name,item.column_name) into n using p_secondary::text;
    counts:=counts||jsonb_build_object('secondary_storage_'||item.table_name||'_'||item.column_name,n);
  end loop;
  if p_dry_run is distinct from false then
    return jsonb_build_object('counts',counts,'status','preview','resumed',false);
  end if;

  -- Snapshot every row that can be coalesced/discarded, before registration merge.
  for item in select unnest(array['profiles','profile_private','memberships','membership_applications',
    'membership_account_restrictions','user_preferences','account_age_declarations','mailing_list_subscriptions',
    'trip_rsvps','trip_attendance','registration_responses','registration_guardian_reviews',
    'trip_leaders','trip_favorites','trip_update_followers','user_interests','user_waivers']) as table_name loop
    execute format('select user_id from public.%I where user_id in ($1,$2) order by user_id for update',item.table_name) using p_primary,p_secondary;
    execute format('select coalesce(jsonb_agg(to_jsonb(t)),''[]'') from public.%I t where user_id=$1',item.table_name)
      into right_row using p_secondary;
    snapshot:=snapshot||jsonb_build_object(item.table_name,right_row);
  end loop;

  -- Null profile fields inherit secondary values; keep primary values otherwise.
  -- Whole application/restriction records keep their consistency constraints.
  for item in select unnest(array['profiles','profile_private','memberships','membership_applications',
    'membership_account_restrictions','user_preferences','mailing_list_subscriptions']) as table_name loop
    execute format('select to_jsonb(t) from public.%I t where user_id=$1',item.table_name) into left_row using p_primary;
    execute format('select to_jsonb(t) from public.%I t where user_id=$1',item.table_name) into right_row using p_secondary;
    if right_row is null then continue; end if;
    merged:=right_row||coalesce(jsonb_strip_nulls(left_row),'{}')||jsonb_build_object('user_id',p_primary);
    if item.table_name='profile_private' then
      merged:=merged||jsonb_build_object('notification_settings',coalesce(nullif(right_row->'notification_settings','null'::jsonb),'{}')||coalesce(nullif(left_row->'notification_settings','null'::jsonb),'{}'));
      -- The registration merge below combines all effective category opt-outs.
    elsif item.table_name='memberships' then
      if left_row->>'status'='banned' or right_row->>'status'='banned' then
        merged:=merged||'{"status":"banned"}';
      elsif left_row->>'status'='suspended' or right_row->>'status'='suspended' then
        merged:=merged||'{"status":"suspended"}';
      end if;
    elsif item.table_name='membership_applications' then
      merged:=coalesce(left_row,right_row)||jsonb_build_object('user_id',p_primary);
      if left_row is not null and (left_row->>'age_status'='minor' or right_row->>'age_status'='minor') then
        merged:=merged||'{"age_status":"minor","guardian_consent":"pending","status":"submitted","confirmed_at":null,"confirmed_by":null,"membership_access_override_id":null}';
      end if;
    elsif item.table_name='membership_account_restrictions' then
      if array_position(array['normal','suspended','banned'],coalesce(left_row->>'restriction','normal'))
        >array_position(array['normal','suspended','banned'],right_row->>'restriction') then
        merged:=left_row;
      else merged:=right_row; end if;
      merged:=merged||jsonb_build_object('user_id',p_primary);
    elsif item.table_name='user_preferences' then
      merged:=merged||jsonb_build_object('trip_email_notifications',
        coalesce((left_row->>'trip_email_notifications')::boolean,true) and (right_row->>'trip_email_notifications')::boolean);
    elsif item.table_name='mailing_list_subscriptions' then
      -- Consent belongs to an email address: never opt the retained address in.
      merged:=merged||jsonb_build_object('email',coalesce((select email from auth.users where id=p_primary),left_row->>'email',right_row->>'email'),
        'subscribed',false,'subscribed_at',null,'unsubscribed_at',now());
    end if;
    select string_agg(format('%I=excluded.%I',attname,attname),',') into assignments
      from pg_attribute where attrelid=format('public.%I',item.table_name)::regclass and attnum>0 and not attisdropped and attname<>'user_id';
    execute format('insert into public.%1$I select * from jsonb_populate_record(null::public.%1$I,$1) on conflict(user_id) do update set %2$s',item.table_name,assignments) using merged;
  end loop;

  -- Preserve opt-outs before the helper reads either private row (the primary's
  -- coalescing above must not erase an opt-out from its original settings).
  update public.profile_private set notification_settings=coalesce(notification_settings,'{}')||
    coalesce((select jsonb_object_agg(prefs.key,prefs.value) from jsonb_array_elements(snapshot->'profile_private') row_data,
      lateral jsonb_each(coalesce(nullif(row_data->'notification_settings','null'::jsonb),'{}')) prefs where prefs.value='false'::jsonb),'{}')
  where user_id=p_primary;
  -- Colliding mutable forms/check-ins deterministically retain the primary's
  -- values. The exact secondary rows were archived above; signed evidence is
  -- never changed. Normalize before the legacy registration helper's checks.
  update public.registration_responses s set form_version=p.form_version,answers=p.answers,emergency_contact=p.emergency_contact
    from public.registration_responses p where s.user_id=p_secondary and p.user_id=p_primary and s.trip_id=p.trip_id
      and (s.form_version,s.answers,s.emergency_contact) is distinct from (p.form_version,p.answers,p.emergency_contact);
  update public.trip_attendance s set attended=p.attended from public.trip_attendance p
    where s.user_id=p_secondary and p.user_id=p_primary and s.trip_id=p.trip_id
      and p.attended is not null and s.attended is not null and p.attended<>s.attended;
  perform public.merge_trip_registrations(p_primary,p_secondary);

  -- Partial unique keys: retain primary pending items; preserve the secondary
  -- records as reviewable history, without calling a payment provider.
  update public.membership_checkout_attempts set status='review_required',updated_at=now()
    where user_id=p_secondary and status='open'
    and exists(select 1 from public.membership_checkout_attempts where user_id=p_primary and status='open');
  update public.membership_zelle_payments set status='rejected',reviewed_at=now(),reviewed_by=p_actor,
    internal_note=concat_ws(E'\n',internal_note,'Account merge: duplicate pending claim; review retained payment history.'),updated_at=now()
    where user_id=p_secondary and status='claimed'
    and exists(select 1 from public.membership_zelle_payments where user_id=p_primary and status='claimed');

  insert into public.trip_leaders(trip_id,user_id,created_at) select trip_id,p_primary,created_at from public.trip_leaders where user_id=p_secondary on conflict do nothing;
  insert into public.trip_update_followers(trip_id,user_id,created_at) select trip_id,p_primary,created_at from public.trip_update_followers where user_id=p_secondary on conflict do nothing;
  insert into public.trip_favorites(trip_id,user_id,created_at) select trip_id,p_primary,created_at from public.trip_favorites where user_id=p_secondary on conflict do nothing;
  insert into public.user_interests(user_id,activity_id,experience_level,created_at) select p_primary,activity_id,experience_level,created_at from public.user_interests where user_id=p_secondary on conflict do nothing;
  -- Legacy waiver collisions keep the retained signature; the original is in the private snapshot.
  delete from public.user_waivers s using public.user_waivers p where s.user_id=p_secondary and p.user_id=p_primary and s.waiver_key=p.waiver_key and s.version=p.version;

  for item in select * from (values
    ('trip_drafts','created_by'),('trips','created_by'),('trips','canceled_by'),
    ('trip_carpools','user_id'),('trip_comments','user_id'),('user_waivers','user_id'),
    ('membership_checkout_attempts','user_id'),('membership_payments','user_id'),('membership_zelle_payments','user_id'),
    ('membership_zelle_payments','reviewed_by'),('membership_entitlements','user_id'),
    ('membership_access_overrides','user_id'),('membership_access_overrides','granted_by'),('membership_access_overrides','revoked_by'),
    ('membership_review_items','user_id'),('membership_review_items','reviewed_by'),('membership_applications','confirmed_by'),
    ('membership_account_restrictions','updated_by'),('mailing_list_consent_events','user_id'),
    ('gallery_photos','uploaded_by'),('announcements','created_by'),('announcements','updated_by'),
    ('club_hosts','linked_user_id'),('club_admin_settings','updated_by'),('schedule_review_items','reviewed_by'),
    ('admin_user_roles','assigned_by'),('admin_activity_events','actor_user_id'),('admin_activity_events','subject_user_id'),
    ('account_deletion_jobs','requested_by')
  ) transfer(table_name,column_name) loop
    execute format('update public.%I set %I=$1 where %I=$2',item.table_name,item.column_name,item.column_name) using p_primary,p_secondary;
  end loop;
  -- Storage metadata can also block auth deletion. Storage is absent in some
  -- local test installations; inspect only the two supported ownership columns.
  for item in select c.relname as table_name,a.attname as column_name from pg_attribute a
    join pg_class c on c.oid=a.attrelid join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='storage' and c.relname in ('objects','buckets') and c.relkind in ('r','p')
      and a.attname in ('owner','owner_id') and not a.attisdropped loop
    execute format('update storage.%I set %I=$1::%s where %I::text=$2',item.table_name,item.column_name,
      case when item.column_name='owner' then 'uuid' else 'text' end,item.column_name) using p_primary::text,p_secondary::text;
  end loop;

  -- All profile-owned drafts and mutable rows have moved before any deletion.
  for item in select unnest(array['trip_leaders','trip_favorites','trip_update_followers','user_interests','registration_guardian_reviews',
    'account_age_declarations','profile_private','memberships','membership_applications',
    'membership_account_restrictions','user_preferences','mailing_list_subscriptions']) as table_name loop
    execute format('delete from public.%I where user_id=$1',item.table_name) using p_secondary;
  end loop;
  -- Fail closed if a later schema addition introduces an unhandled owner FK;
  -- a cascade must never silently discard a newly introduced kind of data.
  for item in select c.conrelid::regclass as relation_name,a.attname as column_name
    from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.contype='f' and c.connamespace in ('public'::regnamespace)
      and c.confrelid in ('auth.users'::regclass,'public.profiles'::regclass)
      and c.conrelid<>'public.profiles'::regclass loop
    execute format('select count(*) from %s where %I=$1',item.relation_name,item.column_name) into n using p_secondary;
    if n<>0 then
      raise exception 'Untransferred account data in %.%. Contact an administrator before retrying.',item.relation_name,item.column_name;
    end if;
  end loop;
  delete from public.profiles where user_id=p_secondary;
  update auth.users set banned_until=now()+interval '100 years' where id=p_secondary;
  delete from auth.sessions where user_id=p_secondary;
  insert into public.account_merge_jobs(secondary_user_id,primary_user_id,actor_user_id,counts,secondary_snapshot)
    values(p_secondary,p_primary,p_actor,counts,snapshot);
  insert into public.admin_activity_events(actor_user_id,subject_user_id,action,resource_type,resource_id,summary,before_data,after_data)
    values(p_actor,p_primary,'accounts.merge','account',p_primary::text,'Merged account; auth cleanup pending.',
      jsonb_build_object('secondaryUserId',p_secondary),jsonb_build_object('primaryUserId',p_primary,'counts',counts));
  return jsonb_build_object('counts',counts,'status','pending_auth_delete','resumed',false);
end $$;
revoke all on function public.merge_accounts(uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.merge_accounts(uuid,uuid,uuid,boolean) to service_role;

create or replace function public.complete_account_merge(p_actor uuid,p_primary uuid,p_secondary uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  if p_actor is null or not public.has_admin_capability(p_actor,'accounts.update') then
    raise exception 'Account management permission required.' using errcode='42501';
  end if;
  if exists(select 1 from auth.users where id=p_secondary) then
    raise exception 'Auth cleanup is still pending. Retry the same account merge.' using errcode='22023';
  end if;
  update public.account_merge_jobs set status='completed',completed_at=coalesce(completed_at,now())
    where secondary_user_id=p_secondary and primary_user_id=p_primary;
  if not found then raise exception 'Account merge record not found.' using errcode='22023'; end if;
  return true;
end $$;
revoke all on function public.complete_account_merge(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.complete_account_merge(uuid,uuid,uuid) to service_role;

-- All application merges now use the capability-checked atomic entry point.
revoke execute on function public.merge_trip_registrations(uuid,uuid) from service_role;

-- Stale sessions must not recreate secondary-owned rows between the database
-- commit and an auth API retry. Unchanged historical attribution is allowed.
create or replace function registration_private.reject_merged_account_reference() returns trigger
language plpgsql security definer set search_path='' as $$
declare column_name text; referenced_id uuid; begin
  foreach column_name in array TG_ARGV loop
    begin
      referenced_id:=(to_jsonb(new)->>column_name)::uuid;
    exception when invalid_text_representation then
      -- Storage owner_id may also contain non-UUID identities.
      continue;
    end;
    if TG_OP='UPDATE' and (to_jsonb(new)->>column_name) is not distinct from (to_jsonb(old)->>column_name) then continue; end if;
    if exists(select 1 from public.registration_account_merges where secondary_id=referenced_id) then
      raise exception 'This account has been merged. Use the retained account.' using errcode='22023';
    end if;
  end loop;
  return new;
end $$;
revoke all on function registration_private.reject_merged_account_reference() from public,anon,authenticated,service_role;
do $$ declare item record; begin
  for item in select c.conrelid::regclass as relation_name,string_agg(distinct quote_literal(a.attname),',') as columns
    from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.contype='f' and c.connamespace='public'::regnamespace
      and c.confrelid in ('auth.users'::regclass,'public.profiles'::regclass)
      and c.conrelid<>'public.registration_account_merges'::regclass
    group by c.conrelid order by c.conrelid loop
    execute format('create trigger reject_merged_account_reference before insert or update on %s for each row execute function registration_private.reject_merged_account_reference(%s)',item.relation_name,item.columns);
  end loop;
  for item in select c.oid::regclass as relation_name,string_agg(quote_literal(a.attname),',') as columns
    from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='storage' and c.relname in ('objects','buckets') and c.relkind in ('r','p')
      and a.attname in ('owner','owner_id') and not a.attisdropped group by c.oid loop
    execute format('create trigger reject_merged_account_reference before insert or update on %s for each row execute function registration_private.reject_merged_account_reference(%s)',item.relation_name,item.columns);
  end loop;
end $$;
