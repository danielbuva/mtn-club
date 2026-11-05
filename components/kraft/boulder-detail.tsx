'use client'

import { ArrowLeft, Info } from 'lucide-react'
import type { RefObject } from 'react'
import { boulderAccessNotice } from '@/lib/kraft/access-notices'
import type { Boulder, KraftGuide } from '@/lib/kraft/types'
import { AccessNotice } from './access-notice'
import { BoulderFaceControls } from './boulder-face-controls'
import { BoulderInformation } from './boulder-information'
import { BoulderRoutePanel } from './boulder-route-panel'
import { CatalogMemberships } from './catalog-memberships'
import { FaceImageNotes } from './face-image-notes'
import { FaceViewer } from './face-viewer'
import { GuideSheet } from './guide-sheet'
import { NearbyBoulders } from './nearby-boulders'
import { SourceNotes } from './source-notes'
import styles from './topo.module.css'
import { useGuideSheet } from './use-guide-sheet'

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
  onReferenceSelect: (boulderId: string, climbId: string) => void
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
  onReferenceSelect,
}: BoulderDetailProps) {
  const sheet = useGuideSheet()
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
      className={`${styles.boulderDetail} ${styles.immersiveDetail}`}
      aria-labelledby="kraft-boulder-title"
      onKeyDownCapture={sheet.onKeyDownCapture}
    >
      <section className={styles.faceSection} aria-label="Boulder faces">
        <FaceViewer
          key={face?.id ?? 'unassigned'}
          face={face}
          asset={faceAsset}
          climbs={boulder.climbs}
          selectedClimbId={selectedClimbId}
          onClimbSelect={onClimbSelect}
          immersive
        />
      </section>
      <div className={styles.floatingGuideHeader}>
        <header className={styles.immersiveHeader}>
          <button
            type="button"
            onClick={onClose}
            className={styles.backButton}
            aria-label="Back to Kraft"
          >
            <ArrowLeft size={19} aria-hidden="true" />
            <span>Kraft</span>
          </button>
          <div className={styles.boulderTitle}>
            <h2 id="kraft-boulder-title" ref={headingRef} tabIndex={-1}>
              {boulder.name}
            </h2>
            <span>{area?.name ?? guide.name}</span>
          </div>
          <button
            type="button"
            className={styles.boulderInfoButton}
            aria-label="Boulder details"
            aria-expanded={sheet.activeSheet === 'boulder'}
            onClick={event => sheet.openSheet('boulder', event.currentTarget)}
          >
            <Info size={20} aria-hidden="true" />
          </button>
        </header>
        <BoulderFaceControls
          faces={boulder.faces}
          face={face}
          onFaceSelect={id => {
            selectFace(id)
            sheet.dismissSheet()
          }}
        />
      </div>
      <BoulderRoutePanel
        boulder={boulder}
        face={face}
        climb={climb}
        sources={guide.sources}
        activeSheet={sheet.activeSheet}
        onOpenSheet={sheet.openSheet}
        onCloseSheet={sheet.closeSheet}
        onFaceSelect={selectFace}
        onClimbSelect={onClimbSelect}
      />
      <GuideSheet
        open={sheet.activeSheet === 'boulder'}
        label="Boulder details"
        title={`${boulder.name} · guide notes`}
        onClose={sheet.closeSheet}
      >
        <AccessNotice notice={boulderAccessNotice(boulder)} />
        <FaceImageNotes face={face} asset={faceAsset} />
        <BoulderInformation boulder={boulder} />
        <CatalogMemberships
          guide={guide}
          boulder={boulder}
          onSelect={onReferenceSelect}
        />
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
      </GuideSheet>
    </section>
  )
}
