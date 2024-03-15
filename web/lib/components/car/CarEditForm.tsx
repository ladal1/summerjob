'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { CarComplete, CarUpdateData, CarUpdateSchema } from 'lib/types/car'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { formatNumber } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'

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

  const router = useRouter()

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
            <TextInput
              id="name"
              label="Název"
              placeholder="Model auta, značka"
              errors={errors}
              register={() => register('name')}
            />
            <TextAreaInput
              id="description"
              label="Poznámka pro organizátory"
              placeholder="Speciální vlastnosti, způsob kompenzace za najeté km, ..."
              rows={4}
              register={() => register('description')}
            />
            <TextInput
              id="seats"
              label="Počet sedadel"
              placeholder="Počet sedadel"
              min={1}
              register={() =>
                register('seats', {
                  valueAsNumber: true,
                  onChange: e =>
                    (e.target.value = formatNumber(e.target.value)),
                })
              }
              errors={errors}
            />
            <TextInput
              id="odometerStart"
              label="Počáteční stav kilometrů"
              placeholder="Počáteční stav kilometrů"
              min={0}
              register={() =>
                register('odometerStart', {
                  valueAsNumber: true,
                  onChange: e =>
                    (e.target.value = formatNumber(e.target.value)),
                })
              }
              errors={errors}
            />
            <TextInput
              id="odometerEnd"
              label="Konečný stav kilometrů"
              placeholder="Konečný stav kilometrů"
              min={0}
              register={() =>
                register('odometerEnd', {
                  valueAsNumber: true,
                  onChange: e =>
                    (e.target.value = formatNumber(e.target.value)),
                })
              }
              errors={errors}
            />
            <TextInput
              id="reimbursementAmount"
              label="Částka k proplacení"
              placeholder="Částka k proplacení"
              min={0}
              register={() =>
                register('reimbursementAmount', {
                  valueAsNumber: true,
                  onChange: e =>
                    (e.target.value = formatNumber(e.target.value)),
                })
              }
              errors={errors}
            />
            <OtherAttributesInput
              register={register}
              objects={[
                {
                  id: 'reimbursed',
                  icon: 'fa-solid fa-hand-holding-dollar',
                  label: 'Proplaceno',
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
                disabled={isSending}
              />
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
