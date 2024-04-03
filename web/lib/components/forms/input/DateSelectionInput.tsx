import { UseFormRegisterReturn } from 'react-hook-form'
import DateSelection from '../DateSelection'
import { Label } from '../Label'
import { DateBool } from 'lib/data/dateSelectionType'

interface DateSelectionInputProps {
  id: string
  label: string
  register: () => UseFormRegisterReturn
  days: DateBool[][]
  disableAfter?: number
  margin?: boolean
}

export const DateSelectionInput = ({
  id,
  label,
  register,
  days,
  disableAfter = undefined,
  margin = true,
}: DateSelectionInputProps) => {
  return (
    <div className="d-flex flex-column m-0">
      <Label id={id} label={label} margin={margin} />
      <DateSelection
        name={id}
        days={days}
        disableAfter={disableAfter}
        register={register}
      />
    </div>
  )
}
