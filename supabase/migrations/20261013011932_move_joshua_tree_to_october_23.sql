-- Preserve any confirmed trip times while moving the original weekend one week.
-- Trips already scheduled for October 23 (including production) are unchanged.
update public.trips
set
  starts_at = starts_at + interval '7 days',
  ends_at = ends_at + interval '7 days'
where schedule_key in (
    'fall-2026-camp-climb-joshua-tree',
    'fall-2026-camp-and-climb-in-joshua-tree-national-park'
  )
  and (starts_at at time zone time_zone)::date = date '2026-10-16';
