'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
import DeleteIcon from '../table/icons/DeleteIcon'
import { PinIcon } from '../forms/PinIcon'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { ExpandableRow } from '../table/ExpandableRow'
import { RowCells } from '../table/RowCells'
import { RowContent, RowContentsInterface } from '../table/RowContent'
import MarkAsCompletedIcon from '../table/icons/MarkAsCompletedIcon'
import { priorityMapping } from 'lib/data/enumMapping/priorityMapping'

interface ProposedJobRowData {
  job: ProposedJobComplete
  reloadJobs: () => void
  workerId: string
}

export default function ProposedJobRow({
  job,
  reloadJobs,
  workerId,
}: ProposedJobRowData) {
  const { trigger: triggerUpdate } = useAPIProposedJobUpdate(job.id, {
    onSuccess: reloadJobs,
  })

  const setJobPinned = (pinned: boolean) => {
    triggerUpdate({ pinnedByChange: { workerId: workerId, pinned } })
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

  const expandedContent: RowContentsInterface[] = [
    {
      label: 'Popis',
      content: (
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {job.publicDescription}
          </ReactMarkdown>
        </div>
      ),
    },
    {
      label: 'Poznámka pro organizátory',
      content: (
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {job.privateDescription}
          </ReactMarkdown>
        </div>
      ),
    },
    {
      label: 'Počet pracantů',
      content: `${job.minWorkers} - ${job.maxWorkers} (${job.strongWorkers} siláků)`,
    },
    {
      label: 'Doprava do oblasti požadována',
      content: `${
        job.area ? (job.area.requiresCar ? 'Ano' : 'Ne') : 'Není známo'
      }`,
    },
    {
      label: 'Alergeny',
      content: `${
        job.allergens.length > 0 ? job.allergens.join(', ') : 'Žádné'
      }`,
    },
    {
      label: 'Dostupné',
      content: `${availableDays}`,
    },
    {
      label: 'Naplánované dny',
      content: `${job.activeJobs.length} / ${job.requiredDays}`,
    },
  ]

  return (
    <ExpandableRow
      data={formatJobRow(
        job,
        workerId,
        setJobPinned,
        setJobCompleted,
        setJobHidden,
        confirmDelete,
        isBeingDeleted
      )}
      className={rowColorClass(job, workerId)}
    >
      <RowContent data={expandedContent} />
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

function rowColorClass(job: ProposedJobComplete, workerId: string) {
  if (job.hidden) {
    return 'smj-hidden-job-row'
  }
  if (job.completed) {
    return 'smj-completed-job-row'
  }
  if (job.pinnedBy.some(worker => worker.workerId === workerId)) {
    return 'smj-pinned-job-row'
  }
  return ''
}

function formatJobRow(
  job: ProposedJobComplete,
  workerId: string,
  setPinned: (pinned: boolean) => void,
  setCompleted: (completed: boolean) => void,
  setHidden: (hidden: boolean) => void,
  deleteJob: () => void,
  isBeingDeleted: boolean
): RowCells[] {
  // Show job as available today before 6:00
  // After that, show job as not available anymore
  const now = new Date()
  now.setHours(now.getHours() - 6)
  return [
    { content: job.name },
    { content: job.area?.name },
    { content: job.contact },
    { content: job.address },
    { content: `${job.activeJobs.length} / ${job.requiredDays}` },
    { content: datesAfterDate(job.availability, now).length },
    { content: `${job.minWorkers} - ${job.maxWorkers}` },
    { content: priorityMapping[job.priority] },
    {
      content: (
        <span
          key={job.id}
          className="d-inline-flex flex-wrap align-items-center gap-3"
        >
          <MarkAsCompletedIcon
            completed={job.completed}
            setCompleted={setCompleted}
          />
          <PinIcon
            isPinned={job.pinnedBy.some(worker => worker.workerId === workerId)}
            setPinned={setPinned}
          />
          {hideJobIcon(job, setHidden)}
          <Link
            href={`/jobs/${job.id}`}
            onClick={e => e.stopPropagation()}
            className="smj-action-edit"
          >
            <i className="fas fa-edit" title="Upravit"></i>
          </Link>
          <DeleteIcon onClick={deleteJob} isBeingDeleted={isBeingDeleted} />
        </span>
      ),
      stickyRight: true,
    },
  ]
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
