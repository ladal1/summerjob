'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPITShirtSizeCreate } from 'lib/fetcher/t-shirt-size'
import {
  TShirtSizeCreateSchema,
  type TShirtSizeCreateData,
  type TShirtSizeCreateDataInput,
} from 'lib/types/t-shirt-size'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { useRouter } from 'next/navigation'
import { Form } from '../forms/Form'

export default function CreateTShirtSize() {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPITShirtSizeCreate({
    onSuccess: () => {
      setSaved(true)
      reset()
    },
  })

  const router = useRouter()

  const onSubmit = (data: TShirtSizeCreateData) => {
    trigger(data)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<TShirtSizeCreateDataInput, unknown, TShirtSizeCreateData>({
    resolver: zodResolver(TShirtSizeCreateSchema),
    defaultValues: {
      name: '',
      order: 0,
    },
  })

  return (
    <Form
      label="Vytvořit velikost trička"
      isInputDisabled={isMutating}
      onConfirmationClosed={onConfirmationClosed}
      resetForm={reset}
      saved={saved}
      error={error}
      formId="create-t-shirt-size"
      isDirty={!saved && Object.keys(dirtyFields).length > 0}
    >
      <form
        id="create-t-shirt-size"
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
