'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '../forms/Form'
import { TextInput } from '../forms/input/TextInput'
import {
  TShirtSizeComplete,
  TShirtSizeUpdateData,
  TShirtSizeUpdateDataInput,
  TShirtSizeUpdateSchema,
} from 'lib/types/t-shirt-size'
import { useAPITShirtSizeUpdate } from 'lib/fetcher/t-shirt-size'

export default function EditTShirtSize({
  tShirtSize,
}: {
  tShirtSize: TShirtSizeComplete
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<TShirtSizeUpdateDataInput, unknown, TShirtSizeUpdateData>({
    resolver: zodResolver(TShirtSizeUpdateSchema),
    defaultValues: {
      name: tShirtSize.name,
      order: tShirtSize.order,
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPITShirtSizeUpdate(
    tShirtSize.id,
    {
      onSuccess: () => {
        setSaved(true)
        reset()
      },
    }
  )

  const onSubmit = (data: TShirtSizeUpdateData) => {
    const modified = pick(
      data,
      ...Object.keys(dirtyFields)
    ) as TShirtSizeUpdateData
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <Form
      label="Upravit velikost trička"
      isInputDisabled={isMutating}
      onConfirmationClosed={onConfirmationClosed}
      resetForm={reset}
      saved={saved}
      error={error}
      formId="edit-t-shirt-size"
      isDirty={!saved && Object.keys(dirtyFields).length > 0}
    >
      <form
        id="edit-t-shirt-size"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <TextInput
          id="name"
          label="Název"
          placeholder="Např. XS, S, M, L..."
          errors={errors}
          register={() => register('name')}
          mandatory
          margin={false}
        />
      </form>
    </Form>
  )
}
