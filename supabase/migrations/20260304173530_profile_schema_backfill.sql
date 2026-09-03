alter table public.profiles
  add column if not exists username text;

alter table public.profile_private
  add column if not exists privacy_settings jsonb,
  add column if not exists travel_profile jsonb,
  add column if not exists skills_certs jsonb,
  add column if not exists interests_preferences jsonb,
  add column if not exists notification_settings jsonb;;
