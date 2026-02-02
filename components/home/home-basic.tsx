'use client'

import type { Feature, Point } from 'geojson'
import maplibregl, { setWorkerUrl } from 'maplibre-gl'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Supercluster from 'supercluster'
import { ScrollIndicator } from '@/components/home/scroll-indicator'
import { type TripPoint, tripPoints } from '@/lib/map/trip-points'

const LAS_VEGAS = {
  lat: 36.1699,
  lon: -115.1398,
}
const FALLBACK_PHOTO_URL =
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80'

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

const isClusterFeature = (feature: ClusterOrPoint): feature is ClusterFeature =>
  (feature.properties as ClusterProperties).cluster === true

if (typeof window !== 'undefined') {
  try {
    setWorkerUrl('/maplibre/maplibre-gl-worker.js')
  } catch {}
}

type HomeBasicMapProps = {
  showScrollIndicator?: boolean
  scrollTargetId?: string
}

export function HomeBasicMap({
  showScrollIndicator = false,
  scrollTargetId = 'home-cta',
}: HomeBasicMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const { resolvedTheme } = useTheme()
  const [stableTheme, setStableTheme] = useState<'light' | 'dark'>('light')

  const mapStyle = useMemo(
    () =>
      stableTheme === 'dark'
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    [stableTheme],
  )

  const themeReady = resolvedTheme === 'light' || resolvedTheme === 'dark'

  const tripPointsById = useMemo<Map<string, TripPoint>>(
    () =>
      new Map<string, TripPoint>(tripPoints.map(point => [point.id, point])),
    [],
  )

  const features = useMemo<TripPointFeature[]>(
    () =>
      tripPoints.map(point => ({
        type: 'Feature',
        properties: { pointId: point.id },
        geometry: {
          type: 'Point',
          coordinates: [point.lon, point.lat],
        },
      })),
    [],
  )

  const clusterIndex = useMemo(() => {
    return new Supercluster<TripPointProperties>({
      radius: 60,
      maxZoom: 16,
    }).load(features)
  }, [features])

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []
  }, [])

  const createImage = useCallback((src: string, alt: string) => {
    const img = document.createElement('img')
    img.src = src
    img.alt = alt
    img.loading = 'lazy'
    img.className = 'h-full w-full object-cover'
    img.onerror = () => {
      if (img.src !== FALLBACK_PHOTO_URL) {
        img.src = FALLBACK_PHOTO_URL
      }
    }
    return img
  }, [])

  const createClusterMarkerElement = useCallback(
    (photos: string[], count: number) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className =
        'relative h-20 w-28 overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-lg backdrop-blur'

      const cover = document.createElement('span')
      cover.className = 'block h-full w-full overflow-hidden'
      cover.appendChild(
        createImage(photos[0] ?? FALLBACK_PHOTO_URL, 'Cluster photo'),
      )
      button.appendChild(cover)

      const badge = document.createElement('span')
      badge.className =
        'absolute left-2 bottom-2 rounded-full bg-black/80 px-2 py-0.5 text-xs font-semibold text-white'
      badge.textContent = String(count)
      button.appendChild(badge)

      return button
    },
    [createImage],
  )

  const createTripMarkerElement = useCallback(
    (trip: TripPoint) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className =
        'relative h-20 w-28 overflow-hidden rounded-2xl border border-white/80 shadow-lg'
      button.appendChild(createImage(trip.photos[0], trip.title))
      return button
    },
    [createImage],
  )

  const updateClusters = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (!map.isStyleLoaded()) return
    const bounds = map.getBounds()
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]
    const zoom = Math.round(map.getZoom())
    const nextClusters = clusterIndex.getClusters(
      bbox,
      zoom,
    ) as ClusterOrPoint[]

    clearMarkers()

    nextClusters.forEach(feature => {
      const [lng, lat] = feature.geometry.coordinates as [number, number]
      if (isClusterFeature(feature)) {
        const { cluster_id: clusterId, point_count: pointCount } =
          feature.properties
        const leaves = clusterIndex.getLeaves(clusterId, 4) as PointFeature[]
        const thumbnails = leaves
          .map(leaf => tripPointsById.get(leaf.properties.pointId)?.photos[0])
          .filter((photo): photo is string => Boolean(photo))
        const el = createClusterMarkerElement(thumbnails, pointCount)
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map)
        markersRef.current.push(marker)
        return
      }

      const trip = tripPointsById.get(feature.properties.pointId)
      if (!trip) return
      const el = createTripMarkerElement(trip)
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map)
      markersRef.current.push(marker)
    })
  }, [
    clearMarkers,
    clusterIndex,
    createClusterMarkerElement,
    createTripMarkerElement,
    tripPointsById,
  ])

  useEffect(() => {
    if (themeReady) {
      setStableTheme(resolvedTheme)
    }
  }, [resolvedTheme, themeReady])

  useEffect(() => {
    if (!themeReady) return
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [LAS_VEGAS.lon, LAS_VEGAS.lat],
      zoom: 8,
      bearing: 0,
      pitch: 0,
    })

    mapRef.current = map

    map.on('load', () => {
      map.resize()
      updateClusters()
    })
    map.on('moveend', updateClusters)
    map.on('zoomend', updateClusters)
    map.on('dragend', updateClusters)

    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      map.off('moveend', updateClusters)
      map.off('zoomend', updateClusters)
      map.off('dragend', updateClusters)
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      clearMarkers()
    }
  }, [clearMarkers, mapStyle, themeReady, updateClusters])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!map.isStyleLoaded()) return
    map.setStyle(mapStyle)
  }, [mapStyle])

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ height: '100%' }}
      />
      {showScrollIndicator ? (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{
            bottom: 'max(6.5rem, calc(env(safe-area-inset-bottom) + 5.5rem))',
          }}
        >
          <ScrollIndicator
            onClick={() => {
              const target = document.getElementById(scrollTargetId)
              target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />
        </div>
      ) : null}
    </section>
  )
}
