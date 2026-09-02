-- Weekly meetups are evergreen frontend copy, not individual trip records.
create temporary table weekly_meetup_trips on commit drop as
select id
from public.trips
where schedule_key like 'fall-2026-weekly-%';

delete from public.trip_attendance
where trip_id in (select id from weekly_meetup_trips);
delete from public.trip_carpools
where trip_id in (select id from weekly_meetup_trips);
delete from public.trip_comments
where trip_id in (select id from weekly_meetup_trips);
delete from public.trip_favorites
where trip_id in (select id from weekly_meetup_trips);
delete from public.trip_hosts
where trip_id in (select id from weekly_meetup_trips);
delete from public.trip_leaders
where trip_id in (select id from weekly_meetup_trips);
delete from public.trip_private
where trip_id in (select id from weekly_meetup_trips);
delete from public.trip_rsvps
where trip_id in (select id from weekly_meetup_trips);
delete from public.trip_waivers
where trip_id in (select id from weekly_meetup_trips);

update public.gallery_photos
set trip_id = null
where trip_id in (select id from weekly_meetup_trips);

delete from public.schedule_review_items
where schedule_key like 'fall-2026-weekly-%';

delete from public.trips
where id in (select id from weekly_meetup_trips);
