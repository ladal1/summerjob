import { Marker, Popup, useMapEvents } from "react-leaflet"

interface LocationMarkerProps {
  markerPosition?: [number, number] | null
  setMarkerPosition?: (coords: [number, number]) => void
  canPickLocation?: boolean
}

export const LocationMarker = ({
  markerPosition,
  setMarkerPosition,
  canPickLocation = false
}: LocationMarkerProps) => {
  useMapEvents({
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