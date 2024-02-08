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
import { NoteInput } from '../forms/input/NoteInput'
import { ImageUploader } from '../forms/ImageUpload'

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
    register,
    handleSubmit,
    setValue,
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
      router.refresh()
    },
  })

  const onSubmit = (dataForm: WorkerForm) => {
    trigger(dataForm)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  const removePhoto = () => {
    setValue('photoFile', undefined, { shouldDirty: false, shouldValidate: false})
  }

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
              register={() => register("firstName")}
              errors={errors}
            />
            <TextInput
              id="lastName"
              label="Příjmení"
              type="text"
              placeholder="Příjmení"
              maxLength={50}
              errors={errors}
              register={() => register("lastName")}
            />
            <TextInput
              id="phone"
              label="Telefonní číslo"
              type="tel"
              placeholder="(+420) 123 456 789"
              maxLength={16}
              pattern="((?:\+|00)[0-9]{1,3})?[ ]?[0-9]{3}[ ]?[0-9]{3}[ ]?[0-9]{3}"
              errors={errors}
              register={() => register("phone", {onChange: (e) => e.target.value = formatPhoneNumber(e.target.value)})}
            />
            <TextInput
              id="email"
              label="Email"
              type="email"
              placeholder="uzivatel@example.cz"
              maxLength={320}
              errors={errors}
              register={() => register("email")}
            />
            <div className="d-flex flex-row flex-wrap">
              <div className="me-5">
                <DateSelectionInput
                  id="availability.workDays"
                  label="Pracovní dostupnost"
                  register={() => register("availability.workDays")}
                  days={allDates}
                />
              </div>
              <DateSelectionInput
                id="availability.adorationDays"
                label="Dny adorace"
                register={() => register("availability.adorationDays")}
                days={allDates}
              />
            </div>
            <AlergyPillInput
              label="Alergie"
              register={() => register("allergyIds")}
            />
            <OtherAttributesInput
              label="Další vlastnosti"
              register={register}
            />
            <ImageUploader
              id="photoFile"
              errors={errors}
              register={register}
              removePhoto={removePhoto}
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
                  <i>
                    Auta je možné přiřadit v záložce Auta po vytvořeni pracanta.
                  </i>
                </p>
              </>
            )}
            <NoteInput
              id="note"
              label="Poznámka"
              placeholder="Poznámka"
              rows={1}
              register={() => register("note")}
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
                disabled={isMutating}
              />
            </div>
            {saved && <SuccessProceedModal onConfirm={onConfirmationClosed} onClose={() => { setSaved(false) }} />}
            {error && <ErrorMessageModal onClose={reset} />}
          </form>
        </div>
      </div>
    </>
  )
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
