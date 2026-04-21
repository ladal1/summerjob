'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPITShirtColorCreate } from 'lib/fetcher/t-shirt-color'
import {
  TShirtColorCreateSchema,
  type TShirtColorCreateData,
  type TShirtColorCreateDataInput,
} from 'lib/types/t-shirt-color'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { useRouter } from 'next/navigation'
import { Form } from '../forms/Form'

export default function CreateTShirtColor() {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPITShirtColorCreate({
    onSuccess: () => {
      setSaved(true)
      reset()
    },
  })

  const router = useRouter()

  const onSubmit = (data: TShirtColorCreateData) => {
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
  } = useForm<TShirtColorCreateDataInput, unknown, TShirtColorCreateData>({
    resolver: zodResolver(TShirtColorCreateSchema),
    defaultValues: {
      name: '',
      order: 0,
    },
  })

  return (
    <Form
      label="Vytvořit barvu trička"
      isInputDisabled={isMutating}
      onConfirmationClosed={onConfirmationClosed}
      resetForm={reset}
      saved={saved}
      error={error}
      formId="create-t-shirt-color"
      isDirty={!saved && Object.keys(dirtyFields).length > 0}
    >
      <form
        id="create-t-shirt-color"
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
