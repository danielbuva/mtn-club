import type { Face, GuideAsset } from '@/lib/kraft/types'
import styles from './topo.module.css'

export function FaceImageNotes({
  face,
  asset,
}: {
  face: Face | null
  asset?: GuideAsset
}) {
  if (!face || !asset) return null
  const reconstructed =
    face.image.status === 'available' &&
    face.image.representation === 'reconstruction'

  return (
    <details className={styles.photoNotes}>
      <summary>{reconstructed ? 'Image' : 'Photo'} notes & credit</summary>
      <p className={styles.orientationStatus}>
        {face.name} · {face.orientation}
        {face.groupingStatus === 'editorial-provisional' &&
          ' · Face grouping unconfirmed'}
        {face.orientationStatus === 'unknown' && ' · Orientation unconfirmed'}
      </p>
      {face.photographNote && (
        <p className={styles.orientationStatus}>{face.photographNote}</p>
      )}
      <p className={styles.photoAttribution}>
        {asset.attributionUrl ? (
          <a href={asset.attributionUrl} target="_blank" rel="noreferrer">
            {asset.attribution}
          </a>
        ) : (
          asset.attribution
        )}{' '}
        ·{' '}
        {asset.licenseUrl ? (
          <a href={asset.licenseUrl} target="_blank" rel="noreferrer">
            {asset.license}
          </a>
        ) : (
          asset.license
        )}
        {asset.modificationNote && <> · {asset.modificationNote}</>}
      </p>
    </details>
  )
}
