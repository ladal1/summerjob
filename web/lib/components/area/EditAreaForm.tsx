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
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { Area } from 'lib/prisma/zod'
import { TextInput } from '../forms/input/TextInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'

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
  const onSuccessMessageClose = () => {
    setSaved(false)
    router.back()
    router.refresh()
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>Upravit oblast</h3>
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
