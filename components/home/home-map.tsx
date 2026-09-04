'use client'

import { circle, bbox as turfBbox } from '@turf/turf'
import type { Feature, FeatureCollection, Point } from 'geojson'
import maplibregl, { type Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapLibre, {
  Layer,
  type MapRef,
  Marker,
  Source,
  type ViewState,
} from 'react-map-gl/maplibre'
import Supercluster from 'supercluster'
import { type TripPoint, tripPoints } from '@/lib/map/trip-points'
import { cn } from '@/lib/utils'

const LAS_VEGAS = {
  lat: 36.1699,
  lon: -115.1398,
}

const RADIUS_KM = 483
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

export function HomeMap({
  selectedTripId,
  onTripSelect,
  className,
}: HomeMapProps) {
  const mapRef = useRef<MapRef | null>(null)
  const rafRef = useRef<number | null>(null)
  const [clusters, setClusters] = useState<ClusterOrPoint[]>([])
  const { resolvedTheme } = useTheme()
  const [stableTheme, setStableTheme] = useState<'light' | 'dark'>('light')

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

  const radiusPolygon = useMemo(() => {
    return circle([LAS_VEGAS.lon, LAS_VEGAS.lat], RADIUS_KM, {
      units: 'kilometers',
      steps: 80,
    })
  }, [])

  const radiusBounds = useMemo(
    () => turfBbox(radiusPolygon) as [number, number, number, number],
    [radiusPolygon],
  )

  const radiusSource = useMemo<FeatureCollection>(() => {
    return {
      type: 'FeatureCollection',
      features: [radiusPolygon],
    }
  }, [radiusPolygon])

  const getMapInstance = useCallback((): MapLibreMap | null => {
    if (!mapRef.current) return null
    const map = mapRef.current.getMap?.()
    return map ?? (mapRef.current as unknown as MapLibreMap)
  }, [])

  const updateClusters = useCallback(() => {
    const map = getMapInstance()
    if (!map) return
    if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) return
    const bounds = map.getBounds()
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]
    const zoom = Math.round(map.getZoom())
    setClusters(clusterIndex.getClusters(bbox, zoom) as ClusterOrPoint[])
  }, [clusterIndex, getMapInstance])

  const scheduleClusterUpdate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      updateClusters()
      rafRef.current = null
    })
  }, [updateClusters])

  useEffect(() => {
    scheduleClusterUpdate()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [scheduleClusterUpdate])

  useEffect(() => {
    if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
      setStableTheme(resolvedTheme)
    }
  }, [resolvedTheme])

  useEffect(() => {
    const map = getMapInstance()
    if (!map) return
    const handleStyleLoad = () => {
      scheduleClusterUpdate()
    }
    map.on('style.load', handleStyleLoad)
    if (map.isStyleLoaded?.()) {
      handleStyleLoad()
    }
    return () => {
      map.off('style.load', handleStyleLoad)
    }
  }, [getMapInstance, scheduleClusterUpdate])

  useEffect(() => {
    if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
      setStableTheme(resolvedTheme)
    }
  }, [resolvedTheme])

  useEffect(() => {
    const map = getMapInstance()
    if (!map) return
    const handleStyleLoad = () => {
      scheduleClusterUpdate()
    }
    map.on('style.load', handleStyleLoad)
    if (map.isStyleLoaded?.()) {
      handleStyleLoad()
    }
    return () => {
      map.off('style.load', handleStyleLoad)
    }
  }, [getMapInstance, scheduleClusterUpdate])

  const isClusterFeature = (
    feature: ClusterOrPoint,
  ): feature is ClusterFeature =>
    (feature.properties as ClusterProperties).cluster === true

  const handleMapLoad = useCallback(() => {
    const map = getMapInstance()
    if (!map) return
    map.fitBounds(
      [
        [radiusBounds[0], radiusBounds[1]],
        [radiusBounds[2], radiusBounds[3]],
      ],
      {
        padding: 64,
        duration: 0,
      },
    )
    updateClusters()
  }, [radiusBounds, updateClusters, getMapInstance])

  const handleClusterClick = useCallback(
    (_clusterId: number, lng: number, lat: number) => {
      const map = getMapInstance()
      if (!map) return
      const currentZoom = map.getZoom()
      const targetZoom = Math.min(currentZoom + 2, 12)
      map.easeTo({
        center: [lng, lat],
        zoom: targetZoom,
        duration: 800,
      })
    },
    [getMapInstance],
  )

  const initialViewState = useMemo<ViewState>(
    () => ({
      longitude: LAS_VEGAS.lon,
      latitude: LAS_VEGAS.lat,
      zoom: 5,
      bearing: 0,
      pitch: 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
    }),
    [],
  )
  const mapStyle = stableTheme === 'dark' ? DARK_BASEMAP_URL : LIGHT_BASEMAP_URL

  return (
    <div className={cn('absolute inset-0', className)}>
      <MapLibre
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={initialViewState}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onMoveEnd={scheduleClusterUpdate}
        dragRotate={false}
        touchPitch={false}
        reuseMaps
      >
        <Source id="radius-circle" type="geojson" data={radiusSource}>
          <Layer
            id="radius-fill"
            type="fill"
            paint={{
              'fill-color': '#6b7280',
              'fill-opacity': 0.08,
            }}
          />
          <Layer
            id="radius-outline"
            type="line"
            paint={{
              'line-color': '#111827',
              'line-opacity': 0.35,
              'line-width': 2,
            }}
          />
        </Source>

        {clusters.map(feature => {
          const [lng, lat] = feature.geometry.coordinates as [number, number]

          if (isClusterFeature(feature)) {
            const { cluster_id: clusterId, point_count: pointCount } =
              feature.properties
            const leaves = clusterIndex.getLeaves(
              clusterId,
              4,
            ) as PointFeature[]
            const thumbnails = leaves
              .map(
                leaf => tripPointsById.get(leaf.properties.pointId)?.photos[0],
              )
              .filter((photo): photo is string => Boolean(photo))

            return (
              <Marker
                key={`cluster-${clusterId}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
              >
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    handleClusterClick(clusterId, lng, lat)
                  }}
                  className="relative grid h-16 w-16 grid-cols-2 grid-rows-2 gap-0.5 rounded-2xl border border-white/80 bg-white/90 p-1 shadow-lg backdrop-blur transition-transform hover:scale-105"
                  aria-label={`Zoom into ${pointCount} trip locations`}
                >
                  {thumbnails.map(photo => (
                    <span
                      key={photo}
                      className="relative overflow-hidden rounded-md"
                    >
                      <Image
                        src={photo}
                        alt="Cluster"
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    </span>
                  ))}
                  {pointCount > 4 ? (
                    <span className="absolute -right-2 -top-2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                      +{pointCount - 4}
                    </span>
                  ) : null}
                </button>
              </Marker>
            )
          }

          const trip = tripPointsById.get(feature.properties.pointId)
          if (!trip) return null
          const isSelected = trip.id === selectedTripId

          return (
            <Marker
              key={trip.id}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  onTripSelect(trip)
                }}
                className={cn(
                  'group relative h-11 w-11 overflow-hidden rounded-xl border border-white/80 shadow-md transition-transform hover:scale-110',
                  isSelected ? 'ring-2 ring-primary' : 'ring-0',
                )}
                aria-label={`View trip details for ${trip.title}`}
              >
                <Image
                  src={trip.photos[0]}
                  alt={trip.title}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </button>
            </Marker>
          )
        })}
      </MapLibre>
      <div className="absolute left-4 top-4 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
        Approx. 5-hour drive radius from Las Vegas
      </div>
      <div className="absolute right-4 top-4 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
        TODO: swap to MapTiler or another provider
      </div>
    </div>
  )
}
