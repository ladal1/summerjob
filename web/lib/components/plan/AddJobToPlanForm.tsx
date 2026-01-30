'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIActiveJobCreateMultiple } from 'lib/fetcher/active-job'
import { useAPIProposedJobsNotInPlan } from 'lib/fetcher/proposed-job'
import { formatDateShort } from 'lib/helpers/helpers'
import {
  ActiveJobCreateData,
  ActiveJobCreateSchema,
} from 'lib/types/active-job'
import { ProposedJobComplete } from 'lib/types/proposed-job'
import { ReactNode, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Select, {
  CSSObjectWithLabel,
  FormatOptionLabelMeta,
  StylesConfig,
} from 'react-select'
import { z } from 'zod'
import ErrorPage from '../error-page/ErrorPage'
import { Issue } from './Issue'
import FormWarning from '../forms/FormWarning'

interface AddJobToPlanFormProps {
  planId: string
  planDate: Date
  onComplete: () => void
  workerId: string
}

type ActiveJobCreateFormData = { jobs: Omit<ActiveJobCreateData, 'planId'>[] }
const ActiveJobCreateFormSchema = z.object({
  jobs: z.array(ActiveJobCreateSchema.omit({ planId: true })).min(1),
})

export default function AddJobToPlanForm({
  planId,
  planDate,
  onComplete,
  workerId,
}: AddJobToPlanFormProps) {
  const { data, error } = useAPIProposedJobsNotInPlan(planId)
  const { trigger, isMutating } = useAPIActiveJobCreateMultiple(planId, {
    onSuccess: () => {
      onComplete()
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<ActiveJobCreateFormData>({
    resolver: zodResolver(ActiveJobCreateFormSchema),
  })

  const watchedJobs = watch('jobs')
  const isJobsEmpty = !watchedJobs || watchedJobs.length === 0

  const items = useMemo(() => {
    if (!data) {
      return []
    }
    const sorted = new Array(...data)
    sorted.sort((a, b) => {
      const isPinnedA = isPinned(a, workerId)
      const isPinnedB = isPinned(b, workerId)

      if (isPinnedA && !isPinnedB) {
        return -1
      }
      if (!isPinnedA && isPinnedB) {
        return 1
      }
      return a.name.localeCompare(b.name)
    })

    return sorted.map<SelectItem>(job =>
      jobToSelectItem(job, workerId, planDate)
    )
  }, [data, workerId, planDate])

  const itemToFormData = (item: SelectItem) => ({
    proposedJobId: item.id,
  })

  const formDataToItem = (
    formData: Omit<ActiveJobCreateData, 'planId'>
  ): SelectItem => {
    const job = data?.find(job => job.id === formData.proposedJobId)
    if (!job) {
      return {
        id: formData.proposedJobId,
        name: 'Unknown job',
        searchable: 'Unknown job',
        publicDescription: '',
        privateDescription: '',
        item: <></>,
      }
    }
    return jobToSelectItem(job, workerId, planDate)
  }

  const formatOptionLabel = (
    option: SelectItem,
    placement: FormatOptionLabelMeta<SelectItem>
  ) => {
    if (placement.context === 'menu') {
      return option.item
    }
    return option.name
  }

  const onSubmit = (data: ActiveJobCreateFormData) => {
    trigger(data)
  }

  if (error && !data) {
    return <ErrorPage error={error} />
  }

  const colourStyles: StylesConfig<SelectItem, true> = {
    control: base =>
      ({
        ...base,
        backgroundColor: 'white',
        border: 0,
        boxShadow: '1px 1px 2px 2px rgba(0, 38, 255, 0.2)',
      }) as CSSObjectWithLabel,
    option: base =>
      ({
        ...base,
        backgroundColor: 'white',
        color: 'black',
        '&:hover': {
          backgroundColor: '#ffea9c',
        },
      }) as CSSObjectWithLabel,
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="form-label fw-bold" htmlFor="job-filter">
          Joby:
        </label>
        <div onClick={e => e.nativeEvent.stopImmediatePropagation()}>
          <Controller
            control={control}
            name="jobs"
            render={({ field: { onChange, value, ref } }) => (
              <Select
                ref={ref}
                value={value?.map(formDataToItem) || []}
                options={items}
                onChange={val =>
                  onChange(
                    val?.length > 0 ? val.map(v => itemToFormData(v)) : []
                  )
                }
                placeholder={'Vyberte joby...'}
                formatOptionLabel={formatOptionLabel}
                isMulti
                getOptionValue={option => option.searchable}
                styles={colourStyles}
                closeMenuOnSelect={false}
              />
            )}
          />
        </div>

        <input type="hidden" {...register('jobs')} />
        {errors.jobs && <FormWarning message={errors.jobs.message} />}

        <button
          className="btn btn-primary mt-4 float-end"
          type="submit"
          disabled={isMutating || isJobsEmpty}
        >
          Přidat
        </button>
      </form>
    </>
  )
}

function AddJobSelectItem({
  job,
  workerId,
  planDate,
}: {
  job: ProposedJobComplete
  workerId: string
  planDate: Date
}) {
  // Filter availability to only include dates from the plan date onwards
  const availableDaysFromPlanDate = job.availability.filter(
    day => new Date(day) >= planDate
  )

  return (
    <>
      <div className="text-wrap">
        {job.name} ({job.area?.name})
        {isPinned(job, workerId) && (
          <i className="ms-2 fas fa-thumbtack smj-action-pinned" />
        )}
        {job.requiredDays - job.activeJobs.length >=
          availableDaysFromPlanDate.length && (
          <>
            <i className="ms-2 fas fa-triangle-exclamation smj-action-pinned" />
            <Issue>
              <span>
                Job musí být naplánován
                <i className="text-muted">{' - poslední dostupné dny'}</i>
              </span>
            </Issue>
          </>
        )}
      </div>
      <div className="text-muted text-wrap text-small">
        Naplánováno: {job.activeJobs.length}/{job.requiredDays}
        <br />
        Dostupné dny:
        {job.availability.map((day, index) => (
          <span key={index}>
            {index === 0 ? ' ' : ', '}
            {formatDateShort(new Date(day))}
          </span>
        ))}
      </div>
    </>
  )
}

function jobToSelectItem(
  job: ProposedJobComplete,
  workerId: string,
  planDate: Date
): SelectItem {
  return {
    id: job.id,
    name: job.name,
    searchable: (
      job.name +
      job.area?.name +
      job.privateDescription +
      job.publicDescription
    ).toLocaleLowerCase(),
    publicDescription: job.publicDescription,
    privateDescription: job.privateDescription,
    item: (
      <AddJobSelectItem job={job} workerId={workerId} planDate={planDate} />
    ),
  }
}

type SelectItem = {
  id: string
  name: string
  searchable: string
  item: ReactNode
  publicDescription: string
  privateDescription: string
}

function isPinned(job: ProposedJobComplete, workerId: string) {
  return job.pinnedBy.some(worker => worker.workerId === workerId)
}
