import { useState } from "react"
import { FieldErrors, Path } from "react-hook-form"
import Map from "../../map/Map"
import { Label } from "../Label"
import FormWarning from "../FormWarning"
import { getGeocodingData, getReverseGeocodingData } from "lib/components/map/GeocodingData"
import { ProgressBar } from "../ProgressBar"

interface AddressInput {
  id: string,
  label: string,
  placeholder: string,
  init?: string,
  register: (address: string) => void
}

interface CoordinatesInput {
  id: string,
  label: string,
  placeholder: string,
  init?: [number, number] | null,
  register: (coords: [number, number]) => void
}

interface MapInputProps {
  address: AddressInput,
  coordinates: CoordinatesInput
  errors: FieldErrors<FormData>
}

export const MapInput = ({
  address,
  coordinates,
  errors
}: MapInputProps) => {
  const errorAddress = errors?.[address.id as Path<FormData>]?.message as string | undefined
  const errorCoordinates = errors?.[coordinates.id as Path<FormData>]?.message as string | undefined

  const [addressValue, setAddressValue] = useState(address.init ?? '')
  const [addressForMap, setAddressForMap] = useState(address.init ?? '')
  const [coordinatesValue, setCoordinatesValue] = useState(coordinates.init ?? null)

  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const [canPickLocation, setCanPickLocation] = useState(true)

  const timeOut = 3000

  const geocodingDataSearch = async ()   => {
    setIsButtonDisabled(true)
    setAddressForMap(addressValue)
    const fetchedCoords = await getGeocodingData(addressValue)
    if(fetchedCoords) {
      setCoordinatesValue(fetchedCoords)
      coordinates.register(fetchedCoords)
    }
    setTimeout(() => {
      setIsButtonDisabled(false)
    }, timeOut)
  }

  const reverseGeocodingDataSearch = async (coords: [number, number]) => {
    setCanPickLocation(false)
    const fetchedAddress = await getReverseGeocodingData(coords[0], coords[1])
    if(fetchedAddress) {
      setAddressValue(fetchedAddress)
      setAddressForMap(fetchedAddress)
      address.register(fetchedAddress)
    }
    setTimeout(() => {
      setCanPickLocation(true)
    }, timeOut)
  }

  const registerMarker = async (coords: [number, number]) => {
    coordinates.register(coords)
    setCoordinatesValue(coords)
    await reverseGeocodingDataSearch(coords)
  }

  return (
    <>
      <div className="container p-0 m-0">
        <div className="row align-items-end">
            <div className="col">
              <Label
                id={address.id}
                label={address.label}
              />
              <input
                className="form-control smj-input p-0 fs-5"
                value={addressValue}
                placeholder={address.placeholder}
                onChange={(e) => {
                  address.register(e.target.value)
                  setAddressValue(e.target.value)
                }}
              />
            </div>
            <div className="col-auto">
              <button 
                className="btn btn-primary"
                type="button"
                onClick={geocodingDataSearch}
                disabled={isButtonDisabled}
              >
                Najít adresu na mapě
              </button>
              {isButtonDisabled && 
                <ProgressBar
                  time={timeOut}  
                />
              }
          </div>
        </div>
      </div>
      <FormWarning message={errorAddress} />
      {(coordinatesValue?.[0] && coordinatesValue?.[1]) && (
        <>
          <Label
          id={coordinates.id}
          label={coordinates.label}
          />
          <input
            className="form-control smj-input p-0 fs-5"
            value={`[${coordinatesValue?.[0]}, ${coordinatesValue?.[1]}]`}
            placeholder={coordinates.placeholder}
            disabled={true}
          />
        </>
      )}
      <FormWarning message={errorCoordinates} />
      <div className="pt-3">
        <div className="container p-0 m-0">
          <Map
            center={coordinates.init ?? [49.8203, 15.4784]} // Czech republic
            zoom={6}
            address={addressForMap}
            canPickLocation={canPickLocation}
            markerPosition={coordinatesValue}
            setMarkerPosition={registerMarker}
          />
          {!canPickLocation && 
            <ProgressBar
              time={timeOut}  
            />
          }
        </div>
      </div>
    </>
  )
}