'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { CarCreateData, CarCreateSchema } from 'lib/types/car'
import { WorkerBasicInfo } from 'lib/types/worker'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { NoteInput } from '../forms/input/NoteInput'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { FilterSelectItem } from '../filter-select/FilterSelect'

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
            <TextInput
              id="name"
              label="Název"
              type="text"
              placeholder="Model auta, značka"
              maxLength={50}
              errors={errors}
              register={register}
            />
            <NoteInput
              id="description"
              label="Poznámka pro organizátory"
              placeholder="Speciální vlastnosti, způsob kompenzace za najeté km, ..."
              rows={3}
              register={register}
            />
            <TextInput
              id="seats"
              label="Počet sedadel"
              isNumber={true}
              type="number"
              placeholder="Počet sedadel"
              min={1}
              errors={errors}
              register={register}
            />
            <FilterSelectInput
              id="ownerId"
              label="Majitel"
              placeholder="Vyberte majitele"
              owners={owners}
              onSelect={onOwnerSelected}
              errors={errors}
              register={() => register('ownerId')}
            />
            <TextInput
              id="odometerStart"
              label="Počáteční stav kilometrů"
              isNumber={true}
              type="number"
              placeholder="Počáteční stav kilometrů"
              min={0}
              errors={errors}
              register={register}
            />

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
