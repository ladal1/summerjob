import { allergyMapping } from 'lib/data/enumMapping/allergyMapping'
import { skillMapping } from 'lib/data/enumMapping/skillMapping'
import { toolNameMapping } from 'lib/data/enumMapping/toolNameMapping'
import {
  useAPIActiveJobDelete,
  useAPIActiveJobs,
  useAPIActiveJobUpdate,
} from 'lib/fetcher/active-job'
import { formatDateShort } from 'lib/helpers/helpers'
import type { Worker } from 'lib/prisma/client'
import { ActiveJobNoPlan, ActiveJobWorkersAndJobs } from 'lib/types/active-job'
import { RidesForJob } from 'lib/types/ride'
import { ToolCompleteData } from 'lib/types/tool'
import { WorkerComplete } from 'lib/types/worker'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { ExpandableRow } from '../table/ExpandableRow'
import { RowCells } from '../table/RowCells'
import { RowContent, RowContentsInterface } from '../table/RowContent'
import { SimpleRow } from '../table/SimpleRow'
import { ActiveJobIssueBanner, ActiveJobIssueIcon } from './ActiveJobIssue'
import AddRideButton from './AddRideButton'
import JobRideList from './JobRideList'
import MoveWorkerModal from './MoveWorkerModal'
import RideSelect from './RideSelect'
import ToggleCompletedCheck from './ToggleCompletedCheck'
import { SameCoworkerIssue, WorkerIssue } from './WorkerIssue'

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
  const { data: activeJobs } = useAPIActiveJobs({
    fallbackData: [],
  })

  const { trigger: triggerUpdate, isMutating: isBeingUpdated } =
    useAPIActiveJobUpdate(job.id, job.planId, {
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

  const expandedContent: RowContentsInterface[] = [
    {
      label: 'Popis',
      content: `${job.proposedJob.publicDescription}`,
    },
    {
      label: 'Poznámka pro organizátory',
      content: `${job.proposedJob.privateDescription}`,
    },
    {
      label: (
        <div className="d-flex gap-1">
          <strong>Doprava</strong>
          <AddRideButton job={job} />
        </div>
      ),
      content: (
        <>
          <JobRideList
            job={job}
            otherJobs={plannedJobs.filter(j => j.id !== job.id)}
            reloadPlan={reloadPlan}
          />
          <br />
        </>
      ),
    },
    {
      label: 'Adorace v oblasti',
      content: `${job.proposedJob.area?.supportsAdoration ? 'Ano' : 'Ne'}`,
    },
    {
      label: 'Alergeny',
      content: `${formatAllergens(job)}`,
    },
    {
      label: 'Nářadí na místě',
      content: `${formatTools(job.proposedJob.toolsOnSite)}`,
    },
    {
      label: 'Nářadí s sebou',
      content: `${formatTools(job.proposedJob.toolsToTakeWith)}`,
    },
    {
      label: 'Pracantů (min/max/silných)',
      content: `${job.proposedJob.minWorkers}/${job.proposedJob.maxWorkers}/
      ${job.proposedJob.strongWorkers}`,
    },
    {
      label: 'Zodpovědná osoba',
      content: `${responsibleWorkerName(job)}`,
    },
    {
      label: '',
      content: ``,
    },
  ]

  //#region Register additional issues
  const sameWorkIssuesWorkers = new Map()
  const [sameWorkIssue, setSameWorkIssue] = useState<boolean>(false)

  const registerSameWorkerIssue = (workerId: string, value: boolean) => {
    sameWorkIssuesWorkers.set(workerId, value)
    const hasIssues = Array.from(job.workers).some(worker =>
      sameWorkIssuesWorkers.get(worker.id)
    )
    if (hasIssues !== sameWorkIssue) {
      setSameWorkIssue(hasIssues)
    }
  }

  const sameCoworkerIssuesWorkers = new Map()
  const [sameCoworkerIssue, setSameCoworkerIssue] = useState<boolean>(false)

  const registerSameCoworkerIssue = (workerId: string, value: boolean) => {
    sameCoworkerIssuesWorkers.set(workerId, value)
    const hasIssues = Array.from(job.workers).some(worker =>
      sameCoworkerIssuesWorkers.get(worker.id)
    )
    if (hasIssues !== sameCoworkerIssue) {
      setSameCoworkerIssue(hasIssues)
    }
  }
  //#endregion

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
            isBeingDeleted,
            sameWorkIssue,
            sameCoworkerIssue
          )}
          onDrop={onWorkerDropped(job.id)}
        >
          <>
            <ActiveJobIssueBanner
              job={job}
              day={day}
              ridesForOtherJobs={ridesForOtherJobs}
              sameWorkIssue={sameWorkIssue}
              sameCoworkerIssue={sameCoworkerIssue}
            />
            <RowContent data={expandedContent} />
            <div className="table-responsive text-nowrap">
              <table className="table table-hover">
                <thead className="smj-light-grey">
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
                        activeJobs,
                        removeWorkerFromJob,
                        setWorkerToMove,
                        reloadPlan,
                        registerSameWorkerIssue,
                        registerSameCoworkerIssue
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
  return job.proposedJob.allergens
    .map(allergen => allergyMapping[allergen])
    .join(', ')
}

function formatTools(tools: ToolCompleteData[]) {
  if (tools.length == 0) return 'Žádné'
  return tools
    .map(
      tool =>
        toolNameMapping[tool.tool] +
        (tool.amount > 1 ? ' - ' + tool.amount : '')
    )
    .join(', ')
}

function formatRowData(
  job: ActiveJobNoPlan,
  day: Date,
  ridesForOtherJobs: RidesForJob[],
  deleteJob: () => void,
  isBeingDeleted: boolean,
  sameWorkIssue: boolean,
  sameCoworkerIssue: boolean
): RowCells[] {
  return [
    {
      content: (
        <span key={`completed-${job.id}`} onClick={e => e.stopPropagation()}>
          <ToggleCompletedCheck job={job} />
        </span>
      ),
    },
    {
      content: (
        <span
          className="d-inline-flex gap-1 align-items-center"
          key={`name-${job.id}`}
        >
          {job.proposedJob.name}
          <ActiveJobIssueIcon
            job={job}
            day={day}
            ridesForOtherJobs={ridesForOtherJobs}
            sameWorkIssue={sameWorkIssue}
            sameCoworkerIssue={sameCoworkerIssue}
          />
        </span>
      ),
    },
    {
      content: `${job.workers.length} / ${job.proposedJob.minWorkers} .. ${job.proposedJob.maxWorkers}`,
    },
    { content: job.proposedJob.contact },
    { content: job.proposedJob.area?.name },
    { content: job.proposedJob.address },
    { content: formatAmenities(job) },
    { content: job.proposedJob.priority },
    {
      content: (
        <span
          key={`actions-${job.id}`}
          className="d-flex align-items-center gap-3"
        >
          <Link
            href={`/plans/${job.planId}/${job.id}`}
            onClick={e => e.stopPropagation()}
            className="smj-action-edit"
          >
            <i className="fas fa-edit" title="Upravit"></i>
          </Link>

          {deleteJobIcon(deleteJob, isBeingDeleted)}
        </span>
      ),
      stickyRight: true,
    },
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
  plannedJobs: ActiveJobWorkersAndJobs[] | undefined,
  removeWorker: (workerId: string) => void,
  requestMoveWorker: (worker: WorkerComplete) => void,
  reloadPlan: () => void,
  registerSameWorkerIssue: (workerId: string, value: boolean) => void,
  registerSameCoworkerIssue: (workerId: string, value: boolean) => void
) {
  const name = `${worker.firstName} ${worker.lastName}${
    worker.age ? `, ${worker.age}` : ''
  }`
  const abilities = []
  const isDriver = job?.rides.map(r => r.driverId).includes(worker.id) || false
  const wantsAdoration = worker.availability.adorationDays
    .map(d => d.getTime())
    .includes(day.getTime())

  if (worker.cars.length > 0) abilities.push('Auto')
  if (worker.isStrong) abilities.push('Silák')
  if (worker.skills) {
    worker.skills.map(skill => {
      abilities.push(skillMapping[skill])
    })
  }
  const allergies = worker.allergies
  const workerSameWork = sameWork(worker.id, job, day, plannedJobs)
  const workerSameCoworker = sameCoworker(worker.id, job, day, plannedJobs)
  registerSameWorkerIssue(worker.id, workerSameWork.length > 0)
  registerSameCoworkerIssue(worker.id, workerSameCoworker.length > 0)

  return [
    {
      content: (
        <>
          <WorkerIssue
            sameWork={workerSameWork}
            sameCoworker={workerSameCoworker}
          />
          {name} {isDriver && <i className="fas fa-car ms-2" title="Řidič"></i>}{' '}
          {wantsAdoration && (
            <i className="fas fa-church ms-2" title="Chce adorovat"></i>
          )}
        </>
      ),
    },
    { content: worker.phone },
    { content: abilities.join(', ') },
    { content: allergies.map(key => allergyMapping[key]) },
    {
      content: (
        <RideSelect
          key={`rideselect-${worker.id}`}
          worker={worker}
          job={job}
          otherRides={rides}
          onRideChanged={reloadPlan}
        />
      ),
    },
    {
      content: (
        <span
          key={`actions-${worker.id}`}
          className="d-flex align-items-center gap-3"
        >
          {moveWorkerToJobIcon(() => requestMoveWorker(worker))}
          {removeWorkerIcon(() => removeWorker(worker.id))}
        </span>
      ),
    },
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

function sameWork(
  currentWorkerId: string,
  currentJob: ActiveJobNoPlan,
  currentDay: Date,
  plannedJobs: ActiveJobWorkersAndJobs[] | undefined
) {
  const issues: Date[] = []
  if (plannedJobs) {
    for (const job of plannedJobs) {
      if (
        job.proposedJobId === currentJob.proposedJobId &&
        job.planId !== currentJob.planId &&
        new Date(job.plan.day).getTime() < currentDay.getTime()
      ) {
        for (const worker of job.workers) {
          if (worker.id === currentWorkerId) {
            issues.push(new Date(job.plan.day))
          }
        }
      }
    }
  }
  return issues
}

function sameCoworker(
  currentWorkerId: string,
  currentJob: ActiveJobNoPlan,
  currentDay: Date,
  plannedJobs: ActiveJobWorkersAndJobs[] | undefined
) {
  const issues: SameCoworkerIssue[] = []
  if (plannedJobs) {
    for (const job of plannedJobs) {
      if (
        job.planId !== currentJob.planId &&
        new Date(job.plan.day).getTime() < currentDay.getTime()
      ) {
        for (const worker of job.workers) {
          for (const curWorker of currentJob.workers) {
            if (
              curWorker.id !== currentWorkerId &&
              worker.id === curWorker.id
            ) {
              issues.push({
                name: worker.firstName + ' ' + worker.lastName,
                jobName: job.proposedJob.name,
                planDay: formatDateShort(new Date(job.plan.day)),
              })
            }
          }
        }
      }
    }
  }
  return issues
}
