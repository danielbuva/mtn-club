-- Provisional applicants may read member trip information, but trip mutations
-- require a confirmed membership grant or trip-management privileges.

drop policy if exists trip_rsvps_insert_self_basic_or_manager_any
  on public.trip_rsvps;
create policy trip_rsvps_insert_self_basic_or_manager_any
on public.trip_rsvps for insert
to authenticated
with check (
  not public.is_banned(auth.uid())
  and (
    public.can_manage_trip(trip_id, auth.uid())
    or (
      user_id = auth.uid()
      and public.is_active_member(auth.uid())
      and public.can_view_trip(trip_id, auth.uid())
      and status in ('going', 'maybe', 'not_going')
    )
  )
);

drop policy if exists trip_rsvps_update_self_or_manager
  on public.trip_rsvps;
create policy trip_rsvps_update_self_or_manager
on public.trip_rsvps for update
to authenticated
using (
  not public.is_banned(auth.uid())
  and (
    public.can_manage_trip(trip_id, auth.uid())
    or (user_id = auth.uid() and public.is_active_member(auth.uid()))
  )
)
with check (
  not public.is_banned(auth.uid())
  and (
    public.can_manage_trip(trip_id, auth.uid())
    or (
      user_id = auth.uid()
      and public.is_active_member(auth.uid())
      and status in ('going', 'maybe', 'not_going')
    )
  )
);

drop policy if exists trip_carpools_insert_self on public.trip_carpools;
create policy trip_carpools_insert_self
on public.trip_carpools for insert
to authenticated
with check (
  user_id = auth.uid()
  and not public.is_banned(auth.uid())
  and public.is_active_member(auth.uid())
  and public.can_view_trip(trip_id, auth.uid())
);

drop policy if exists trip_carpools_update_self_or_manager
  on public.trip_carpools;
create policy trip_carpools_update_self_or_manager
on public.trip_carpools for update
to authenticated
using (
  not public.is_banned(auth.uid())
  and (
    public.can_manage_trip(trip_id, auth.uid())
    or (user_id = auth.uid() and public.is_active_member(auth.uid()))
  )
)
with check (
  not public.is_banned(auth.uid())
  and (
    public.can_manage_trip(trip_id, auth.uid())
    or (user_id = auth.uid() and public.is_active_member(auth.uid()))
  )
);

drop policy if exists trip_carpools_delete_self_or_manager
  on public.trip_carpools;
create policy trip_carpools_delete_self_or_manager
on public.trip_carpools for delete
to authenticated
using (
  public.can_manage_trip(trip_id, auth.uid())
  or (
    user_id = auth.uid()
    and not public.is_banned(auth.uid())
    and public.is_active_member(auth.uid())
  )
);

drop policy if exists trip_comments_insert_memberish on public.trip_comments;
create policy trip_comments_insert_memberish
on public.trip_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and not public.is_banned(auth.uid())
  and public.can_view_trip(trip_id, auth.uid())
  and (
    public.is_active_member(auth.uid())
    or public.can_manage_trip(trip_id, auth.uid())
  )
);

drop policy if exists trip_comments_update_self_or_staff
  on public.trip_comments;
create policy trip_comments_update_self_or_staff
on public.trip_comments for update
to authenticated
using (
  public.can_manage_trip(trip_id, auth.uid())
  or (
    user_id = auth.uid()
    and not public.is_banned(auth.uid())
    and public.is_active_member(auth.uid())
  )
)
with check (
  public.can_manage_trip(trip_id, auth.uid())
  or (
    user_id = auth.uid()
    and not public.is_banned(auth.uid())
    and public.is_active_member(auth.uid())
  )
);

drop policy if exists trip_attendance_insert_self on public.trip_attendance;
create policy trip_attendance_insert_self
on public.trip_attendance for insert
to authenticated
with check (
  user_id = auth.uid()
  and not public.is_banned(auth.uid())
  and public.is_active_member(auth.uid())
  and public.can_view_trip(trip_id, auth.uid())
);

drop policy if exists trip_attendance_update_self on public.trip_attendance;
create policy trip_attendance_update_self
on public.trip_attendance for update
to authenticated
using (
  user_id = auth.uid()
  and not public.is_banned(auth.uid())
  and public.is_active_member(auth.uid())
)
with check (
  user_id = auth.uid()
  and not public.is_banned(auth.uid())
  and public.is_active_member(auth.uid())
);
