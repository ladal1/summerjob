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

interface EditAreaProps {
  sArea: Serialized<Area>
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
            <label className="form-label fw-bold mt-4" htmlFor="name">
              Název oblasti
            </label>
            <input
              className="form-control p-1 ps-2"
              id="name"
              {...register('name')}
            />
            {errors.name && (
              <div className="text-danger">Zadejte název jobu</div>
            )}

            <div className="form-check mt-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="requiresCar"
                {...register('requiresCar')}
              />
              <label className="form-check-label" htmlFor="requiresCar">
                <i className="fa fa-car ms-2 me-2"></i>
                Do oblasti je nutné dojet autem
              </label>
            </div>

            <div className="d-flex justify-content-between gap-3">
              <button
                className="btn btn-secondary mt-4"
                type="button"
                onClick={() => window.history.back()}
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
