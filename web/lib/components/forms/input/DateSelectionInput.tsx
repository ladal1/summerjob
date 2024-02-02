import { UseFormRegisterReturn } from 'react-hook-form'
import DateSelection from '../DateSelection'

interface DateSelectionInputProps {
  id: string
  label: string
  register: () => UseFormRegisterReturn
  days: DateBool[][]
}

export const DateSelectionInput = ({
  id,
  label,
  register,
  days,
}: DateSelectionInputProps) => {
  return (
    <div className="d-flex flex-column m-0">
      <label className="form-label d-block fw-bold mt-4" htmlFor={id}>
        {label}
      </label>
      <DateSelection name={id} days={days} register={register} />
    </div>
  )
}
