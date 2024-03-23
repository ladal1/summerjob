'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { CarComplete, CarUpdateData, CarUpdateSchema } from 'lib/types/car'
import { useForm } from 'react-hook-form'

type CarEditFormProps = {
  car: CarComplete
  onSubmit: (data: CarUpdateData) => void
  isSending: boolean
}

export default function CarEditForm({
  car,
  onSubmit,
  isSending,
}: CarEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CarUpdateData>({
    resolver: zodResolver(CarUpdateSchema),
    defaultValues: {
      name: car.name,
      description: car.description ?? '',
      seats: car.seats,
      odometerStart: car.odometerStart,
      odometerEnd: car.odometerEnd,
      reimbursed: car.reimbursed,
      reimbursementAmount: car.reimbursementAmount,
    },
  })

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>
            {car.name} - {car.owner.firstName} {car.owner.lastName}
          </h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="form-label fw-bold mt-4" htmlFor="name">
              Název
            </label>
            <input
              id="name"
              className="form-control p-0 fs-5"
              type="text"
              placeholder="Model auta, značka"
              {...register('name')}
            />
            {errors.name?.message && (
              <p className="text-danger">{errors.name.message as string}</p>
            )}
            <label className="form-label fw-bold mt-4" htmlFor="description">
              Poznámka pro organizátory
            </label>
            <textarea
              id="description"
              className="form-control border p-1 fs-5"
              rows={3}
              placeholder="Popis"
              {...register('description')}
            />
            <label className="form-label fw-bold mt-4" htmlFor="seats">
              Počet sedadel
            </label>
            <input
              id="seats"
              className="form-control p-0 fs-5"
              type="number"
              placeholder="Počet sedadel"
              min="1"
              {...register('seats', { valueAsNumber: true })}
            />
            {errors.seats?.message && (
              <p className="text-danger">{errors.seats.message as string}</p>
            )}
            <label className="form-label fw-bold mt-4" htmlFor="odometer-start">
              Počáteční stav kilometrů
            </label>
            <input
              id="odometer-start"
              className="form-control p-0 fs-5"
              type="number"
              placeholder="Počáteční stav kilometrů"
              min="0"
              {...register('odometerStart', { valueAsNumber: true })}
            />
            {errors.odometerStart?.message && (
              <p className="text-danger">
                {errors.odometerStart.message as string}
              </p>
            )}
            <label className="form-label fw-bold mt-4" htmlFor="odometer-end">
              Konečný stav kilometrů
            </label>
            <input
              id="odometer-end"
              className="form-control p-0 fs-5"
              type="number"
              placeholder="Konečný stav kilometrů"
              min="0"
              {...register('odometerEnd', { valueAsNumber: true })}
            />
            {errors.odometerEnd?.message && (
              <p className="text-danger">
                {errors.odometerEnd.message as string}
              </p>
            )}
            <label
              className="form-label fw-bold mt-4"
              htmlFor="odometer-reimbursementAmount"
            >
              Částka k proplacení
            </label>
            <input
              id="odometer-reimbursementAmount"
              className="form-control p-0 fs-5"
              type="number"
              placeholder="Částka k proplacení"
              min="0"
              {...register('reimbursementAmount', {
                valueAsNumber: true,
              })}
            />
            <div className="form-check mt-4">
              <input
                className="form-check-input me-2"
                type="checkbox"
                id="odometer-reimbursed"
                {...register('reimbursed')}
              />
              <label
                className="form-check-label form-label fw-bold"
                htmlFor="odometer-reimbursed"
              >
                Proplaceno
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
                disabled={isSending}
              />
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
