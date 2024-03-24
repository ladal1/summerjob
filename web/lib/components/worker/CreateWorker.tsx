'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { allergyMapping } from 'lib/data/enumMapping/allergyMapping'
import { skillMapping } from 'lib/data/enumMapping/skillMapping'
import { useAPIWorkerCreate } from 'lib/fetcher/worker'
import { formatPhoneNumber, removeRedundantSpace } from 'lib/helpers/helpers'
import { WorkerCreateSchema } from 'lib/types/worker'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ImageUploader } from '../forms/ImageUploader'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { GroupButtonsInput } from '../forms/input/GroupButtonsInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { TextInput } from '../forms/input/TextInput'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { Form } from '../post/Form'

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
          <div className="d-flex flex-row flex-wrap">
            <div className="me-5">
              <DateSelectionInput
                id="availability.workDays"
                label="Pracovní dostupnost"
                register={() => register('availability.workDays')}
                days={allDates}
              />
            </div>
            <DateSelectionInput
              id="availability.adorationDays"
              label="Dny adorace"
              register={() => register('availability.adorationDays')}
              days={allDates}
            />
          </div>
          <GroupButtonsInput
            id="allergyIds"
            label="Alergie"
            mapping={allergyMapping}
            register={() => register('allergyIds')}
          />
          <GroupButtonsInput
            id="skills"
            label="Dovednosti"
            mapping={skillMapping}
            register={() => register('skills')}
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
              <p>
                <i>
                  Auta je možné přiřadit v záložce Auta po vytvořeni pracanta.
                </i>
              </p>
            </>
          )}
          <TextAreaInput
            id="note"
            label="Poznámka"
            placeholder="Poznámka"
            rows={1}
            register={() => register('note')}
            errors={errors}
          />
        </form>
      </Form>
    </>
  )
}
