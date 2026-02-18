'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '../forms/Form'
import { TextInput } from '../forms/input/TextInput'
import {
  ToolNameComplete,
  ToolNameUpdateData,
  ToolNameUpdateSchema,
} from 'lib/types/tool-name'
import { useAPIToolNameUpdate } from 'lib/fetcher/tool-name'
import { DynamicGroupButtonsInput } from '../forms/input/DynamicGroupButtonsInput'
import { useAPISkills } from 'lib/fetcher/skill'
import { useAPIJobTypes } from 'lib/fetcher/job-type'

export default function EditToolName({
  toolName,
}: {
  toolName: ToolNameComplete
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<ToolNameUpdateData>({
    resolver: zodResolver(ToolNameUpdateSchema),
    defaultValues: {
      name: toolName.name,
      skills: toolName.skills.map(s => s.id),
      jobTypes: toolName.jobTypes.map(jt => jt.id),
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPIToolNameUpdate(
    toolName.id,
    {
      onSuccess: () => {
        setSaved(true)
        reset()
      },
    }
  )

  const onSubmit = (data: ToolNameUpdateData) => {
    const modified = pick(
      data,
      ...Object.keys(dirtyFields)
    ) as ToolNameUpdateData
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  const { data: skills = [] } = useAPISkills()
  const skillOptions = skills.map(s => ({
    value: s.id,
    label: s.name,
  }))

  const { data: jobTypes = [] } = useAPIJobTypes()
  const jobTypeOptions = jobTypes.map(jt => ({
    value: jt.id,
    label: jt.name,
  }))

  return (
    <>
      <Form
        label="Upravit nástroj"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-tool-name"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="edit-tool-name"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TextInput
            id="name"
            label="Název"
            placeholder="Např. Pila, Žebřík..."
            errors={errors}
            register={() => register('name')}
            mandatory
            margin={false}
          />

          <DynamicGroupButtonsInput
            id="skills"
            label="Patří k dovednostem"
            options={skillOptions}
            register={() => register('skills')}
          />

          <DynamicGroupButtonsInput
            id="job-types"
            label="Patří k typům práce"
            options={jobTypeOptions}
            register={() => register('jobTypes')}
          />
        </form>
      </Form>
    </>
  )
}
