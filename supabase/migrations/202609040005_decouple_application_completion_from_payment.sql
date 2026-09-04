-- A completed application may be backed by either a confirmed payment or a
-- complimentary access override. Payment truth lives in the dedicated payment
-- records, so application completion must not require the legacy claim flag.
alter table public.membership_applications
  drop constraint if exists membership_applications_confirmation_state;

alter table public.membership_applications
  add constraint membership_applications_confirmation_state check (
    (status = 'confirmed'
      and guardian_consent in ('not_required', 'confirmed')
      and confirmed_at is not null
      and confirmed_by is not null)
    or (status <> 'confirmed'
      and confirmed_at is null
      and confirmed_by is null
      and membership_access_override_id is null)
  );
