'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { type CalendarTrip } from '@/lib/events/types'
import { cn } from '@/lib/utils'

interface MapShellProps {
  trips: CalendarTrip[]
  onTripSelect: (trip: CalendarTrip) => void
  selectedTripId?: string
  className?: string
  is3D?: boolean
}

export function MapShell({ trips, onTripSelect, selectedTripId, className, is3D }: MapShellProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-120.5, 42.5], // Center on West Coast
      zoom: 5,
      pitch: is3D ? 45 : 0,
      bearing: is3D ? -17 : 0,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right')

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update pitch when 3D mode changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return
    
    map.current.easeTo({
      pitch: is3D ? 45 : 0,
      bearing: is3D ? -17 : 0,
      duration: 1000,
    })
  }, [is3D, mapLoaded])

  // Create marker element
  const createMarkerElement = useCallback((trip: CalendarTrip, isSelected: boolean) => {
    const el = document.createElement('div')
    el.className = 'trip-marker'
    el.innerHTML = `
      <div class="marker-container ${isSelected ? 'selected' : ''}" style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid ${isSelected ? 'var(--primary)' : 'white'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        cursor: pointer;
        transition: all 0.2s ease;
        transform: scale(${isSelected ? 1.15 : 1});
      ">
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=100&h=100&fit=crop" 
          alt="${trip.title}"
          style="width: 100%; height: 100%; object-fit: cover;"
        />
      </div>
    `
    
    el.addEventListener('mouseenter', () => {
      const container = el.querySelector('.marker-container') as HTMLElement
      if (container && !isSelected) {
        container.style.transform = 'scale(1.1)'
      }
    })
    
    el.addEventListener('mouseleave', () => {
      const container = el.querySelector('.marker-container') as HTMLElement
      if (container && !isSelected) {
        container.style.transform = 'scale(1)'
      }
    })
    
    return el
  }, [])

  // Add markers for trips
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add new markers
    trips.forEach((trip) => {
      const isSelected = trip.id === selectedTripId
      const el = createMarkerElement(trip, isSelected)
      
      el.addEventListener('click', () => {
        onTripSelect(trip)
      })

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([trip.coordinates.lng, trip.coordinates.lat])
        .addTo(map.current!)

      markersRef.current.push(marker)
    })
  }, [trips, mapLoaded, selectedTripId, onTripSelect, createMarkerElement])

  // Fly to selected trip
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedTripId) return

    const selectedTrip = trips.find(t => t.id === selectedTripId)
    if (selectedTrip) {
      map.current.flyTo({
        center: [selectedTrip.coordinates.lng, selectedTrip.coordinates.lat],
        zoom: 8,
        duration: 1500,
      })
    }
  }, [selectedTripId, trips, mapLoaded])

  return (
    <div className={cn('relative w-full h-full', className)}>
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* 3D Mode Overlay (placeholder for future terrain) */}
      {is3D && (
        <div className="absolute bottom-24 left-4 bg-card/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-border">
          <p className="text-sm font-medium">3D Terrain Mode</p>
          <p className="text-xs text-muted-foreground">Enhanced elevation view active</p>
        </div>
      )}
    </div>
  )
}
