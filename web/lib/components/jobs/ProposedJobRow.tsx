'use client'
import {
  useAPIProposedJobDelete,
  useAPIProposedJobUpdate,
} from 'lib/fetcher/proposed-job'
import {
  capitalizeFirstLetter,
  datesAfterDate,
  formatDateShort,
} from 'lib/helpers/helpers'
import { ProposedJobComplete } from 'lib/types/proposed-job'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import DeleteIcon from '../forms/DeleteIcon'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { ExpandableRow } from '../table/ExpandableRow'

interface ProposedJobRowData {
  job: ProposedJobComplete
  reloadJobs: () => void
}

export default function ProposedJobRow({
  job,
  reloadJobs,
}: ProposedJobRowData) {
  const { trigger: triggerUpdate } = useAPIProposedJobUpdate(job.id, {
    onSuccess: reloadJobs,
  })

  const setJobPinned = (pinned: boolean) => {
    triggerUpdate({ pinned })
  }

  const setJobCompleted = (completed: boolean) => {
    triggerUpdate({ completed })
  }

  const setJobHidden = (hidden: boolean) => {
    triggerUpdate({ hidden })
  }

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const {
    trigger: triggerDelete,
    isMutating: isBeingDeleted,
    error: deleteError,
    reset: resetDeleteError,
  } = useAPIProposedJobDelete(job.id, {
    onSuccess: reloadJobs,
  })

  const deleteJob = () => {
    triggerDelete()
    setShowDeleteConfirmation(false)
  }

  const confirmDelete = () => {
    setShowDeleteConfirmation(true)
  }

  const onErrorMessageClose = () => {
    resetDeleteError()
  }

  const availableDays = useMemo(() => {
    const days = [...job.availability]
    days.sort((a, b) => a.getTime() - b.getTime())
    return days.map(formatDateShort).map(capitalizeFirstLetter).join(', ')
  }, [job.availability])

  return (
    <ExpandableRow
      data={formatJobRow(
        job,
        setJobPinned,
        setJobCompleted,
        setJobHidden,
        confirmDelete,
        isBeingDeleted
      )}
      className={rowColorClass(job)}
    >
      <div className="ms-2">
        <strong>Popis</strong>
        <p>{job.publicDescription}</p>
        <strong>Poznámka pro organizátory</strong>
        <p>{job.privateDescription}</p>
        <p>
          <strong>Počet pracantů: </strong>
          {job.minWorkers} - {job.maxWorkers} ({job.strongWorkers} siláků)
        </p>
        <p>
          <strong>Doprava do oblasti požadována: </strong>
          {job.area.requiresCar ? 'Ano' : 'Ne'}
        </p>
        <p>
          <strong>Alergeny: </strong>
          {job.allergens.length > 0 ? job.allergens.join(', ') : 'Žádné'}
        </p>
        <p>
          <strong>Dostupné: </strong>
          {availableDays}
        </p>
        <p>
          <strong>Naplánované dny: </strong>
          {job.activeJobs.length} / {job.requiredDays}
        </p>
      </div>
      {showDeleteConfirmation && !deleteError && (
        <ConfirmationModal
          onConfirm={deleteJob}
          onReject={() => setShowDeleteConfirmation(false)}
        >
          <p>
            Opravdu chcete smazat job <b>{job.name}</b>?
          </p>
          {job.activeJobs.length > 0 && (
            <div className="alert alert-danger">
              Tento job je součástí alespoň jednoho plánu!
              <br /> Jeho odstraněním zároveň odstraníte i odpovídající
              naplánované akce.
            </div>
          )}
        </ConfirmationModal>
      )}
      {deleteError && (
        <ErrorMessageModal
          onClose={onErrorMessageClose}
          mainMessage={'Nepovedlo se odstranit job.'}
        />
      )}
    </ExpandableRow>
  )
}

function rowColorClass(job: ProposedJobComplete) {
  if (job.hidden) {
    return 'smj-hidden-job-row'
  }
  if (job.completed) {
    return 'smj-completed-job-row'
  }
  if (job.pinned) {
    return 'smj-pinned-job-row'
  }
  return ''
}

function formatJobRow(
  job: ProposedJobComplete,
  setPinned: (pinned: boolean) => void,
  setCompleted: (completed: boolean) => void,
  setHidden: (hidden: boolean) => void,
  deleteJob: () => void,
  isBeingDeleted: boolean
) {
  // Show job as available today before 6:00
  // After that, show job as not available anymore
  const now = new Date()
  now.setHours(now.getHours() - 6)
  return [
    job.name,
    job.area.name,
    job.contact,
    job.address,
    `${job.activeJobs.length} / ${job.requiredDays}`,
    datesAfterDate(job.availability, now).length,
    `${job.minWorkers} - ${job.maxWorkers}`,
    <span key={job.id} className="d-flex align-items-center gap-3">
      {markJobAsCompletedIcon(job, setCompleted)}
      {pinJobIcon(job, setPinned)}
      {hideJobIcon(job, setHidden)}
      <Link
        href={`/jobs/${job.id}`}
        onClick={e => e.stopPropagation()}
        className="smj-action-edit"
      >
        <i className="fas fa-edit" title="Upravit"></i>
      </Link>
      <DeleteIcon onClick={deleteJob} isBeingDeleted={isBeingDeleted} />
    </span>,
  ]
}

function markJobAsCompletedIcon(
  job: ProposedJobComplete,
  setCompleted: (completed: boolean) => void
) {
  const color = job.completed ? 'smj-action-completed' : 'smj-action-complete'
  const title = job.completed
    ? 'Označit jako nedokončený'
    : 'Označit jako dokončený'
  const icon = job.completed ? 'fa-times' : 'fa-check'
  return (
    <i
      className={`fas ${icon} ${color}`}
      title={title}
      onClick={e => {
        e.stopPropagation()
        setCompleted(!job.completed)
      }}
    ></i>
  )
}

function pinJobIcon(
  job: ProposedJobComplete,
  setPinned: (pinned: boolean) => void
) {
  const color = job.pinned ? 'smj-action-pinned' : 'smj-action-pin'
  const title = job.pinned ? 'Odepnout' : 'Připnout'
  const icon = job.pinned ? 'fa-thumbtack' : 'fa-thumbtack'
  return (
    <i
      className={`fas ${icon} ${color}`}
      title={title}
      onClick={e => {
        e.stopPropagation()
        setPinned(!job.pinned)
      }}
    ></i>
  )
}

function hideJobIcon(
  job: ProposedJobComplete,
  setHidden: (hidden: boolean) => void
) {
  const color = job.hidden ? 'smj-action-hidden' : 'smj-action-hide'
  const title = job.hidden ? 'Zobrazit' : 'Skrýt'
  const icon = job.hidden ? 'fa-eye' : 'fa-eye-slash'
  return (
    <i
      className={`fas ${icon} ${color}`}
      title={title}
      onClick={e => {
        e.stopPropagation()
        setHidden(!job.hidden)
      }}
    ></i>
  )
}
