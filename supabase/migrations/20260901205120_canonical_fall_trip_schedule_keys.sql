-- Keep persisted schedule keys aligned with the canonical title-derived keys.

update public.trips
set schedule_key = 'fall-2026-camp-and-climb-in-joshua-tree-national-park'
where schedule_key = 'fall-2026-camp-climb-joshua-tree';

update public.trips
set schedule_key = 'fall-2026-camp-climb-and-hike-in-zion-national-park'
where schedule_key = 'fall-2026-camp-climb-hike-zion';

update public.trips
set schedule_key = 'fall-2026-camp-and-climb-in-bishop'
where schedule_key = 'fall-2026-camp-climb-bishop';;
