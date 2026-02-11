'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIJobTypeCreate } from 'lib/fetcher/job-type'
import { JobTypeCreateSchema, type JobTypeCreateData } from 'lib/types/job-type'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { useRouter } from 'next/navigation'
import { Form } from '../forms/Form'

export default function CreateJobType() {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPIJobTypeCreate({
    onSuccess: () => {
      setSaved(true)
      reset()
    },
  })

  const router = useRouter()

  const onSubmit = (data: JobTypeCreateData) => {
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
  } = useForm<JobTypeCreateData>({
    resolver: zodResolver(JobTypeCreateSchema),
    defaultValues: {
      name: '',
    },
  })

  return (
    <>
      <Form
        label="Vytvořit typ práce"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-job-type"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="create-job-type"
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
