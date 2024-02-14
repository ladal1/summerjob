'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { CarCreateData, CarCreateSchema } from 'lib/types/car'
import { WorkerBasicInfo } from 'lib/types/worker'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { FilterSelectItem } from '../filter-select/FilterSelect'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { useRouter } from 'next/navigation'
import { allowForNumber, formatNumber } from 'lib/helpers/helpers'

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

  const router = useRouter()

  const onOwnerSelected = (id: string) => {
    setValue('ownerId', id)
  }

  function workerToSelectItem(worker: WorkerBasicInfo): FilterSelectItem {
    return {
      id: worker.id,
      name: `${worker.firstName} ${worker.lastName}`,
      searchable: `${worker.firstName} ${worker.lastName}`,
    }
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
            <TextInput
              id="name"
              label="Název"
              placeholder="Model auta, značka"
              errors={errors}
              register={() => register("name")}
            />
            <TextAreaInput
              id="description"
              label="Poznámka pro organizátory"
              placeholder="Speciální vlastnosti, způsob kompenzace za najeté km, ..."
              rows={4}
              register={() => register("description")}
            />
            <TextInput
              id="seats"
              label="Počet sedadel"
              type="number"
              placeholder="Počet sedadel"
              min={1}
              defaultValue={4}
              onKeyDown={(e) => allowForNumber(e)}
              register={() => register("seats", { valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              errors={errors}
            />
            <FilterSelectInput
              id="ownerId"
              label="Majitel"
              placeholder="Vyberte majitele"
              items={owners.map(workerToSelectItem)}
              onSelected={onOwnerSelected}
              register={() => register('ownerId')}
              errors={errors}
            />
            <TextInput
              id="odometerStart"
              label="Počáteční stav kilometrů"
              type="number"
              placeholder="Počáteční stav kilometrů"
              min={0}
              onKeyDown={(e) => allowForNumber(e)}
              register={() => register("odometerStart", { valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              errors={errors}
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
                disabled={isSending}
              />
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
