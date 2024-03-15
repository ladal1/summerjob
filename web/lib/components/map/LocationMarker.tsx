import { Marker, Popup, useMapEvents } from "react-leaflet"

interface LocationMarkerProps {
  address?: string
  markerPosition?: [number, number] | null
  setMarkerPosition?: (coords: [number, number]) => void
  canPickLocation?: boolean
}

export const LocationMarker = ({
  address,
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
        <div>
          <div className="row">
            <div className="col">
              <strong>Souřadnice:</strong>
            </div>
          </div>
          <div className="row">
            <div className="col">
              {`[${markerPosition[0]}, ${markerPosition[1]}]`}
            </div>
          </div>
        </div>
        {address && (
          <div>
            <br/>
            <div className="row">
              <div className="col">
              <strong>Adresa:</strong> 
              </div>
            </div>
            <div className="row">
              <div className="col">
                {`${address}`}
              </div>
            </div>
          </div>
        )}
      </Popup>
    </Marker>
  )
}