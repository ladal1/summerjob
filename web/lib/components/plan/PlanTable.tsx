import type { Worker } from 'lib/prisma/client'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { PlanComplete, sortJobsByAreaAndId } from 'lib/types/plan'
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

interface PlanTableProps {
  plan?: PlanComplete
  shouldShowJob: (job: ActiveJobNoPlan) => boolean
  joblessWorkers: WorkerComplete[]
  reloadJoblessWorkers: () => void
  reloadPlan: () => void
  onHover: (url: string | null) => void
  adorationByWorker?: Map<string, boolean>
  showNumbers?: boolean
}

export function PlanTable({
  plan,
  shouldShowJob,
  joblessWorkers,
  reloadJoblessWorkers,
  reloadPlan,
  onHover,
  adorationByWorker = new Map(),
  showNumbers = false,
}: PlanTableProps) {
  // Create dynamic columns based on showNumbers
  const columns: SortableColumn[] = useMemo(() => {
    const baseColumns: SortableColumn[] = [
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
      { id: 'priority', name: showNumbers ? 'Číslo' : 'Priorita' },
      {
        id: 'actions',
        name: 'Akce',
        notSortable: true,
        stickyRight: true,
        style: { minWidth: '100px' },
      },
    ]
    return baseColumns
  }, [showNumbers])

  // Create position mapping based on sortJobsByAreaAndId function
  const jobPositionMap = useMemo(() => {
    if (!plan) return new Map<string, number>()
    
    const jobsWithPositions = sortJobsByAreaAndId([...plan.jobs])
    const positionMap = new Map<string, number>()
    
    jobsWithPositions.forEach(job => {
      if (job.seqId) {
        positionMap.set(job.id, job.seqId)
      }
    })
    
    return positionMap
  }, [plan])

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
      priority: (job: ActiveJobNoPlan) => 
        showNumbers ? (jobPositionMap.get(job.id) || 0) : job.proposedJob.priority,
    }),
    [showNumbers, jobPositionMap]
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
      columns={columns}
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
            adorationByWorker={adorationByWorker}
            jobPositionMap={showNumbers ? jobPositionMap : new Map()}
          />
        ))}
      {joblessWorkers && plan && (
        <PlanJoblessRow
          planId={plan.id}
          planDay={plan.day}
          jobs={sortedJobs}
          joblessWorkers={joblessWorkers}
          numColumns={columns.length}
          onWorkerDragStart={onWorkerDragStart}
          reloadPlan={reload}
          onWorkerHover={onHover}
          adorationByWorker={adorationByWorker}
        />
      )}
    </SortableTable>
  )
}
