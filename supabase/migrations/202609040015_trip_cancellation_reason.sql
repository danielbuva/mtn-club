-- Cancellation stays public; archiving is the reversible delete operation.
alter table public.trips
  add column if not exists cancellation_reason text;

alter table public.trips
  add constraint trips_cancellation_reason_length
  check (cancellation_reason is null or char_length(cancellation_reason) <= 500);
