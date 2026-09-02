-- Membership sign-up is completed by a server action using the service role.
-- These legacy tables predate the explicit service-role grants used by the
-- newer membership application tables.
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.memberships to service_role;
