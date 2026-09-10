-- Server-side admin loaders and account management need table privileges too.
-- RLS bypass does not itself grant SELECT/INSERT/UPDATE/DELETE privileges.
grant select, insert, update, delete on public.trip_leaders,
  public.trip_private, public.trip_tag_options to service_role;
