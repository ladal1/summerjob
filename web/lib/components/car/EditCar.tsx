'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPICarUpdate } from 'lib/fetcher/car'
import { formatNumber, pick } from 'lib/helpers/helpers'
import {
  CarUpdateSchema,
  type CarComplete,
  type CarUpdateData,
} from 'lib/types/car'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { TextInput } from '../forms/input/TextInput'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { Form } from '../forms/Form'

export default function EditCar({ car }: { car: CarComplete }) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
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

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPICarUpdate(car.id, {
    onSuccess: () => {
      setSaved(true)
    },
  })

  const onSubmit = (data: CarUpdateData) => {
    const modified = pick(data, ...Object.keys(dirtyFields)) as CarUpdateData
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <>
      <Form
        label="Upravit auto"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-car"
      >
        <form id="edit-car" onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            id="name"
            label="Název"
            placeholder="Model auta, značka"
            errors={errors}
            register={() => register('name')}
            mandatory
            margin={false}
          />
          <TextAreaInput
            id="description"
            label="Poznámka pro organizátory"
            placeholder="Speciální vlastnosti, způsob kompenzace za najeté km, ..."
            rows={4}
            register={() => register('description')}
            errors={errors}
          />
          <TextInput
            id="seats"
            type="number"
            label="Počet sedadel"
            placeholder="Počet sedadel"
            min={1}
            register={() =>
              register('seats', {
                valueAsNumber: true,
                onChange: e => (e.target.value = formatNumber(e.target.value)),
              })
            }
            errors={errors}
            mandatory
          />
          <TextInput
            id="odometerStart"
            type="number"
            label="Počáteční stav kilometrů"
            placeholder="Počáteční stav kilometrů"
            min={0}
            register={() =>
              register('odometerStart', {
                valueAsNumber: true,
                onChange: e => (e.target.value = formatNumber(e.target.value)),
              })
            }
            errors={errors}
            mandatory
          />
          <TextInput
            id="odometerEnd"
            type="number"
            label="Konečný stav kilometrů"
            placeholder="Konečný stav kilometrů"
            min={0}
            register={() =>
              register('odometerEnd', {
                valueAsNumber: true,
                onChange: e => (e.target.value = formatNumber(e.target.value)),
              })
            }
            errors={errors}
            mandatory
          />
          <TextInput
            id="reimbursementAmount"
            type="number"
            label="Částka k proplacení"
            placeholder="Částka k proplacení"
            min={0}
            register={() =>
              register('reimbursementAmount', {
                valueAsNumber: true,
                onChange: e => (e.target.value = formatNumber(e.target.value)),
              })
            }
            errors={errors}
            mandatory
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
        </form>
      </Form>
    </>
  )
}
