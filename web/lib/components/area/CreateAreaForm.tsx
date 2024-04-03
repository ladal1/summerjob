'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIAreaCreate } from 'lib/fetcher/area'
import { AreaCreateData, AreaCreateSchema } from 'lib/types/area'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { TextInput } from '../forms/input/TextInput'
import { Form } from '../forms/Form'

interface CreateAreaProps {
  eventId: string
}

const schema = AreaCreateSchema.omit({ summerJobEventId: true })
type FormData = z.infer<typeof schema>

export default function CreateAreaForm({ eventId }: CreateAreaProps) {
  const { trigger, error, isMutating, reset } = useAPIAreaCreate(eventId)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AreaCreateData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
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
        label="Vytvořit oblast"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-area"
      >
        <form
          id="create-area"
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
