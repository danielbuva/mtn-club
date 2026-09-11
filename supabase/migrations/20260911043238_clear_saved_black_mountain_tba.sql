-- The organizer saved a 7 AM start, but the old editor left the TBA flag set.
-- Only repair that known state; preserve subsequent scheduling changes.
update public.trips
set is_all_day = false
where id = '771c7bce-afc2-44de-acf5-5b5268ff1bbb'
  and starts_at = '2026-09-13 14:00:00+00'::timestamptz
  and time_zone = 'America/Los_Angeles'
  and is_all_day;
