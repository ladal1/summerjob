'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { WorkerCreateSchema } from 'lib/types/worker'
import { useState } from 'react'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { formatPhoneNumber } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { useAPIWorkerCreate } from 'lib/fetcher/worker'
import { TextInput } from '../forms/input/TextInput'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { AlergyPillInput } from '../forms/input/AlergyPillInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import AddCarModal from '../modal/AddCarModal'
import { CarCreateData, CarCreateSchema } from 'lib/types/car'

const schema = WorkerCreateSchema
type WorkerForm = z.input<typeof schema>

interface CreateWorkerProps {
  allDates: DateBool[][]
  carAccess: boolean
}

export default function CreateWorker({
  allDates,
  carAccess,
}: CreateWorkerProps) {
  const {
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkerForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      availability: {
        workDays: [],
        adorationDays: [],
      },
      allergyIds: [],
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)

  const { trigger, isMutating, reset, error } = useAPIWorkerCreate({
    onSuccess: () => {
      setSaved(true)
    },
  })

  const onSubmit = (data: WorkerForm) => {
    trigger(data)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  const [phoneNumber, setPhoneNumber] = useState('')

  const handlePhoneChange = (e: { target: { value: string } }) => {
    const formattedValue = formatPhoneNumber(e.target.value)
    setPhoneNumber(formattedValue)
    // Set phone to dirtyFields
    setValue('phone', phoneNumber, { shouldDirty: true })
  }

  /* TODO: Finish AddCarModal or remove 
  const {
    setValue: setValueCar,
    register: registerCar,
    handleSubmit: handleSubmitCar,
    formState: { errors: errorsCar },
  } = useForm<CarCreateData>({
    resolver: zodResolver(CarCreateSchema),
    defaultValues: {
      seats: 4,
    },
  })


  const firstName = watch('firstName')
  const lastName = watch('lastName')

  const [isAddCarModalOpen, setAddCarModalOpen] = useState(false)

  const openAddCarModal = () => {
    setAddCarModalOpen(true)
  }

  const closeAddCarModal = () => {
    setAddCarModalOpen(false)
  }

  <button
    className="btn btn-light pt-2 pb-2 align-self-start"
    onClick={openAddCarModal}
  >
    <i className="fas fa-plus me-2"></i>
    Přidat auto
  </button>
  {isAddCarModalOpen && (
    <AddCarModal 
      onClose={closeAddCarModal} 
      errors={errorsCar}
      register={registerCar}
    />
  )}
  */

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>Přidat pracanta</h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextInput
              id="firstName"
              label="Jméno"
              type="text"
              placeholder="Jméno"
              maxLength={50}
              errors={errors}
              register={register}
            />
            <TextInput
              id="lastName"
              label="Příjmení"
              type="text"
              placeholder="Příjmení"
              maxLength={50}
              errors={errors}
              register={register}
            />
            <TextInput
              id="phone"
              label="Telefonní číslo"
              type="tel"
              placeholder="(+420) 123 456 789"
              maxLength={16}
              pattern="((?:\+|00)[0-9]{1,3})?[ ]?[0-9]{3}[ ]?[0-9]{3}[ ]?[0-9]{3}"
              value={phoneNumber}
              onChange={handlePhoneChange}
              errors={errors}
              register={register}
            />
            <TextInput
              id="email"
              label="Email"
              type="email"
              placeholder="uzivatel@example.cz"
              maxLength={320}
              errors={errors}
              register={register}
            />
            <div className="d-flex flex-row flex-wrap">
              <div className="me-5">
                <DateSelectionInput
                  id="availability.workDays"
                  label="Pracovní dostupnost"
                  register={register}
                  days={allDates}
                />
              </div>
              <DateSelectionInput
                id="availability.adorationDays"
                label="Dny adorace"
                register={register}
                days={allDates}
              />
            </div>
            <AlergyPillInput
              id="allergyIds"
              label="Alergie"
              register={register}
            />
            <OtherAttributesInput
              label="Další vlastnosti"
              register={register}
            />

            {carAccess && (
              <>
                <label
                  className="form-label d-block fw-bold mt-4"
                  htmlFor="car"
                >
                  Auta
                </label>
                <p>
                  Auta je možné přiřadit v záložce Auta po vytvořeni pracanta.
                </p>
              </>
            )}

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
            {saved && <SuccessProceedModal onClose={onConfirmationClosed} />}
            {error && <ErrorMessageModal onClose={reset} />}
          </form>
        </div>
      </div>
    </>
  )
}
