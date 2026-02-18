'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIWorkAllergyCreate } from 'lib/fetcher/work-allergy'
import {
  WorkAllergyCreateSchema,
  type WorkAllergyCreateData,
} from 'lib/types/work-allergy'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { useRouter } from 'next/navigation'
import { Form } from '../forms/Form'

export default function CreateWorkAllergy() {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPIWorkAllergyCreate({
    onSuccess: () => {
      setSaved(true)
      reset()
    },
  })

  const router = useRouter()

  const onSubmit = (data: WorkAllergyCreateData) => {
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
  } = useForm<WorkAllergyCreateData>({
    resolver: zodResolver(WorkAllergyCreateSchema),
    defaultValues: {
      name: '',
    },
  })

  return (
    <>
      <Form
        label="Vytvořit pracovní alergii"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-work-allergy"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="create-work-allergy"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TextInput
            id="name"
            label="Název"
            placeholder="Např. Prach, Pyl..."
            errors={errors}
            register={() => register('name')}
            mandatory
            margin={false}
          />
        </form>
      </Form>
    </>
  )
}
