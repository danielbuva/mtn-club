-- Remove the four exact legacy/demo trips that predate the published Fall 2026
-- schedule. Matching both id and title prevents an accidental broad cleanup.
create temporary table legacy_placeholder_trips on commit drop as
select id
from public.trips
where schedule_key is null
  and (id, title) in (
    ('cdc9d374-b3ae-4487-87f2-5d5ecb8bab82'::uuid, 'Kraft Bouldering'),
    ('568faa96-e369-4920-8f5f-decc22154f73'::uuid, 'Climb, Hike, Snow!'),
    ('97565328-10e5-478a-864b-5b3bd21c269a'::uuid, 'jj'),
    ('a0281b87-006f-4ad2-b46e-c3292848f316'::uuid, 'Zion Trip')
  );

delete from public.trip_attendance
where trip_id in (select id from legacy_placeholder_trips);
delete from public.trip_carpools
where trip_id in (select id from legacy_placeholder_trips);
delete from public.trip_comments
where trip_id in (select id from legacy_placeholder_trips);
delete from public.trip_favorites
where trip_id in (select id from legacy_placeholder_trips);
delete from public.trip_hosts
where trip_id in (select id from legacy_placeholder_trips);
delete from public.trip_leaders
where trip_id in (select id from legacy_placeholder_trips);
delete from public.trip_private
where trip_id in (select id from legacy_placeholder_trips);
delete from public.trip_rsvps
where trip_id in (select id from legacy_placeholder_trips);
delete from public.trip_waivers
where trip_id in (select id from legacy_placeholder_trips);

update public.gallery_photos
set trip_id = null
where trip_id in (select id from legacy_placeholder_trips);

delete from public.trips
where id in (select id from legacy_placeholder_trips);
