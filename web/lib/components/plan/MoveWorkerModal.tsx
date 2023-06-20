'use client'
import { useAPIActiveJobUpdateDynamic } from 'lib/fetcher/active-job'
import { Worker } from 'lib/prisma/client'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { useState } from 'react'
import { FilterSelect, FilterSelectItem } from '../filter-select/FilterSelect'
import { Modal, ModalSize } from '../modal/Modal'

interface MoveWorkerModalProps {
  worker: Worker
  currentJob?: ActiveJobNoPlan
  jobs: ActiveJobNoPlan[]
  onReject: () => void
  onSuccess: () => void
}

export default function MoveWorkerModal({
  worker,
  currentJob,
  jobs,
  onReject,
  onSuccess,
}: MoveWorkerModalProps) {
  const [selectedJob, setSelectedJob] = useState<ActiveJobNoPlan | undefined>(
    currentJob
  )
  const getNewJobId = () => selectedJob?.id
  const { trigger, isMutating, error } = useAPIActiveJobUpdateDynamic(
    getNewJobId,
    jobs[0].planId,
    {
      onSuccess: () => {
        onSuccess()
      },
    }
  )

  const canSubmit =
    selectedJob !== undefined &&
    selectedJob.id !== currentJob?.id &&
    !isMutating

  const onConfirm = () => {
    if (canSubmit) {
      trigger({
        workerIds: [...selectedJob.workers.map(w => w.id), worker.id],
      })
    }
  }

  const onItemSelected = (item: FilterSelectItem) => {
    const job = jobs.find(j => j.id === item.id)
    setSelectedJob(job)
  }

  const items = jobs.map(jobToFilterSelectItem)
  const defaultSelect = currentJob
    ? items.find(i => i.id === currentJob.id)
    : undefined

  return (
    <Modal title="Přeřadit pracanta" size={ModalSize.MEDIUM} onClose={onReject}>
      Přeřadit pracanta{' '}
      <b>
        {worker.firstName} {worker.lastName}
      </b>{' '}
      na job:
      <div className="m-3 ms-0">
        <FilterSelect
          items={items}
          placeholder={'Vyberte job'}
          onSelected={onItemSelected}
          {...(defaultSelect && {
            defaultSelected: defaultSelect,
          })}
        />
      </div>
      <div className="d-flex justify-content-between">
        <button
          className="btn btn-secondary pt-2 pb-2"
          type="button"
          onClick={() => onReject()}
        >
          Zpět
        </button>
        <button
          className="btn pt-2 pb-2 btn-primary"
          onClick={() => onConfirm()}
          disabled={!canSubmit}
        >
          Potvrdit
        </button>
      </div>
    </Modal>
  )
}

function jobToFilterSelectItem(job: ActiveJobNoPlan) {
  return {
    id: job.id,
    name: job.proposedJob.name,
    searchable: job.proposedJob.name + ' ' + job.proposedJob.area.name,
    item: (
      <span>
        {job.proposedJob.name} ({job.proposedJob.area.name})
      </span>
    ),
  }
}
