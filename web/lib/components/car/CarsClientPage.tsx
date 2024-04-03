'use client'
import { useAPICars } from 'lib/fetcher/car'
import { normalizeString } from 'lib/helpers/helpers'
import { CarComplete, deserializeCars } from 'lib/types/car'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Filters } from '../filters/Filters'
import PageHeader from '../page-header/PageHeader'
import { CarsStatistics } from './CarsStatistics'
import { CarsTable } from './CarsTable'

interface CarsClientPageProps {
  initialData: Serialized
}

export default function CarsClientPage({ initialData }: CarsClientPageProps) {
  const initialCars = deserializeCars(initialData)
  const { data, mutate } = useAPICars({
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

  const filteredCars = useMemo(() => {
    return filterCars(filter, data)
  }, [data, filter])

  const requestReload = (expectedResult: CarComplete[]) => {
    mutate(expectedResult)
  }

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
            <div className="col-lg-10 pb-2">
              <CarsTable data={filteredCars} reload={requestReload} />
            </div>
            <div className="col-sm-12 col-lg-2">
              <CarsStatistics data={filteredCars} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function filterCars(search: string, cars?: CarComplete[]) {
  if (!cars) return []
  const filterString = normalizeString(search).trimEnd()
  return cars.filter(car => {
    const name = normalizeString(car.name)
    const owner =
      normalizeString(car.owner.firstName) + normalizeString(car.owner.lastName)
    return name.includes(filterString) || owner.includes(filterString)
  })
}
