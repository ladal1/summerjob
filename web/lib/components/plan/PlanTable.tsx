import type { Worker } from 'lib/prisma/client'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { PlanComplete } from 'lib/types/plan'
import { RidesForJob } from 'lib/types/ride'
import { WorkerComplete } from 'lib/types/worker'
import { useCallback, useMemo, useState } from 'react'
import {
  SortableColumn,
  SortableTable,
  SortOrder,
} from '../table/SortableTable'
import { sortData } from '../table/SortData'
import { PlanJoblessRow } from './PlanJoblessRow'
import { PlanJobRow } from './PlanJobRow'

const _columns: SortableColumn[] = [
  {
    id: 'completed',
    name: 'Hotovo',
    style: { maxWidth: '100px' },
  },
  { id: 'name', name: 'Práce' },
  { id: 'workers', name: 'Pracanti' },
  { id: 'contact', name: 'Kontaktní osoba' },
  { id: 'area', name: 'Oblast' },
  { id: 'address', name: 'Adresa' },
  { id: 'amenities', name: 'Zajištění' },
  { id: 'priority', name: 'Priorita' },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
    style: { minWidth: '100px' },
  },
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
  //#region Sort
  const getSortable = useMemo(
    () => ({
      completed: (job: ActiveJobNoPlan) => +!job.completed,
      name: (job: ActiveJobNoPlan) => job.proposedJob.name,
      area: (job: ActiveJobNoPlan) => job.proposedJob.area?.name ?? -1,
      address: (job: ActiveJobNoPlan) => job.proposedJob.address,
      amenities: (job: ActiveJobNoPlan) =>
        `${+!job.proposedJob.hasFood}${+!job.proposedJob.hasShower}`,
      days: (job: ActiveJobNoPlan) => job.proposedJob.requiredDays,
      contact: (job: ActiveJobNoPlan) => job.proposedJob.contact,
      workers: (job: ActiveJobNoPlan) =>
        `${job.proposedJob.minWorkers}/${job.proposedJob.maxWorkers} .. ${job.proposedJob.strongWorkers}`,
      priority: (job: ActiveJobNoPlan) => job.proposedJob.priority,
    }),
    []
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: 'name',
    direction: 'asc',
  })
  const onSortRequested = (direction: SortOrder) => {
    setSortOrder(direction)
  }
  const sortedJobs = useMemo(() => {
    return plan ? sortData(plan.jobs, getSortable, sortOrder) : []
  }, [plan, getSortable, sortOrder])

  const onWorkerDragStart = useCallback((worker: Worker, sourceId: string) => {
    return (e: React.DragEvent<HTMLTableRowElement>) => {
      e.dataTransfer.setData('worker-id', worker.id)
      e.dataTransfer.setData('source-id', sourceId)
    }
  }, [])
  //#endregion

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
