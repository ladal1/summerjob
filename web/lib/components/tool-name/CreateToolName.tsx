'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIToolNameCreate } from 'lib/fetcher/tool-name'
import {
  ToolNameCreateSchema,
  type ToolNameCreateData,
} from 'lib/types/tool-name'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { useRouter } from 'next/navigation'
import { Form } from '../forms/Form'
import { DynamicGroupButtonsInput } from '../forms/input/DynamicGroupButtonsInput'
import { useAPISkills } from 'lib/fetcher/skill'
import { useAPIJobTypes } from 'lib/fetcher/job-type'

export default function CreateToolName() {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPIToolNameCreate({
    onSuccess: () => {
      setSaved(true)
      reset()
    },
  })

  const router = useRouter()

  const onSubmit = (data: ToolNameCreateData) => {
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
  } = useForm<ToolNameCreateData>({
    resolver: zodResolver(ToolNameCreateSchema),
    defaultValues: {
      name: '',
      skills: [],
      jobTypes: [],
    },
  })

  const { data: skills = [] } = useAPISkills()
  const skillMapping = skills.map(s => ({
    value: s.id,
    label: s.name,
  }))

  const { data: jobTypes = [] } = useAPIJobTypes()
  const jobTypeMapping = jobTypes.map(jt => ({
    value: jt.id,
    label: jt.name,
  }))

  return (
    <>
      <Form
        label="Vytvořit nástroj"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-tool-name"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="create-tool-name"
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
            options={skillMapping}
            register={() => register('skills')}
          />

          <DynamicGroupButtonsInput
            id="job-types"
            label="Patří k typům práce"
            options={jobTypeMapping}
            register={() => register('jobTypes')}
          />
        </form>
      </Form>
    </>
  )
}
