import { FieldErrors, FieldValues } from 'react-hook-form'
import { Label } from '../Label'
import React from 'react'
import { FilterSelect, FilterSelectItem } from 'lib/components/filter-select/FilterSelect'
import FormWarning from '../FormWarning'

interface PillInputProps<FormData extends FieldValues> {
  id: string
  label?: string
  placeholder: string,
  items: FilterSelectItem[][],
  register: (items: FilterSelectItem[]) => void
  errors: FieldErrors<FormData>
}

export const PillInput = <FormData extends FieldValues>({
  id,
  label,
  placeholder,
  items,
  register,
  errors
}: PillInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  const onSelected = (items: FilterSelectItem[]) => {
    register(items)
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
        items={items}
        onSelected={onSelected}
        multiple={true}
      />
      <FormWarning message={error} />
    </div>
  )
}

