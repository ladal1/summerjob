'use client'
import { useAPICarDeleteDynamic } from 'lib/fetcher/car'
import { CarComplete } from 'lib/types/car'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import { SimpleRow } from '../table/SimpleRow'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import { sortData } from '../table/SortData'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Název', sortable: true },
  { id: 'owner', name: 'Majitel', sortable: true },
  { id: 'seats', name: 'Místa', sortable: true },
  { id: 'kilometrage', name: 'Najeto km', sortable: true },
  { id: 'reimbursed', name: 'Proplaceno', sortable: true },
  {
    id: 'actions',
    name: 'Akce',
    className: 'smj-sticky-col-right smj-table-header',
  },
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

  //#region Sort
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: undefined,
    direction: 'desc',
  })
  const onSortRequested = (direction: SortOrder) => {
    setSortOrder(direction)
  }

  const getSortable = useMemo(
    () => ({
      name: (car: CarComplete) => car.name,
      owner: (car: CarComplete) =>
        `${car.owner.firstName} ${car.owner.lastName}`,
      seats: (car: CarComplete) => car.seats,
      drivenKilometers: (car: CarComplete) =>
        car.odometerEnd - car.odometerStart,
      reimbursment: (car: CarComplete) => (car.reimbursed ? 'Ano' : 'Ne'),
    }),
    []
  )

  const sortedData = useMemo(() => {
    return data ? sortData(data, getSortable, sortOrder) : []
  }, [sortOrder, data])
  //#endregion

  return (
    <SortableTable
      columns={_columns}
      currentSort={sortOrder}
      onRequestedSort={onSortRequested}
    >
      {data !== undefined && data.length === 0 && (
        <MessageRow message="Žádná auta" colspan={_columns.length} />
      )}
      {data !== undefined &&
        sortedData.map(car => (
          <SimpleRow
            key={car.id}
            {...{
              data: formatCarRow(car, car.id === deletingCarId, deleteCar),
            }}
          />
        ))}
    </SortableTable>
  )
}

function formatCarRow(
  car: CarComplete,
  isBeingDeleted: boolean,
  deleteCar: (carId: string) => void
) {
  const drivenKm = car.odometerEnd - car.odometerStart
  return [
    { content: car.name },
    { content: `${car.owner.firstName} ${car.owner.lastName}` },
    { content: car.seats },
    { content: drivenKm },
    { content: car.reimbursed ? 'Ano' : 'Ne' },
    {
      content: (
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
        </span>
      ),
      stickyRight: true,
    },
  ]
}
