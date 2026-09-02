import type { PublicGalleryPhoto } from '@/lib/gallery/queries'

const involvementImageUrl = (documentId: string) =>
  `https://se-images-blob.campuslabs.com/documents/138/${documentId}/1500.jpg`

const photo = (
  documentId: string,
  title: string,
  altText: string,
): PublicGalleryPhoto => ({
  id: `involvement-center-${documentId}`,
  title,
  alt_text: altText,
  caption: null,
  taken_on: null,
  trip_id: null,
  imageUrl: involvementImageUrl(documentId),
})

export const involvementCenterGalleryPhotos: PublicGalleryPhoto[] = [
  photo(
    '6b649e3c-9b36-419d-d402-08d9cf59c26c',
    'Bouldering with spotters',
    'A climber works up a sandstone boulder while club members spot from below.',
  ),
  photo(
    'e0a4120f-34ba-4f45-d401-08d9cf59c26c',
    'Working the boulder problem',
    'A Mountain Club member climbs a tan boulder with two spotters nearby.',
  ),
  photo(
    'ba0f16c2-27c4-4416-d2a3-08d9cf59c26c',
    'Climbing day',
    'Two climbers move across a broad rock face beneath a blue, cloud-filled sky.',
  ),
  photo(
    '4f394f1d-db1f-472f-d2a2-08d9cf59c26c',
    'Rock climbing',
    'A climber in red pants ascends a light-colored rock wall.',
  ),
  photo(
    '60678719-0bc4-4e94-d2b0-08d9cf59c26c',
    'A break in the snow',
    'Club members rest with snowboards on a snowy trail surrounded by trees.',
  ),
  photo(
    '28a7c95f-39ed-4726-d2af-08d9cf59c26c',
    'At the trail junction',
    'Two helmeted club members pause beside a trail sign on a blue-sky snow day.',
  ),
  photo(
    '3ac0f2d3-eac8-4f11-d2ae-08d9cf59c26c',
    'Riding through the trees',
    'Snowboarders travel down a snowy trail between tall evergreen trees.',
  ),
  photo(
    '737be852-bfa8-4354-9ceb-08d9cf59c4ce',
    'Snow day crew',
    'Four Mountain Club members pose together in the snow with skis and snowboards.',
  ),
  photo(
    '2f84f568-012f-4a01-d2ad-08d9cf59c26c',
    'Camp circle',
    'Club members sit together in camp chairs with desert mountains in the distance.',
  ),
  photo(
    '13898c4d-eba6-468d-9cea-08d9cf59c4ce',
    'Cooking at camp',
    'A camper prepares food beside a tent as the sky glows near sunset.',
  ),
  photo(
    '2136efa4-e620-47d1-d2ac-08d9cf59c26c',
    'Camp beneath the mountains',
    'A tent and group campsite sit in open desert beneath a bright blue sky.',
  ),
  photo(
    '251e0fca-0a41-4989-9ce8-08d9cf59c4ce',
    'Backpacking below the ridge',
    'Backpackers travel through a pine forest beneath a rocky mountain ridge.',
  ),
  photo(
    'fe66e3b1-67c4-4f60-d2a7-08d9cf59c26c',
    'The trail crew',
    'A group of backpackers pose together on a green mountain trail.',
  ),
  photo(
    '2bfd1423-d54f-4408-9e4c-08d9cf59c4ce',
    'Sandstone trail',
    'A group hikes single file through a steep sandstone passage.',
  ),
  photo(
    '92db5ce3-581a-4dc4-9e4b-08d9cf59c4ce',
    'Winter canyon hike',
    'Two hikers walk beside an icy stream at the bottom of a rocky canyon.',
  ),
  photo(
    'abbac296-47d8-4776-d29f-08d9cf59c26c',
    'Beneath the sandstone',
    'Club members rest on a sandstone ledge beneath a massive rounded boulder.',
  ),
  photo(
    '068683c8-1628-4a60-9cde-08d9cf59c4ce',
    'Snow in the canyon',
    'Two hikers cross a snow-covered canyon beneath tall gray walls.',
  ),
  photo(
    'f9e6f79d-8fef-4762-d29e-08d9cf59c26c',
    'Red rock group hike',
    'A Mountain Club group poses together between towering red sandstone walls.',
  ),
]
