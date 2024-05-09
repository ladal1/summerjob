import { DateBool } from 'lib/data/dateSelectionType'
import {
  FieldValues,
  UseFormRegisterReturn,
  UseFormSetValue,
} from 'react-hook-form'
import { Label } from '../Label'
import DateSelection from '../DateSelection'

interface DateSelectionInputProps<FormData extends FieldValues> {
  id: string
  label: string
  register: () => UseFormRegisterReturn
  setValue?: UseFormSetValue<FormData>
  days: DateBool[][]
  disableAfter?: number
  allowSpecialButtons?: boolean
  margin?: boolean
}

export const DateSelectionInput = <FormData extends FieldValues>({
  id,
  label,
  register,
  setValue,
  days,
  disableAfter = undefined,
  allowSpecialButtons = false,
  margin = true,
}: DateSelectionInputProps<FormData>) => {
  return (
    <div className="d-flex flex-column m-0">
      <Label id={id} label={label} margin={margin} />
      <DateSelection
        name={id}
        days={days}
        disableAfter={disableAfter}
        register={register}
        setValue={setValue}
        allowSpecialButtons={allowSpecialButtons}
      />
    </div>
  )
}
