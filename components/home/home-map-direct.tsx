'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { setWorkerUrl } from 'maplibre-gl'
import Supercluster from 'supercluster'
import type { Feature, Point } from 'geojson'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { tripPoints, type TripPoint } from '@/lib/map/trip-points'
import { useIsMobile } from '@/hooks/use-mobile'
import { useHydrated } from '@/hooks/use-hydrated'

const LAS_VEGAS = {
  lat: 36.1699,
  lon: -115.1398,
}

const LIGHT_BASEMAP_URL =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
const DARK_BASEMAP_URL =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

if (typeof window !== 'undefined') {
  try {
    setWorkerUrl('/maplibre/maplibre-gl-worker.js')
  } catch {}
}

type TripPointProperties = {
  pointId: string
}

type ClusterProperties = {
  cluster: true
  cluster_id: number
  point_count: number
  point_count_abbreviated: number
}

type TripPointFeature = Feature<Point, TripPointProperties>
type ClusterFeature = Feature<Point, ClusterProperties>
type PointFeature = Feature<Point, TripPointProperties>
type ClusterOrPoint = ClusterFeature | PointFeature

type HomeMapProps = {
  selectedTripId?: string
  onTripSelect: (trip: TripPoint) => void
  className?: string
}

const isClusterFeature = (feature: ClusterOrPoint): feature is ClusterFeature =>
  (feature.properties as ClusterProperties).cluster === true

export function HomeMap({ selectedTripId, onTripSelect, className }: HomeMapProps) {
  const { resolvedTheme } = useTheme()
  const hydrated = useHydrated()
  const isMobile = useIsMobile()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const rafRef = useRef<number | null>(null)
  const markersByIdRef = useRef<
    Map<string, { marker: maplibregl.Marker; type: 'cluster' | 'point' }>
  >(new Map())
  const activeRef = useRef(true)
  const [stableTheme, setStableTheme] = useState<'light' | 'dark'>('light')
  const [mapLoaded, setMapLoaded] = useState(false)

  const tripPointsById = useMemo<Map<string, TripPoint>>(
    () => new Map<string, TripPoint>(tripPoints.map((point) => [point.id, point])),
    []
  )

  const features = useMemo<TripPointFeature[]>(
    () =>
      tripPoints.map((point) => ({
        type: 'Feature',
        properties: { pointId: point.id },
        geometry: {
          type: 'Point',
          coordinates: [point.lon, point.lat],
        },
      })),
    []
  )

  const clusterIndex = useMemo(() => {
    return new Supercluster<TripPointProperties>({
      radius: 60,
      maxZoom: 16,
    }).load(features)
  }, [features])

  useEffect(() => {
    if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
      setStableTheme(resolvedTheme)
    }
  }, [resolvedTheme])

  const mapStyle = stableTheme === 'dark' ? DARK_BASEMAP_URL : LIGHT_BASEMAP_URL

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
    markersByIdRef.current.clear()
  }, [])

  const createImage = useCallback((src: string, alt: string) => {
    const img = document.createElement('img')
    img.src = src
    img.alt = alt
    img.loading = 'lazy'
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.objectFit = 'cover'
    // img.onerror = () => {
    //   if (img.src !== FALLBACK_PHOTO_URL) {
    //     img.src = FALLBACK_PHOTO_URL
    //   }
    // }
    return img
  }, [])

  const createTripMarkerElement = useCallback(
    (trip: TripPoint, isSelected: boolean) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.setAttribute('aria-label', `View trip details for ${trip.title}`)
      button.style.position = 'relative'
      button.style.cursor = 'pointer'
      button.style.border = 'none'
      button.style.background = 'transparent'
      button.style.padding = '0'

      const frame = document.createElement('span')
      frame.dataset.role = 'frame'
      frame.style.display = 'block'
      frame.style.width = '112px'
      frame.style.height = '84px'
      frame.style.borderRadius = '18px'
      frame.style.overflow = 'hidden'
      frame.style.border = isSelected ? '2px solid var(--primary)' : '1px solid rgba(148, 163, 184, 0.5)'
      frame.style.background = 'rgba(255, 255, 255, 0.92)'
      frame.style.boxShadow = '0 12px 24px rgba(15, 23, 42, 0.25)'
      frame.style.transition = 'transform 0.2s ease'

      frame.appendChild(createImage(trip.photos[0], trip.title))

      const tail = document.createElement('span')
      tail.style.position = 'absolute'
      tail.style.left = '50%'
      tail.style.bottom = '-12px'
      tail.style.transform = 'translateX(-50%)'
      tail.style.width = '0'
      tail.style.height = '0'
      tail.style.borderLeft = '12px solid transparent'
      tail.style.borderRight = '12px solid transparent'
      tail.style.borderTop = '12px solid rgba(148, 163, 184, 0.6)'

      const tailInner = document.createElement('span')
      tailInner.style.position = 'absolute'
      tailInner.style.left = '50%'
      tailInner.style.bottom = '-10px'
      tailInner.style.transform = 'translateX(-50%)'
      tailInner.style.width = '0'
      tailInner.style.height = '0'
      tailInner.style.borderLeft = '11px solid transparent'
      tailInner.style.borderRight = '11px solid transparent'
      tailInner.style.borderTop = '11px solid rgba(255, 255, 255, 0.92)'

      button.appendChild(frame)
      button.appendChild(tail)
      button.appendChild(tailInner)

      button.onmouseenter = () => {
        frame.style.transform = 'scale(1.03)'
      }
      button.onmouseleave = () => {
        frame.style.transform = 'scale(1)'
      }

      return button
    },
    [createImage]
  )

  const updateTripMarkerElement = useCallback((el: HTMLElement, isSelected: boolean) => {
    const frame = el.querySelector('[data-role="frame"]') as HTMLElement | null
    if (!frame) return
    frame.style.border = isSelected
      ? '2px solid var(--primary)'
      : '1px solid rgba(148, 163, 184, 0.5)'
  }, [])

  const createClusterMarkerElement = useCallback(
    (photoUrl: string, count: number, clusterId: number, lng: number, lat: number) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.setAttribute('aria-label', `Zoom into ${count} trip locations`)
      button.style.position = 'relative'
      button.style.cursor = 'pointer'
      button.style.border = 'none'
      button.style.background = 'transparent'
      button.style.padding = '0'

      const shadow = document.createElement('span')
      shadow.style.position = 'absolute'
      shadow.style.left = '50%'
      shadow.style.top = '4px'
      shadow.style.transform = 'translateX(-50%)'
      shadow.style.width = '104px'
      shadow.style.height = '76px'
      shadow.style.borderRadius = '18px'
      shadow.style.background = 'rgba(255, 255, 255, 0.75)'
      shadow.style.border = '1px solid rgba(148, 163, 184, 0.4)'

      const frame = document.createElement('span')
      frame.dataset.role = 'frame'
      frame.style.position = 'relative'
      frame.style.display = 'block'
      frame.style.width = '116px'
      frame.style.height = '88px'
      frame.style.borderRadius = '18px'
      frame.style.overflow = 'hidden'
      frame.style.border = '1px solid rgba(148, 163, 184, 0.6)'
      frame.style.background = 'rgba(255, 255, 255, 0.95)'
      frame.style.boxShadow = '0 18px 30px rgba(15, 23, 42, 0.25)'
      frame.style.transition = 'transform 0.2s ease'

      const image = createImage(photoUrl, 'Cluster photo')
      image.dataset.role = 'image'
      frame.appendChild(image)

      const countBadge = document.createElement('span')
      countBadge.textContent = String(count)
      countBadge.dataset.role = 'count'
      countBadge.style.position = 'absolute'
      countBadge.style.left = '10px'
      countBadge.style.bottom = '10px'
      countBadge.style.padding = '2px 8px'
      countBadge.style.borderRadius = '999px'
      countBadge.style.background = 'rgba(15, 23, 42, 0.8)'
      countBadge.style.color = 'white'
      countBadge.style.fontSize = '10px'
      countBadge.style.fontWeight = '600'

      const tail = document.createElement('span')
      tail.style.position = 'absolute'
      tail.style.left = '50%'
      tail.style.bottom = '-12px'
      tail.style.transform = 'translateX(-50%)'
      tail.style.width = '0'
      tail.style.height = '0'
      tail.style.borderLeft = '12px solid transparent'
      tail.style.borderRight = '12px solid transparent'
      tail.style.borderTop = '12px solid rgba(148, 163, 184, 0.6)'

      const tailInner = document.createElement('span')
      tailInner.style.position = 'absolute'
      tailInner.style.left = '50%'
      tailInner.style.bottom = '-10px'
      tailInner.style.transform = 'translateX(-50%)'
      tailInner.style.width = '0'
      tailInner.style.height = '0'
      tailInner.style.borderLeft = '11px solid transparent'
      tailInner.style.borderRight = '11px solid transparent'
      tailInner.style.borderTop = '11px solid rgba(255, 255, 255, 0.95)'

      button.appendChild(shadow)
      button.appendChild(frame)
      button.appendChild(countBadge)
      button.appendChild(tail)
      button.appendChild(tailInner)

      button.onmouseenter = () => {
        frame.style.transform = 'scale(1.03)'
      }
      button.onmouseleave = () => {
        frame.style.transform = 'scale(1)'
      }

      button.dataset.clusterId = String(clusterId)
      button.dataset.lng = String(lng)
      button.dataset.lat = String(lat)
      button.onclick = (event) => {
        event.stopPropagation()
        const map = mapRef.current
        if (!map) return
        const id = Number(button.dataset.clusterId)
        const centerLng = Number(button.dataset.lng)
        const centerLat = Number(button.dataset.lat)
        if (!Number.isFinite(id) || !Number.isFinite(centerLng) || !Number.isFinite(centerLat)) return
        const expansionZoom = clusterIndex.getClusterExpansionZoom(id)
        const targetZoom = Math.min(expansionZoom ?? map.getZoom() + 2, 12)
        map.easeTo({ center: [centerLng, centerLat], zoom: targetZoom, duration: 800 })
      }

      return button
    },
    [clusterIndex, createImage]
  )

  const updateClusterMarkerElement = useCallback((el: HTMLElement, photoUrl: string, count: number) => {
    const image = el.querySelector('[data-role="image"]') as HTMLImageElement | null
    if (image && image.src !== photoUrl) {
      image.src = photoUrl
    }
    const countBadge = el.querySelector('[data-role="count"]') as HTMLElement | null
    if (countBadge) {
      countBadge.textContent = String(count)
    }
  }, [])

  const updateClusters = useCallback(() => {
    const map = mapRef.current
    if (!map || !activeRef.current) return
    if (!map.isStyleLoaded()) return

    const bounds = map.getBounds()
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]
    const zoom = Math.round(map.getZoom())
    const nextClusters = clusterIndex.getClusters(bbox, zoom) as ClusterOrPoint[]
    const nextIds = new Set<string>()

    nextClusters.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates as [number, number]
      if (isClusterFeature(feature)) {
        const { cluster_id: clusterId, point_count: pointCount } = feature.properties
        const markerId = `cluster-${clusterId}`
        nextIds.add(markerId)
        const leaves = clusterIndex.getLeaves(clusterId, pointCount) as PointFeature[]
        const mostRecentTrip = leaves
          .map((leaf) => tripPointsById.get(leaf.properties.pointId))
          .filter((trip): trip is TripPoint => Boolean(trip))
          .sort((a, b) => (b.occurredOn ?? '').localeCompare(a.occurredOn ?? ''))[0]
        const clusterPhoto = mostRecentTrip?.photos[0]

        const existing = markersByIdRef.current.get(markerId)
        if (existing) {
          existing.marker.setLngLat([lng, lat])
          updateClusterMarkerElement(existing.marker.getElement(), clusterPhoto, pointCount)
          const el = existing.marker.getElement()
          el.dataset.clusterId = String(clusterId)
          el.dataset.lng = String(lng)
          el.dataset.lat = String(lat)
        } else {
          const el = createClusterMarkerElement(clusterPhoto, pointCount, clusterId, lng, lat)
          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([lng, lat])
            .addTo(map)
          markersRef.current.push(marker)
          markersByIdRef.current.set(markerId, { marker, type: 'cluster' })
        }
        return
      }

      const trip = tripPointsById.get(feature.properties.pointId)
      if (!trip) return
      const markerId = `trip-${trip.id}`
      nextIds.add(markerId)
      const isSelected = trip.id === selectedTripId
      const existing = markersByIdRef.current.get(markerId)
      if (existing) {
        existing.marker.setLngLat([lng, lat])
        updateTripMarkerElement(existing.marker.getElement(), isSelected)
      } else {
        const el = createTripMarkerElement(trip, isSelected)
        el.onclick = (event) => {
          event.stopPropagation()
          onTripSelect(trip)
        }
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map)
        markersRef.current.push(marker)
        markersByIdRef.current.set(markerId, { marker, type: 'point' })
      }
    })
    markersByIdRef.current.forEach((entry, id) => {
      if (nextIds.has(id)) return
      entry.marker.remove()
      markersByIdRef.current.delete(id)
      markersRef.current = markersRef.current.filter((marker) => marker !== entry.marker)
    })
  }, [
    clearMarkers,
    clusterIndex,
    createClusterMarkerElement,
    createTripMarkerElement,
    onTripSelect,
    selectedTripId,
    tripPointsById,
    updateClusterMarkerElement,
    updateTripMarkerElement,
  ])

  const scheduleUpdate = useCallback(() => {
    if (!activeRef.current) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      updateClusters()
    })
  }, [updateClusters])

  useEffect(() => {
    if (!hydrated) return
    if (!mapContainerRef.current || mapRef.current) return

    mapContainerRef.current.style.position = 'absolute'
    mapContainerRef.current.style.inset = '0'
    mapContainerRef.current.style.width = '100%'
    mapContainerRef.current.style.height = '100%'

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [LAS_VEGAS.lon, LAS_VEGAS.lat],
      zoom: isMobile ? 6.2 : 9.1,
      bearing: 0,
      pitch: 0,
    })

    mapRef.current = map
    map.on('load', () => {
      setMapLoaded(true)
      const canvas = map.getCanvas()
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      map.resize()
      scheduleUpdate()
    })
    map.on('move', scheduleUpdate)
    map.on('zoom', scheduleUpdate)
    map.on('drag', scheduleUpdate)
    map.on('moveend', scheduleUpdate)
    map.on('zoomend', scheduleUpdate)
    map.on('dragend', scheduleUpdate)
    map.on('style.load', scheduleUpdate)

    const resizeObserver = new ResizeObserver(() => {
      const canvas = map.getCanvas()
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      map.resize()
    })
    resizeObserver.observe(mapContainerRef.current)

    requestAnimationFrame(() => {
      const canvas = map.getCanvas()
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      map.resize()
    })

    return () => {
      map.off('moveend', updateClusters)
      map.off('zoomend', updateClusters)
      map.off('dragend', updateClusters)
      map.off('move', scheduleUpdate)
      map.off('zoom', scheduleUpdate)
      map.off('drag', scheduleUpdate)
      map.off('moveend', scheduleUpdate)
      map.off('zoomend', scheduleUpdate)
      map.off('dragend', scheduleUpdate)
      map.off('style.load', scheduleUpdate)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      clearMarkers()
    }
  }, [clearMarkers, hydrated, isMobile, mapStyle, scheduleUpdate, updateClusters])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    if (map.getStyle()?.sprite === mapStyle) return
    map.setStyle(mapStyle)
  }, [mapLoaded, mapStyle])

  useEffect(() => {
    if (!mapLoaded) return
    scheduleUpdate()
  }, [mapLoaded, scheduleUpdate, selectedTripId])

  return (
    <div className={cn('absolute inset-0', className)}>
      <div ref={mapContainerRef} className="absolute inset-0" />
      <div className="absolute right-4 top-4 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
        TODO: swap to MapTiler or another provider
      </div>
    </div>
  )
}
