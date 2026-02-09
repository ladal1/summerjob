'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPISkillCreate } from 'lib/fetcher/skill'
import { SkillHasCreateSchema, type SkillHasCreateData } from 'lib/types/skill'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { useRouter } from 'next/navigation'
import { Form } from '../forms/Form'

export default function CreateSkill() {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPISkillCreate({
    onSuccess: () => {
      setSaved(true)
      reset()
    },
  })

  const router = useRouter()

  const onSubmit = (data: SkillHasCreateData) => {
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
  } = useForm<SkillHasCreateData>({
    resolver: zodResolver(SkillHasCreateSchema),
    defaultValues: {
      name: '',
    },
  })

  return (
    <>
      <Form
        label="Vytvořit dovednost"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-skill"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="create-skill"
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
