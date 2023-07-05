import { ActiveJobNoPlan } from 'lib/types/active-job'
import { WorkerComplete } from 'lib/types/worker'
import { ExpandableRow } from '../table/ExpandableRow'
import { SimpleRow } from '../table/SimpleRow'
import type { Worker } from 'lib/prisma/client'
import { useAPIActiveJobUpdateDynamic } from 'lib/fetcher/active-job'
import { useEffect, useState } from 'react'
import MoveWorkerModal from './MoveWorkerModal'

const NO_JOB = 'NO_JOB'

interface PlanJoblessRowProps {
  planId: string
  planDay: Date
  jobs: ActiveJobNoPlan[]
  joblessWorkers: WorkerComplete[]
  numColumns: number
  onWorkerDragStart: (
    worker: Worker,
    sourceId: string
  ) => (e: React.DragEvent<HTMLTableRowElement>) => void
  reloadPlan: () => void
  onWorkerHover: (url: string | null) => void
}

export function PlanJoblessRow({
  planId,
  planDay,
  jobs,
  joblessWorkers,
  numColumns,
  onWorkerDragStart,
  reloadPlan,
  onWorkerHover,
}: PlanJoblessRowProps) {
  const [sourceJobId, setSourceJobId] = useState<string | undefined>(undefined)
  const [workerIds, setWorkerIds] = useState<string[]>([])
  const getSourceJobId = () => sourceJobId

  const { trigger, isMutating, error } = useAPIActiveJobUpdateDynamic(
    getSourceJobId,
    planId,
    {
      onSuccess: () => {
        reloadPlan()
      },
    }
  )

  useEffect(() => {
    if (sourceJobId) {
      trigger({ workerIds: workerIds })
      setSourceJobId(undefined)
    }
  }, [sourceJobId, workerIds, trigger, reloadPlan])

  const onWorkerDropped = () => (e: React.DragEvent<HTMLTableRowElement>) => {
    const workerId = e.dataTransfer.getData('worker-id')
    const fromJobId = e.dataTransfer.getData('source-id')
    if (fromJobId === NO_JOB) {
      return
    }

    const job = jobs.find(j => j.id === fromJobId)

    if (!job) {
      return
    }
    const newWorkers = [
      ...job.workers.map(w => w.id).filter(w => w !== workerId),
    ]

    setSourceJobId(fromJobId)
    setWorkerIds(newWorkers)
  }

  const [workerToMove, setWorkerToMove] = useState<WorkerComplete | undefined>(
    undefined
  )

  const onWorkerMoved = () => {
    setWorkerToMove(undefined)
    reloadPlan()
  }

  return (
    <>
      <ExpandableRow
        data={[`Bez práce (${joblessWorkers.length})`]}
        colspan={numColumns}
        className={joblessWorkers.length > 0 ? 'smj-background-error' : ''}
        onDrop={onWorkerDropped()}
      >
        <div className="ms-2">
          <b>Následující pracanti nemají přiřazenou práci:</b>
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
                <th>
                  <strong>Akce</strong>
                </th>
              </tr>
            </thead>
            <tbody>
              {joblessWorkers.map(worker => (
                <SimpleRow
                  data={formatWorkerData(worker, planDay, setWorkerToMove)}
                  key={worker.id}
                  draggable={true}
                  onDragStart={onWorkerDragStart(worker, NO_JOB)}
                  onMouseEnter={() =>
                    worker.photoPath
                      ? onWorkerHover(`/api/workers/${worker.id}/image`)
                      : onWorkerHover(null)
                  }
                  onMouseLeave={() => onWorkerHover(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {workerToMove && (
          <MoveWorkerModal
            onReject={() => setWorkerToMove(undefined)}
            jobs={jobs}
            worker={workerToMove}
            onSuccess={onWorkerMoved}
          />
        )}
      </ExpandableRow>
    </>
  )
}

function formatWorkerData(
  worker: WorkerComplete,
  planDay: Date,
  requestMoveWorker: (worker: WorkerComplete) => void
) {
  const name = `${worker.firstName} ${worker.lastName}`
  const abilities = []

  if (worker.cars.length > 0) abilities.push('Auto')
  if (worker.isStrong) abilities.push('Silák')
  if (
    worker.availability.adorationDays.find(
      x => x.getTime() === planDay.getTime()
    )
  )
    abilities.push('Adoruje')
  const allergies = worker.allergies

  return [
    name,
    worker.phone,
    abilities.join(', '),
    allergies.join(', '),
    <span
      key={`actions-${worker.id}`}
      className="d-flex align-items-center gap-3"
    >
      {moveWorkerToJobIcon(() => requestMoveWorker(worker))}
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
