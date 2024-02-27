import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes, useState } from "react"
import { FieldErrors, FieldValues, UseFormRegisterReturn } from "react-hook-form"
import Map from "../../map/Map"
import { Label } from "../Label"
import FormWarning from "../FormWarning"
import { getGeocodingData } from "lib/components/map/GeocodingData"

interface MapInputProps<FormData extends FieldValues>
extends DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> {
  id: string
  label: string
  registerAdress: (address: string) => void
  registerCoordinations: (coords: [number, number]) => void 
  errors: FieldErrors<FormData>
  markerPosition?: [number, number] | null
}

export const MapInput = <FormData extends FieldValues> ({
  id,
  label,
  registerAdress,
  registerCoordinations,
  errors,
  markerPosition,
  ...rest
}: MapInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const [address, setAddress] = useState('')
  

  const geocodingDataSearch = async () => {
    setIsButtonDisabled(true)
    const coordinates = await getGeocodingData(address)
    if(coordinates) {
      console.log(coordinates)
    }
    setTimeout(() => {
      setIsButtonDisabled(false)
    }, 2000);
  }

  return (
    <>
      <div className="container p-0 m-0">
        <div className="row align-items-end">
            <div className="col">
              <Label
                id={id}
                label={label}
              />
              <input
                className="form-control smj-input p-0 fs-5"
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
                Najít souřadnice na mapě
              </button>
          </div>
        </div>
      </div>
      <div className="pt-3">
        <Map
          center={markerPosition ?? [49.8203, 15.4784]} // Czech republic
          zoom={6}
          canPickLocation={true}
          markerPosition={markerPosition}
          registerCoordinations={registerCoordinations}
        />
      </div>
      <FormWarning message={error} />
    </>
  )
}