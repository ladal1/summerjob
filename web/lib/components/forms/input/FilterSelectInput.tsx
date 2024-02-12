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
  onSelect: (item: FilterSelectItem) => void
}

export const FilterSelectInput = <FormData extends FieldValues>({
  id,
  label,
  placeholder,
  items,
  register,
  errors,
  onSelect,
}: FilterSelectInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  return (
    <div className="d-flex flex-column m-0">
      <Label
        id={id}
        label={label}
      />
      <FilterSelect
        placeholder={placeholder}
        items={items}
        onSelected={onSelect}
      />
      <input type={'hidden'} {...register()} />
      <FormWarning message={error} />
    </div>
  )
}
