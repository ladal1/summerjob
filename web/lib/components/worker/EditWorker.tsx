'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { deserializeWorker, WorkerUpdateSchema } from 'lib/types/worker'
import { useEffect, useState } from 'react'
import { useAPIWorkerUpdate } from 'lib/fetcher/worker'
import Link from 'next/link'
import AllergyPill from '../forms/AllergyPill'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { Serialized } from 'lib/types/serialize'
import { formatPhoneNumber, pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import FormWarning from '../forms/FormWarning'
import { Allergy } from '../../prisma/client'
import { allergyMapping } from 'lib/data/allergyMapping'
import ImageUploader from '../forms/ImageUpload'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { TextInput } from '../forms/input/TextInput'
import { AlergyPillInput } from '../forms/input/AlergyPillInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'

const schema = WorkerUpdateSchema
type WorkerForm = z.input<typeof schema>

interface EditWorkerProps {
  serializedWorker: Serialized
  allDates: DateBool[][]
  isProfilePage: boolean
  carAccess: boolean
}

export default function EditWorker({
  serializedWorker,
  allDates,
  isProfilePage,
  carAccess,
}: EditWorkerProps) {
  const worker = deserializeWorker(serializedWorker)

  const {
    formState: { dirtyFields },
    setValue,
    getValues,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkerForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.email,
      phone: formatPhoneNumber(worker.phone),
      strong: worker.isStrong,
      allergyIds: worker.allergies as Allergy[],
      availability: {
        workDays: worker.availability.workDays.map(day => day.toJSON()),
        adorationDays: worker.availability.adorationDays.map(day =>
          day.toJSON()
        ),
      },
    },
  })
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, reset, error } = useAPIWorkerUpdate(worker.id, {
    onSuccess: () => {
      uploadFile()
      setSaved(true)
      router.refresh()
    },
  })

  const onSubmit = (data: WorkerForm) => {
    const modified = pick(data, ...Object.keys(dirtyFields)) as WorkerForm
    trigger(modified)
  }

  const handleAddCar = async () => {
    await handleSubmit(onSubmit)();
    router.push('/cars/new');
  };

  const onConfirmationClosed = () => {
    setSaved(false)
    if (!isProfilePage) {
      router.back()
    }
  }

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    worker.photoPath ? `/api/workers/${worker.id}/image` : null
  )

  const uploadFile = async () => {
    const formData = new FormData()
    if (!file) return

    formData.append('image', file)
    await fetch(`/api/workers/${worker.id}/image`, {
      method: 'POST',
      body: formData,
    })
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>
            {worker.firstName} {worker.lastName}
          </h3>
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
              onChange={(e) => e.target.value = formatPhoneNumber(e.target.value)}
              errors={errors}
              register={() => register("phone")}
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
            <p className="text-muted mt-1">
              {isProfilePage
                ? 'Změnou e-mailu dojde k odhlášení z aplikace.'
                : 'Změnou e-mailu dojde k odhlášení uživatele z aplikace.'}
            </p>
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
            {!isProfilePage && (
              <OtherAttributesInput
                label="Další vlastnosti"
                register={register}
              />
            )}
            {!isProfilePage && (
              <ImageUploader
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
                setFile={setFile}
              />
            )}
            {(carAccess || isProfilePage) && (
              <>
                <label
                  className="form-label d-block fw-bold mt-4"
                  htmlFor="car"
                >
                  Auta
                </label>
              </>
            )}

            {carAccess ? (
              <>
                {worker.cars.length === 0 && <p>Žádná auta</p>}
                {worker.cars.length > 0 && (
                  <div className="list-group">
                    {worker.cars.map(car => (
                      <Link
                        key={car.id}
                        href={`/cars/${car.id}`}
                        className="list-group-item list-group-item-action ps-2 d-flex align-items-center justify-content-between w-50"
                      >
                        {car.name}
                        <i className="fas fa-angle-right ms-2"></i>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              isProfilePage && (
                <>
                  {worker.cars.length > 0 && (
                    <div className="list-group">
                      {worker.cars.map(car => (
                        <div key={car.id} className="list-group-item ps-2 w-50">
                          {car.name}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            )}
            <div className="mt-2">
              {carAccess ? (
                  <div className="d-flex align-items-baseline flex-wrap">
                    <div className="me-3">
                      <i>Auta je možné přiřadit v záložce Auta: </i> 
                    </div>
                    <button 
                      className="btn btn-light pt-2 pb-2"
                      onClick={handleAddCar}
                    >
                      <div className="d-flex align-items-center">
                        <i className="fas fa-plus me-2"/>
                        Přidat auto
                      </div>
                    </button>
                  </div>
              ) : (
                isProfilePage && (
                  <p>
                    <i>Pro přiřazení auta kontaktujte tým SummerJob.</i>
                  </p>
                )
              )}
            </div>

            {!isProfilePage && (
              <div>
                <label className="form-label fw-bold mt-4" htmlFor="note">
                  Poznámka
                </label>
                <input
                  id="note"
                  className="form-control p-0 fs-5"
                  type="text"
                  placeholder="Poznámka"
                  {...register('note')}
                />
              </div>
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
