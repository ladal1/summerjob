import {
  FieldErrors,
  FieldValues,
  UseFormRegisterReturn,
} from 'react-hook-form'
import {
  FilterSelect,
  FilterSelectItem,
} from 'lib/components/filter-select/FilterSelect'
import FormWarning from '../FormWarning'
import { Label } from '../Label'

interface FilterSelectInputProps<FormData extends FieldValues> {
  id: string
  label: string
  placeholder: string
  items: FilterSelectItem[]
  register: () => UseFormRegisterReturn
  errors: FieldErrors<FormData>
  onSelected: (id: string) => void
  defaultSelected?: FilterSelectItem
}

export const FilterSelectInput = <FormData extends FieldValues>({
  id,
  label,
  placeholder,
  items,
  register,
  errors,
  onSelected,
  defaultSelected,
}: FilterSelectInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  return (
    <div className="d-flex flex-column m-0">
      <Label
        id={id}
        label={label}
      />
      <FilterSelect
        id={id}
        placeholder={placeholder}
        items={items}
        onSelected={onSelected}
        defaultSelected={defaultSelected}
      />
      <input type={'hidden'} {...register()} />
      <FormWarning message={error} />
    </div>
  )
}
