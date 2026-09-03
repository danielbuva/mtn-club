-- Provisional applicants may read member trip information but cannot create events.

drop policy if exists trips_insert_unofficial_or_staff_official on public.trips;
create policy trips_insert_unofficial_or_staff_official
on public.trips for insert
with check (
  created_by = auth.uid()
  and not public.is_banned(auth.uid())
  and (
    public.is_active_member(auth.uid())
    or public.is_staff_or_admin(auth.uid())
  )
  and (
    is_official = false
    or public.is_staff_or_admin(auth.uid())
  )
);
;
