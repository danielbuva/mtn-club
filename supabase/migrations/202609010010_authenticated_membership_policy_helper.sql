-- Trip write policies evaluate this helper as the authenticated user.

revoke execute on function public.is_active_member(uuid) from public, anon;
grant execute on function public.is_active_member(uuid) to authenticated;
