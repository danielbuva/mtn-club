alter table public.trips
  add column if not exists overview_what text,
  add column if not exists overview_where text,
  add column if not exists overview_weather text,
  add column if not exists overview_equipment text,
  add column if not exists overview_carpool_need_gear text;;
