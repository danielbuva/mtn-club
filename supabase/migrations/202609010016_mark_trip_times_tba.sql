-- Current trip times have not been announced. Keep the stored timestamps for
-- date ordering while telling every client not to render them as clock times.
update public.trips
set
  is_all_day = true,
  updated_at = now()
where is_all_day = false;
