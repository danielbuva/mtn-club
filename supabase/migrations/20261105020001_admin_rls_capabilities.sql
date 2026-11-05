-- Final-state inventory of legacy officer authorization (schema-only + migrations):
-- * activities INSERT/UPDATE, waiver_templates INSERT/UPDATE -> settings.update.
-- * profile_private SELECT/UPDATE -> self or accounts.read/accounts.update.
-- * profiles UPDATE -> self or accounts.update (public SELECT is intentional).
-- * memberships SELECT -> self or membership.read; UPDATE -> service RPCs only.
-- * user_waivers SELECT -> self or membership.read (writes already revoked).
-- * trip_comments DELETE -> scoped trips.update or the member's own comment.
-- * can_view_trip/can_view_trip_private -> scoped trips.read plus member access.
-- * confirm_zelle_membership_application's legacy role check is replaced in 02.
-- Gallery/storage, hosts, drafts, trip writes and tag options were already
-- narrowed by 202609020001 and 202609050003. Super-admin-only identity/roster,
-- payment reversal and test-trip purge checks remain intentionally stricter.
-- is_active_member deliberately gives admins ordinary member access, per
-- 20260910041126; it does not authorize access to other members' private data.
--
-- App write audit (app/(admin)/** and lib/admin/**):
-- accounts/actions: restriction -> accounts.update; complimentary access ->
-- membership.update RPC; identity/role/deletion writes additionally require
-- super admin. Profile cleanup uses the service client, not member table writes.
-- membership/actions: service RPCs require membership.confirm_payment/guardian;
-- reversing a payment also requires super admin. No authenticated membership
-- UPDATE is needed; signup retains its own pending/regular INSERT policy.
-- trips/actions: scoped trips.official/delete; purge also requires super admin.
-- leadership/actions: leadership.read plus super admin for grants/roster/roles.
-- settings/actions: settings.update for club_terms and club_admin_settings.
-- announcements/actions: announcements.manage. These use the service client.
-- Registration pages use capability-checked RPCs; lib/admin contains no writes.

drop policy if exists activities_write_staff on public.activities;
create policy activities_insert_settings on public.activities
  for insert to authenticated
  with check ((select public.has_admin_capability(auth.uid(), 'settings.update')));

drop policy if exists activities_update_staff on public.activities;
create policy activities_update_settings on public.activities
  for update to authenticated
  using ((select public.has_admin_capability(auth.uid(), 'settings.update')))
  with check ((select public.has_admin_capability(auth.uid(), 'settings.update')));

drop policy if exists memberships_select_self_or_staff on public.memberships;
create policy memberships_select_self_or_membership on public.memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_admin_capability(auth.uid(), 'membership.read'))
  );

-- Membership mutations must preserve entitlement, restriction and audit rules
-- enforced by grant_complimentary_membership_access and payment/guardian RPCs.
drop policy if exists memberships_update_staff_only on public.memberships;
revoke update, delete on public.memberships from authenticated;

drop policy if exists profile_private_select_self_or_staff on public.profile_private;
create policy profile_private_select_self_or_accounts on public.profile_private
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_admin_capability(auth.uid(), 'accounts.read'))
  );

drop policy if exists profile_private_update_self_or_staff on public.profile_private;
create policy profile_private_update_self_or_accounts on public.profile_private
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_admin_capability(auth.uid(), 'accounts.update'))
  )
  with check (
    user_id = (select auth.uid())
    or (select public.has_admin_capability(auth.uid(), 'accounts.update'))
  );

drop policy if exists profiles_update_self_or_staff on public.profiles;
create policy profiles_update_self_or_accounts on public.profiles
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_admin_capability(auth.uid(), 'accounts.update'))
  )
  with check (
    user_id = (select auth.uid())
    or (select public.has_admin_capability(auth.uid(), 'accounts.update'))
  );

drop policy if exists user_waivers_select_self_or_staff on public.user_waivers;
create policy user_waivers_select_self_or_membership on public.user_waivers
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_admin_capability(auth.uid(), 'membership.read'))
  );

drop policy if exists waiver_templates_write_staff on public.waiver_templates;
create policy waiver_templates_insert_settings on public.waiver_templates
  for insert to authenticated
  with check ((select public.has_admin_capability(auth.uid(), 'settings.update')));

drop policy if exists waiver_templates_update_staff on public.waiver_templates;
create policy waiver_templates_update_settings on public.waiver_templates
  for update to authenticated
  using ((select public.has_admin_capability(auth.uid(), 'settings.update')))
  with check ((select public.has_admin_capability(auth.uid(), 'settings.update')));

drop policy if exists trip_comments_delete_staff on public.trip_comments;
create policy trip_comments_delete_self_or_manager on public.trip_comments
  for delete to authenticated
  using (
    public.can_manage_trip(trip_id, (select auth.uid()))
    or (
      user_id = (select auth.uid())
      and (select public.is_active_member(auth.uid()))
      and not (select public.is_banned(auth.uid()))
    )
  );

create or replace function public.can_view_trip(p_trip_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.trips t
    where t.id = p_trip_id
      and (
        t.visibility in ('public', 'minimal')
        or public.has_trip_admin_capability(p_uid, 'trips.read', p_trip_id)
        or public.is_active_member(p_uid)
        or exists (
          select 1 from public.trip_leaders tl
          where tl.trip_id = t.id and tl.user_id = p_uid
        )
        or exists (
          select 1 from public.trip_rsvps r
          where r.trip_id = t.id and r.user_id = p_uid and r.status <> 'removed'
        )
      )
  );
$$;

create or replace function public.can_view_trip_private(p_trip_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    public.has_trip_admin_capability(p_uid, 'trips.read', p_trip_id)
    or public.is_active_member(p_uid)
    or exists (
      select 1 from public.trip_leaders tl
      where tl.trip_id = p_trip_id and tl.user_id = p_uid
    )
    or exists (
      select 1 from public.trip_rsvps r
      where r.trip_id = p_trip_id
        and r.user_id = p_uid
        and r.status in ('invited', 'going', 'maybe', 'waitlisted')
    );
$$;

-- No remaining policy or function should be able to reuse dashboard access as
-- an officer authorization check. No CASCADE: unexpected dependencies fail.
drop function public.is_staff_or_admin(uuid);
