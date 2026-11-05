-- Reconcile the independently authored 0100/0200/0400/0500/0800/0900 fixes.
-- No policy names collide. Preserve the operation-specific policies and ACLs;
-- replace the overlapping functions and the definer paths that bypassed them.
begin;

-- Members/RSVPs and unrelated admin capabilities never grant leaders access.
create or replace function public.can_view_trip(p_trip_id uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t where t.id = p_trip_id and (
      case when t.visibility in ('leaders', 'minimal') then
        p_uid is not null and (
          public.has_trip_admin_capability(p_uid, 'trips.read', t.id)
          or public.has_trip_admin_capability(p_uid, 'trips.update', t.id)
          or exists (select 1 from public.trip_leaders l
            where l.trip_id = t.id and l.user_id = p_uid)
        )
      else
        t.visibility = 'public'
        or public.has_trip_admin_capability(p_uid, 'trips.read', t.id)
        or public.is_active_member(p_uid)
        or exists (select 1 from public.trip_leaders l
          where l.trip_id = t.id and l.user_id = p_uid)
        or exists (select 1 from public.trip_rsvps r
          where r.trip_id = t.id and r.user_id = p_uid and r.status <> 'removed')
      end
    )
  );
$$;

create or replace function public.can_view_trip_private(p_trip_id uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t where t.id = p_trip_id and (
      case when t.visibility in ('leaders', 'minimal') then
        public.can_view_trip(t.id, p_uid)
      else
        public.has_trip_admin_capability(p_uid, 'trips.read', t.id)
        or public.is_active_member(p_uid)
        or exists (select 1 from public.trip_leaders l
          where l.trip_id = t.id and l.user_id = p_uid)
        or exists (select 1 from public.trip_rsvps r
          where r.trip_id = t.id and r.user_id = p_uid
            and r.status in ('invited', 'going', 'maybe', 'waitlisted'))
      end
    )
  );
$$;

-- Preserve both configured payment-review permission and centralized eligibility,
-- using the renewal-aware payment/entitlement path instead of legacy overrides.
create or replace function public.confirm_zelle_membership_application(
  p_user_id uuid, p_reviewer_id uuid
)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_payment_id uuid;
  v_ineligible text;
  v_end timestamptz;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  if not public.has_admin_capability(p_reviewer_id, 'membership.confirm_payment') then
    raise exception 'payment review permission required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  v_ineligible := public.membership_activation_ineligibility(p_user_id);
  if v_ineligible is not null then raise exception '%', v_ineligible; end if;
  v_payment_id := public.set_zelle_membership_payment_status(
    p_user_id, p_reviewer_id, 'confirmed', null
  );
  select ends_at into v_end from public.membership_entitlements
  where zelle_payment_id = v_payment_id and revoked_at is null;
  return v_end;
end;
$$;
revoke all on function public.confirm_zelle_membership_application(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_zelle_membership_application(uuid, uuid) to service_role;


-- Authorize the actor, never the historical creator. RLS still governs row access.
create or replace function public.enforce_unofficial_trip_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_limit integer;
  v_count integer;
begin
  -- Only trusted backend/maintenance sessions may use the durable merge map.
  -- JWT role claims alone cannot turn a member's ownership edit into a merge.
  if tg_op = 'UPDATE'
    and new.created_by is distinct from old.created_by
    and (to_jsonb(new) - 'created_by' - 'updated_at') = (to_jsonb(old) - 'created_by' - 'updated_at')
    and (current_setting('role', true) = 'service_role'
      or (session_user in ('postgres', 'supabase_admin')
        and current_setting('role', true) in ('none', 'postgres', 'supabase_admin')
        and public.has_admin_capability(v_actor, 'accounts.update')))
    and exists (select 1 from public.registration_account_merges
      where secondary_id = old.created_by and primary_id = new.created_by) then
    return new;
  end if;

  -- Background imports/schedule sync have no end-user actor.
  if current_setting('role', true) = 'service_role'
    or (v_actor is null and session_user in ('postgres', 'supabase_admin')
      and current_setting('role', true) in ('none', 'postgres', 'supabase_admin')) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.starts_at, new.is_official, new.lifecycle_status, new.created_by)
      is not distinct from (old.starts_at, old.is_official, old.lifecycle_status, old.created_by) then
      return new;
    end if;
    if not public.can_manage_trip(old.id, v_actor) then
      raise exception 'Trip management permission required.';
    end if;
    -- Official permission is required to promote, not to maintain an existing trip.
    if new.is_official and not old.is_official
      and not public.has_admin_capability(v_actor, 'trips.official') then
      raise exception 'official trip permission required';
    end if;
    if new.is_official or public.has_trip_admin_capability(v_actor, 'trips.update', old.id) then
      return new;
    end if;
    -- Canceling/archiving does not consume an upcoming-trip slot.
    if new.lifecycle_status <> 'published' then return new; end if;
  else
    if v_actor is null or new.created_by is distinct from v_actor then
      raise exception 'Trip creator must be the current actor.';
    end if;
    if new.is_official then
      if not public.has_admin_capability(v_actor, 'trips.official') then
        raise exception 'official trip permission required';
      end if;
      return new;
    end if;
    if public.has_admin_capability(v_actor, 'trips.create') then return new; end if;
  end if;

  if not public.is_active_member(v_actor) or public.is_banned(v_actor)
    or exists (
      select 1 from public.membership_account_restrictions
      where user_id = v_actor and restriction in ('suspended', 'banned')
    ) then
    raise exception 'active unrestricted membership required';
  end if;
  if new.lifecycle_status <> 'published' or new.starts_at <= now() then return new; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_actor::text, 11));
  select non_admin_upcoming_trip_limit into v_limit from public.club_admin_settings where id;
  select count(*) into v_count from public.trips
  where created_by = v_actor and not is_official
    and lifecycle_status = 'published' and starts_at > now()
    and (tg_op = 'INSERT' or id <> new.id);
  if v_count >= coalesce(v_limit, 2) then
    raise exception 'unofficial upcoming trip limit reached';
  end if;
  return new;
end;
$$;

-- Renewal claims/terms and signup checkpoints already use the existing transfer
-- loops. Extend the inventory, private snapshot and transfer to publication receipts.
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
  select count(*) into n from trip_write_private.draft_publications where draft_owner_id=p_secondary;
  counts:=counts||jsonb_build_object('secondary_draft_publications_draft_owner_id',n);
  select count(*) into n from trip_write_private.draft_publications where published_by=p_secondary;
  counts:=counts||jsonb_build_object('secondary_draft_publications_published_by',n);
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

  -- Receipts confer retry/read access and have UUID owners without auth FKs.
  -- Archive original attribution before transferring that access to the primary.
  perform draft_id from trip_write_private.draft_publications
    where draft_owner_id in (p_primary,p_secondary) or published_by in (p_primary,p_secondary)
    order by draft_id for update;
  select coalesce(jsonb_agg(to_jsonb(r)), '[]') into right_row
    from trip_write_private.draft_publications r
    where draft_owner_id=p_secondary or published_by=p_secondary;
  snapshot:=snapshot||jsonb_build_object('draft_publications',right_row);

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
    if item.table_name='membership_applications' then
      -- membership_access_override_id is unique: release the source row's
      -- reference before the retained row takes it over.
      update public.membership_applications set membership_access_override_id=null
        where user_id=p_secondary and membership_access_override_id is not null;
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
  update trip_write_private.draft_publications
    set draft_owner_id=case when draft_owner_id=p_secondary then p_primary else draft_owner_id end,
        published_by=case when published_by=p_secondary then p_primary else published_by end
    where draft_owner_id=p_secondary or published_by=p_secondary;
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
    where c.contype='f' and c.connamespace in ('public'::regnamespace,'trip_write_private'::regnamespace)
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

-- Repair receipts left behind by merges run after 0800 but before this migration.
-- Preserve original attribution in the existing private job before moving access,
-- including completed jobs that the idempotent merge RPC will no longer transfer.
with receipts as (
  select j.secondary_user_id, jsonb_agg(to_jsonb(r) order by r.draft_id) as snapshot,
    count(*) filter (where r.draft_owner_id=j.secondary_user_id) as owner_count,
    count(*) filter (where r.published_by=j.secondary_user_id) as publisher_count
  from public.account_merge_jobs j join trip_write_private.draft_publications r
    on r.draft_owner_id=j.secondary_user_id or r.published_by=j.secondary_user_id
  where not (j.secondary_snapshot ? 'draft_publications')
  group by j.secondary_user_id
)
update public.account_merge_jobs j
set secondary_snapshot=j.secondary_snapshot||jsonb_build_object('draft_publications',r.snapshot),
    counts=j.counts||jsonb_build_object('secondary_draft_publications_draft_owner_id',r.owner_count,
      'secondary_draft_publications_published_by',r.publisher_count)
from receipts r where r.secondary_user_id=j.secondary_user_id;

update trip_write_private.draft_publications r set draft_owner_id=m.primary_id
from public.registration_account_merges m where r.draft_owner_id=m.secondary_id;
update trip_write_private.draft_publications r set published_by=m.primary_id
from public.registration_account_merges m where r.published_by=m.secondary_id;

-- New receipt ownership must obey the same stale-session guard as public rows.
create trigger reject_merged_account_reference before insert or update
on trip_write_private.draft_publications for each row
execute function registration_private.reject_merged_account_reference('draft_owner_id', 'published_by');

-- A publication receipt cannot bypass leaders visibility after access is revoked.
create or replace function public.get_published_trip_for_draft(p_draft_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in required.'; end if;
  if registration_private.blocked(auth.uid()) or exists (
    select 1 from public.registration_account_merges where secondary_id=auth.uid()
  ) then raise exception 'Sign in with an eligible retained account.'; end if;
  return (select trip_id from trip_write_private.draft_publications
    where draft_id = p_draft_id and auth.uid() in (draft_owner_id, published_by)
      and public.can_view_trip(trip_id, auth.uid()));
end;
$$;

-- All publication writes, including the registration/risk configuration and
-- draft consumption, commit together. Serialize by draft ID even after deletion.
create or replace function public.publish_trip_draft(
  p_draft_id uuid,
  p_data jsonb,
  p_meetup_point text,
  p_public_host_ids uuid[],
  p_leader_user_ids uuid[],
  p_risk_statements text[],
  p_waiver_activities text[],
  p_registration_enabled boolean,
  p_collect_transportation boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_trip public.trips;
  v_draft public.trip_drafts;
  v_receipt trip_write_private.draft_publications;
  v_settings public.trip_registration_settings;
begin
  if v_actor is null then raise exception 'Sign in required.'; end if;
  if registration_private.blocked(v_actor) or exists (
    select 1 from public.registration_account_merges where secondary_id=v_actor
  ) then raise exception 'Sign in with an eligible retained account.'; end if;
  if p_draft_id is null then raise exception 'Save a draft before publishing.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_draft_id::text, 80500));
  select * into v_receipt from trip_write_private.draft_publications where draft_id = p_draft_id;
  if found then
    if v_actor not in (v_receipt.draft_owner_id, v_receipt.published_by) then
      raise exception 'Draft publication access required.';
    end if;
    if not public.can_view_trip(v_receipt.trip_id, v_actor) then
      raise exception 'Trip not available.';
    end if;
    return v_receipt.trip_id;
  end if;
  if registration_private.blocked(v_actor)
    or not (public.is_active_member(v_actor) or public.has_admin_capability(v_actor, 'trips.create'))
    or not exists(select 1 from public.profiles where user_id = v_actor) then
    raise exception 'Active membership or trip administration access required.';
  end if;
  select * into v_draft from public.trip_drafts where id = p_draft_id for update;
  if not found then raise exception 'Draft not found. Refresh and try again.'; end if;
  if v_draft.created_by <> v_actor and (
    public.admin_capability_scope(v_actor, 'trips.read') = 'all'
    and public.admin_capability_scope(v_actor, 'trips.delete') = 'all'
  ) is not true then
    raise exception 'Draft publication access required.';
  end if;
  if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text) > 200000
    or exists(select 1 from jsonb_object_keys(p_data) k where k <> all(array[
      'title', 'event_kind', 'registration_opens_at', 'rsvp_deadline', 'waitlist_enabled',
      'elevation_ft', 'starts_at', 'ends_at', 'time_zone', 'activity_tags', 'visibility',
      'difficulty', 'location_public', 'description_public', 'overview_what', 'overview_where',
      'overview_weather', 'overview_equipment', 'overview_carpool_need_gear', 'capacity',
      'is_official', 'is_all_day'
    ])) then
    raise exception 'Invalid event publication.';
  end if;
  v_trip := jsonb_populate_record(null::public.trips,
    '{"event_kind":"outdoor","waitlist_enabled":false,"time_zone":"America/Los_Angeles","activity_tags":[],"is_official":false,"is_all_day":false}'::jsonb || p_data);
  v_trip.id := gen_random_uuid();
  v_trip.created_by := v_actor;
  perform trip_write_private.validate_trip(v_trip);
  if nullif(trim(v_trip.location_public), '') is null then raise exception 'Primary location is required.'; end if;
  if v_trip.is_official and not public.has_admin_capability(v_actor, 'trips.official') then
    raise exception 'official trip permission required';
  end if;
  if p_registration_enabled is null or p_collect_transportation is null then
    raise exception 'Choose registration and transportation settings.';
  end if;
  perform trip_write_private.validate_assignments(p_public_host_ids, p_leader_user_ids);
  if (cardinality(p_public_host_ids) > 0 or cardinality(p_leader_user_ids) > 0)
    and not public.has_admin_capability(v_actor, 'trips.update') then
    raise exception 'Trip management permission is required to assign hosts.';
  end if;

  insert into public.trips(id, created_by, title, event_kind, registration_opens_at, rsvp_deadline,
    waitlist_enabled, elevation_ft, starts_at, ends_at, time_zone, activity_tags, visibility,
    difficulty, location_public, description_public, overview_what, overview_where, overview_weather,
    overview_equipment, overview_carpool_need_gear, capacity, is_official, is_all_day)
  values(v_trip.id, v_actor, v_trip.title, v_trip.event_kind, v_trip.registration_opens_at, v_trip.rsvp_deadline,
    v_trip.waitlist_enabled, v_trip.elevation_ft, v_trip.starts_at, v_trip.ends_at, v_trip.time_zone,
    v_trip.activity_tags, v_trip.visibility, v_trip.difficulty, v_trip.location_public,
    v_trip.description_public, v_trip.overview_what, v_trip.overview_where, v_trip.overview_weather,
    v_trip.overview_equipment, v_trip.overview_carpool_need_gear, v_trip.capacity, v_trip.is_official, v_trip.is_all_day);
  if public.has_admin_capability(v_actor, 'trips.update') then
    insert into public.trip_tag_options(tag)
    select distinct tag from unnest(v_trip.activity_tags) t(tag) on conflict(tag) do nothing;
  end if;
  if p_meetup_point is not null then
    insert into public.trip_private(trip_id, meetup_point) values(v_trip.id, p_meetup_point);
  end if;
  if cardinality(p_public_host_ids) > 0 or cardinality(p_leader_user_ids) > 0 then
    -- Preserve the existing per-trip assignment capability check for scoped admins.
    if not public.has_trip_admin_capability(v_actor, 'trips.update', v_trip.id) then
      raise exception 'Trip management permission is required to assign hosts.';
    end if;
    perform trip_write_private.replace_assignments(v_trip.id, p_public_host_ids, p_leader_user_ids);
  end if;
  perform public.set_trip_transportation_collection(v_trip.id, p_collect_transportation);
  perform public.save_trip_informed_risks(v_trip.id, 0, p_risk_statements, p_waiver_activities);
  if p_registration_enabled then
    select * into v_settings from public.trip_registration_settings where trip_id = v_trip.id;
    perform public.save_registration_settings(v_trip.id, v_settings.revision, jsonb_build_object(
      'enabled', true, 'eligibility', v_settings.eligibility,
      'emergencyRequired', v_settings.emergency_required, 'waiverRequired', v_settings.waiver_required,
      'questions', v_settings.questions, 'capacity', v_trip.capacity, 'waitlistEnabled', v_trip.waitlist_enabled,
      'deadline', v_trip.rsvp_deadline, 'opensAt', v_trip.registration_opens_at,
      'offerHours', v_settings.offer_hours, 'collectTransportation', p_collect_transportation
    ));
  end if;
  insert into trip_write_private.draft_publications(draft_id, draft_owner_id, published_by, trip_id)
  values(p_draft_id, v_draft.created_by, v_actor, v_trip.id);
  delete from public.trip_drafts where id = p_draft_id;
  return v_trip.id;
end;
$$;

revoke all on function public.get_published_trip_for_draft(uuid) from public, anon, service_role;
revoke all on function public.publish_trip_draft(uuid, jsonb, text, uuid[], uuid[], text[], text[], boolean, boolean) from public, anon, service_role;
grant execute on function public.get_published_trip_for_draft(uuid) to authenticated;
grant execute on function public.publish_trip_draft(uuid, jsonb, text, uuid[], uuid[], text[], text[], boolean, boolean) to authenticated;

-- Aggregate permission does not grant access to leaders trips or their metadata.
create or replace function public.get_admin_analytics_totals(p_range_start timestamptz default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_admin_capability(auth.uid(), 'analytics.read') then
    raise exception 'Analytics permission required.' using errcode = '42501';
  end if;
  return registration_private.admin_membership_counts(null, null) || (
    with trips as (
      select * from public.trips
      where public.can_view_trip(id, auth.uid())
        and (p_range_start is null or starts_at >= p_range_start)
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
        and public.can_view_trip(id, auth.uid())
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

commit;
