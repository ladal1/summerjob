'use client'
import LogsTable from './LogsTable'
import { APILogEvent, FilteredLogs, deserializeLogs } from 'lib/types/logger'
import { Serialized } from 'lib/types/serialize'
import { useMemo, useState } from 'react'
import useDebounce from 'lib/helpers/debounce'
import { useAPILogs } from 'lib/fetcher/log'
import { Filters } from '../filters/Filters'

interface LogsClientPageProps {
  sLogs: Serialized
}

const PAGE_SIZE = 10

export default function LogsClientPage({ sLogs }: LogsClientPageProps) {
  const logs = deserializeLogs(sLogs)
  const [filter, setFilter] = useState('')
  const debouncedSearch = useDebounce(filter, 500)
  const [page, setPage] = useState(1)
  const eventTypes = useMemo(() => getEventTypes(), [])
  const [filterEventType, setFilterEventType] = useState(
    eventTypes[0]
  )
  const { data } = useAPILogs(
    debouncedSearch,
    filterEventType.id,
    (page - 1) * PAGE_SIZE,
    PAGE_SIZE,
    {
      fallbackData: logs,
      keepPreviousData: true,
    }
  )

  const onFilterChanged = (value: string) => {
    setPage(1)
    setFilter(value)
  }

  const eventTypeSelectChanged = (id: string) => {
    setPage(1)
    setFilterEventType(eventTypes.find(p => p.id === id) || eventTypes[0])
  }

  const paginationButtons = useMemo(() => {
    if (!data) return []
    const numberOfPages = Math.ceil(data.total / PAGE_SIZE)
    if (numberOfPages <= 5) {
      return Array.from({ length: numberOfPages }, (_, i) => (
        <PaginationButton
          key={i}
          active={page === i + 1}
          page={i + 1}
          onClick={() => setPage(i + 1)}
        />
      ))
    }
    const pageButtons = []
    let lastWasDisabled = false
    for (let i = 1; i <= numberOfPages; i++) {
      if (i === 1 || i === numberOfPages || (i >= page - 1 && i <= page + 1)) {
        pageButtons.push(
          <PaginationButton
            key={i}
            active={page === i}
            page={i}
            onClick={() => setPage(i)}
          />
        )
        lastWasDisabled = false
      } else if (!lastWasDisabled) {
        pageButtons.push(
          <PaginationButton
            key={i}
            active={false}
            page={'...'}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onClick={() => {}}
            disabled={true}
          />
        )
        lastWasDisabled = true
      }
    }
    return pageButtons
  }, [data, page, setPage])

  return (
    <section>
      <div className="container">
        <div className="row">
          <div className="col">
            <Filters
              search={filter}
              onSearchChanged={onFilterChanged}
              selects={[
                {
                  id: 'eventType',
                  options: eventTypes,
                  selected: filterEventType,
                  onSelectChanged: eventTypeSelectChanged,
                  defaultOptionId: 'all'
                },
              ]}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <LogsTable logs={data!.logs} />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <nav aria-label="Page navigation">
              <ul className="smj-pagination d-flex justify-content-center">
                {paginationButtons}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </section>
  )
}

function PaginationButton({
  page,
  onClick,
  active,
  disabled = false,
}: {
  page: string | number
  onClick: () => void
  active: boolean
  disabled?: boolean
}) {
  return (
    <li
      className={`smj-page-item ${active ? 'active' : ''} ${
        disabled ? 'disabled' : ''
      }`}
    >
      <a
        className="smj-page-link"
        href="#"
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClick={disabled ? () => {} : onClick}
      >
        {page}
      </a>
    </li>
  )
}

function getEventTypes() {
  const types = [{ id: 'all', name: 'Vyberte typ události' }]
  const events = Object.values(APILogEvent)
  events.sort()
  for (const type of events) {
    types.push({ id: type, name: type })
  }
  return types
}
