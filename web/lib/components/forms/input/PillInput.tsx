import { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Label } from '../Label'
import React from 'react'
import { FilterSelect, FilterSelectItem } from 'lib/components/filter-select/FilterSelect'
import { toolNameMapping } from 'lib/data/enumMapping/toolNameMapping'

interface PillInputProps<FormData extends FieldValues> {
  id: string
  label?: string
  placeholder: string,
  items: FilterSelectItem[][],
  register: (id: string, amount: number) => void
}

export const PillInput = <FormData extends FieldValues>({
  id,
  label,
  placeholder,
  items,
  register
}: PillInputProps<FormData>) => {

  const onSelected = (id: string) => {
    console.log(id)
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
      />
      <button
        className="btn btn-secondary mt-4"
        type="button"
        onClick={() => register('AXE', 2)}
      >
        Register
      </button>
    </div>
  )
}

