-- The original activity seed included a difficulty description. Preserve any
-- explicit difficulty; only infer beginner when the field was never set.
update public.trips
set difficulty = coalesce(difficulty, 'beginner'),
    activity_tags = array(
      select tag from unnest(activity_tags) tag
      where regexp_replace(lower(trim(tag)), '[-\s]+', ' ', 'g') <> 'beginner friendly'
    )
where exists (
  select 1 from unnest(activity_tags) tag
  where regexp_replace(lower(trim(tag)), '[-\s]+', ' ', 'g') = 'beginner friendly'
);

update public.trip_drafts
set difficulty = coalesce(difficulty, 'beginner'),
    activity_tags = array(
      select tag from unnest(activity_tags) tag
      where regexp_replace(lower(trim(tag)), '[-\s]+', ' ', 'g') <> 'beginner friendly'
    )
where exists (
  select 1 from unnest(activity_tags) tag
  where regexp_replace(lower(trim(tag)), '[-\s]+', ' ', 'g') = 'beginner friendly'
);

delete from public.trip_tag_options
where regexp_replace(lower(trim(tag)), '[-\s]+', ' ', 'g') = 'beginner friendly';
