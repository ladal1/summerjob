import { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { DetailedHTMLProps, InputHTMLAttributes } from 'react'
import { allergyMapping } from 'lib/data/allergyMapping'
import AllergyPill from '../AllergyPill'

interface AlergyPillInputProps<FormData extends FieldValues>
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  id: Path<FormData>
  label: string
  register: UseFormRegister<FormData>
}

export const AlergyPillInput = <FormData extends FieldValues>({
  id,
  label,
  register,
}: AlergyPillInputProps<FormData>) => {
  return (
    <>
      <label className="form-label d-block fw-bold mt-4" htmlFor="allergy">
        {label}
      </label>
      <div className="form-check-inline">
        {Object.entries(allergyMapping).map(([allergyKey, allergyName]) => (
          <AllergyPill
            key={allergyKey}
            allergyId={allergyKey}
            allergyName={allergyName}
            register={() => register(id)}
          />
        ))}
      </div>
    </>
  )
}
