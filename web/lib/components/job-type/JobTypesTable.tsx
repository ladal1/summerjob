import { JobTypeComplete } from 'lib/types/job-type'
import { useAPIJobTypeReorder } from 'lib/fetcher/job-type'
import { DndSortableListTable } from '../table/DndSortableListTable'
import JobTypeRow from './JobTypeRow'

interface JobTypeTableProps {
  data?: JobTypeComplete[]
  reload: (expectedResult: JobTypeComplete[]) => void
}

export function JobTypesTable({ data, reload }: JobTypeTableProps) {
  const { trigger: triggerReorder } = useAPIJobTypeReorder()

  return (
    <DndSortableListTable<JobTypeComplete>
      data={data}
      columns={[
        { id: 'name', name: 'Název' },
        { id: 'actions', name: 'Akce', stickyRight: true },
      ]}
      emptyMessage="Žádné typy práce"
      onReorder={async ids => {
        await triggerReorder({ ids })
      }}
      renderRow={item => (
        <JobTypeRow
          key={item.id}
          jobType={item}
          onUpdated={() => reload((data ?? []).filter(jt => jt.id !== item.id))}
        />
      )}
    />
  )
}
