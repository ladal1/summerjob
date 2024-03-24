'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { deserializeWorker, WorkerUpdateSchema } from 'lib/types/worker'
import { useState } from 'react'
import { useAPIWorkerUpdate } from 'lib/fetcher/worker'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { Serialized } from 'lib/types/serialize'
import {
  formatPhoneNumber,
  pick,
  removeRedundantSpace,
} from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { Allergy, Skill } from '../../prisma/client'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { TextInput } from '../forms/input/TextInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { Label } from '../forms/Label'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { DateBool } from 'lib/data/dateSelectionType'
import { ImageUploader } from '../forms/ImageUploader'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { allergyMapping } from 'lib/data/enumMapping/allergyMapping'
import { GroupButtonsInput } from '../forms/input/GroupButtonsInput'
import { skillMapping } from 'lib/data/enumMapping/skillMapping'
import { Form } from '../post/Form'

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
    register,
    setValue,
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
      team: worker.isTeam,
      note: worker.note,
      allergyIds: worker.allergies as Allergy[],
      skills: worker.skills as Skill[],
      availability: {
        workDays: worker.availability.workDays.map(day => day.toJSON()),
        adorationDays: worker.availability.adorationDays.map(day =>
          day.toJSON()
        ),
      },
    },
  })

  //#region Form
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, reset, error } = useAPIWorkerUpdate(worker.id, {
    onSuccess: () => {
      setSaved(true)
      router.refresh()
    },
  })

  const onSubmit = (dataForm: WorkerForm) => {
    const modified = pick(dataForm, ...Object.keys(dirtyFields)) as WorkerForm
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    if (isHandlingCar) {
      router.push(`/cars/${carRoute}`)
    } else if (!isProfilePage) {
      router.back()
    }
  }
  //#endregion

  //#region Car
  const [isHandlingCar, setIsHandlingCar] = useState(false)
  const [carRoute, setCarRoute] = useState('new')

  const handleAddCar = () => {
    setIsHandlingCar(true)
  }

  const handleEditCar = (route: string) => {
    setIsHandlingCar(true)
    setCarRoute(route)
  }
  //#endregion

  //#region File

  const removeNewPhoto = () => {
    setValue('photoFile', null, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const removeExistingPhoto = () => {
    setValue('photoFileRemoved', true, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const registerPhoto = (fileList: FileList) => {
    setValue('photoFile', fileList, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion

  return (
    <>
      <Form
        label="Upravit pracanta"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-worker"
        shouldShowBackButton={!isProfilePage}
      >
        <form id="edit-worker" onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            id="firstName"
            label="Jméno"
            placeholder="Jméno"
            register={() =>
              register('firstName', {
                onChange: e =>
                  (e.target.value = removeRedundantSpace(e.target.value)),
              })
            }
            errors={errors}
          />
          <TextInput
            id="lastName"
            label="Příjmení"
            placeholder="Příjmení"
            errors={errors}
            register={() =>
              register('lastName', {
                onChange: e =>
                  (e.target.value = removeRedundantSpace(e.target.value)),
              })
            }
          />
          <TextInput
            id="phone"
            label="Telefonní číslo"
            placeholder="(+420) 123 456 789"
            errors={errors}
            register={() =>
              register('phone', {
                onChange: e =>
                  (e.target.value = formatPhoneNumber(e.target.value)),
              })
            }
          />
          <TextInput
            id="email"
            label="Email"
            placeholder="uzivatel@example.cz"
            errors={errors}
            register={() => register('email')}
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
                register={() => register('availability.workDays')}
                days={allDates}
                disableAfter={isProfilePage ? 18 : undefined}
              />
            </div>
            <DateSelectionInput
              id="availability.adorationDays"
              label="Dny adorace"
              register={() => register('availability.adorationDays')}
              days={allDates}
              disableAfter={isProfilePage ? 18 : undefined}
            />
          </div>
          <GroupButtonsInput
            id="allergyIds"
            label="Alergie"
            mapping={allergyMapping}
            register={() => register('allergyIds')}
          />
          {!isProfilePage && (
            <GroupButtonsInput
              id="skills"
              label="Dovednosti"
              mapping={skillMapping}
              register={() => register('skills')}
            />
          )}
          {!isProfilePage && (
            <OtherAttributesInput
              label="Další vlastnosti"
              register={register}
              objects={[
                {
                  id: 'strong',
                  icon: 'fas fa-dumbbell',
                  label: 'Silák',
                },
                {
                  id: 'team',
                  icon: 'fa-solid fa-people-group',
                  label: 'Tým',
                },
              ]}
            />
          )}
          {!isProfilePage && (
            <ImageUploader
              id="photoFile"
              label="Fotografie"
              secondaryLabel="Maximálně 1 soubor o maximální velikosti 10 MB."
              photoInit={
                worker.photoPath
                  ? [{ url: `/api/workers/${worker.id}/photo`, index: '0' }]
                  : null
              }
              errors={errors}
              registerPhoto={registerPhoto}
              removeNewPhoto={removeNewPhoto}
              removeExistingPhoto={removeExistingPhoto}
            />
          )}
          {(carAccess || isProfilePage) && <Label id="car" label="Auta" />}

          {carAccess ? (
            <>
              {worker.cars.length === 0 && <p>Žádná auta</p>}
              {worker.cars.length > 0 && (
                <div className="list-group mb-2">
                  {worker.cars.map(car => (
                    <input
                      key={car.id}
                      type={'submit'}
                      className="list-group-item list-group-item-action ps-2 d-flex align-items-center justify-content-between w-50"
                      value={car.name}
                      disabled={isMutating}
                      onClick={() => handleEditCar(car.id)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            isProfilePage && (
              <div className="mb-2">
                {worker.cars.length > 0 && (
                  <div className="list-group">
                    {worker.cars.map(car => (
                      <div key={car.id} className="list-group-item ps-2 w-50">
                        {car.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {carAccess ? (
            <div className="d-flex align-items-baseline flex-wrap">
              <div className="me-3">
                <i>Auta je možné přiřadit v záložce Auta: </i>
              </div>
              <button
                type={'submit'}
                className="btn btn-light pt-2 pb-2"
                disabled={isMutating}
                onClick={handleAddCar}
              >
                <div className="d-flex align-items-center">
                  <i className="fas fa-plus me-2" />
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

          {!isProfilePage && (
            <TextAreaInput
              id="note"
              label="Poznámka"
              placeholder="Poznámka"
              rows={1}
              register={() => register('note')}
              errors={errors}
            />
          )}
        </form>
      </Form>
    </>
  )
}
