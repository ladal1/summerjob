import { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Label } from '../Label'
import React from 'react'

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
          <div className="form-check align-self-center align-items-center d-flex gap-2 mt-2">
            <input
              className="form-check-input smj-checkbox"
              type="checkbox"
              id={item.id}
              {...register(item.id as Path<FormData>)}
            />
            <label className="form-check-label" htmlFor={item.id}>
              <i className={`${item.icon} ms-2 me-2`}></i>
              {item.label}
            </label>
          </div>
        </React.Fragment>
      ))}
    </>
  )
}
