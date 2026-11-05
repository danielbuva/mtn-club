-- Commit the enum value before using it in policies or data updates.
alter type public.trip_visibility add value if not exists 'leaders';
