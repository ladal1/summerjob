'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIAreaCreate } from 'lib/fetcher/area'
import { useAPIWorkers } from 'lib/fetcher/worker'
import { AreaCreateSchema } from 'lib/types/area'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { TextInput } from '../forms/input/TextInput'
import { Form } from '../forms/Form'
import { Label } from '../forms/Label'
import FormWarning from '../forms/FormWarning'

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
    formState: { errors, dirtyFields },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      managerId: '',
    },
  })

  const { data: workers } = useAPIWorkers()
  const teamMembers = (workers ?? []).filter(w => w.isTeam)

  const onSubmit = (data: FormData) => {
    trigger(data, {
      onSuccess: () => {
        setSaved(true)
        reset()
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
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
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
          <Label id="managerId" label="Vedoucí oblasti" />
          <select
            id="managerId"
            className="form-select smj-input p-0 fs-5"
            {...register('managerId')}
          >
            <option value="">Žádný</option>
            {teamMembers.map(worker => (
              <option key={worker.id} value={worker.id}>
                {worker.firstName} {worker.lastName}
              </option>
            ))}
          </select>
          <FormWarning
            message={errors.managerId?.message as string | undefined}
          />
        </form>
      </Form>
    </>
  )
}
