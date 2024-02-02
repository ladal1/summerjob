import { UseFormRegisterReturn } from 'react-hook-form'
import { allergyMapping } from 'lib/data/allergyMapping'
import AllergyPill from '../AllergyPill'

interface AlergyPillInputProps {
  label: string
  register: () => UseFormRegisterReturn
}

export const AlergyPillInput = ({
  label,
  register,
}: AlergyPillInputProps) => {
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
            register={register}
          />
        ))}
      </div>
    </>
  )
}
