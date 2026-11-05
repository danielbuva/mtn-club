'use client'

import {
  type MouseEvent,
  type PointerEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

type Point = { x: number; y: number }
type Pinch = { distance: number; zoom: number; anchor: Point }
type PendingAnchor = { point: Point; midpoint: Point }

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function positionPhoto(
  viewport: HTMLElement | null,
  canvas: HTMLElement | null,
  anchor: PendingAnchor | null,
) {
  if (!viewport || !canvas || !anchor) return
  viewport.scrollLeft =
    anchor.point.x * canvas.clientWidth + canvas.offsetLeft - anchor.midpoint.x
  viewport.scrollTop =
    anchor.point.y * canvas.clientHeight + canvas.offsetTop - anchor.midpoint.y
}

export function usePhotoGestures(
  zoom: number,
  onZoomChange: (zoom: number) => void,
  centerInitial = false,
  frameKey?: string,
  selectionKey: string | null = null,
) {
  const viewportRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, Point>())
  const origin = useRef<Point | null>(null)
  const pinch = useRef<Pinch | null>(null)
  const pendingAnchor = useRef<PendingAnchor | null>(null)
  const suppressClick = useRef(false)
  const initialized = useRef(false)
  const framing = useRef(frameKey)
  const focusedSelection = useRef<string | null>(null)
  const selectedCenter = useRef<Point | null>(null)
  const [annotationScale, setAnnotationScale] = useState(1)
  const [overviewSelection, setOverviewSelection] = useState<string | null>(
    null,
  )

  useLayoutEffect(() => {
    function positionCamera() {
      const viewport = viewportRef.current
      const canvas = canvasRef.current
      // The parent dialog opens after its children mount. Wait for its real
      // dimensions before establishing the first image anchor.
      if (zoom < 1 || !viewport?.clientWidth || !canvas?.clientWidth) return
      const scale = Math.max(
        1,
        canvas.clientWidth / viewport.clientWidth / zoom,
      )
      setAnnotationScale(previous =>
        Math.abs(previous - scale) < 0.01 ? previous : scale,
      )
      const changedFrame = framing.current !== frameKey
      if (!initialized.current || framing.current !== frameKey) {
        initialized.current = true
        framing.current = frameKey
        if (centerInitial)
          pendingAnchor.current = {
            point: { x: 0.5, y: 0.5 },
            midpoint: {
              // Leave breathing room beside the floating face selector.
              x: viewport.clientWidth * 0.55,
              y: viewport.clientHeight / 2,
            },
          }
      }
      if (!selectionKey) {
        focusedSelection.current = null
        selectedCenter.current = null
      } else if (
        focusedSelection.current !== selectionKey ||
        (changedFrame && frameKey === 'fill')
      ) {
        const newSelection = focusedSelection.current !== selectionKey
        const line = canvas.querySelector('[data-guide-selected-path="true"]')
        const svg = line?.closest('svg')
        if (line instanceof SVGPathElement && svg instanceof SVGSVGElement) {
          const bounds = line.getBBox()
          const native = svg.viewBox.baseVal
          if (newSelection) {
            const pixels = canvas.clientWidth / native.width
            const tooWide = bounds.width * pixels > viewport.clientWidth * 0.9
            const top = bounds.y * pixels + canvas.offsetTop
            const bottom =
              (bounds.y + bounds.height) * pixels + canvas.offsetTop
            const obscured = top < 90 || bottom > viewport.clientHeight - 100
            setOverviewSelection(tooWide || obscured ? selectionKey : null)
          }
          selectedCenter.current = {
            x: (bounds.x + bounds.width / 2) / native.width,
            y: (bounds.y + bounds.height / 2) / native.height,
          }
          focusedSelection.current = selectionKey
          pendingAnchor.current = {
            point: selectedCenter.current,
            midpoint: {
              x: viewport.clientWidth / 2,
              y: viewport.clientHeight / 2,
            },
          }
        }
      }
      positionPhoto(viewport, canvas, pendingAnchor.current)
      pendingAnchor.current = null
    }
    positionCamera()
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(positionCamera)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [centerInitial, frameKey, selectionKey, zoom])

  function zoomBy(step: number) {
    const nextZoom = Math.max(1, Math.min(3, zoom + step))
    if (nextZoom === zoom) return
    const viewport = viewportRef.current
    const canvas = canvasRef.current
    if (viewport && canvas && canvas.clientWidth && canvas.clientHeight) {
      const center = {
        x: viewport.clientWidth / 2,
        y: viewport.clientHeight / 2,
      }
      pendingAnchor.current = {
        point: {
          x:
            (viewport.scrollLeft + center.x - canvas.offsetLeft) /
            canvas.clientWidth,
          y:
            (viewport.scrollTop + center.y - canvas.offsetTop) /
            canvas.clientHeight,
        },
        midpoint: center,
      }
    }
    onZoomChange(nextZoom)
  }

  function resetZoom() {
    const viewport = viewportRef.current
    pendingAnchor.current = viewport
      ? {
          point:
            selectedCenter.current ??
            (centerInitial ? { x: 0.5, y: 0.5 } : { x: 0, y: 0 }),
          midpoint: centerInitial
            ? {
                x: viewport.clientWidth * (selectedCenter.current ? 0.55 : 0.5),
                y: viewport.clientHeight / 2,
              }
            : { x: 0, y: 0 },
        }
      : null
    if (zoom === 1) {
      positionPhoto(viewport, canvasRef.current, pendingAnchor.current)
      pendingAnchor.current = null
    }
    onZoomChange(1)
  }

  function beginPinch() {
    const points = [...pointers.current.values()]
    const canvas = canvasRef.current
    if (points.length !== 2 || !canvas) return
    const center = midpoint(points[0], points[1])
    const bounds = canvas.getBoundingClientRect()
    pinch.current = {
      distance: Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y,
      ),
      zoom,
      anchor: {
        x: (center.x - bounds.left) / bounds.width,
        y: (center.y - bounds.top) / bounds.height,
      },
    }
    suppressClick.current = true
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    if (pointers.current.size === 0) {
      suppressClick.current = false
      origin.current = { x: event.clientX, y: event.clientY }
    }
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    if (pointers.current.size === 2) {
      beginPinch()
      for (const id of pointers.current.keys())
        event.currentTarget.setPointerCapture(id)
    }
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const previous = pointers.current.get(event.pointerId)
    const viewport = viewportRef.current
    if (!previous || !viewport) return
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    const points = [...pointers.current.values()]
    if (points.length === 2 && pinch.current) {
      event.preventDefault()
      const distance = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y,
      )
      const nextZoom = Math.max(
        1,
        Math.min(
          3,
          (pinch.current.zoom * distance) / Math.max(1, pinch.current.distance),
        ),
      )
      const center = midpoint(points[0], points[1])
      const bounds = viewport.getBoundingClientRect()
      pendingAnchor.current = {
        point: pinch.current.anchor,
        midpoint: { x: center.x - bounds.left, y: center.y - bounds.top },
      }
      if (nextZoom === zoom) {
        positionPhoto(
          viewportRef.current,
          canvasRef.current,
          pendingAnchor.current,
        )
        pendingAnchor.current = null
      } else onZoomChange(nextZoom)
      return
    }
    if (points.length !== 1 || !origin.current) return
    if (
      !suppressClick.current &&
      Math.hypot(
        event.clientX - origin.current.x,
        event.clientY - origin.current.y,
      ) < 6
    )
      return
    suppressClick.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    viewport.scrollLeft += previous.x - event.clientX
    viewport.scrollTop += previous.y - event.clientY
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    pointers.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) origin.current = null
    else origin.current = [...pointers.current.values()][0]
  }

  function onClickCapture(event: MouseEvent<HTMLElement>) {
    if (!suppressClick.current || event.detail === 0) return
    event.preventDefault()
    event.stopPropagation()
    suppressClick.current = false
  }

  return {
    viewportRef,
    canvasRef,
    annotationScale,
    overviewSelection,
    zoomBy,
    resetZoom,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onClickCapture,
  }
}
