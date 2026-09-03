alter table public.trips
  add column if not exists activity_tags text[] not null default '{}';

create table if not exists public.trip_tag_options (
  tag text primary key,
  created_at timestamptz not null default now()
);

insert into public.trip_tag_options (tag)
values
  ('climbing'),
  ('hiking'),
  ('camping'),
  ('backpacking'),
  ('bouldering'),
  ('sport climbing'),
  ('trad climbing'),
  ('beginner friendly'),
  ('carpool'),
  ('overnight')
on conflict (tag) do nothing;;
