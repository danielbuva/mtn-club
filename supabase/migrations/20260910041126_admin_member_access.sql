-- This is the authorization helper used by member RLS and registration rules.
-- Keep has_membership_access and membership records tied to real membership.
create or replace function public.is_active_member(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_membership_access(p_uid)
    or public.has_admin_capability(p_uid, 'overview.read');
$$;

revoke execute on function public.is_active_member(uuid) from public, anon;
grant execute on function public.is_active_member(uuid) to authenticated, service_role;

comment on function public.is_active_member(uuid) is
  'Full member authorization: current membership or authorized admin access. Does not grant or record membership; suspended/banned admin roles remain blocked.';
