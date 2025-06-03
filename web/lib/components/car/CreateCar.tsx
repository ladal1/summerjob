'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPICarCreate } from 'lib/fetcher/car'
import { formatNumber } from 'lib/helpers/helpers'
import { CarCreateSchema, type CarCreateData } from 'lib/types/car'
import { WorkerBasicInfo } from 'lib/types/worker'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FilterSelectItem } from '../filter-select/FilterSelect'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { TextInput } from '../forms/input/TextInput'
import { useRouter } from 'next/navigation'
import { Form } from '../forms/Form'

export default function CreateCar({ workers }: { workers: WorkerBasicInfo[] }) {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPICarCreate({
    onSuccess: () => {
      setSaved(true)
      reset()
    },
  })

  const router = useRouter()

  const onSubmit = (data: CarCreateData) => {
    trigger(data)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<CarCreateData>({
    resolver: zodResolver(CarCreateSchema),
    defaultValues: {
      seats: 4,
    },
  })

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
      <Form
        label="Vytvořit auto"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-car"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="create-car"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
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
            defaultValue={4}
            register={() =>
              register('seats', {
                valueAsNumber: true,
                onChange: e => (e.target.value = formatNumber(e.target.value)),
              })
            }
            errors={errors}
            mandatory
          />
          <FilterSelectInput
            id="ownerId"
            label="Majitel"
            placeholder="Vyberte majitele"
            items={workers.map(workerToSelectItem)}
            onSelected={onOwnerSelected}
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
        </form>
      </Form>
    </>
  )
}
