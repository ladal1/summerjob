import { DetailedHTMLProps, InputHTMLAttributes } from "react"
import { FieldErrors, FieldValues, UseFormRegisterReturn } from "react-hook-form"
import Map from "./Map"
import { Label } from "../Label"
import FormWarning from "../FormWarning"

interface MapInputProps<FormData extends FieldValues>
extends DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> {
  id: string
  label: string
  registerAdress: () => UseFormRegisterReturn
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

  return (
    <>
      <Label
        id={id}
        label={label}
      />
      <input
        className="form-control smj-input p-0 fs-5"
        {...registerAdress()}
        {...rest}
      />
      <div className="pt-2">
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