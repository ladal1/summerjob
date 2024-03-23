import { UseFormRegisterReturn } from 'react-hook-form'
import { EnumMapping } from 'lib/data/enumMapping/enumMapping'
import ButtonGroup from '../ButtonGroup'

interface GroupButtonsInputProps {
  label: string
  mapping: EnumMapping<string>
  register: () => UseFormRegisterReturn
}

export const GroupButtonsInput = ({
  label,
  mapping,
  register,
}: GroupButtonsInputProps) => {
  return (
    <>
      <label className="form-label d-block fw-bold mt-4" htmlFor="allergy">
        {label}
      </label>
      <div className="form-check-inline">
        {Object.entries(mapping).map(([key, name]) => (
          <ButtonGroup
            key={key}
            id={key}
            name={name}
            register={register}
          />
        ))}
      </div>
    </>
  )
}
