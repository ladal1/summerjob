'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '../forms/Form'
import { TextInput } from '../forms/input/TextInput'
import {
  WorkAllergyComplete,
  WorkAllergyUpdateData,
  WorkAllergyUpdateSchema,
} from 'lib/types/work-allergy'
import { useAPIWorkAllergyUpdate } from 'lib/fetcher/work-allergy'

export default function EditWorkAllergy({
  workAllergy,
}: {
  workAllergy: WorkAllergyComplete
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<WorkAllergyUpdateData>({
    resolver: zodResolver(WorkAllergyUpdateSchema),
    defaultValues: {
      name: workAllergy.name,
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPIWorkAllergyUpdate(
    workAllergy.id,
    {
      onSuccess: () => {
        setSaved(true)
        reset()
      },
    }
  )

  const onSubmit = (data: WorkAllergyUpdateData) => {
    const modified = pick(
      data,
      ...Object.keys(dirtyFields)
    ) as WorkAllergyUpdateData
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <>
      <Form
        label="Upravit pracovní alergii"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-work-allergy"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="edit-work-allergy"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TextInput
            id="name"
            label="Název"
            placeholder="Např. Lepek, Vegan..."
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
