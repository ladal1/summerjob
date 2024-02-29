import { DetailedHTMLProps, InputHTMLAttributes, useState } from "react"
import { FieldErrors, FieldValues } from "react-hook-form"
import Map from "../../map/Map"
import { Label } from "../Label"
import FormWarning from "../FormWarning"
import { getGeocodingData, getReverseGeocodingData } from "lib/components/map/GeocodingData"
import { ProgressBar } from "../ProgressBar"

interface MapInputProps<FormData extends FieldValues>
extends DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> {
  idAddress: string
  idCoordinations: string
  label: string
  registerAdress: (address: string) => void
  registerCoordinations: (coords: [number, number]) => void 
  errors: FieldErrors<FormData>
  markerPosition?: [number, number] | null
  addressInit?: string
}

export const MapInput = <FormData extends FieldValues> ({
  idAddress,
  idCoordinations,
  label,
  registerAdress,
  registerCoordinations,
  errors,
  markerPosition = null,
  addressInit = '',
  ...rest
}: MapInputProps<FormData>) => {
  const errorAddress = errors?.[idAddress]?.message as string | undefined
  const errorCoordinations = errors?.[idCoordinations]?.message as string | undefined

  const [address, setAddress] = useState(addressInit)
  const [coordinates, setCoordinates] = useState(markerPosition)

  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const [canPickLocation, setCanPickLocation] = useState(true)

  const timeOut = 3000

  const geocodingDataSearch = async ()   => {
    setIsButtonDisabled(true)
    const fetchedCoords = await getGeocodingData(address)
    if(fetchedCoords) {
      setCoordinates(fetchedCoords)
      registerCoordinations(fetchedCoords)
    }
    setTimeout(() => {
      setIsButtonDisabled(false)
    }, timeOut)
  }

  const reverseGeocodingDataSearch = async () => {
    setCanPickLocation(false)
    const fetchedAddress = await getReverseGeocodingData(coordinates?.at(0), coordinates?.at(1)) // has to be number, because coords are set in caller registerMarker
    if(fetchedAddress) {
      setAddress(fetchedAddress)
      registerAdress(fetchedAddress)
    }
    setTimeout(() => {
      setCanPickLocation(true)
    }, timeOut)
  }

  const registerMarker = (coords: [number, number]) => {
    registerCoordinations(coords)
    setCoordinates(coords)
    reverseGeocodingDataSearch()
  }

  return (
    <>
      <div className="container p-0 m-0">
        <div className="row align-items-end">
            <div className="col">
              <Label
                id={idAddress}
                label={label}
              />
              <input
                className="form-control smj-input p-0 fs-5"
                value={address}
                onChange={(e) => {
                  registerAdress(e.target.value)
                  setAddress(e.target.value)
                }}
                {...rest}
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
      <div className="pt-3">
        <div className="container p-0 m-0">
          <Map
            center={markerPosition ?? [49.8203, 15.4784]} // Czech republic
            zoom={6}
            canPickLocation={canPickLocation}
            markerPosition={coordinates}
            setMarkerPosition={registerMarker}
          />
          {!canPickLocation && 
            <ProgressBar
              time={timeOut}  
            />
          }
        </div>
      </div>
      <FormWarning message={errorCoordinations} />
    </>
  )
}