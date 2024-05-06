import { ProposedJobComplete } from 'lib/types/proposed-job'
import { useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import RowCategory from '../table/RowCategory'
import { sortData } from '../table/SortData'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import ProposedJobRow from './ProposedJobRow'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Název', style: { minWidth: '180px' } },
  {
    id: 'area',
    name: 'Lokalita',
    style: { minWidth: '180px' },
  },
  {
    id: 'contact',
    name: 'Kontaktní osoba',
    style: { minWidth: '150px' },
  },
  {
    id: 'address',
    name: 'Adresa',
    style: { minWidth: '170px' },
  },
  { id: 'daysPlanned', name: 'Naplánované dny' },
  { id: 'daysLeft', name: 'Dostupné dny' },
  { id: 'workers', name: 'Pracantů' },
  { id: 'priority', name: 'Priorita' },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
    style: { minWidth: '100px' },
  },
]

interface JobsTableProps {
  data: ProposedJobComplete[]
  shouldShowJob: (job: ProposedJobComplete) => boolean
  reload: () => void
  workerId: string
}

export function JobsTable({
  data,
  shouldShowJob,
  reload,
  workerId,
}: JobsTableProps) {
  const [hiddenJobs, waitingJobs, completedJobs, pinnedJobs] = useMemo(() => {
    const { hidden, completed, pinned, regular } = data.reduce(
      (acc, job) => {
        if (job.hidden) {
          acc.hidden.push(job)
        } else if (job.completed) {
          acc.completed.push(job)
        } else if (
          job.pinnedBy &&
          job.pinnedBy.some(worker => worker.workerId === workerId)
        ) {
          acc.pinned.push(job)
        } else {
          acc.regular.push(job)
        }
        return acc
      },
      { hidden: [], completed: [], pinned: [], regular: [] } as {
        hidden: Array<ProposedJobComplete>
        completed: Array<ProposedJobComplete>
        pinned: Array<ProposedJobComplete>
        regular: Array<ProposedJobComplete>
      }
    )

    return [hidden, regular, completed, pinned]
  }, [data, workerId])

  //#region Sort
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: undefined,
    direction: 'desc',
  })
  const onSortRequested = (direction: SortOrder) => {
    setSortOrder(direction)
  }

  const getSortable = useMemo(
    () => ({
      name: (job: ProposedJobComplete) => job.name,
      area: (job: ProposedJobComplete) => job.area?.name ?? -1,
      contact: (job: ProposedJobComplete) => job.contact,
      address: (job: ProposedJobComplete) => job.address,
      daysPlanned: (job: ProposedJobComplete) =>
        `${job.activeJobs.length}${job.requiredDays}`,
      daysLeft: (job: ProposedJobComplete) => job.availability.length,
      workers: (job: ProposedJobComplete) =>
        `${job.minWorkers}${job.maxWorkers}`,
      priority: (job: ProposedJobComplete) => job.priority,
    }),
    []
  )

  const sortedData = useMemo<ProposedJobComplete[]>(
    () => [
      ...sortData(pinnedJobs, getSortable, sortOrder),
      ...sortData(waitingJobs, getSortable, sortOrder),
    ],
    [sortOrder, waitingJobs, pinnedJobs, getSortable]
  )

  const sortedCompleted = useMemo<ProposedJobComplete[]>(
    () => sortData(completedJobs, getSortable, sortOrder),
    [sortOrder, completedJobs, getSortable]
  )

  const sortedHidden = useMemo<ProposedJobComplete[]>(
    () => sortData(hiddenJobs, getSortable, sortOrder),
    [sortOrder, hiddenJobs, getSortable]
  )
  //#endregion

  const reloadJobs = () => {
    reload()
  }

  return (
    <SortableTable
      columns={_columns}
      currentSort={sortOrder}
      onRequestedSort={onSortRequested}
    >
      {data && data.length === 0 && (
        <MessageRow message="Žádné joby" colspan={_columns.length} />
      )}
      {data &&
        sortedData.map(
          job =>
            shouldShowJob(job) && (
              <ProposedJobRow
                key={job.id}
                job={{
                  ...job,
                  address: job.address.split(',').slice(0, 2).join(', '),
                }}
                workerId={workerId}
                reloadJobs={reloadJobs}
              />
            )
        )}
      <RowCategory
        title={`Dokončené (${sortedCompleted.length})`}
        numCols={_columns.length}
        secondaryTitle={
          'Joby označené jako dokončené se nebudou zobrazovat při plánování'
        }
        className="bg-category-done"
      >
        {data &&
          sortedCompleted.map(
            job =>
              shouldShowJob(job) && (
                <ProposedJobRow
                  key={job.id}
                  job={{
                    ...job,
                    address: job.address.split(',').slice(0, 2).join(', '),
                  }}
                  workerId={workerId}
                  reloadJobs={reloadJobs}
                />
              )
          )}
      </RowCategory>
      <RowCategory
        title={`Skryté (${sortedHidden.length})`}
        numCols={_columns.length}
        secondaryTitle={
          'Joby označené jako skryté se nebudou zobrazovat při plánování'
        }
        className="bg-category-hidden"
      >
        {data &&
          sortedHidden.map(
            job =>
              shouldShowJob(job) && (
                <ProposedJobRow
                  key={job.id}
                  job={{
                    ...job,
                    address: job.address.split(',').slice(0, 2).join(', '),
                  }}
                  workerId={workerId}
                  reloadJobs={reloadJobs}
                />
              )
          )}
      </RowCategory>
    </SortableTable>
  )
}
