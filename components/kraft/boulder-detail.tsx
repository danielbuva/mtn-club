'use client'

import { ArrowLeft } from 'lucide-react'
import type { RefObject } from 'react'
import type { Boulder, KraftGuide } from '@/lib/kraft/types'
import { BoulderFaceControls } from './boulder-face-controls'
import { BoulderInformation } from './boulder-information'
import { BoulderRoutePanel } from './boulder-route-panel'
import { FaceViewer } from './face-viewer'
import { NearbyBoulders } from './nearby-boulders'
import { SourceNotes } from './source-notes'
import styles from './topo.module.css'

type BoulderDetailProps = {
  guide: KraftGuide
  boulder: Boulder
  headingRef: RefObject<HTMLHeadingElement | null>
  selectedClimbId: string | null
  selectedFaceId: string | null
  onFaceSelect: (id: string, climbId: string | null) => void
  onClimbSelect: (id: string | null) => void
  onClose: () => void
  onBoulderSelect: (id: string) => void
}

export function BoulderDetail({
  guide,
  boulder,
  headingRef,
  selectedClimbId,
  selectedFaceId,
  onFaceSelect,
  onClimbSelect,
  onClose,
  onBoulderSelect,
}: BoulderDetailProps) {
  const climb = boulder.climbs.find(item => item.id === selectedClimbId)
  const face =
    boulder.faces.find(item => item.id === selectedFaceId) ??
    boulder.faces.find(item => item.id === climb?.faceIds[0]) ??
    boulder.faces[0] ??
    null
  const image = face?.image
  const faceAsset =
    image?.status === 'available'
      ? guide.assets.find(asset => asset.id === image.assetId)
      : undefined
  const area = guide.areas.find(item => item.id === boulder.areaId)

  function selectFace(id: string) {
    onFaceSelect(id, climb?.faceIds.includes(id) ? climb.id : null)
  }

  return (
    <section
      className={styles.boulderDetail}
      aria-labelledby="kraft-boulder-title"
    >
      <div className={styles.detailNavigation}>
        <button type="button" onClick={onClose} className={styles.backButton}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Kraft
        </button>
        <span>{area?.name ?? guide.name}</span>
      </div>
      <header className={styles.boulderHeader}>
        <h2 id="kraft-boulder-title" ref={headingRef} tabIndex={-1}>
          {boulder.name}
        </h2>
      </header>
      <div className={styles.detailBody}>
        <section className={styles.faceSection} aria-label="Boulder faces">
          <BoulderFaceControls
            faces={boulder.faces}
            face={face}
            onFaceSelect={selectFace}
          />
          <FaceViewer
            key={face?.id ?? 'unassigned'}
            face={face}
            asset={faceAsset}
            climbs={boulder.climbs}
            selectedClimbId={selectedClimbId}
            onClimbSelect={onClimbSelect}
          />
        </section>
        <BoulderRoutePanel
          boulder={boulder}
          face={face}
          climb={climb}
          sources={guide.sources}
          onFaceSelect={selectFace}
          onClimbSelect={onClimbSelect}
        />
      </div>
      <BoulderInformation boulder={boulder} />
      <SourceNotes
        sourceIds={boulder.sourceIds}
        sources={guide.sources}
        boulder={boulder}
      />
      <NearbyBoulders
        guide={guide}
        boulder={boulder}
        onBoulderSelect={onBoulderSelect}
      />
    </section>
  )
}
