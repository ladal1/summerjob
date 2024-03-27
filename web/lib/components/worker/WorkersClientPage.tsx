'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIWorkers } from 'lib/fetcher/worker'
import { normalizeString } from 'lib/helpers/helpers'
import { Serialized } from 'lib/types/serialize'
import { deserializeWorkers, WorkerComplete } from 'lib/types/worker'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Filters } from '../filters/Filters'
import WorkersTable from './WorkersTable'
import { Skill } from 'lib/prisma/client'
import { skillMapping } from 'lib/data/enumMapping/skillMapping'

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

  const calculateWithCar = () => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + (current.cars.length > 0 ? 1 : 0)
    }, 0)

    return count ?? 0
  }

  const calculateIsStrong = () => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + +current.isStrong
    }, 0)

    return count ?? 0
  }

  interface SkillsList {
    [key: string]: {
      name: string
      amount: number
    }
  }

  const skillsList: SkillsList = (data || []).reduce(
    (accumulator: SkillsList, worker) => {
      const sortedSkills = worker.skills.sort((a, b) =>
        skillMapping[a].localeCompare(skillMapping[b])
      )
      console.log(sortedSkills)
      sortedSkills.forEach(skill => {
        accumulator[skill] = {
          name: skill,
          amount: (accumulator[skill]?.amount || 0) + 1,
        }
      })
      console.log(accumulator)
      return accumulator
    },
    {}
  )
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
                    <span className="me-2">Pracantů</span>
                    <span>{data?.length}</span>
                  </li>
                  <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                    <span className="me-2">S autem</span>
                    <span>{calculateWithCar()}</span>
                  </li>
                  <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                    <span className="me-2">Silných</span>
                    <span>{calculateIsStrong()}</span>
                  </li>
                  <li className="list-group-item ps-0 pe-0 smj-gray">
                    <span className="me-2">Dovednosti</span>
                    <table className="table">
                      <tbody>
                        {Object.entries(skillsList).map(([key, skill]) => (
                          <tr key={key} className="text-end">
                            <td>{skillMapping[skill.name as Skill]}</td>
                            <td>{skill.amount}</td>
                          </tr>
                        ))}
                        {Object.entries(skillsList).length === 0 && (
                          <tr key="none" className="text-end">
                            <td>žádné</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </li>
                </ul>
              </div>
              <div
                className="smj-search-stack smj-shadow rounded-3"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  padding: '10px',
                  top: '20px',
                  position: 'sticky',
                }}
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
