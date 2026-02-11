import { UseFormRegisterReturn } from 'react-hook-form'
import ButtonGroup from '../ButtonGroup'

type Option = {
  value: string
  label: string
}

interface GroupButtonsInputProps {
  id: string
  label: string
  options: Option[]
  register: () => UseFormRegisterReturn
}

export const DynamicGroupButtonsInput = ({
  id,
  label,
  options,
  register,
}: GroupButtonsInputProps) => {
  return (
    <>
      <label className="form-label d-block fw-bold mt-4" htmlFor={id}>
        {label}
      </label>
      <div id={id} className="form-check-inline">
        {options.map(opt => (
          <ButtonGroup
            key={opt.value}
            id={opt.value}
            name={opt.label}
            register={register}
            groupId={id}
          />
        ))}
      </div>
    </>
  )
}
