'use client'
import { useAPICars } from 'lib/fetcher/car'
import { normalizeString } from 'lib/helpers/helpers'
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
            <div className="col-sm-12 col-lg-12">
              <CarsTable data={filterCars(data!)} reload={requestReload} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
