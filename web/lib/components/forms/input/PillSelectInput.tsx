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
  removeExisting?: (id: string) => void
  withNumberSelect?: boolean
  register: (items: PillSelectItem[]) => void
  registerUpdated?: (items: PillSelectItem[]) => void
  errors: FieldErrors<FormData>
}

export const PillSelectInput = <FormData extends FieldValues>({
  id,
  label,
  placeholder,
  items,
  init,
  removeExisting,
  withNumberSelect = false,
  register,
  registerUpdated,
  errors,
}: PillSelectInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  const onSelected = (items: PillSelectItem[]) => {
    if (registerUpdated) {
      const { withId, withoutId } = items.reduce(
        (result, toolItem) => {
          if (toolItem.databaseId) {
            result.withId.push(toolItem)
          } else {
            result.withoutId.push(toolItem)
          }
          return result
        },
        { withId: [] as PillSelectItem[], withoutId: [] as PillSelectItem[] }
      )
      register(withoutId)
      registerUpdated(withId)
    } else {
      register(items)
    }
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
        withNumberSelect={withNumberSelect}
        multiple
      />
      <FormWarning message={error} />
    </div>
  )
}
