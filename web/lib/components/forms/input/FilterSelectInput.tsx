import {
  FilterSelect,
  FilterSelectItem,
} from 'lib/components/filter-select/FilterSelect'
import { FieldErrors, FieldValues } from 'react-hook-form'
import FormWarning from '../FormWarning'
import { Label } from '../Label'

interface FilterSelectInputProps<FormData extends FieldValues> {
  id: string
  label: string
  placeholder: string
  items: FilterSelectItem[]
  labelClassName?: string
  errors: FieldErrors<FormData>
  onSelected: (id: string) => void
  defaultSelected?: FilterSelectItem | undefined

  mandatory?: boolean
}

export const FilterSelectInput = <FormData extends FieldValues>({
  id,
  label,
  placeholder,
  items,
  labelClassName = '',
  errors,
  onSelected,
  defaultSelected,

  mandatory = false,
}: FilterSelectInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  return (
    <div className="d-flex flex-column m-0">
      <Label
        id={id}
        label={label}
        mandatory={mandatory}
        className={labelClassName}
      />
      <FilterSelect
        id={id}
        placeholder={placeholder}
        items={items}
        onSelected={onSelected}
        defaultSelected={defaultSelected}
      />
      <FormWarning message={error} />
    </div>
  )
}
