-- Analytics uses a server-only Supabase service-role client. The trips table
-- predates the admin system and did not have an explicit service-role grant.
grant select, insert, update, delete on table public.trips to service_role;
