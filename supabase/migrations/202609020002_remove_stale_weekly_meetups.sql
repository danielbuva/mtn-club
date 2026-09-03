-- Tuesday and Thursday climbing meetups were removed from the event inventory.
-- Clear rows created by the old Fall 2026 recurring-meetup seed and their
-- dependent operational records so direct admin queries cannot surface them.
create temporary table stale_weekly_meetup_trips on commit drop as
select id
from public.trips
where schedule_key like 'fall-2026-weekly-%';

delete from public.trip_attendance
where trip_id in (select id from stale_weekly_meetup_trips);

delete from public.trip_carpools
where trip_id in (select id from stale_weekly_meetup_trips);

delete from public.trip_comments
where trip_id in (select id from stale_weekly_meetup_trips);

delete from public.trip_favorites
where trip_id in (select id from stale_weekly_meetup_trips);

delete from public.trip_hosts
where trip_id in (select id from stale_weekly_meetup_trips);

delete from public.trip_leaders
where trip_id in (select id from stale_weekly_meetup_trips);

delete from public.trip_private
where trip_id in (select id from stale_weekly_meetup_trips);

delete from public.trip_rsvps
where trip_id in (select id from stale_weekly_meetup_trips);

delete from public.trip_waivers
where trip_id in (select id from stale_weekly_meetup_trips);

update public.gallery_photos
set trip_id = null
where trip_id in (select id from stale_weekly_meetup_trips);

delete from public.schedule_review_items
where schedule_key like 'fall-2026-weekly-%';

delete from public.trips
where id in (select id from stale_weekly_meetup_trips);
