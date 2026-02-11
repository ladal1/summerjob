'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '../forms/Form'
import { TextInput } from '../forms/input/TextInput'
import {
  JobTypeComplete,
  JobTypeUpdateData,
  JobTypeUpdateSchema,
} from 'lib/types/job-type'
import { useAPIJobTypeUpdate } from 'lib/fetcher/job-type'

export default function EditJobType({ jobType }: { jobType: JobTypeComplete }) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<JobTypeUpdateData>({
    resolver: zodResolver(JobTypeUpdateSchema),
    defaultValues: {
      name: jobType.name,
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPIJobTypeUpdate(
    jobType.id,
    {
      onSuccess: () => {
        setSaved(true)
        reset()
      },
    }
  )

  const onSubmit = (data: JobTypeUpdateData) => {
    const modified = pick(
      data,
      ...Object.keys(dirtyFields)
    ) as JobTypeUpdateData
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <>
      <Form
        label="Upravit typ práce"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-job-type"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="edit-job-type"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TextInput
            id="name"
            label="Název"
            placeholder="Např. Dřevo, Malování..."
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
