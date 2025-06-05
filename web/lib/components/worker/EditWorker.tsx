'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { foodAllergyMapping } from 'lib/data/enumMapping/foodAllergyMapping'
import { workAllergyMapping } from 'lib/data/enumMapping/workAllergyMapping'
import { skillHasMapping } from 'lib/data/enumMapping/skillHasMapping'
import { skillBringsMapping } from 'lib/data/enumMapping/skillBringsMapping'
import { useAPIWorkerUpdate } from 'lib/fetcher/worker'
import {
  formatNumber,
  formatPhoneNumber,
  pick,
  removeRedundantSpace,
} from 'lib/helpers/helpers'
import { Serialized } from 'lib/types/serialize'
import { deserializeWorker, WorkerUpdateSchema } from 'lib/types/worker'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  FoodAllergy,
  WorkAllergy,
  SkillHas,
  SkillBrings,
} from '../../prisma/client'
import { Form } from '../forms/Form'
import { ImageUploader } from '../forms/ImageUploader'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { GroupButtonsInput } from '../forms/input/GroupButtonsInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { TextInput } from '../forms/input/TextInput'
import { Label } from '../forms/Label'
import { LinkToOtherForm } from '../forms/LinkToOtherForm'

const schema = WorkerUpdateSchema
type WorkerForm = z.input<typeof schema>

interface EditWorkerProps {
  serializedWorker: Serialized
  allDates: DateBool[][]
  isProfilePage: boolean
  carAccess: boolean
  label: string
}

export default function EditWorker({
  serializedWorker,
  allDates,
  isProfilePage,
  carAccess,
  label,
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
      foodAllergies: worker.foodAllergies as FoodAllergy[],
      workAllergies: worker.workAllergies as WorkAllergy[],
      skills: worker.skills as SkillHas[],
      tools: worker.tools as SkillBrings[],
      age: worker.age,
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
      reset()
      router.refresh()
    },
  })

  const onSubmit = (dataForm: WorkerForm) => {
    const modified = pick(dataForm, ...Object.keys(dirtyFields)) as WorkerForm
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    if (linkToOtherForm) {
      router.push(linkToOtherForm)
    } else if (!isProfilePage) {
      router.back()
    }
  }
  //#endregion

  //#region Other form

  const [linkToOtherForm, setLinkToOtherForm] = useState<string | null>(null)
  const handleEditCar = (id: string) => {
    setLinkToOtherForm(`/cars/${id}`)
  }
  const handleSubmitFromLink = () => {
    setLinkToOtherForm('/cars/new')
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
        label={label}
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-worker"
        shouldShowBackButton={!isProfilePage}
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
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
            mandatory
            margin={false}
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
            mandatory
          />
          {!isProfilePage && (
            <TextInput
              id="age"
              type="number"
              label="Věk"
              placeholder="Věk"
              min={1}
              register={() =>
                register('age', {
                  valueAsNumber: true,
                  onChange: e =>
                    (e.target.value = formatNumber(e.target.value)),
                })
              }
              errors={errors}
            />
          )}
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
            mandatory
          />
          <TextInput
            id="email"
            label="Email"
            placeholder="uzivatel@example.cz"
            errors={errors}
            register={() => register('email')}
            mandatory
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
            id="foodAllergies"
            label="Potravinové alergie"
            mapping={foodAllergyMapping}
            register={() => register('foodAllergies')}
          />
          <GroupButtonsInput
            id="workAllergies"
            label="Pracovní alergie"
            mapping={workAllergyMapping}
            register={() => register('workAllergies')}
          />
          {!isProfilePage && (
            <>
              <GroupButtonsInput
                id="skills"
                label="Dovednosti (umí)"
                mapping={skillHasMapping}
                register={() => register('skills')}
              />

              <GroupButtonsInput
                id="tools"
                label="Nářadí (přiveze)"
                mapping={skillBringsMapping}
                register={() => register('tools')}
              />
            </>
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
          {(carAccess || isProfilePage) && (
            <>
              <Label id="car" label="Auta" />
              {worker.cars.length === 0 && <p>Žádná auta</p>}{' '}
            </>
          )}

          {carAccess ? (
            <>
              {worker.cars.length > 0 && (
                <div className="list-group mb-2">
                  {worker.cars.map(car => (
                    <div key={car.id} onClick={() => handleEditCar(car.id)}>
                      <LinkToOtherForm
                        label={car.name}
                        labelBold={false}
                        margin={false}
                      />
                    </div>
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
              <LinkToOtherForm
                label="Auta je možné přiřadit v záložce Auta"
                handleEditedForm={handleSubmitFromLink}
                margin={false}
              />
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
              rows={2}
              register={() => register('note')}
              errors={errors}
            />
          )}
        </form>
      </Form>
    </>
  )
}
