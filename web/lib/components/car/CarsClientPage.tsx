'use client'
import { useAPICars } from 'lib/fetcher/car'
import { CarComplete, deserializeCars } from 'lib/types/car'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import { useState } from 'react'
import PageHeader from '../page-header/PageHeader'
import { CarsTable } from './CarsTable'
import { Filters } from '../filters/Filters'

interface CarsClientPageProps {
  initialData: Serialized
}

export default function CarsClientPage({ initialData }: CarsClientPageProps) {
  const initialCars = deserializeCars(initialData)
  const { data, error, isLoading, mutate } = useAPICars({
    fallbackData: initialCars,
  })
  const [filter, setFilter] = useState('')

  const filterCars = (cars: CarComplete[]) => {
    const filterString = filter.toLocaleLowerCase()
    return cars.filter(car => {
      const name = car.name.toLowerCase()
      const owner =
        car.owner.firstName.toLowerCase() + car.owner.lastName.toLowerCase()
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
              <Filters 
                search={filter} 
                onSearchChanged={setFilter} 
              />
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
