'use client'
import { useAPICars } from 'lib/fetcher/car'
import {
  formatNumberAfterThreeDigits,
  normalizeString,
} from 'lib/helpers/helpers'
import { CarComplete, deserializeCars } from 'lib/types/car'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Filters } from '../filters/Filters'
import PageHeader from '../page-header/PageHeader'
import { CarsTable } from './CarsTable'

interface CarsClientPageProps {
  initialData: Serialized
}

export default function CarsClientPage({ initialData }: CarsClientPageProps) {
  const initialCars = deserializeCars(initialData)
  const { data, error, isLoading, mutate } = useAPICars({
    fallbackData: initialCars,
  })

  // get query parameters
  const searchParams = useSearchParams()
  const searchQ = searchParams?.get('search')

  const [filter, setFilter] = useState(searchQ ?? '')

  // replace url with new query parameters
  const router = useRouter()
  useEffect(() => {
    router.replace(
      `?${new URLSearchParams({
        search: filter,
      })}`,
      {
        scroll: false,
      }
    )
  }, [filter, router])

  const filterCars = (cars: CarComplete[]) => {
    const filterString = normalizeString(filter).trimEnd()
    return cars.filter(car => {
      const name = normalizeString(car.name)
      const owner =
        normalizeString(car.owner.firstName) +
        normalizeString(car.owner.lastName)
      return name.includes(filterString) || owner.includes(filterString)
    })
  }

  const requestReload = (expectedResult: CarComplete[]) => {
    mutate(expectedResult)
  }

  const calculateKilomatrage = () => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + (current.odometerEnd - current.odometerStart)
    }, 0)

    return count ?? 0
  }
  const calculateReimbursed = () => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + +current.reimbursed
    }, 0)

    return count ?? 0
  }

  const calculateNumberOfSeats = () => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + current.seats
    }, 0)

    return count ?? 0
  }

  interface SeatList {
    [key: string]: {
      name: string
      amount: number
    }
  }

  const seatList: SeatList = (data || []).reduce(
    (accumulator: SeatList, car) => {
      accumulator[car.seats] = {
        name: '' + car.seats,
        amount: (accumulator['' + car.seats]?.amount || 0) + 1,
      }
      return accumulator
    },
    {}
  )

  return (
    <>
      <PageHeader title={'Seznam vozidel'}>
        <Link href="/cars/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-car"></i>
            <span>Nové auto</span>
          </button>
        </Link>
      </PageHeader>

      <section>
        <div className="container-fluid">
          <div className="row gx-3">
            <div className="col">
              <Filters search={filter} onSearchChanged={setFilter} />
            </div>
          </div>
          <div className="row gx-3">
            <div className="col-sm-12 col-lg-10">
              <CarsTable data={filterCars(data!)} reload={requestReload} />
            </div>
            <div className="col-sm-12 col-lg-2">
              <div className="vstack smj-search-stack smj-shadow rounded-3">
                <h5>Statistiky</h5>
                <hr />
                <ul className="list-group list-group-flush ">
                  <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                    <span className="me-2">Aut</span>
                    <span>{data?.length}</span>
                  </li>
                  <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                    <span className="me-2">Najeto kilometrů</span>
                    <span>
                      {formatNumberAfterThreeDigits(
                        '' + calculateKilomatrage()
                      )}
                    </span>
                  </li>
                  <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                    <span className="me-2">Proplacených</span>
                    <span>{calculateReimbursed()}</span>
                  </li>
                  <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                    <span className="me-2">Celkově míst</span>
                    <span>{calculateNumberOfSeats()}</span>
                  </li>
                  <li className="list-group-item ps-0 pe-0 smj-gray">
                    <span className="me-2">Počet míst</span>
                    <table className="table">
                      <tbody>
                        {Object.entries(seatList).map(([key, seat]) => (
                          <tr key={key} className="text-end">
                            <td>{seat.name}</td>
                            <td>
                              {seat.amount}
                              {'x'}
                            </td>
                          </tr>
                        ))}
                        {Object.entries(seatList).length === 0 && (
                          <tr key="none" className="text-end">
                            <td>žádné</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
