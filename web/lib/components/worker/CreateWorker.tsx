'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { useAPIFoodAllergies } from 'lib/fetcher/food-allergy'
import { useAPIWorkerCreate } from 'lib/fetcher/worker'
import {
  formatNumber,
  formatPhoneNumber,
  removeRedundantSpace,
} from 'lib/helpers/helpers'
import { WorkerCreateSchema } from 'lib/types/worker'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form } from '../forms/Form'
import { ImageUploader } from '../forms/ImageUploader'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { GroupButtonsInput } from '../forms/input/GroupButtonsInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { TextInput } from '../forms/input/TextInput'
import { LinkToOtherForm } from '../forms/LinkToOtherForm'
import { DynamicGroupButtonsInput } from '../forms/input/DynamicGroupButtonsInput'
import { useAPIWorkAllergies } from 'lib/fetcher/work-allergy'
import { useAPISkills } from 'lib/fetcher/skill'
import { useAPIToolNames } from 'lib/fetcher/tool-name'

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
    formState: { errors, dirtyFields },
  } = useForm<WorkerForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      availability: {
        workDays: [],
      },
      foodAllergies: [],
      workAllergies: [],
      skills: [],
      tools: [],
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)

  const [linkToOtherForm, setLinkToOtherForm] = useState<string | null>(null)

  const handleSubmitFromLink = () => {
    setLinkToOtherForm('/cars/new')
  }

  const { trigger, isMutating, reset, error } = useAPIWorkerCreate({
    onSuccess: () => {
      setSaved(true)
      reset()
      router.refresh()
    },
  })

  const onSubmit = (dataForm: WorkerForm) => {
    trigger(dataForm)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    if (linkToOtherForm) {
      router.push(linkToOtherForm)
    } else {
      router.back()
    }
    router.back()
  }

  //#region Photo

  const removeNewPhoto = () => {
    setValue('photoFile', null, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const registerPhoto = (fileList: FileList) => {
    setValue('photoFile', fileList, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion

  const { data: foodAllergies = [] } = useAPIFoodAllergies()
  const foodAllergyMapping = foodAllergies.map(a => ({
    value: a.id,
    label: a.name,
  }))

  const { data: workAllergies = [] } = useAPIWorkAllergies()
  const workAllergyMapping = workAllergies.map(a => ({
    value: a.id,
    label: a.name,
  }))

  const { data: skills = [] } = useAPISkills()
  const skillOptions = skills.map(s => ({
    value: s.id,
    label: s.name,
  }))

  const { data: tools = [] } = useAPIToolNames()
  const toolOptions = tools.map(t => ({
    value: t.id,
    label: t.name,
  }))

  return (
    <>
      <Form
        label="Vytvořit pracanta"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-worker"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form id="create-worker" onSubmit={handleSubmit(onSubmit)}>
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
          <TextInput
            id="age"
            type="number"
            label="Věk"
            placeholder="Věk"
            min={1}
            register={() =>
              register('age', {
                valueAsNumber: true,
                onChange: e => {
                  e.target.value = formatNumber(e.target.value)
                },
              })
            }
            errors={errors}
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
          <div className="d-flex flex-row flex-wrap">
            <div className="me-5 width-300">
              <DateSelectionInput
                id="availability.workDays"
                label="Pracovní dostupnost"
                register={() => register('availability.workDays')}
                days={allDates}
              />
            </div>
          </div>

          <DynamicGroupButtonsInput
            id="foodAllergies"
            label="Potravinové alergie"
            options={foodAllergyMapping}
            register={() => register('foodAllergies')}
          />
          <DynamicGroupButtonsInput
            id="workAllergies"
            label="Pracovní alergie"
            options={workAllergyMapping}
            register={() => register('workAllergies')}
          />
          <DynamicGroupButtonsInput
            id="skills"
            label="Dovednosti (umí)"
            options={skillOptions}
            register={() => register('skills')}
          />
          <DynamicGroupButtonsInput
            id="tools"
            label="Nářadí (přiveze)"
            options={toolOptions}
            register={() => register('tools')}
          />

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
          <ImageUploader
            id="photoFile"
            label="Fotografie"
            secondaryLabel="Maximálně 1 soubor o maximální velikosti 10 MB."
            errors={errors}
            registerPhoto={registerPhoto}
            removeNewPhoto={removeNewPhoto}
          />

          {carAccess && (
            <>
              <label className="form-label d-block fw-bold mt-4" htmlFor="car">
                Auta
              </label>
              <LinkToOtherForm
                label="Auta je možné přiřadit v záložce Auta po vytvořeni pracanta."
                handleEditedForm={handleSubmitFromLink}
                labelBold={false}
                margin={false}
              />
            </>
          )}
          <TextAreaInput
            id="note"
            label="Poznámka"
            placeholder="Poznámka"
            rows={2}
            register={() => register('note')}
            errors={errors}
          />
        </form>
      </Form>
    </>
  )
}
