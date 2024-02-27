import React, { useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

export interface MapProps {
  center: [number, number]
  zoom: number
  scrollWheelZoom?: boolean
  markerPosition?: [number, number] | null
  canPickLocation?: boolean
  registerCoordinations?: (coords: [number, number]) => void
}

export const Map = ({ 
  center, 
  zoom,
  scrollWheelZoom = true,
  markerPosition,
  canPickLocation = false,
  registerCoordinations
}: MapProps) => {


  // Fix for Marker Icon that is not defaultly showing for react-leaflet
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png',
    iconAnchor: [11, 46], // fix icon position
    popupAnchor: [2, -46] // fix popup window position
  })
  L.Marker.prototype.options.icon = DefaultIcon

  
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(markerPosition ?? null)

  function LocationMarker() {
    const map = useMapEvents({
      click(event) {
        if(canPickLocation) {
          const { lat, lng } = event.latlng
          console.log(`Clicked at: ${lat}, ${lng}`)
          setClickedPosition([lat, lng])
          if(registerCoordinations)
            registerCoordinations([lat, lng])
        }
      },
    })
  
    return clickedPosition === null ? null : (
      <Marker position={clickedPosition}>
        <Popup>
          Souřadnice: <br /> {`[${clickedPosition[0]}, ${clickedPosition[1]}]`}
        </Popup>
      </Marker>
    )
  }

  return (
      <MapContainer 
        className="smj-map-container" 
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