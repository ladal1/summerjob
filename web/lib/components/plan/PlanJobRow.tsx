import { ActiveJobNoPlan } from 'lib/types/active-job'
import { RideComplete, RidesForJob } from 'lib/types/ride'
import { WorkerComplete } from 'lib/types/worker'
import Link from 'next/link'
import { ExpandableRow, RowCells } from '../table/ExpandableRow'
import { SimpleRow } from '../table/SimpleRow'
import type { Worker } from 'lib/prisma/client'
import {
  useAPIActiveJobDelete,
  useAPIActiveJobUpdate,
} from 'lib/fetcher/active-job'
import { useMemo, useState } from 'react'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import AddRideButton from './AddRideButton'
import RideSelect from './RideSelect'
import MoveWorkerModal from './MoveWorkerModal'
import JobRideList from './JobRideList'
import { ActiveJobIssueBanner, ActiveJobIssueIcon } from './ActiveJobIssue'

interface PlanJobRowProps {
  job: ActiveJobNoPlan
  day: Date
  plannedJobs: ActiveJobNoPlan[]
  isDisplayed: boolean
  rides: RidesForJob[]
  onWorkerDragStart: (
    worker: Worker,
    sourceId: string
  ) => (e: React.DragEvent<HTMLTableRowElement>) => void
  reloadPlan: () => void
  onWorkerHover: (url: string | null) => void
}

export function PlanJobRow({
  job,
  day,
  plannedJobs,
  isDisplayed,
  rides,
  onWorkerDragStart,
  reloadPlan,
  onWorkerHover,
}: PlanJobRowProps) {
  //#region Update job
  const {
    trigger: triggerUpdate,
    isMutating: isBeingUpdated,
    error: updatingError,
  } = useAPIActiveJobUpdate(job.id, job.planId, {
    onSuccess: () => {
      reloadPlan()
    },
  })

  const [workerToMove, setWorkerToMove] = useState<WorkerComplete | undefined>(
    undefined
  )

  const onWorkerDropped =
    (toJobId: string) => (e: React.DragEvent<HTMLTableRowElement>) => {
      if (isBeingUpdated) {
        return
      }
      const workerId = e.dataTransfer.getData('worker-id')
      const fromJobId = e.dataTransfer.getData('source-id')
      if (fromJobId === toJobId) {
        return
      }

      const newWorkers = [...job.workers.map(w => w.id), workerId]
      triggerUpdate({ workerIds: newWorkers })
    }

  const removeWorkerFromJob = (workerId: string) => {
    if (isBeingUpdated) {
      return
    }
    const newWorkers = job.workers.map(w => w.id).filter(id => id !== workerId)
    triggerUpdate({ workerIds: newWorkers })
  }

  const onWorkerMoved = () => {
    setWorkerToMove(undefined)
    reloadPlan()
  }

  //#endregion

  //#region Delete active job
  const {
    trigger: triggerDelete,
    isMutating: isBeingDeleted,
    error: deleteError,
    reset: resetDeleteError,
  } = useAPIActiveJobDelete(job.id, job.planId, {
    onSuccess: reloadPlan,
  })
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

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

  //#endregion

  const ridesForOtherJobs = useMemo(
    () => rides.filter(r => r.jobId !== job.id),
    [rides, job]
  )

  return (
    <>
      {isDisplayed && (
        <ExpandableRow
          key={job.id}
          data={formatRowData(
            job,
            day,
            ridesForOtherJobs,
            confirmDelete,
            isBeingDeleted
          )}
          onDrop={onWorkerDropped(job.id)}
        >
          <>
            <ActiveJobIssueBanner
              job={job}
              day={day}
              ridesForOtherJobs={ridesForOtherJobs}
            />
            <div className="ms-2">
              <strong>Popis</strong>
              <p>{job.publicDescription}</p>
              <strong>Poznámka pro organizátory</strong>
              <p>{job.privateDescription}</p>

              <div className="d-flex gap-1">
                <strong>Doprava</strong>
                <AddRideButton job={job} />
              </div>

              <JobRideList
                job={job}
                otherJobs={plannedJobs.filter(j => j.id !== job.id)}
                reloadPlan={reloadPlan}
              />
              <br />
              <p>
                <strong>Adorace v oblasti: </strong>
                <span>
                  {job.proposedJob.area?.supportsAdoration ? 'Ano' : 'Ne'}
                </span>
              </p>
              <p>
                <strong>Alergeny: </strong>
                <span>{formatAllergens(job)}</span>
              </p>
              <p>
                <strong>Pracantů (min/max/silných): </strong>
                <span>
                  {' '}
                  {job.proposedJob.minWorkers}/{job.proposedJob.maxWorkers}/
                  {job.proposedJob.strongWorkers}
                </span>
              </p>
              <p>
                <strong>Zodpovědná osoba: </strong>
                {responsibleWorkerName(job)}
              </p>
            </div>
            <div className="table-responsive text-nowrap">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>
                      <strong>Pracant</strong>
                    </th>
                    <th>
                      <strong>Kontakt</strong>
                    </th>
                    <th>
                      <strong>Vlastnosti</strong>
                    </th>
                    <th>
                      <strong>Alergie</strong>
                    </th>
                    <th style={{ width: '20%' }}>
                      <strong>Doprava</strong>
                    </th>
                    <th>
                      <strong>Akce</strong>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {job.workers.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <i>Žádní pracanti</i>
                      </td>
                    </tr>
                  )}

                  {job.workers.map(worker => (
                    <SimpleRow
                      data={formatWorkerData(
                        worker,
                        job,
                        day,
                        ridesForOtherJobs,
                        removeWorkerFromJob,
                        setWorkerToMove,
                        reloadPlan
                      )}
                      onMouseEnter={() =>
                        worker.photoPath
                          ? onWorkerHover(`/api/workers/${worker.id}/photo`)
                          : onWorkerHover(null)
                      }
                      onMouseLeave={() => onWorkerHover(null)}
                      key={worker.id}
                      draggable={true}
                      onDragStart={onWorkerDragStart(worker, job.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
          {showDeleteConfirmation && !deleteError && (
            <ConfirmationModal
              onConfirm={deleteJob}
              onReject={() => setShowDeleteConfirmation(false)}
            >
              <p>
                Opravdu chcete smazat job <b>{job.proposedJob.name}</b>?
              </p>
            </ConfirmationModal>
          )}
          {deleteError && (
            <ErrorMessageModal
              onClose={onErrorMessageClose}
              mainMessage={'Nepovedlo se odstranit job.'}
            />
          )}
          {workerToMove && (
            <MoveWorkerModal
              onReject={() => setWorkerToMove(undefined)}
              currentJob={job}
              jobs={plannedJobs}
              worker={workerToMove}
              onSuccess={onWorkerMoved}
            />
          )}
        </ExpandableRow>
      )}
    </>
  )
}

function responsibleWorkerName(job: ActiveJobNoPlan) {
  if (!job.responsibleWorker) return 'Není'
  return `${job.responsibleWorker?.firstName} ${job.responsibleWorker?.lastName}`
}

function formatAmenities(job: ActiveJobNoPlan) {
  return (
    <>
      {job.proposedJob.hasFood && (
        <i className="fas fa-utensils me-2" title="Jídlo na místě"></i>
      )}{' '}
      {job.proposedJob.hasShower && (
        <i className="fas fa-shower" title="Sprcha na místě"></i>
      )}
    </>
  )
}

function formatAllergens(job: ActiveJobNoPlan) {
  if (job.proposedJob.allergens.length == 0) return 'Žádné'
  return job.proposedJob.allergens.join(', ')
}

function formatRowData(
  job: ActiveJobNoPlan,
  day: Date,
  ridesForOtherJobs: RidesForJob[],
  deleteJob: () => void,
  isBeingDeleted: boolean
): RowCells[] {
  return [
    {content: <span
      className="d-inline-flex gap-1 align-items-center"
      key={`name-${job.id}`}
    >
      {job.proposedJob.name}
      <ActiveJobIssueIcon
        job={job}
        day={day}
        ridesForOtherJobs={ridesForOtherJobs}
      />
    </span>},
    {content: `${job.workers.length} / ${job.proposedJob.minWorkers} .. ${job.proposedJob.maxWorkers}`},
    {content: job.proposedJob.contact},
    {content: job.proposedJob.area?.name},
    {content: job.proposedJob.address},
    {content: formatAmenities(job)},
    {content: <span key={`actions-${job.id}`} className="d-flex align-items-center gap-3">
      <Link
        href={`/plans/${job.planId}/${job.id}`}
        onClick={e => e.stopPropagation()}
        className="smj-action-edit"
      >
        <i className="fas fa-edit" title="Upravit"></i>
      </Link>

      {deleteJobIcon(deleteJob, isBeingDeleted)}
      <span style={{ width: '0px' }}></span>
    </span>, stickyRight: true},
  ]
}

function deleteJobIcon(deleteJob: () => void, isBeingDeleted: boolean) {
  return (
    <>
      {!isBeingDeleted && (
        <>
          <i
            className="fas fa-trash-alt smj-action-delete"
            title="Smazat"
            onClick={e => {
              e.stopPropagation()
              deleteJob()
            }}
          ></i>
          <span style={{ width: '0px' }}></span>
        </>
      )}
      {isBeingDeleted && (
        <i
          className="fas fa-spinner smj-action-delete spinning"
          title="Odstraňování..."
        ></i>
      )}
    </>
  )
}

function formatWorkerData(
  worker: WorkerComplete,
  job: ActiveJobNoPlan,
  day: Date,
  rides: RidesForJob[],
  removeWorker: (workerId: string) => void,
  requestMoveWorker: (worker: WorkerComplete) => void,
  reloadPlan: () => void
) {
  const name = `${worker.firstName} ${worker.lastName}`
  const abilities = []
  const isDriver = job?.rides.map(r => r.driverId).includes(worker.id) || false
  const wantsAdoration = worker.availability.adorationDays
    .map(d => d.getTime())
    .includes(day.getTime())

  if (worker.cars.length > 0) abilities.push('Auto')
  if (worker.isStrong) abilities.push('Silák')
  const allergies = worker.allergies

  return [
    <>
      {name} {isDriver && <i className="fas fa-car ms-2" title="Řidič"></i>}{' '}
      {wantsAdoration && (
        <i className="fas fa-church ms-2" title="Chce adorovat"></i>
      )}
    </>,
    worker.phone,
    abilities.join(', '),
    allergies.join(', '),
    <RideSelect
      key={`rideselect-${worker.id}`}
      worker={worker}
      job={job}
      otherRides={rides}
      onRideChanged={reloadPlan}
    />,
    <span
      key={`actions-${worker.id}`}
      className="d-flex align-items-center gap-3"
    >
      {moveWorkerToJobIcon(() => requestMoveWorker(worker))}
      {removeWorkerIcon(() => removeWorker(worker.id))}
    </span>,
  ]
}

function moveWorkerToJobIcon(move: () => void) {
  return (
    <>
      <i
        className="fas fa-shuffle smj-action-edit cursor-pointer"
        title="Přesunout na jiný job"
        onClick={e => {
          e.stopPropagation()
          move()
        }}
      ></i>
    </>
  )
}

function removeWorkerIcon(remove: () => void) {
  return (
    <>
      <i
        className="fas fa-trash-alt smj-action-delete cursor-pointer"
        title="Odstranit z jobu"
        onClick={e => {
          e.stopPropagation()
          remove()
        }}
      ></i>
    </>
  )
}
