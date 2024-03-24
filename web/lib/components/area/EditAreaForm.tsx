'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIAreaUpdate } from 'lib/fetcher/area'
import {
  AreaUpdateData,
  AreaUpdateSchema,
  deserializeAreaComp,
} from 'lib/types/area'
import { Serialized } from 'lib/types/serialize'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { TextInput } from '../forms/input/TextInput'
import { Form } from '../post/Form'

interface EditAreaProps {
  sArea: Serialized
}

export default function EditAreaForm({ sArea }: EditAreaProps) {
  const area = deserializeAreaComp(sArea)
  const { trigger, error, isMutating, reset } = useAPIAreaUpdate(area)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AreaUpdateData>({
    resolver: zodResolver(AreaUpdateSchema),
    defaultValues: {
      name: area.name,
      requiresCar: area.requiresCar,
    },
  })

  const onSubmit = (data: AreaUpdateData) => {
    trigger(data, {
      onSuccess: () => {
        setSaved(true)
      },
    })
  }

  const router = useRouter()

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <>
      <Form
        label="Upravit oblast"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-area"
      >
        <form
          id="edit-area"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TextInput
            id="name"
            label="Název oblasti"
            placeholder="Název oblasti"
            register={() => register('name')}
            errors={errors}
            mandatory
            margin={false}
          />
          <OtherAttributesInput
            register={register}
            objects={[
              {
                id: 'requiresCar',
                icon: 'fa fa-car',
                label: 'Do oblasti je nutné dojet autem',
              },
              {
                id: 'supportsAdoration',
                icon: 'fa fa-church',
                label: 'V oblasti je možné adorovat',
              },
            ]}
          />
        </form>
      </Form>
    </>
  )
}
