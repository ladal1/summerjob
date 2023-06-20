'use client'
import { useAPICarDeleteDynamic } from 'lib/fetcher/car'
import { CarComplete } from 'lib/types/car'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import { SimpleRow } from '../table/SimpleRow'

const _columns = [
  'Název',
  'Majitel',
  'Místa',
  'Najeto km',
  'Proplaceno',
  'Akce',
]

interface CarTableProps {
  data?: CarComplete[]
  reload: (expectedResult: CarComplete[]) => void
}

export function CarsTable({ data, reload }: CarTableProps) {
  const [deletingCarId, setDeletingCarId] = useState<string | undefined>(
    undefined
  )
  const { trigger, isMutating } = useAPICarDeleteDynamic(() => deletingCarId)

  useEffect(() => {
    if (deletingCarId) {
      trigger(null, {
        onSuccess: () => {
          setDeletingCarId(undefined)
          reload(data?.filter(car => car.id !== deletingCarId) ?? [])
        },
        onError: () => {
          setDeletingCarId(undefined)
        },
      })
    }
  }, [setDeletingCarId, deletingCarId, trigger, data, reload])

  const deleteCar = (carId: string) => {
    if (!isMutating) {
      setDeletingCarId(carId)
    }
  }

  return (
    <div className="table-responsive text-nowrap mb-2 smj-shadow rounded-3">
      <table className="table table-hover mb-0">
        <thead className="smj-table-header">
          <tr>
            {_columns.map(column => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="smj-table-body mb-0">
          {data !== undefined && data.length === 0 && (
            <MessageRow message="Žádná auta" colspan={_columns.length} />
          )}
          {data !== undefined &&
            data.map(car => (
              <SimpleRow
                key={car.id}
                {...{
                  data: formatCarRow(car, car.id === deletingCarId, deleteCar),
                }}
              />
            ))}
        </tbody>
      </table>
    </div>
  )
}

function formatCarRow(
  car: CarComplete,
  isBeingDeleted: boolean,
  deleteCar: (carId: string) => void
) {
  const drivenKm = car.odometerEnd - car.odometerStart
  return [
    car.name,
    `${car.owner.firstName} ${car.owner.lastName}`,
    car.seats,
    drivenKm,
    car.reimbursed ? 'Ano' : 'Ne',
    <span key={car.id} className="d-flex align-items-center gap-3">
      <Link
        key={car.id}
        href={`/cars/${car.id}`}
        onClick={e => e.stopPropagation()}
        className="smj-action-edit"
      >
        <i className="fas fa-edit" title="Upravit"></i>
      </Link>
      {!isBeingDeleted && (
        <>
          <i
            className="fas fa-trash-alt smj-action-delete cursor-pointer"
            title="Smazat"
            onClick={() => deleteCar(car.id)}
          ></i>
          <span style={{ width: '0px' }}></span>
        </>
      )}

      {isBeingDeleted && (
        <i
          className="fas fa-spinner smj-action-delete spinning"
          title="Odstraňování..."
        ></i>
      )}
    </span>,
  ]
}
