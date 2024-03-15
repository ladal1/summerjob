'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIAreaCreate } from 'lib/fetcher/area'
import { AreaCreateData, AreaCreateSchema } from 'lib/types/area'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { z } from 'zod'
import { TextInput } from '../forms/input/TextInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'

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
  const onSuccessMessageClose = () => {
    setSaved(false)
    router.back()
    router.refresh()
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>Přidat oblast</h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <TextInput
              id="name"
              label="Název oblasti"
              placeholder="Název oblasti"
              register={() => register('name')}
              errors={errors}
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
            <div className="d-flex justify-content-between gap-3">
              <button
                className="btn btn-secondary mt-4"
                type="button"
                onClick={() => router.back()}
              >
                Zpět
              </button>
              <input
                type={'submit'}
                className="btn btn-primary mt-4"
                value={'Uložit'}
                disabled={isMutating}
              />
            </div>
          </form>
        </div>
      </div>
      {saved && <SuccessProceedModal onClose={onSuccessMessageClose} />}
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}
