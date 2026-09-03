-- Import the 18 Involvement Center photos that were previously appended only
-- in application code. Their source URLs remain external, but their metadata
-- and publication state now live in the canonical gallery table.
do $$
declare
  v_uploader_id uuid;
begin
  select users.id
  into v_uploader_id
  from auth.users users
  order by
    case lower(users.email)
      when 'valded5@unlv.nevada.edu' then 0
      when 'welcometochilis666@aol.com' then 1
      else 2
    end,
    users.created_at
  limit 1;

  if v_uploader_id is null then
    raise exception 'An Auth account is required before importing gallery photos.';
  end if;

  if not exists (
    select 1
    from public.gallery_photos photos
    where photos.storage_path like
      'https://se-images-blob.campuslabs.com/documents/138/%'
  ) then
    update public.gallery_photos
    set sort_order = sort_order + 18;
  end if;

  insert into public.gallery_photos (
    storage_path,
    title,
    alt_text,
    sort_order,
    is_published,
    uploaded_by
  )
  values
    (
      'https://se-images-blob.campuslabs.com/documents/138/6b649e3c-9b36-419d-d402-08d9cf59c26c/1500.jpg',
      'Bouldering with spotters',
      'A climber works up a sandstone boulder while club members spot from below.',
      0,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/e0a4120f-34ba-4f45-d401-08d9cf59c26c/1500.jpg',
      'Working the boulder problem',
      'A Mountain Club member climbs a tan boulder with two spotters nearby.',
      1,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/ba0f16c2-27c4-4416-d2a3-08d9cf59c26c/1500.jpg',
      'Climbing day',
      'Two climbers move across a broad rock face beneath a blue, cloud-filled sky.',
      2,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/4f394f1d-db1f-472f-d2a2-08d9cf59c26c/1500.jpg',
      'Rock climbing',
      'A climber in red pants ascends a light-colored rock wall.',
      3,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/60678719-0bc4-4e94-d2b0-08d9cf59c26c/1500.jpg',
      'A break in the snow',
      'Club members rest with snowboards on a snowy trail surrounded by trees.',
      4,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/28a7c95f-39ed-4726-d2af-08d9cf59c26c/1500.jpg',
      'At the trail junction',
      'Two helmeted club members pause beside a trail sign on a blue-sky snow day.',
      5,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/3ac0f2d3-eac8-4f11-d2ae-08d9cf59c26c/1500.jpg',
      'Riding through the trees',
      'Snowboarders travel down a snowy trail between tall evergreen trees.',
      6,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/737be852-bfa8-4354-9ceb-08d9cf59c4ce/1500.jpg',
      'Snow day crew',
      'Four Mountain Club members pose together in the snow with skis and snowboards.',
      7,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/2f84f568-012f-4a01-d2ad-08d9cf59c26c/1500.jpg',
      'Camp circle',
      'Club members sit together in camp chairs with desert mountains in the distance.',
      8,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/13898c4d-eba6-468d-9cea-08d9cf59c4ce/1500.jpg',
      'Cooking at camp',
      'A camper prepares food beside a tent as the sky glows near sunset.',
      9,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/2136efa4-e620-47d1-d2ac-08d9cf59c26c/1500.jpg',
      'Camp beneath the mountains',
      'A tent and group campsite sit in open desert beneath a bright blue sky.',
      10,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/251e0fca-0a41-4989-9ce8-08d9cf59c4ce/1500.jpg',
      'Backpacking below the ridge',
      'Backpackers travel through a pine forest beneath a rocky mountain ridge.',
      11,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/fe66e3b1-67c4-4f60-d2a7-08d9cf59c26c/1500.jpg',
      'The trail crew',
      'A group of backpackers pose together on a green mountain trail.',
      12,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/2bfd1423-d54f-4408-9e4c-08d9cf59c4ce/1500.jpg',
      'Sandstone trail',
      'A group hikes single file through a steep sandstone passage.',
      13,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/92db5ce3-581a-4dc4-9e4b-08d9cf59c4ce/1500.jpg',
      'Winter canyon hike',
      'Two hikers walk beside an icy stream at the bottom of a rocky canyon.',
      14,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/abbac296-47d8-4776-d29f-08d9cf59c26c/1500.jpg',
      'Beneath the sandstone',
      'Club members rest on a sandstone ledge beneath a massive rounded boulder.',
      15,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/068683c8-1628-4a60-9cde-08d9cf59c4ce/1500.jpg',
      'Snow in the canyon',
      'Two hikers cross a snow-covered canyon beneath tall gray walls.',
      16,
      true,
      v_uploader_id
    ),
    (
      'https://se-images-blob.campuslabs.com/documents/138/f9e6f79d-8fef-4762-d29e-08d9cf59c26c/1500.jpg',
      'Red rock group hike',
      'A Mountain Club group poses together between towering red sandstone walls.',
      17,
      true,
      v_uploader_id
    )
  on conflict (storage_path) do nothing;
end;
$$;
