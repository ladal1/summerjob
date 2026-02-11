'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIFoodAllergyCreate } from 'lib/fetcher/food-allergy'
import {
  FoodAllergyCreateSchema,
  type FoodAllergyCreateData,
} from 'lib/types/food-allergy'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { useRouter } from 'next/navigation'
import { Form } from '../forms/Form'

export default function CreateFoodAllergy() {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPIFoodAllergyCreate({
    onSuccess: () => {
      setSaved(true)
      reset()
    },
  })

  const router = useRouter()

  const onSubmit = (data: FoodAllergyCreateData) => {
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
  } = useForm<FoodAllergyCreateData>({
    resolver: zodResolver(FoodAllergyCreateSchema),
    defaultValues: {
      name: '',
    },
  })

  return (
    <>
      <Form
        label="Vytvořit alergii na jídlo"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-food-allergy"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="create-food-allergy"
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
