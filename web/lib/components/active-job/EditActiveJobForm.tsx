'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIActiveJobUpdate } from 'lib/fetcher/active-job'
import { formatDateLong, pick } from 'lib/helpers/helpers'
import {
  ActiveJobUpdateData,
  ActiveJobUpdateSchema,
  deserializeActiveJob,
} from 'lib/types/active-job'
import { Serialized } from 'lib/types/serialize'
import { WorkerBasicInfo } from 'lib/types/worker'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FieldErrors, useForm } from 'react-hook-form'
import { FilterSelectItem } from '../filter-select/FilterSelect'
import { Form } from '../forms/Form'
import FormWarning from '../forms/FormWarning'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { MarkdownEditor } from '../forms/input/MarkdownEditor'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { TextInput } from '../forms/input/TextInput'
import { LinkToOtherForm } from '../forms/LinkToOtherForm'
import RidesList from './RidesList'

interface EditActiveJobProps {
  serializedJob: Serialized
}

export default function EditActiveJobForm({
  serializedJob,
}: EditActiveJobProps) {
  const job = deserializeActiveJob(serializedJob)
  const { trigger, error, isMutating, reset } = useAPIActiveJobUpdate(
    job.id,
    job.planId
  )

  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    setValue,
  } = useForm<ActiveJobUpdateData>({
    resolver: zodResolver(ActiveJobUpdateSchema),
    defaultValues: {
      completed: job?.completed,
      proposedJob: {
        name: job.proposedJob.name,
        publicDescription: job.proposedJob.publicDescription,
        privateDescription: job.proposedJob.privateDescription,
      },
      responsibleWorkerId: job?.responsibleWorker?.id,
    },
  })

  const router = useRouter()

  const [linkToOtherForm, setLinkToOtherForm] = useState<string | null>(null)

  const handleSubmitFromLink = () => {
    setLinkToOtherForm(`/jobs/${job.proposedJobId}`)
  }

  const onSubmit = (data: ActiveJobUpdateData) => {
    if (data.responsibleWorkerId === '') {
      delete data.responsibleWorkerId
    }
    const modified = pick(
      data,
      ...Object.keys(dirtyFields)
    ) as ActiveJobUpdateData
    trigger(modified, {
      onSuccess: () => {
        setSaved(true)
        reset()
      },
    })
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    if (linkToOtherForm) router.push(linkToOtherForm)
    else router.back()
  }

  const selectResponsibleWorker = (id: string) => {
    setValue('responsibleWorkerId', id, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function workerToSelectItem(worker: WorkerBasicInfo): FilterSelectItem {
    return {
      id: worker.id,
      searchable: `${worker.firstName} ${worker.lastName}`,
      name: `${worker.firstName} ${worker.lastName}`,
    }
  }

  const workerSelectItems = job.workers.map(workerToSelectItem)

  return (
    <>
      <Form
        label="Upravit job z plánu"
        secondaryLabel={formatDateLong(job.plan.day)}
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-active-job"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form id="edit-active-job" onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            id="proposedJob"
            label="Název jobu"
            placeholder="Název jobu"
            register={() => register('proposedJob.name')}
            errors={errors}
            mandatory
            margin={false}
          />
          <FormWarning
            message={errors?.proposedJob?.name?.message as string | undefined}
          />
          <MarkdownEditor
            id="proposedJob.publicDescription"
            label="Veřejný popis"
            placeholder="Popis jobu (podpora Markdown)"
            rows={4}
            register={() => register('proposedJob.publicDescription')}
            errors={errors as FieldErrors<Record<string, unknown>>}
          />
          <MarkdownEditor
            id="proposedJob.privateDescription"
            label="Poznámka pro organizátory"
            placeholder="Poznámka (podpora Markdown)"
            rows={4}
            register={() => register('proposedJob.privateDescription')}
            errors={errors as FieldErrors<Record<string, unknown>>}
          />
          <FilterSelectInput
            id="responsibleWorkerId"
            label="Zodpovědný pracant"
            placeholder="Vyberte pracanta"
            items={workerSelectItems}
            onSelected={selectResponsibleWorker}
            {...(job.responsibleWorker && {
              defaultSelected: workerToSelectItem(job.responsibleWorker),
            })}
            defaultSelected={workerSelectItems.find(
              item => item.id === job.responsibleWorkerId
            )}
            errors={errors}
          />
          <label className="form-label fw-bold mt-4" htmlFor="rides">
            Přiřazené jízdy
          </label>
          {job.rides.length > 0 ? <RidesList job={job} /> : <p>Žádné jízdy</p>}
          <OtherAttributesInput
            label="Příznak"
            register={register}
            objects={[
              {
                id: 'completed',
                icon: 'fa-solid fa-user-check',
                label: 'Hotovo',
              },
            ]}
          />
          <LinkToOtherForm
            label="Upravit další parametry jobu"
            handleEditedForm={handleSubmitFromLink}
          />
        </form>
      </Form>
    </>
  )
}
