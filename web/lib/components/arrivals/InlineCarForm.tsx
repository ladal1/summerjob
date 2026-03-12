'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPICarCreate } from 'lib/fetcher/car'
import { formatNumber } from 'lib/helpers/helpers'
import { CarCreateSchema, type CarCreateData } from 'lib/types/car'
import { useForm } from 'react-hook-form'

interface InlineCarFormProps {
  workerId: string
  onCreated: () => void
  onCancel: () => void
}

export default function InlineCarForm({
  workerId,
  onCreated,
  onCancel,
}: InlineCarFormProps) {
  const { trigger, isMutating, error, reset } = useAPICarCreate({
    onSuccess: () => {
      reset()
      onCreated()
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CarCreateData>({
    resolver: zodResolver<typeof CarCreateSchema>(CarCreateSchema),
    defaultValues: {
      ownerId: workerId,
      seats: 4,
      odometerStart: 0,
      description: '',
    },
  })

  const onSubmit = (data: CarCreateData) => {
    trigger(data)
  }

  return (
    <div className="card card-body bg-light">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="row g-2 align-items-end"
        autoComplete="off"
      >
        <input type="hidden" {...register('ownerId')} />
        <input type="hidden" {...register('description')} />
        <div className="col-auto">
          <label htmlFor="car-name" className="form-label mb-0 small">
            Název auta
          </label>
          <input
            id="car-name"
            type="text"
            className={`form-control form-control-sm ${errors.name ? 'is-invalid' : ''}`}
            placeholder="Model, značka"
            {...register('name')}
          />
          {errors.name && (
            <div className="invalid-feedback">{errors.name.message}</div>
          )}
        </div>
        <div className="col-auto" style={{ width: '100px' }}>
          <label htmlFor="car-seats" className="form-label mb-0 small">
            Sedadla
          </label>
          <input
            id="car-seats"
            type="number"
            className={`form-control form-control-sm ${errors.seats ? 'is-invalid' : ''}`}
            min={1}
            {...register('seats', {
              valueAsNumber: true,
              onChange: e => (e.target.value = formatNumber(e.target.value)),
            })}
          />
        </div>
        <div className="col-auto" style={{ width: '140px' }}>
          <label htmlFor="car-odometer" className="form-label mb-0 small">
            Stav km
          </label>
          <input
            id="car-odometer"
            type="number"
            className={`form-control form-control-sm ${errors.odometerStart ? 'is-invalid' : ''}`}
            min={0}
            {...register('odometerStart', {
              valueAsNumber: true,
              onChange: e => (e.target.value = formatNumber(e.target.value)),
            })}
          />
        </div>
        <div className="col-auto d-flex gap-1">
          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={isMutating}
          >
            <i className="fas fa-plus me-1"></i>
            Přidat
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onCancel}
          >
            Zrušit
          </button>
        </div>
        {error && (
          <div className="col-12">
            <div className="text-danger small">
              Nepodařilo se vytvořit auto.
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
