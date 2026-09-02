-- Run against a disposable Supabase project after applying all migrations.
-- Calendar-year arithmetic intentionally maps leap day to February 28.
begin;

do $$
declare
  grant_start timestamptz := '2028-02-29 17:00:00-08'::timestamptz;
  grant_end timestamptz;
begin
  grant_end := (
    (grant_start at time zone 'America/Los_Angeles') + interval '1 year'
  ) at time zone 'America/Los_Angeles';

  if grant_end <> '2029-02-28 17:00:00-08'::timestamptz then
    raise exception 'Unexpected leap-day result: %', grant_end;
  end if;
end $$;

rollback;
