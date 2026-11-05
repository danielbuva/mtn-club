'use client'

import { ChevronUp, List } from 'lucide-react'
import {
  accessClosedLabel,
  boulderAccessNotice,
  climbAccessNotice,
} from '@/lib/kraft/access-notices'
import type { Boulder, Climb, EvidenceSource, Face } from '@/lib/kraft/types'
import { AccessNotice } from './access-notice'
import { ClimbDetail } from './climb-detail'
import { ClimbList } from './climb-list'
import { GuideSheet, type GuideSheetKind } from './guide-sheet'
import { gradeRecordNote } from './source-notes'
import styles from './topo.module.css'

export function BoulderRoutePanel({
  boulder,
  face,
  climb,
  sources,
  activeSheet,
  onOpenSheet,
  onCloseSheet,
  onFaceSelect,
  onClimbSelect,
}: {
  boulder: Boulder
  face: Face | null
  climb: Climb | undefined
  sources: EvidenceSource[]
  activeSheet: GuideSheetKind
  onOpenSheet: (sheet: 'climbs' | 'climb', control: HTMLButtonElement) => void
  onCloseSheet: () => void
  onFaceSelect: (id: string) => void
  onClimbSelect: (id: string) => void
}) {
  const climbs = boulder.climbs.toSorted(
    (a, b) =>
      (a.gradeValue ?? Number.POSITIVE_INFINITY) -
        (b.gradeValue ?? Number.POSITIVE_INFINITY) ||
      (a.gradeMaxValue ?? a.gradeValue ?? Number.POSITIVE_INFINITY) -
        (b.gradeMaxValue ?? b.gradeValue ?? Number.POSITIVE_INFINITY) ||
      a.name.localeCompare(b.name),
  )
  const geometry = climb?.geometry.find(item => item.faceId === face?.id)
  const accessNotice = climb
    ? climbAccessNotice(climb)
    : boulderAccessNotice(boulder)

  function selectClimb(id: string) {
    onClimbSelect(id)
    onCloseSheet()
  }

  function selectFace(id: string) {
    onFaceSelect(id)
    onCloseSheet()
  }

  return (
    <>
      <aside className={styles.routeDock} aria-label="Boulder climbs">
        {climb ? (
          <section
            className={styles.selectedClimb}
            aria-label="Selected climb"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className={styles.selectedClimbHeading}>
              <h3>{climb.name}</h3>
              <span>{climb.grade}</span>
              <button
                type="button"
                className={styles.compactRecordButton}
                aria-label={`Open ${climb.name} full climb record`}
                aria-expanded={activeSheet === 'climb'}
                onClick={event => onOpenSheet('climb', event.currentTarget)}
              >
                Details
              </button>
            </div>
            <small className={styles.selectionStatus}>
              {accessNotice
                ? `${accessClosedLabel} · historical route record`
                : climb.faceIds.length === 0
                  ? 'Face assignment pending'
                  : geometry?.status === 'authored'
                    ? `${geometry.confidenceLevel === 'moderate' ? 'Approximate corridor' : 'Reviewed line'} available · ${face?.name}`
                    : `Route line pending · ${face?.name}`}
            </small>
            {climb.boulderAssignmentStatus === 'editorial-provisional' && (
              <small className={styles.selectionStatus}>
                Physical boulder identity pending
              </small>
            )}
          </section>
        ) : (
          <p className={styles.routePrompt}>
            {accessNotice
              ? `${accessClosedLabel} · historical records`
              : 'Choose a climb'}
            <span>{climbs.length} climb records</span>
          </p>
        )}
        <button
          type="button"
          className={styles.browseClimbsButton}
          aria-label="Browse climbs"
          aria-expanded={activeSheet === 'climbs'}
          onClick={event =>
            activeSheet === 'climbs'
              ? onCloseSheet()
              : onOpenSheet('climbs', event.currentTarget)
          }
        >
          <List size={17} aria-hidden="true" />
          <span>
            Climbs <small>{climbs.length}</small>
          </span>
          <ChevronUp size={17} aria-hidden="true" />
        </button>
      </aside>
      <GuideSheet
        open={activeSheet === 'climbs'}
        label="Climb picker"
        title="Climbs"
        onClose={onCloseSheet}
      >
        <div className={styles.sectionHeading}>
          <span>{climbs.length} · easiest first</span>
        </div>
        {climbs.length > 0 ? (
          <section
            className={styles.climbScroll}
            aria-label="Climbs sorted by grade"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: This scrollable route list is reachable by keyboard.
            tabIndex={0}
          >
            <ClimbList
              climbs={climbs}
              boulder={boulder}
              selectedClimbId={climb?.id ?? null}
              onClimbSelect={selectClimb}
            />
          </section>
        ) : (
          <p className={styles.emptyClimbs}>
            No climb records are available for this boulder yet.
          </p>
        )}
      </GuideSheet>
      {climb && (
        <GuideSheet
          open={activeSheet === 'climb'}
          label="Climb details"
          title="Climb details & sources"
          onClose={onCloseSheet}
        >
          <AccessNotice notice={climbAccessNotice(climb)} />
          {gradeRecordNote(climb) && (
            <p className={styles.fieldStatus}>{gradeRecordNote(climb)}</p>
          )}
          <ClimbDetail
            climb={climb}
            number={boulder.climbs.indexOf(climb) + 1}
            face={face}
            faces={boulder.faces}
            sources={sources}
            onFaceSelect={selectFace}
          />
        </GuideSheet>
      )}
    </>
  )
}
