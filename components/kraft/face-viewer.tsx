'use client'

import { Camera } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Climb, Face, GuideAsset } from '@/lib/kraft/types'
import { FaceImageNotes } from './face-image-notes'
import { FaceViewerControls, type LineMode } from './face-viewer-controls'
import styles from './topo.module.css'
import { type TopoRoute, TopoRoutes } from './topo-routes'
import { usePhotoGestures } from './use-photo-gestures'

type FaceViewerProps = {
  face: Face | null
  asset?: GuideAsset
  climbs: Climb[]
  selectedClimbId: string | null
  onClimbSelect: (id: string) => void
  immersive?: boolean
}

export function FaceViewer({
  face,
  asset,
  climbs,
  selectedClimbId,
  onClimbSelect,
  immersive = false,
}: FaceViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [wholeFace, setWholeFace] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const selectedHasLine = climbs.some(
    climb =>
      climb.id === selectedClimbId &&
      climb.geometry.some(
        geometry =>
          geometry.status === 'authored' && geometry.faceId === face?.id,
      ),
  )
  const photoGestures = usePhotoGestures(
    zoom,
    setZoom,
    immersive,
    wholeFace ? 'whole' : 'fill',
    immersive && imageLoaded && selectedHasLine ? selectedClimbId : null,
  )
  const [lineMode, setLineMode] = useState<LineMode>('all')
  const [imageError, setImageError] = useState(false)
  const imageElement = useRef<HTMLImageElement>(null)
  const reconstructed =
    face?.image.status === 'available' &&
    face.image.representation === 'reconstruction'
  const imageLabel = reconstructed ? 'image' : 'photograph'

  useLayoutEffect(() => {
    if (photoGestures.overviewSelection) setWholeFace(true)
  }, [photoGestures.overviewSelection])

  useEffect(() => {
    if (selectedClimbId)
      setLineMode(mode => (mode === 'photo' ? 'selected' : mode))
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
          No route lines available · Open Climbs to browse the records
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
        style={
          immersive
            ? undefined
            : { aspectRatio: `${face.image.width} / ${face.image.height}` }
        }
        onPointerDown={photoGestures.onPointerDown}
        onPointerMove={photoGestures.onPointerMove}
        onPointerUp={photoGestures.onPointerUp}
        onPointerCancel={photoGestures.onPointerCancel}
        onClickCapture={photoGestures.onClickCapture}
        aria-label={`Scrollable face ${imageLabel}`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Arrow keys pan this focusable camera without moving the guide controls.
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
            width:
              immersive && !wholeFace
                ? `max(${zoom * 100}%, calc(${(face.image.width / face.image.height) * zoom} * var(--photo-height, 100dvh)))`
                : `min(${zoom * 100}%, calc(${(face.image.width / face.image.height) * zoom} * ${immersive ? 'var(--overview-height)' : 'var(--photo-max-height, 560px)'}))`,
          }}
        >
          {/* Image and SVG retain their shared native framing at every zoom. */}
          {/* biome-ignore lint/performance/noImgElement: Local guide images retain native dimensions for exact SVG alignment. */}
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
              assetId={face.image.assetId}
              zoom={zoom * photoGestures.annotationScale}
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
          {face.name}
          {reconstructed && ' · Reconstructed view'}
          {routes.length === 0 && ' · Lines pending'}
        </span>
      </figcaption>
      <FaceViewerControls
        imageLabel={imageLabel}
        zoom={zoom}
        lineMode={lineMode}
        hasRoutes={routes.length > 0}
        hasSelection={selectedClimbId !== null}
        immersive={immersive}
        wholeFace={wholeFace}
        onFraming={() => {
          photoGestures.resetZoom()
          setWholeFace(current => !current)
        }}
        onZoom={photoGestures.zoomBy}
        onReset={photoGestures.resetZoom}
        onLineMode={setLineMode}
      />
      {!immersive && <FaceImageNotes face={face} asset={asset} />}
    </figure>
  )
}
