-- Guard RLS policy functions to avoid errors for unauthenticated users
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trips_select_members ON public.trips;
CREATE POLICY trips_select_members ON public.trips
  FOR SELECT
  USING (
    visibility = 'members'
    AND public.is_authenticated()
    AND public.is_active_member(club_id)
  );

DROP POLICY IF EXISTS trips_select_leaders ON public.trips;
CREATE POLICY trips_select_leaders ON public.trips
  FOR SELECT
  USING (
    visibility = 'leaders_only'
    AND public.is_authenticated()
    AND public.is_leader(club_id)
  );

DROP POLICY IF EXISTS trips_select_invite_stub ON public.trips;
CREATE POLICY trips_select_invite_stub ON public.trips
  FOR SELECT
  USING (
    visibility = 'invite_only'
    AND public.is_authenticated()
    AND public.is_leader(club_id)
  );

DROP POLICY IF EXISTS trips_insert_meetup ON public.trips;
CREATE POLICY trips_insert_meetup ON public.trips
  FOR INSERT
  WITH CHECK (
    public.is_authenticated()
    AND is_official = false
    AND public.is_active_member(club_id)
    AND created_by_membership_id = public.my_membership_id(club_id)
  );

DROP POLICY IF EXISTS trips_insert_official ON public.trips;
CREATE POLICY trips_insert_official ON public.trips
  FOR INSERT
  WITH CHECK (
    public.is_authenticated()
    AND is_official = true
    AND public.is_leader(club_id)
    AND created_by_membership_id = public.my_membership_id(club_id)
  );

DROP POLICY IF EXISTS trips_update_meetup ON public.trips;
CREATE POLICY trips_update_meetup ON public.trips
  FOR UPDATE
  USING (
    public.is_authenticated()
    AND is_official = false
    AND created_by_membership_id = public.my_membership_id(club_id)
  )
  WITH CHECK (
    public.is_authenticated()
    AND is_official = false
    AND created_by_membership_id = public.my_membership_id(club_id)
  );

DROP POLICY IF EXISTS trips_update_official ON public.trips;
CREATE POLICY trips_update_official ON public.trips
  FOR UPDATE
  USING (
    public.is_authenticated()
    AND is_official = true
    AND public.is_leader(club_id)
  )
  WITH CHECK (
    public.is_authenticated()
    AND is_official = true
    AND public.is_leader(club_id)
  );

DROP POLICY IF EXISTS trips_delete_meetup ON public.trips;
CREATE POLICY trips_delete_meetup ON public.trips
  FOR DELETE
  USING (
    public.is_authenticated()
    AND is_official = false
    AND created_by_membership_id = public.my_membership_id(club_id)
  );

DROP POLICY IF EXISTS trips_delete_official ON public.trips;
CREATE POLICY trips_delete_official ON public.trips
  FOR DELETE
  USING (
    public.is_authenticated()
    AND is_official = true
    AND public.is_leader(club_id)
  );
