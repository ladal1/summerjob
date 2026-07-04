'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import { useAPIArrivals } from 'lib/fetcher/arrival'
import { normalizeString } from 'lib/helpers/helpers'
import { Serialized } from 'lib/types/serialize'
import { ArrivalWorker, deserializeArrivals } from 'lib/types/arrival'
import { SortOrder } from '../table/SortableTable'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Filters } from '../filters/Filters'
import ArrivalsTable from './ArrivalsTable'

interface ArrivalsClientPageProps {
  sWorkers: Serialized
}

export default function ArrivalsClientPage({
  sWorkers,
}: ArrivalsClientPageProps) {
  const initialWorkers = deserializeArrivals(sWorkers)
  const { data, error, mutate } = useAPIArrivals({
    fallbackData: initialWorkers,
  })

  const searchParams = useSearchParams()
  const searchQ = searchParams?.get('search')
  const onlyNotArrivedQ = searchParams?.get('onlyNotArrived')
  const showHiddenQ = searchParams?.get('showHidden')

  const [filter, setFilter] = useState(searchQ ?? '')
  const [onlyNotArrived, setOnlyNotArrived] = useState(
    onlyNotArrivedQ !== null ? onlyNotArrivedQ === 'true' : true
  )
  const [showHidden, setShowHidden] = useState(showHiddenQ === 'true')
  const [recentlyArrived, setRecentlyArrived] = useState<Set<string>>(new Set())
  const [recentlyHidden, setRecentlyHidden] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (recentlyArrived.size === 0 && recentlyHidden.size === 0) return
    const timer = setTimeout(() => {
      setRecentlyArrived(new Set())
      setRecentlyHidden(new Set())
    }, 30000)
    return () => clearTimeout(timer)
  }, [recentlyArrived, recentlyHidden])

  const handleFilterChange = (value: string) => {
    setFilter(value)
    setRecentlyArrived(new Set())
    setRecentlyHidden(new Set())
  }

  const handleOnlyNotArrivedChange = (value: boolean) => {
    setOnlyNotArrived(value)
    setRecentlyArrived(new Set())
    setRecentlyHidden(new Set())
  }

  const handleShowHiddenChange = (value: boolean) => {
    setShowHidden(value)
    setRecentlyArrived(new Set())
    setRecentlyHidden(new Set())
  }

  const handleWorkerArrived = (workerId: string) => {
    setRecentlyArrived(prev => {
      const next = new Set(prev)
      next.add(workerId)
      return next
    })
  }

  const handleWorkerHidden = (workerId: string) => {
    setRecentlyHidden(prev => {
      const next = new Set(prev)
      next.add(workerId)
      return next
    })
  }

  const sortColumnQ = searchParams?.get('sortColumn')
  const sortDirectionQ = searchParams?.get('sortDirection')
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: sortColumnQ ?? 'name',
    direction: (sortDirectionQ as 'asc' | 'desc') || 'asc',
  })

  const router = useRouter()
  useEffect(() => {
    const params = new URLSearchParams({
      search: filter,
      onlyNotArrived: `${onlyNotArrived}`,
      showHidden: `${showHidden}`,
    })
    if (sortOrder.columnId !== 'name' || sortOrder.direction !== 'asc') {
      params.set('sortColumn', sortOrder.columnId || 'name')
      params.set('sortDirection', sortOrder.direction)
    }
    router.replace(`?${params}`, { scroll: false })
  }, [filter, onlyNotArrived, showHidden, sortOrder, router])

  const fulltextData = useMemo(() => getFulltextData(data), [data])
  const filteredData = useMemo(
    () =>
      filterWorkers(
        normalizeString(filter).trimEnd(),
        fulltextData,
        onlyNotArrived,
        showHidden,
        recentlyArrived,
        recentlyHidden,
        data
      ),
    [
      fulltextData,
      filter,
      onlyNotArrived,
      showHidden,
      recentlyArrived,
      recentlyHidden,
      data,
    ]
  )

  const stats = useMemo(() => {
    if (!data) return { total: 0, arrived: 0, hidden: 0 }
    const visible = data.filter(w => w.show)
    return {
      total: visible.length,
      arrived: visible.filter(w => w.arrived).length,
      hidden: data.filter(w => !w.show).length,
    }
  }, [data])

  if (error && !data) {
    return <ErrorPage error={error} />
  }

  return (
    <section>
      <div className="container">
        <div className="row gx-3">
          <div className="col">
            <Filters
              search={filter}
              onSearchChanged={handleFilterChange}
              checkboxes={[
                {
                  id: 'onlyNotArrivedCheckbox',
                  label: 'Pouze nedorazivší',
                  checked: onlyNotArrived,
                  onCheckboxChanged: handleOnlyNotArrivedChange,
                },
                {
                  id: 'showHiddenCheckbox',
                  label: 'Zobrazit skryté',
                  checked: showHidden,
                  onCheckboxChanged: handleShowHiddenChange,
                },
              ]}
            />
          </div>
        </div>
        <div className="row gx-3">
          <div className="col-lg-9 pb-2">
            <ArrivalsTable
              workers={filteredData || []}
              onUpdated={mutate}
              onWorkerArrived={handleWorkerArrived}
              onWorkerHidden={handleWorkerHidden}
              sortOrder={sortOrder}
              onSortChanged={setSortOrder}
            />
          </div>
          <div className="col-sm-12 col-lg-3">
            <div className="card smj-shadow rounded-3 mb-3">
              <div className="card-body">
                <h5 className="card-title">Statistiky</h5>
                <p className="mb-1">
                  Dorazilo: <strong>{stats.arrived}</strong> / {stats.total}
                </p>
                <div className="progress mb-2" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{
                      width:
                        stats.total > 0
                          ? `${(stats.arrived / stats.total) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
                {stats.hidden > 0 && (
                  <p className="mb-0 text-muted">Skryto: {stats.hidden}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function getFulltextData(workers?: ArrivalWorker[]) {
  const map = new Map<string, string>()
  workers?.forEach(worker => {
    map.set(
      worker.id,
      normalizeString(
        worker.firstName + worker.lastName + worker.phone + worker.email
      )
    )
  })
  return map
}

function filterWorkers(
  text: string,
  searchable: Map<string, string>,
  onlyNotArrived: boolean,
  showHidden: boolean,
  recentlyArrived: Set<string>,
  recentlyHidden: Set<string>,
  workers?: ArrivalWorker[]
) {
  if (!workers) return []
  return workers
    .filter(w => {
      if (!showHidden && !w.show) return recentlyHidden.has(w.id)
      return true
    })
    .filter(w => {
      if (onlyNotArrived && w.arrived) return recentlyArrived.has(w.id)
      return true
    })
    .filter(w => {
      if (text.length > 0) {
        return searchable.get(w.id)?.includes(text.toLowerCase()) ?? true
      }
      return true
    })
}
