import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { ChangeView } from '../ChangeView'
import { LocationMarker } from '../LocationMarker'
import React, { useEffect, useState } from 'react'

export interface MapProps {
  center: [number, number]
  zoom: number
  address?: string
  scrollWheelZoom?: boolean
  markerPosition?: [number, number] | null
  setMarkerPosition?: (coords: [number, number]) => void
  canPickLocation?: boolean
}

export const Map = ({ 
  center, 
  zoom,
  address,
  scrollWheelZoom = true,
  markerPosition,
  setMarkerPosition,
  canPickLocation = false
}: MapProps) => {


  // Fix for Marker Icon that is not defaultly showing for react-leaflet
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png',
    iconAnchor: [11, 46], // fix icon position
    popupAnchor: [2, -46] // fix popup window position
  })
  L.Marker.prototype.options.icon = DefaultIcon

  return (
      <MapContainer 
        className="smj-map-container" 
        style={{
          zIndex: 1 // Fix for too high z-index of zoom panel
        }}
        center={center} 
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        placeholder={
          <>
            <p>
              Mapa České republiky.{' '}
              <noscript>Pro zobrazení mapy povolte JavaScript.</noscript>
            </p>
          </>
        }
      >
        { markerPosition && <ChangeView center={markerPosition}/>}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          address={address ?? ''}
          markerPosition={markerPosition}
          setMarkerPosition={setMarkerPosition}
          canPickLocation={canPickLocation}
        />
      </MapContainer>
  )
}