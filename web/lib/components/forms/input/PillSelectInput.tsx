import { FieldErrors, FieldValues } from 'react-hook-form'
import { Label } from '../Label'
import React from 'react'
import FormWarning from '../FormWarning'
import {
  PillSelect,
  PillSelectItem,
} from 'lib/components/filter-select/PillSelect'

interface PillSelectInputProps<FormData extends FieldValues> {
  id: string
  label?: string
  placeholder: string
  items: PillSelectItem[][]
  init?: PillSelectItem[]
  removeExisting: (id: string) => void
  register: (items: PillSelectItem[]) => void
  errors: FieldErrors<FormData>
}

export const PillSelectInput = <FormData extends FieldValues>({
  id,
  label,
  placeholder,
  items,
  init,
  removeExisting,
  register,
  errors,
}: PillSelectInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  const onSelected = (items: PillSelectItem[]) => {
    register(items)
  }

  return (
    <div className="d-flex flex-column m-0">
      <Label id={id} label={label} />
      <PillSelect
        id={id}
        placeholder={placeholder}
        items={items}
        onSelected={onSelected}
        defaultSelected={init}
        removeExisting={removeExisting}
        multiple={true}
      />
      <FormWarning message={error} />
    </div>
  )
}
