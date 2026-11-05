'use client'

import { Layers2, Minus, Plus, RotateCcw, Scan } from 'lucide-react'
import { useRef, useState } from 'react'
import styles from './topo.module.css'

export type LineMode = 'all' | 'selected' | 'photo'

export function FaceViewerControls({
  imageLabel,
  zoom,
  lineMode,
  hasRoutes,
  hasSelection,
  immersive,
  wholeFace,
  onFraming,
  onZoom,
  onReset,
  onLineMode,
}: {
  imageLabel: string
  zoom: number
  lineMode: LineMode
  hasRoutes: boolean
  hasSelection: boolean
  immersive: boolean
  wholeFace: boolean
  onFraming: () => void
  onZoom: (step: number) => void
  onReset: () => void
  onLineMode: (mode: LineMode) => void
}) {
  const [displayOpen, setDisplayOpen] = useState(false)
  const displayButton = useRef<HTMLButtonElement>(null)
  const modes = (
    <fieldset className={styles.lineControls} aria-label="Route line display">
      {(['all', 'selected', 'photo'] as const).map(mode => (
        <button
          key={mode}
          type="button"
          aria-pressed={mode === lineMode}
          disabled={mode === 'selected' && !hasSelection}
          onClick={() => onLineMode(mode)}
        >
          {mode === 'all'
            ? 'All lines'
            : mode === 'selected'
              ? 'Selected line'
              : `Clean ${imageLabel}`}
        </button>
      ))}
    </fieldset>
  )

  return (
    <div className={styles.viewerControls}>
      {immersive && (
        <button
          type="button"
          className={styles.framingButton}
          aria-label={wholeFace ? 'Fill screen with face' : 'Fit whole face'}
          aria-pressed={wholeFace}
          onClick={onFraming}
        >
          <Scan size={17} aria-hidden="true" />
          <span>{wholeFace ? 'Fill' : 'Whole'}</span>
        </button>
      )}
      {hasRoutes &&
        (immersive ? (
          <fieldset
            className={styles.topoDisplay}
            aria-label="Topo display menu"
            onKeyDown={event => {
              if (event.key !== 'Escape' || !displayOpen) return
              event.preventDefault()
              event.stopPropagation()
              setDisplayOpen(false)
              displayButton.current?.focus({ preventScroll: true })
            }}
          >
            <button
              ref={displayButton}
              type="button"
              className={styles.topoDisplayButton}
              aria-label="Topo display"
              aria-expanded={displayOpen}
              onClick={() => setDisplayOpen(open => !open)}
            >
              <Layers2 size={18} aria-hidden="true" />
            </button>
            {displayOpen && modes}
          </fieldset>
        ) : (
          modes
        ))}
      <fieldset
        className={styles.zoomControls}
        aria-label={imageLabel === 'image' ? 'Image zoom' : 'Photograph zoom'}
      >
        <button
          type="button"
          aria-label={`Zoom in ${imageLabel}`}
          disabled={zoom === 3}
          onClick={() => onZoom(0.5)}
        >
          <Plus size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Reset ${imageLabel} zoom`}
          disabled={!immersive && zoom === 1}
          onClick={onReset}
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Zoom out ${imageLabel}`}
          disabled={zoom === 1}
          onClick={() => onZoom(-0.5)}
        >
          <Minus size={17} aria-hidden="true" />
        </button>
      </fieldset>
    </div>
  )
}
