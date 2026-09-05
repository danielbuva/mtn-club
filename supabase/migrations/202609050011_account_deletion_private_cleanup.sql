-- The server-side deletion worker only needs to locate and scrub these private fields.
-- No private-data read or delete privileges are added.
grant select(user_id) on public.profile_private to service_role;
grant update(phone,birthday,emergency_contact,carpool_profile,gear_profile,
 privacy_settings,travel_profile,skills_certs,interests_preferences,notification_settings)
 on public.profile_private to service_role;
