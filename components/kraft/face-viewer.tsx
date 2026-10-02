'use client'

import { Camera, Minus, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Climb, Face, GuideAsset } from '@/lib/kraft/types'
import styles from './topo.module.css'
import { type TopoRoute, TopoRoutes } from './topo-routes'
import { usePhotoGestures } from './use-photo-gestures'

type FaceViewerProps = {
  face: Face | null
  asset?: GuideAsset
  climbs: Climb[]
  selectedClimbId: string | null
  onClimbSelect: (id: string) => void
}

export function FaceViewer({
  face,
  asset,
  climbs,
  selectedClimbId,
  onClimbSelect,
}: FaceViewerProps) {
  const [zoom, setZoom] = useState(1)
  const photoGestures = usePhotoGestures(zoom, setZoom)
  const [lineMode, setLineMode] = useState<'all' | 'selected' | 'photo'>('all')
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageElement = useRef<HTMLImageElement>(null)
  const reconstructed =
    face?.image.status === 'available' &&
    face.image.representation === 'reconstruction'
  const imageLabel = reconstructed ? 'image' : 'photograph'
  useEffect(() => {
    if (selectedClimbId) {
      setLineMode(mode => (mode === 'photo' ? 'selected' : mode))
    }
  }, [selectedClimbId])
  useEffect(() => {
    if (imageError) return
    const image = imageElement.current
    if (!image?.complete) return
    // Cached images can finish before hydration installs their load handlers.
    if (image.naturalWidth > 0) setImageLoaded(true)
    else setImageError(true)
  }, [imageError])
  const routes: TopoRoute[] = climbs.flatMap((climb, index) =>
    climb.geometry.flatMap(geometry =>
      geometry.status === 'authored' && geometry.faceId === face?.id
        ? [{ climb, geometry, number: index + 1 }]
        : [],
    ),
  )

  if (
    !face ||
    face.image.status === 'missing' ||
    !asset ||
    asset.src !== face.image.src
  ) {
    return (
      <div className={styles.missingPhoto}>
        <Camera size={30} strokeWidth={1.25} aria-hidden="true" />
        <span className={styles.eyebrow}>
          {face ? face.name : 'Face records pending'}
        </span>
        <h3>Photograph not yet in the guide</h3>
        <p>
          {face?.image.status === 'missing'
            ? face.image.reason
            : face
              ? 'A photograph with documented distribution rights is needed for this face.'
              : 'A supported face record and an identified image are needed to show the correct side of this boulder.'}
        </p>
        <span className={styles.contentStatus}>
          No route lines available · Browse the climb records below
        </span>
      </div>
    )
  }

  if (imageError) {
    return (
      <div className={styles.missingPhoto}>
        <Camera size={30} strokeWidth={1.25} aria-hidden="true" />
        <output>This face {imageLabel} could not be opened</output>
        <p>
          Try loading it again. If you are offline, return to the Kraft map and
          check your downloaded content.
        </p>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => setImageError(false)}
        >
          Try {imageLabel} again
        </button>
      </div>
    )
  }

  return (
    <figure className={styles.faceFigure}>
      <section
        ref={photoGestures.viewportRef}
        className={styles.photoViewport}
        style={{ aspectRatio: `${face.image.width} / ${face.image.height}` }}
        onPointerDown={photoGestures.onPointerDown}
        onPointerMove={photoGestures.onPointerMove}
        onPointerUp={photoGestures.onPointerUp}
        onPointerCancel={photoGestures.onPointerCancel}
        onClickCapture={photoGestures.onClickCapture}
        aria-label={`Scrollable face ${imageLabel}`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard focus lets arrow keys pan this scrollable zoomed photograph.
        tabIndex={0}
      >
        {!imageLoaded && (
          <output className={styles.photoLoading}>
            Opening face {imageLabel}…
          </output>
        )}
        <div
          ref={photoGestures.canvasRef}
          className={styles.photoCanvas}
          style={{
            width: `min(${zoom * 100}%, calc(${(face.image.width / face.image.height) * zoom} * var(--photo-max-height, 560px)))`,
          }}
        >
          {/* Image and independent SVG share native dimensions and framing. */}
          {/* biome-ignore lint/performance/noImgElement: Local guide images are downloaded in their native dimensions for exact SVG alignment. */}
          <img
            ref={imageElement}
            src={face.image.src}
            width={face.image.width}
            height={face.image.height}
            alt={face.image.alt}
            draggable={false}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {lineMode !== 'photo' && imageLoaded && (
            <TopoRoutes
              width={face.image.width}
              height={face.image.height}
              zoom={zoom}
              routes={routes}
              selectedClimbId={selectedClimbId}
              selectedOnly={lineMode === 'selected'}
              onClimbSelect={onClimbSelect}
            />
          )}
        </div>
      </section>
      <figcaption className={styles.photoCaption}>
        <span>
          {face.name} · {face.orientation}
          {reconstructed && ' · Reconstructed view'}
        </span>
        <fieldset
          className={styles.zoomControls}
          aria-label={reconstructed ? 'Image zoom' : 'Photograph zoom'}
        >
          <button
            type="button"
            aria-label={`Zoom out ${imageLabel}`}
            disabled={zoom === 1}
            onClick={() => photoGestures.zoomBy(-0.5)}
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Reset ${imageLabel} zoom`}
            disabled={zoom === 1}
            onClick={photoGestures.resetZoom}
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Zoom in ${imageLabel}`}
            disabled={zoom === 3}
            onClick={() => photoGestures.zoomBy(0.5)}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </fieldset>
      </figcaption>
      {routes.length > 0 ? (
        <fieldset
          className={styles.lineControls}
          aria-label="Route line display"
        >
          {(['all', 'selected', 'photo'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              aria-pressed={mode === lineMode}
              disabled={mode === 'selected' && selectedClimbId === null}
              onClick={() => setLineMode(mode)}
            >
              {mode === 'all'
                ? 'All lines'
                : mode === 'selected'
                  ? 'Selected line'
                  : `Clean ${imageLabel}`}
            </button>
          ))}
        </fieldset>
      ) : (
        <p className={styles.topoUnavailable}>
          Route lines await authoring and review.
        </p>
      )}
      {routes.some(route => route.geometry.confidenceLevel === 'moderate') && (
        <p className={styles.topoUnavailable}>
          Lines show approximate routes, not exact holds.
        </p>
      )}
      <details className={styles.photoNotes}>
        <summary>{reconstructed ? 'Image' : 'Photo'} notes & credit</summary>
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
    </figure>
  )
}
