'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIWorkers } from 'lib/fetcher/worker'
import { normalizeString } from 'lib/helpers/helpers'
import { Serialized } from 'lib/types/serialize'
import { deserializeWorkers, WorkerComplete } from 'lib/types/worker'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Filters } from '../filters/Filters'
import { PhotoViewer } from '../photo/PhotoViewer'
import { WorkersStatistics } from './WorkersStatistics'
import WorkersTable from './WorkersTable'

interface WorkersClientPageProps {
  sWorkers: Serialized
}

export default function WorkersClientPage({
  sWorkers,
}: WorkersClientPageProps) {
  const inititalWorkers = deserializeWorkers(sWorkers)
  const { data, error, mutate } = useAPIWorkers({
    fallbackData: inititalWorkers,
  })

  // get query parameters
  const searchParams = useSearchParams()
  const onlyStrongQ = searchParams?.get('area')
  const onlyWithCarQ = searchParams?.get('day')
  const searchQ = searchParams?.get('search')

  const getBoolean = (value: string) => {
    switch (value) {
      case 'true':
      case '1':
      case 'ano':
      case 'yes':
        return true
      default:
        return false
    }
  }

  const [filter, setFilter] = useState(searchQ ?? '')
  const [onlyStrong, setOnlyStrong] = useState(
    onlyStrongQ ? getBoolean(onlyStrongQ) : false
  )
  const [onlyWithCar, setOnlyWithCar] = useState(
    onlyWithCarQ ? getBoolean(onlyWithCarQ) : false
  )

  // replace url with new query parameters
  const router = useRouter()
  useEffect(() => {
    router.replace(
      `?${new URLSearchParams({
        onlyStrong: `${onlyStrong}`,
        onlyWithCar: `${onlyWithCar}`,
        search: filter,
      })}`,
      {
        scroll: false,
      }
    )
  }, [onlyStrong, onlyWithCar, filter, router])

  const fulltextData = useMemo(() => getFulltextData(data), [data])
  const filteredData = useMemo(
    () =>
      filterWorkers(
        normalizeString(filter).trimEnd(),
        fulltextData,
        onlyStrong,
        onlyWithCar,
        data
      ),
    [fulltextData, filter, onlyStrong, onlyWithCar, data]
  )
  const [workerPhotoURL, setWorkerPhotoURL] = useState<string | null>(null)

  if (error && !data) {
    return <ErrorPage error={error} />
  }
  return (
    <>
      <PageHeader title="Pracanti">
        <Link href={`/workers/import`}>
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-users"></i>
            <span>Hromadný import</span>
          </button>
        </Link>
        <Link href={`/workers/new`}>
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-user-plus"></i>
            <span>Přidat pracanta</span>
          </button>
        </Link>
        <Link
          href="/api/workers/export-contacts"
          className="btn btn-secondary btn-with-icon"
        >
          <i className="fas fa-address-book"></i>
          <span>Export kontaktů</span>
        </Link>
        <Link href={`/print-workers`} prefetch={false}>
          <button className="btn btn-secondary btn-with-icon" type="button">
            <i className="fas fa-print"></i>
            <span>Tisknout</span>
          </button>
        </Link>
      </PageHeader>

      <section>
        <div className="container-fluid">
          <div className="row gx-3">
            <div className="col">
              <Filters
                search={filter}
                onSearchChanged={setFilter}
                checkboxes={[
                  {
                    id: 'onlyStrongCheckbox',
                    label: 'Pouze silní',
                    checked: onlyStrong,
                    onCheckboxChanged: setOnlyStrong,
                  },
                  {
                    id: 'onlyWithCarCheckbox',
                    label: 'Pouze s autem',
                    checked: onlyWithCar,
                    onCheckboxChanged: setOnlyWithCar,
                  },
                ]}
              />
            </div>
          </div>
          <div className="row gx-3">
            <div className="col-lg-10 pb-2">
              <WorkersTable
                workers={filteredData || []}
                onUpdated={mutate}
                onHover={setWorkerPhotoURL}
              />
            </div>
            <div className="col-sm-12 col-lg-2">
              <WorkersStatistics data={filteredData ?? []} />
              <PhotoViewer photoURL={workerPhotoURL} alt="Pracant" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function getFulltextData(workers?: WorkerComplete[]) {
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
  onlyStrong: boolean,
  onlyWithCar: boolean,
  workers?: WorkerComplete[]
) {
  if (!workers) return []
  return workers
    .filter(w => {
      if (text.length > 0) {
        return searchable.get(w.id)?.includes(text.toLowerCase()) ?? true
      }
      return true
    })
    .filter(w => {
      if (onlyStrong) {
        return w.isStrong
      }
      return true
    })
    .filter(w => {
      if (onlyWithCar) {
        return w.cars.length > 0
      }
      return true
    })
}
