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
  errors: FieldErrors<FormData>
  onSelected: (id: string) => void
  defaultSelected?: FilterSelectItem | undefined
}

export const FilterSelectInput = <FormData extends FieldValues>({
  id,
  label,
  placeholder,
  items,
  errors,
  onSelected,
  defaultSelected,
}: FilterSelectInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  const innerOnSelected = (items: FilterSelectItem[]) => {
    console.log(items)
    if(items && items.length !== 0)
      onSelected(items[0].id)
  }

  return (
    <div className="d-flex flex-column m-0">
      <Label
        id={id}
        label={label}
      />
      <FilterSelect
        id={id}
        placeholder={placeholder}
        items={[items]}
        onSelected={innerOnSelected}
        defaultSelected={defaultSelected}
      />
      <FormWarning message={error} />
    </div>
  )
}
