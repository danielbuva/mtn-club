-- Public trips should not require an authenticated-only policy helper.

drop policy if exists trips_select_by_visibility_or_access on public.trips;

create policy trips_select_public
on public.trips for select
to anon, authenticated
using (visibility in ('public', 'minimal'));

create policy trips_select_authenticated_by_access
on public.trips for select
to authenticated
using (public.can_view_trip_readonly(id));
