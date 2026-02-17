'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '../forms/Form'
import { TextInput } from '../forms/input/TextInput'
import {
  SkillHasComplete,
  SkillHasUpdateData,
  SkillHasUpdateSchema,
} from 'lib/types/skill'
import { useAPISkillUpdate } from 'lib/fetcher/skill'

export default function EditSkill({ skill }: { skill: SkillHasComplete }) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<SkillHasUpdateData>({
    resolver: zodResolver(SkillHasUpdateSchema),
    defaultValues: {
      name: skill.name,
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPISkillUpdate(skill.id, {
    onSuccess: () => {
      setSaved(true)
      reset()
    },
  })

  const onSubmit = (data: SkillHasUpdateData) => {
    const modified = pick(
      data,
      ...Object.keys(dirtyFields)
    ) as SkillHasUpdateData
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <>
      <Form
        label="Upravit dovednost"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-skill"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="edit-skill"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TextInput
            id="name"
            label="Název"
            placeholder="Např. Dřevorubec, Práce ve výškách..."
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
