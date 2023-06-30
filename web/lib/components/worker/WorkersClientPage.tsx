'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIWorkers } from 'lib/fetcher/worker'
import { Serialized } from 'lib/types/serialize'
import { deserializeWorkers, WorkerComplete } from 'lib/types/worker'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { WorkersFilters } from './WorkersFilters'
import WorkersTable from './WorkersTable'
import Image from 'next/image'

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

  const [filter, setFilter] = useState('')
  const [onlyStrong, setOnlyStrong] = useState(false)
  const [onlyWithCar, setOnlyWithCar] = useState(false)

  const fulltextData = useMemo(() => getFulltextData(data), [data])
  const filteredData = useMemo(
    () => filterWorkers(filter, fulltextData, onlyStrong, onlyWithCar, data),
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
              <WorkersFilters
                search={filter}
                onSearchChanged={setFilter}
                onlyStrong={onlyStrong}
                onOnlyStrongChanged={setOnlyStrong}
                onlyWithCar={onlyWithCar}
                onOnlyWithCarChanged={setOnlyWithCar}
              />
            </div>
          </div>
          <div className="row gx-3">
            <div className="col-sm-12 col-lg-10">
              <WorkersTable
                workers={filteredData || []}
                onUpdated={mutate}
                onHover={setWorkerPhotoURL}
              />
            </div>
            <div className="col-sm-12 col-lg-2">
              <div className="vstack smj-search-stack smj-shadow rounded-3">
                <h5>Statistiky</h5>
                <hr />
                <ul className="list-group list-group-flush ">
                  <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                    Pracantů
                    <span>{data?.length}</span>
                  </li>
                </ul>
              </div>
              <div
                className="smj-search-stack smj-shadow rounded-3"
                style={{ width: '100%', maxWidth: '100%', padding: '10px' }}
              >
                <h5 style={{ paddingLeft: '12px', paddingTop: '12px' }}>
                  Foto
                </h5>
                <hr />
                {workerPhotoURL ? (
                  <Image
                    src={workerPhotoURL}
                    alt="Pracant"
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                    }}
                    width={500}
                    height={500}
                  />
                ) : (
                  <svg
                    viewBox="0 0 64 64"
                    xmlns="http://www.w3.org/2000/svg"
                    strokeWidth="3"
                    stroke="#000000"
                    fill="none"
                  >
                    <circle cx="32" cy="18.14" r="11.14" />
                    <path d="M54.55,56.85A22.55,22.55,0,0,0,32,34.3h0A22.55,22.55,0,0,0,9.45,56.85Z" />
                  </svg>
                )}
              </div>
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
      (
        worker.firstName +
        worker.lastName +
        worker.phone +
        worker.email
      ).toLocaleLowerCase()
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
