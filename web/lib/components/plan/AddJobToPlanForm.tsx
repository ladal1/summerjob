'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useAPIActiveJobCreate,
  useAPIActiveJobCreateMultiple,
} from 'lib/fetcher/active-job'
import { useAPIProposedJobsNotInPlan } from 'lib/fetcher/proposed-job'
import {
  ActiveJobCreateData,
  ActiveJobCreateSchema,
} from 'lib/types/active-job'
import { ProposedJobComplete } from 'lib/types/proposed-job'
import React, { ReactNode, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Select, { FormatOptionLabelMeta } from 'react-select'
import { z } from 'zod'
import ErrorPage from '../error-page/ErrorPage'
import { formatDateLong, formatDateShort } from 'lib/helpers/helpers'
import { Issue } from './Issue'

interface AddJobToPlanFormProps {
  planId: string
  onComplete: () => void
  workerId: string
}

type ActiveJobCreateFormData = { jobs: Omit<ActiveJobCreateData, 'planId'>[] }
const ActiveJobCreateFormSchema = z.object({
  jobs: z.array(ActiveJobCreateSchema.omit({ planId: true })).min(1),
})

export default function AddJobToPlanForm({
  planId,
  onComplete,
  workerId
}: AddJobToPlanFormProps) {
  const { data, error, isLoading } = useAPIProposedJobsNotInPlan(planId)
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
  } = useForm<ActiveJobCreateFormData>({
    resolver: zodResolver(ActiveJobCreateFormSchema),
  })

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

    return sorted.map<SelectItem>((job) => jobToSelectItem(job, workerId))
  }, [data, workerId])

  const itemToFormData = (item: SelectItem) => ({
    proposedJobId: item.id,
    publicDescription: item.publicDescription,
    privateDescription: item.privateDescription,
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
    return jobToSelectItem(job, workerId)
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

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="form-label fw-bold" htmlFor="job-filter">
          Joby:
        </label>
        <Controller
          control={control}
          name="jobs"
          render={({ field: { onChange, value, ref } }) => (
            <Select
              ref={ref}
              value={value?.map(formDataToItem)}
              options={items}
              onChange={val => onChange(val.map(v => itemToFormData(v)))}
              placeholder={'Vyberte joby...'}
              formatOptionLabel={formatOptionLabel}
              isMulti
              getOptionValue={option => option.searchable}
            />
          )}
        />

        <input type="hidden" {...register('jobs')} />
        {errors.jobs && <div className="text-danger">Vyberte job!</div>}

        <button
          className="btn btn-primary mt-4 float-end"
          type="submit"
          disabled={isMutating}
        >
          Přidat
        </button>
      </form>
    </>
  )
}

function AddJobSelectItem({ job, workerId }: { job: ProposedJobComplete, workerId: string }) {
  return (
    <>
      <div className="text-wrap">
        {job.name} ({job.area?.name})
        {isPinned(job, workerId) && (
          <i className="ms-2 fas fa-thumbtack smj-action-pinned"/>
        )}
        {(job.requiredDays - job.activeJobs.length) >= job.availability.length && (
          <>
            <i className="ms-2 fas fa-triangle-exclamation smj-action-pinned"/>
            <Issue>
              <span>
                Job musí být naplánován
                <i className="text-muted">
                  {' - poslední dostupné dny'}
                </i>
              </span>
            </Issue>
          </>
        )}
      </div>
      <div className="text-muted text-wrap text-small">
        Naplánováno: {job.activeJobs.length}/{job.requiredDays}
        <br/>
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

function jobToSelectItem(job: ProposedJobComplete, workerId: string): SelectItem {
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
    item: <AddJobSelectItem job={job} workerId={workerId} />,
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

function isPinned (job: ProposedJobComplete, workerId: string) {
  return job.pinnedBy.some(worker => worker.workerId === workerId)
} 
