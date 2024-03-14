import { ActiveJobNoPlan } from 'lib/types/active-job'
import type { Worker } from 'lib/prisma/client'
import { PlanComplete } from 'lib/types/plan'
import {
  SortableColumn,
  SortableTable,
  SortOrder,
} from '../table/SortableTable'
import { useCallback, useMemo, useState } from 'react'
import { WorkerComplete } from 'lib/types/worker'
import { PlanJobRow } from './PlanJobRow'
import { PlanJoblessRow } from './PlanJoblessRow'
import { RidesForJob } from 'lib/types/ride'

const _columns: SortableColumn[] = [
  { id: 'completed', name: 'Hotovo', sortable: true, style: {maxWidth: "60px"} },
  { id: 'name', name: 'Práce', sortable: true },
  { id: 'workers', name: 'Pracanti', sortable: true },
  { id: 'contact', name: 'Kontaktní osoba', sortable: true },
  { id: 'area', name: 'Oblast', sortable: true },
  { id: 'address', name: 'Adresa', sortable: true },
  { id: 'amenities', name: 'Zajištění', sortable: false },
  { id: 'actions', name: 'Akce', sortable: false, className: "smj-sticky-col-right smj-table-header", style: {minWidth: "100px"}},
]

interface PlanTableProps {
  plan?: PlanComplete
  shouldShowJob: (job: ActiveJobNoPlan) => boolean
  joblessWorkers: WorkerComplete[]
  reloadJoblessWorkers: () => void
  reloadPlan: () => void
  onHover: (url: string | null) => void
}

export function PlanTable({
  plan,
  shouldShowJob,
  joblessWorkers,
  reloadJoblessWorkers,
  reloadPlan,
  onHover,
}: PlanTableProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: 'name',
    direction: 'asc',
  })
  const onSortRequested = (direction: SortOrder) => {
    setSortOrder(direction)
  }
  const sortedJobs = useMemo(() => {
    return plan ? sortJobsInPlan(plan, sortOrder) : []
  }, [sortOrder, plan])

  const onWorkerDragStart = useCallback((worker: Worker, sourceId: string) => {
    return (e: React.DragEvent<HTMLTableRowElement>) => {
      e.dataTransfer.setData('worker-id', worker.id)
      e.dataTransfer.setData('source-id', sourceId)
    }
  }, [])

  const rides = useMemo(() => {
    return (
      plan?.jobs
        .map<RidesForJob>(j => ({
          jobId: j.id,
          jobName: j.proposedJob.name,
          rides: j.rides,
        }))
        .filter(j => j.rides.length > 0) ?? []
    )
  }, [plan])

  const reload = useCallback(() => {
    reloadPlan()
    reloadJoblessWorkers()
  }, [reloadPlan, reloadJoblessWorkers])

  return (
    <SortableTable
      columns={_columns}
      currentSort={sortOrder}
      onRequestedSort={onSortRequested}
    >
      {plan &&
        sortedJobs.map(job => (
          <PlanJobRow
            key={job.id}
            isDisplayed={shouldShowJob(job)}
            day={plan.day}
            job={job}
            plannedJobs={sortedJobs}
            rides={rides}
            onWorkerDragStart={onWorkerDragStart}
            reloadPlan={reload}
            onWorkerHover={onHover}
          />
        ))}
      {joblessWorkers && plan && (
        <PlanJoblessRow
          planId={plan.id}
          planDay={plan.day}
          jobs={sortedJobs}
          joblessWorkers={joblessWorkers}
          numColumns={_columns.length}
          onWorkerDragStart={onWorkerDragStart}
          reloadPlan={reload}
          onWorkerHover={onHover}
        />
      )}
    </SortableTable>
  )
}

function sortJobsInPlan(data: PlanComplete, sortOrder: SortOrder) {
  if (sortOrder.columnId === undefined) {
    return data.jobs
  }
  const jobs = [...data.jobs]

  const getSortable: {
    [b: string]: (job: ActiveJobNoPlan) => string | number
  } = {
    completed: job => +job.completed,
    name: job => job.proposedJob.name,
    area: job => job.proposedJob.area?.name ?? -1,
    address: job => job.proposedJob.address,
    days: job => job.proposedJob.requiredDays,
    contact: job => job.proposedJob.contact,
    workers: job =>
      `${job.proposedJob.minWorkers}/${job.proposedJob.maxWorkers}`,
  }

  if (sortOrder.columnId in getSortable) {
    const sortKey = getSortable[sortOrder.columnId]
    return jobs.sort((a, b) => {
      if (sortKey(a) < sortKey(b)) {
        return sortOrder.direction === 'desc' ? 1 : -1
      }
      if (sortKey(a) > sortKey(b)) {
        return sortOrder.direction === 'desc' ? -1 : 1
      }
      return 0
    })
  }
  return jobs
}
