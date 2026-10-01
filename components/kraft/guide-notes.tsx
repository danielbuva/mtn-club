import type { KraftGuide } from '@/lib/kraft/types'

export function GuideNotes({ guide }: { guide: KraftGuide }) {
  const faces = guide.boulders.flatMap(boulder => boulder.faces)
  const availablePhotos = faces.filter(
    face => face.image.status === 'available',
  ).length
  const climbs = guide.boulders.flatMap(boulder => boulder.climbs)
  const authored = climbs.filter(climb =>
    climb.geometry.some(route => route.status === 'authored'),
  ).length
  return (
    <details className="kraft-guide-notes">
      <summary>
        About this edition & sources <span aria-hidden="true">+</span>
      </summary>
      <div>
        <h2>A growing Kraft field guide.</h2>
        <p>
          This edition indexes dated source catalogs for {guide.boulders.length}{' '}
          named boulders with {climbs.length} climb records. Locations, grades
          and physical rock assignments remain attributed observations, awaiting
          field review.
        </p>
        <p>
          {availablePhotos} of {faces.length} face photographs and {authored} of{' '}
          {climbs.length} route topos are available. Missing photographs and
          unreviewed lines are marked on each face. Downloading saves the
          available edition; it does not fill those gaps.
        </p>
        <p>
          The recorded faces are a starting inventory. Additional viewpoints may
          be needed to identify every climb. Source catalog entries that
          describe adjacent rocks carry a separate physical identity note.
        </p>
        <p>
          Use established trails and check the physical rock before climbing.
          Sandstone is fragile when wet; wait until it is fully dry. Distances
          use source coordinates and are approximate.{' '}
          <a
            href="https://www.blm.gov/programs/national-conservation-lands/nevada/red-rock-canyon-national-conservation-area/planning-your-visit"
            target="_blank"
            rel="noreferrer"
          >
            BLM field guidance ↗
          </a>
        </p>
        <p className="kraft-version">
          Edition {guide.version} · Sources checked {guide.reviewedAt}
        </p>
        <ul>
          {guide.sources.map(source => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title} ↗
              </a>
              <span>
                {source.publisher}
                {source.license
                  ? ` · ${source.license}`
                  : ' · Factual reference'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
