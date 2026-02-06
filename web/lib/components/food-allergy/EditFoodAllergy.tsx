'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '../forms/Form'
import { TextInput } from '../forms/input/TextInput'
import {
  FoodAllergyComplete,
  FoodAllergyUpdateData,
  FoodAllergyUpdateSchema,
} from 'lib/types/food-allergy'
import { useAPIFoodAllergyUpdate } from 'lib/fetcher/food-allergy'

export default function EditFoodAllergy({
  foodAllergy,
}: {
  foodAllergy: FoodAllergyComplete
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<FoodAllergyUpdateData>({
    resolver: zodResolver(FoodAllergyUpdateSchema),
    defaultValues: {
      name: foodAllergy.name,
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPIFoodAllergyUpdate(
    foodAllergy.id,
    {
      onSuccess: () => {
        setSaved(true)
        reset()
      },
    }
  )

  const onSubmit = (data: FoodAllergyUpdateData) => {
    const modified = pick(
      data,
      ...Object.keys(dirtyFields)
    ) as FoodAllergyUpdateData
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <>
      <Form
        label="Upravit alergii na jídlo"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-food-allergy"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="edit-food-allergy"
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
