import React, { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

export interface MapProps {
  center: [number, number]
  zoom: number
  scrollWheelZoom?: boolean
  markerPosition?: [number, number] | null
  setMarkerPosition?: (coords: [number, number]) => void
  canPickLocation?: boolean
}

export const Map = ({ 
  center, 
  zoom,
  scrollWheelZoom = true,
  markerPosition,
  setMarkerPosition,
  canPickLocation = false,
}: MapProps) => {


  // Fix for Marker Icon that is not defaultly showing for react-leaflet
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png',
    iconAnchor: [11, 46], // fix icon position
    popupAnchor: [2, -46] // fix popup window position
  })
  L.Marker.prototype.options.icon = DefaultIcon

  function LocationMarker() {
    const map = useMapEvents({
      
      click(event) {
        if(canPickLocation) {
          const { lat, lng } = event.latlng
          if(setMarkerPosition)
            setMarkerPosition([lat, lng])
        }
      },
    })
  
    return (markerPosition === null || markerPosition === undefined) ? null : (
      <Marker position={markerPosition}>
        <Popup>
          Souřadnice: <br /> {`[${markerPosition[0]}, ${markerPosition[1]}]`}
        </Popup>
      </Marker>
    )
  }

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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
      </MapContainer>
  )
}