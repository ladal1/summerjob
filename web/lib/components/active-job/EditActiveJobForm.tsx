'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIActiveJobUpdate } from 'lib/fetcher/active-job'
import { formatDateLong } from 'lib/helpers/helpers'
import {
  ActiveJobComplete,
  ActiveJobUpdateData,
  ActiveJobUpdateSchema,
  deserializeActiveJob,
} from 'lib/types/active-job'
import { Serialized } from 'lib/types/serialize'
import { WorkerBasicInfo } from 'lib/types/worker'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FilterSelect, FilterSelectItem } from '../filter-select/FilterSelect'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
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
    formState: { errors },
    setValue,
  } = useForm<ActiveJobUpdateData>({
    resolver: zodResolver(ActiveJobUpdateSchema),
    defaultValues: {
      publicDescription: job?.publicDescription || '',
      privateDescription: job?.privateDescription || '',
      responsibleWorkerId: job?.responsibleWorker?.id,
    },
  })

  const onSubmit = (data: ActiveJobUpdateData) => {
    if (data.responsibleWorkerId === '') {
      delete data.responsibleWorkerId
    }
    trigger(data, {
      onSuccess: () => {
        setSaved(true)
      },
    })
  }

  const selectResponsibleWorker = (item: FilterSelectItem) => {
    setValue('responsibleWorkerId', item.id)
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>{job.proposedJob.name}</h3>
          <small className="text-muted">
            {formatDateLong(job.plan.day, true)}
          </small>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" />
            <label
              className="form-label fw-bold mt-4"
              htmlFor="public-description"
            >
              Popis
            </label>
            <textarea
              className="form-control border p-1 ps-2"
              id="public-description"
              rows={3}
              {...register('publicDescription')}
            ></textarea>
            <label
              className="form-label fw-bold mt-4"
              htmlFor="private-description"
            >
              Poznámka pro organizátory
            </label>
            <textarea
              className="form-control border p-1 ps-2"
              id="private-description"
              rows={3}
              {...register('privateDescription')}
            ></textarea>
            <div>
              <small className="text-muted mt-2">
                Popis a poznámka pro organizátory se vztahují jen k aktuálně
                naplánovanému jobu. Pokud chcete změnit popisy celého
                navrhovaného jobu, klikněte na tlačítko{' '}
              </small>
              <pre className="d-inline m-2">Upravit další parametry jobu</pre>
              <small className="text-muted mt-2">níže.</small>
            </div>
            <label
              className="form-label fw-bold mt-4"
              htmlFor="responsible-worker"
            >
              Zodpovědný pracant
            </label>
            <input type={'hidden'} {...register('responsibleWorkerId')} />
            <FilterSelect
              items={job.workers.map(workerToSelectItem)}
              placeholder="Vyberte pracanta"
              onSelected={selectResponsibleWorker}
              {...(job.responsibleWorker && {
                defaultSelected: workerToSelectItem(job.responsibleWorker),
              })}
            />
            <label className="form-label fw-bold mt-4" htmlFor="rides">
              Přiřazené jízdy
            </label>
            {job.rides.length > 0 ? (
              <RidesList job={job} />
            ) : (
              <p>Žádné jízdy</p>
            )}
            <div className="list-group mt-4 w-50">
              <Link
                className="list-group-item d-flex justify-content-between align-items-center"
                href={`/jobs/${job.proposedJobId}`}
              >
                <span className="fw-bold">Upravit další parametry jobu</span>
                <span className="badge rounded-pill bg-warning smj-shadow">
                  <i className="fas fa-chevron-right p-1"></i>
                </span>
              </Link>
            </div>
            <div className="d-flex justify-content-between gap-3">
              <button
                className="btn btn-secondary mt-4"
                type="button"
                onClick={() => window.history.back()}
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
          </form>
        </div>
      </div>
      {saved && <SuccessProceedModal onClose={() => window.history.back()} />}
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}

function workerToSelectItem(worker: WorkerBasicInfo): FilterSelectItem {
  return {
    id: worker.id,
    searchable: `${worker.firstName} ${worker.lastName}`,
    name: `${worker.firstName} ${worker.lastName}`,
    item: (
      <span>
        {worker.firstName} {worker.lastName}
      </span>
    ),
  }
}
