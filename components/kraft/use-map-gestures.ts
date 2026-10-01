'use client'

import type { KeyboardEvent, PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { MAP_HEIGHT, MAP_WIDTH } from '@/lib/kraft/geography'

interface Point {
  x: number
  y: number
}
interface Camera {
  x: number
  y: number
  zoom: number
}
interface Size {
  width: number
  height: number
}
interface Gesture {
  camera: Camera
  first: Point
  second?: Point
}

const INITIAL_CAMERA: Camera = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2, zoom: 1 }
const MIN_ZOOM = 0.8
const MAX_ZOOM = 7
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
})

export function useMapGestures() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState<Size>({
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  })
  const [camera, setCamera] = useState<Camera>(INITIAL_CAMERA)
  const cameraRef = useRef(camera)
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture | null>(null)
  const dragged = useRef(false)
  const sizeRef = useRef(size)

  function pixelsPerUnit(zoom: number, currentSize = sizeRef.current) {
    return (
      Math.min(
        currentSize.width / (MAP_WIDTH + 70),
        currentSize.height / (MAP_HEIGHT + 70),
      ) * zoom
    )
  }

  function updateCamera(next: Camera) {
    const zoom = clamp(next.zoom, MIN_ZOOM, MAX_ZOOM)
    const factor = pixelsPerUnit(zoom)
    const halfWidth = sizeRef.current.width / factor / 2
    const halfHeight = sizeRef.current.height / factor / 2
    const bounded: Camera = {
      zoom,
      x:
        halfWidth > MAP_WIDTH / 2 + 60
          ? MAP_WIDTH / 2
          : clamp(next.x, halfWidth - 60, MAP_WIDTH - halfWidth + 60),
      y:
        halfHeight > MAP_HEIGHT / 2 + 120
          ? MAP_HEIGHT / 2 + 60
          : clamp(next.y, halfHeight - 60, MAP_HEIGHT - halfHeight + 180),
    }
    cameraRef.current = bounded
    setCamera(bounded)
  }

  function zoomBy(factor: number, anchor?: Point) {
    const current = cameraRef.current
    const zoom = clamp(current.zoom * factor, MIN_ZOOM, MAX_ZOOM)
    const rect = svgRef.current?.getBoundingClientRect()
    const offsetX = anchor && rect ? anchor.x - rect.left - rect.width / 2 : 0
    const offsetY = anchor && rect ? anchor.y - rect.top - rect.height / 2 : 0
    const before = pixelsPerUnit(current.zoom)
    const after = pixelsPerUnit(zoom)
    updateCamera({
      zoom,
      x: current.x + offsetX / before - offsetX / after,
      y: current.y + offsetY / before - offsetY / after,
    })
  }

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const next = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }
      if (next.width <= 0 || next.height <= 0) return
      sizeRef.current = next
      setSize(next)
    })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  // A non-passive listener keeps wheel zoom on the field map instead of scrolling the page.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    function wheel(event: WheelEvent) {
      event.preventDefault()
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
      zoomBy(Math.exp(-delta * 0.0018), { x: event.clientX, y: event.clientY })
    }
    svg.addEventListener('wheel', wheel, { passive: false })
    return () => svg.removeEventListener('wheel', wheel)
  })

  function beginGesture() {
    const [first, second] = [...pointers.current.values()]
    gesture.current = first
      ? { camera: cameraRef.current, first, second }
      : null
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (pointers.current.size === 0) dragged.current = false
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    beginGesture()
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    const start = gesture.current
    const [first, second] = [...pointers.current.values()]
    if (!start || !first) return
    const startFactor = pixelsPerUnit(start.camera.zoom)
    if (second && start.second) {
      dragged.current = true
      const rect = event.currentTarget.getBoundingClientRect()
      const oldMidpoint = midpoint(start.first, start.second)
      const newMidpoint = midpoint(first, second)
      const zoom = clamp(
        (start.camera.zoom * distance(first, second)) /
          Math.max(1, distance(start.first, start.second)),
        MIN_ZOOM,
        MAX_ZOOM,
      )
      const newFactor = pixelsPerUnit(zoom)
      updateCamera({
        zoom,
        x:
          start.camera.x +
          (oldMidpoint.x - rect.left - rect.width / 2) / startFactor -
          (newMidpoint.x - rect.left - rect.width / 2) / newFactor,
        y:
          start.camera.y +
          (oldMidpoint.y - rect.top - rect.height / 2) / startFactor -
          (newMidpoint.y - rect.top - rect.height / 2) / newFactor,
      })
    } else {
      if (distance(start.first, first) > 6) dragged.current = true
      if (!dragged.current) return
      updateCamera({
        ...start.camera,
        x: start.camera.x - (first.x - start.first.x) / startFactor,
        y: start.camera.y - (first.y - start.first.y) / startFactor,
      })
    }
    for (const id of pointers.current.keys()) {
      if (!event.currentTarget.hasPointerCapture(id))
        event.currentTarget.setPointerCapture(id)
    }
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    pointers.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    beginGesture()
  }

  function onPointerCancel(event: PointerEvent<SVGSVGElement>) {
    dragged.current = true
    onPointerUp(event)
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const current = cameraRef.current
    const step = 60 / pixelsPerUnit(current.zoom)
    switch (event.key) {
      case 'ArrowLeft':
        updateCamera({ ...current, x: current.x - step })
        break
      case 'ArrowRight':
        updateCamera({ ...current, x: current.x + step })
        break
      case 'ArrowUp':
        updateCamera({ ...current, y: current.y - step })
        break
      case 'ArrowDown':
        updateCamera({ ...current, y: current.y + step })
        break
      case '+':
      case '=':
        zoomBy(1.4)
        break
      case '-':
      case '_':
        zoomBy(1 / 1.4)
        break
      case 'Home':
        updateCamera(INITIAL_CAMERA)
        break
      default:
        return
    }
    event.preventDefault()
  }

  const factor = pixelsPerUnit(camera.zoom, size)
  const width = size.width / factor
  const height = size.height / factor
  return {
    svgRef,
    camera,
    pixelsPerUnit: factor,
    viewBox: `${camera.x - width / 2} ${camera.y - height / 2} ${width} ${height}`,
    bounds: {
      minX: camera.x - width / 2,
      minY: camera.y - height / 2,
      maxX: camera.x + width / 2,
      maxY: camera.y + height / 2,
    },
    canSelect: () => !dragged.current,
    zoomIn: () => zoomBy(1.4),
    zoomOut: () => zoomBy(1 / 1.4),
    reset: () => updateCamera(INITIAL_CAMERA),
    atMinZoom: camera.zoom <= MIN_ZOOM,
    atMaxZoom: camera.zoom >= MAX_ZOOM,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
    },
  }
}
