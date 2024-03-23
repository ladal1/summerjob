'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { CarCreateData, CarCreateSchema } from 'lib/types/car'
import { WorkerBasicInfo } from 'lib/types/worker'
import { useForm } from 'react-hook-form'
import { FilterSelect, FilterSelectItem } from '../filter-select/FilterSelect'

type CarEditFormProps = {
  onSubmit: (data: CarCreateData) => void
  isSending: boolean
  owners: WorkerBasicInfo[]
}

export default function CarCreateForm({
  onSubmit,
  isSending,
  owners,
}: CarEditFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CarCreateData>({
    resolver: zodResolver(CarCreateSchema),
    defaultValues: {
      seats: 4,
    },
  })

  const ownerItems = owners.map(workerToSelectItem)

  const onOwnerSelected = (item: FilterSelectItem) => {
    setValue('ownerId', item.id)
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>Přidat auto</h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <label className="form-label fw-bold mt-4" htmlFor="name">
              Název
            </label>
            <input
              id="name"
              className="form-control p-2 fs-5"
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
              className="form-control border p-2 fs-5"
              rows={3}
              placeholder="Speciální vlastnosti, způsob kompenzace za najeté km, ..."
              {...register('description')}
            />
            <label className="form-label fw-bold mt-4" htmlFor="seats">
              Počet sedadel
            </label>
            <input
              id="seats"
              className="form-control p-2 fs-5"
              type="number"
              placeholder="Počet sedadel"
              min="1"
              {...register('seats', { valueAsNumber: true })}
            />
            {errors.seats?.message && (
              <p className="text-danger">{errors.seats.message as string}</p>
            )}

            <label className="form-label fw-bold mt-4" htmlFor="owner">
              Majitel
            </label>
            <FilterSelect
              placeholder="Vyberte majitele"
              items={ownerItems}
              onSelected={onOwnerSelected}
            />
            <input type={'hidden'} {...register('ownerId')} />
            {errors.ownerId?.message && (
              <p className="text-danger">Vyberte majitele auta.</p>
            )}

            <label className="form-label fw-bold mt-4" htmlFor="odometer-start">
              Počáteční stav kilometrů
            </label>
            <input
              id="odometer-start"
              className="form-control p-2 fs-5"
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

function workerToSelectItem(worker: WorkerBasicInfo): FilterSelectItem {
  return {
    id: worker.id,
    name: `${worker.firstName} ${worker.lastName}`,
    searchable: `${worker.firstName} ${worker.lastName}`,
    item: (
      <div>
        {worker.firstName} {worker.lastName}
      </div>
    ),
  }
}
