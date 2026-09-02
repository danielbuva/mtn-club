alter table public.trips
  alter column difficulty drop not null;

alter table public.trips
  alter column difficulty drop default;
