-- Apply after deploying the nullable-end registration snapshot schema.
update public.trips set ends_at = null
where id = '771c7bce-afc2-44de-acf5-5b5268ff1bbb'
  and starts_at = '2026-09-13 14:00:00+00'
  and ends_at = '2026-09-14 06:59:59+00';
