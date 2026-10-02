'use client'

import { useRef } from 'react'
import { climbAccessNotice } from '@/lib/kraft/access-notices'
import type { Boulder, Climb, EvidenceSource, Face } from '@/lib/kraft/types'
import { AccessNotice } from './access-notice'
import { ClimbDetail } from './climb-detail'
import { ClimbList } from './climb-list'
import { gradeRecordNote } from './source-notes'
import styles from './topo.module.css'

export function BoulderRoutePanel({
  boulder,
  face,
  climb,
  sources,
  onFaceSelect,
  onClimbSelect,
}: {
  boulder: Boulder
  face: Face | null
  climb: Climb | undefined
  sources: EvidenceSource[]
  onFaceSelect: (id: string) => void
  onClimbSelect: (id: string) => void
}) {
  const fullRecord = useRef<HTMLDetailsElement>(null)
  const sidebar = useRef<HTMLElement>(null)
  const climbs = boulder.climbs.toSorted(
    (a, b) =>
      (a.gradeValue ?? Number.POSITIVE_INFINITY) -
        (b.gradeValue ?? Number.POSITIVE_INFINITY) ||
      (a.gradeMaxValue ?? a.gradeValue ?? Number.POSITIVE_INFINITY) -
        (b.gradeMaxValue ?? b.gradeValue ?? Number.POSITIVE_INFINITY) ||
      a.name.localeCompare(b.name),
  )
  const geometry = climb?.geometry.find(item => item.faceId === face?.id)

  function openFullRecord() {
    const record = fullRecord.current
    const panel = sidebar.current
    if (!record || !panel) return
    record.open = true
    panel.scrollTop +=
      record.getBoundingClientRect().top - panel.getBoundingClientRect().top
    record.querySelector('summary')?.focus({ preventScroll: true })
  }

  return (
    <aside
      ref={sidebar}
      className={styles.routeSidebar}
      aria-label="Boulder climbs"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Mobile browsing scrolls this panel while keeping the face photograph in view.
      tabIndex={0}
    >
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
              aria-controls={`${climb.id}-full-record`}
              onClick={openFullRecord}
            >
              Details
            </button>
          </div>
          <AccessNotice notice={climbAccessNotice(climb)} compact />
          <p>{climb.description}</p>
          <small>
            {climb.faceIds.length === 0
              ? 'Face assignment pending'
              : geometry?.status === 'authored'
                ? `${geometry.confidenceLevel === 'moderate' ? 'Approximate corridor' : 'Reviewed line'} available · ${face?.name}`
                : `Route line pending · ${face?.name}`}
            {gradeRecordNote(climb) && ` · ${gradeRecordNote(climb)}`}
          </small>
          {climb.boulderAssignmentStatus === 'editorial-provisional' && (
            <small>
              Physical boulder identity pending; see the full record.
            </small>
          )}
          {climb.risk && <small>Landing & exposure: {climb.risk}</small>}
        </section>
      ) : (
        <p className={styles.routePrompt}>
          Choose a climb below.
          <span className={styles.routePromptExplanation}>
            {' '}
            Reviewed lines appear when available.
          </span>
        </p>
      )}
      <section
        className={styles.climbsSection}
        aria-labelledby="kraft-climb-list"
      >
        <div className={styles.sectionHeading}>
          <h3 id="kraft-climb-list">Climbs</h3>
          <span>{climbs.length} · easiest first</span>
        </div>
        {climbs.length > 0 ? (
          <section
            className={styles.climbScroll}
            aria-label="Climbs sorted by grade"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: This independently scrollable route list must be reachable by keyboard.
            tabIndex={0}
          >
            <ClimbList
              climbs={climbs}
              boulder={boulder}
              selectedClimbId={climb?.id ?? null}
              onClimbSelect={onClimbSelect}
            />
          </section>
        ) : (
          <p className={styles.emptyClimbs}>
            No climb records are available for this boulder yet.
          </p>
        )}
      </section>
      {climb && (
        <details
          key={climb.id}
          ref={fullRecord}
          id={`${climb.id}-full-record`}
          className={styles.routeFacts}
        >
          <summary aria-label={`View ${climb.name} climb details`}>
            Full climb details & sources
          </summary>
          <ClimbDetail
            climb={climb}
            number={boulder.climbs.indexOf(climb) + 1}
            face={face}
            faces={boulder.faces}
            sources={sources}
            onFaceSelect={onFaceSelect}
          />
        </details>
      )}
    </aside>
  )
}
