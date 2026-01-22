-- Events/trips core extensions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_kind') THEN
    CREATE TYPE public.trip_kind AS ENUM (
      'outdoor',
      'indoor',
      'social',
      'service',
      'admin',
      'travel'
    );
  END IF;
END $$;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS short_summary text,
  ADD COLUMN IF NOT EXISTS kind public.trip_kind,
  ADD COLUMN IF NOT EXISTS activity_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS meetup_time timestamptz,
  ADD COLUMN IF NOT EXISTS arrive_window_start timestamptz,
  ADD COLUMN IF NOT EXISTS arrive_window_end timestamptz,
  ADD COLUMN IF NOT EXISTS leave_window_start timestamptz,
  ADD COLUMN IF NOT EXISTS leave_window_end timestamptz,
  ADD COLUMN IF NOT EXISTS rsvp_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS carpool_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS gear_claim_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS primary_location_name text,
  ADD COLUMN IF NOT EXISTS primary_location_lat double precision,
  ADD COLUMN IF NOT EXISTS primary_location_lng double precision,
  ADD COLUMN IF NOT EXISTS meeting_location_name text,
  ADD COLUMN IF NOT EXISTS meeting_location_lat double precision,
  ADD COLUMN IF NOT EXISTS meeting_location_lng double precision,
  ADD COLUMN IF NOT EXISTS external_links jsonb,
  ADD COLUMN IF NOT EXISTS access_notes text,
  ADD COLUMN IF NOT EXISTS difficulty_level smallint,
  ADD COLUMN IF NOT EXISTS waitlist_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_updated_at timestamptz;

-- Profiles (app_users) extensions
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS emergency_contact jsonb,
  ADD COLUMN IF NOT EXISTS privacy_settings jsonb,
  ADD COLUMN IF NOT EXISTS travel_profile jsonb,
  ADD COLUMN IF NOT EXISTS gear_profile jsonb,
  ADD COLUMN IF NOT EXISTS skills_certs jsonb,
  ADD COLUMN IF NOT EXISTS interests_preferences jsonb,
  ADD COLUMN IF NOT EXISTS notification_settings jsonb;

-- RLS: trips/events
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trips_select_public ON public.trips;
CREATE POLICY trips_select_public ON public.trips
  FOR SELECT
  USING (visibility = 'public');

DROP POLICY IF EXISTS trips_select_members ON public.trips;
CREATE POLICY trips_select_members ON public.trips
  FOR SELECT
  USING (
    visibility = 'members'
    AND public.is_active_member(club_id)
  );

DROP POLICY IF EXISTS trips_select_leaders ON public.trips;
CREATE POLICY trips_select_leaders ON public.trips
  FOR SELECT
  USING (
    visibility = 'leaders_only'
    AND public.is_leader(club_id)
  );

DROP POLICY IF EXISTS trips_select_invite_stub ON public.trips;
CREATE POLICY trips_select_invite_stub ON public.trips
  FOR SELECT
  USING (
    visibility = 'invite_only'
    AND public.is_leader(club_id)
  );

DROP POLICY IF EXISTS trips_insert_meetup ON public.trips;
CREATE POLICY trips_insert_meetup ON public.trips
  FOR INSERT
  WITH CHECK (
    is_official = false
    AND public.is_active_member(club_id)
    AND created_by_membership_id = public.my_membership_id(club_id)
  );

DROP POLICY IF EXISTS trips_insert_official ON public.trips;
CREATE POLICY trips_insert_official ON public.trips
  FOR INSERT
  WITH CHECK (
    is_official = true
    AND public.is_leader(club_id)
    AND created_by_membership_id = public.my_membership_id(club_id)
  );

DROP POLICY IF EXISTS trips_update_meetup ON public.trips;
CREATE POLICY trips_update_meetup ON public.trips
  FOR UPDATE
  USING (
    is_official = false
    AND created_by_membership_id = public.my_membership_id(club_id)
  )
  WITH CHECK (
    is_official = false
    AND created_by_membership_id = public.my_membership_id(club_id)
  );

DROP POLICY IF EXISTS trips_update_official ON public.trips;
CREATE POLICY trips_update_official ON public.trips
  FOR UPDATE
  USING (
    is_official = true
    AND public.is_leader(club_id)
  )
  WITH CHECK (
    is_official = true
    AND public.is_leader(club_id)
  );

DROP POLICY IF EXISTS trips_delete_meetup ON public.trips;
CREATE POLICY trips_delete_meetup ON public.trips
  FOR DELETE
  USING (
    is_official = false
    AND created_by_membership_id = public.my_membership_id(club_id)
  );

DROP POLICY IF EXISTS trips_delete_official ON public.trips;
CREATE POLICY trips_delete_official ON public.trips
  FOR DELETE
  USING (
    is_official = true
    AND public.is_leader(club_id)
  );

-- RLS: app_users (profiles)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_users_select_own ON public.app_users;
CREATE POLICY app_users_select_own ON public.app_users
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS app_users_insert_own ON public.app_users;
CREATE POLICY app_users_insert_own ON public.app_users
  FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS app_users_update_own ON public.app_users;
CREATE POLICY app_users_update_own ON public.app_users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
