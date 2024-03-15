import { ProposedJobComplete } from 'lib/types/proposed-job'
import { useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import RowCategory from '../table/RowCategory'
import {
  SortableColumn,
  SortableTable,
  SortOrder,
} from '../table/SortableTable'
import ProposedJobRow from './ProposedJobRow'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Název', sortable: true, style: { minWidth: '180px' } },
  {
    id: 'area',
    name: 'Lokalita',
    sortable: true,
    style: { minWidth: '180px' },
  },
  {
    id: 'contact',
    name: 'Kontaktní osoba',
    sortable: false,
    style: { minWidth: '150px' },
  },
  {
    id: 'address',
    name: 'Adresa',
    sortable: false,
    style: { minWidth: '170px' },
  },
  { id: 'daysPlanned', name: 'Naplánované dny', sortable: true },
  { id: 'daysLeft', name: 'Dostupné dny', sortable: true },
  { id: 'workers', name: 'Pracantů', sortable: true },
  { id: 'priority', name: 'Priorita', sortable: true },
  {
    id: 'actions',
    name: 'Akce',
    sortable: false,
    className: 'smj-sticky-col-right smj-table-header',
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
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: undefined,
    direction: 'desc',
  })
  const onSortRequested = (direction: SortOrder) => {
    setSortOrder(direction)
  }
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

  const sortedData = useMemo(
    () => [
      ...sortJobs(pinnedJobs, sortOrder),
      ...sortJobs(waitingJobs, sortOrder),
    ],
    [sortOrder, waitingJobs, pinnedJobs]
  )

  const sortedCompleted = useMemo(
    () => sortJobs(completedJobs, sortOrder),
    [sortOrder, completedJobs]
  )

  const sortedHidden = useMemo(
    () => sortJobs(hiddenJobs, sortOrder),
    [sortOrder, hiddenJobs]
  )

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
                job={job}
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
                  job={job}
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
                  job={job}
                  workerId={workerId}
                  reloadJobs={reloadJobs}
                />
              )
          )}
      </RowCategory>
    </SortableTable>
  )
}

function sortJobs(data: ProposedJobComplete[], sortOrder: SortOrder) {
  if (sortOrder.columnId === undefined) {
    return data
  }
  data = [...data]

  const getSortable: {
    [b: string]: (job: ProposedJobComplete) => string | number
  } = {
    name: job => job.name,
    area: job => job.area?.name ?? -1,
    address: job => job.address,
    daysPlanned: job => job.activeJobs.length,
    daysLeft: job => job.availability.length,
    workers: job => job.minWorkers,
    priority: job => job.priority,
  }

  if (sortOrder.columnId in getSortable) {
    const sortKey = getSortable[sortOrder.columnId]
    return data.sort((a, b) => {
      if (sortKey(a) < sortKey(b)) {
        return sortOrder.direction === 'desc' ? 1 : -1
      }
      if (sortKey(a) > sortKey(b)) {
        return sortOrder.direction === 'desc' ? -1 : 1
      }
      return 0
    })
  }
  return data
}
