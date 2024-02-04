import { UseFormRegisterReturn } from 'react-hook-form'
import DateSelection from '../DateSelection'
import { Label } from './Label'

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
      <Label
        id={id}
        label={label}
      />
      <DateSelection name={id} days={days} register={register} />
    </div>
  )
}
