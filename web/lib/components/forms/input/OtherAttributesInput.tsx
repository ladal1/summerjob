import { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Label } from '../Label'
import React from 'react'
import { IconAndLabel } from '../IconAndLabel'

interface OtherAttributesInputProps<FormData extends FieldValues> {
  label?: string
  register: UseFormRegister<FormData>
  objects: {
    id: string
    icon: string
    label: string
  }[]
}

export const OtherAttributesInput = <FormData extends FieldValues>({
  label,
  register,
  objects,
}: OtherAttributesInputProps<FormData>) => {
  return (
    <>
      <div className="mb-2">
        <Label id={objects[0]?.id} label={label} />
      </div>

      {objects.map(item => (
        <React.Fragment key={item.id}>
          <div className="mt-2">
            <div className="d-flex align-items-start gap-3">
              <div>
                <input
                  className="form-check-input smj-checkbox "
                  type="checkbox"
                  id={item.id}
                  {...register(item.id as Path<FormData>)}
                />
              </div>
              <div>
                <label className="form-check-label" htmlFor={item.id}>
                  <IconAndLabel icon={item.icon} label={item.label} />
                </label>
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}
    </>
  )
}
