'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '../forms/Form'
import { TextInput } from '../forms/input/TextInput'
import {
  TShirtColorComplete,
  TShirtColorUpdateData,
  TShirtColorUpdateDataInput,
  TShirtColorUpdateSchema,
} from 'lib/types/t-shirt-color'
import { useAPITShirtColorUpdate } from 'lib/fetcher/t-shirt-color'

export default function EditTShirtColor({
  tShirtColor,
}: {
  tShirtColor: TShirtColorComplete
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<TShirtColorUpdateDataInput, unknown, TShirtColorUpdateData>({
    resolver: zodResolver(TShirtColorUpdateSchema),
    defaultValues: {
      name: tShirtColor.name,
      order: tShirtColor.order,
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPITShirtColorUpdate(
    tShirtColor.id,
    {
      onSuccess: () => {
        setSaved(true)
        reset()
      },
    }
  )

  const onSubmit = (data: TShirtColorUpdateData) => {
    const modified = pick(
      data,
      ...Object.keys(dirtyFields)
    ) as TShirtColorUpdateData
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <Form
      label="Upravit barvu trička"
      isInputDisabled={isMutating}
      onConfirmationClosed={onConfirmationClosed}
      resetForm={reset}
      saved={saved}
      error={error}
      formId="edit-t-shirt-color"
      isDirty={!saved && Object.keys(dirtyFields).length > 0}
    >
      <form
        id="edit-t-shirt-color"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <TextInput
          id="name"
          label="Název"
          placeholder="Např. přírodní, béžová, šedomodrá..."
          errors={errors}
          register={() => register('name')}
          mandatory
          margin={false}
        />
      </form>
    </Form>
  )
}
