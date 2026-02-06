'use client'
import { FoodAllergyComplete } from 'lib/types/food-allergy'
import { useEffect, useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import { SimpleRow } from '../table/SimpleRow'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import { sortData } from '../table/SortData'
import { useAPIFoodAllergyDeleteDynamic } from 'lib/fetcher/food-allergy'
import Link from 'next/link'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Název' },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
  },
]

interface FoodAllergyTableProps {
  data?: FoodAllergyComplete[]
  reload: (expectedResult: FoodAllergyComplete[]) => void
}

export function FoodAllergiesTable({ data, reload }: FoodAllergyTableProps) {
  const [deletingFoodAllergyId, setDeletingFoodAllergyId] = useState<
    string | undefined
  >(undefined)
  const { trigger, isMutating } = useAPIFoodAllergyDeleteDynamic(
    () => deletingFoodAllergyId
  )

  useEffect(() => {
    if (deletingFoodAllergyId) {
      trigger(null, {
        onSuccess: () => {
          setDeletingFoodAllergyId(undefined)
          reload(
            data?.filter(
              foodAllergy => foodAllergy.id !== deletingFoodAllergyId
            ) ?? []
          )
        },
        onError: () => {
          setDeletingFoodAllergyId(undefined)
        },
      })
    }
  }, [setDeletingFoodAllergyId, deletingFoodAllergyId, trigger, data, reload])

  const deleteFoodAllergy = (foodAllergyId: string) => {
    if (!isMutating) {
      setDeletingFoodAllergyId(foodAllergyId)
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

  // names have to be same as collumns ids
  const getSortable = useMemo(
    () => ({
      name: (foodAllergy: FoodAllergyComplete) => foodAllergy.name,
    }),
    []
  )

  const sortedData = useMemo(() => {
    return data ? sortData(data, getSortable, sortOrder) : []
  }, [data, getSortable, sortOrder])
  //#endregion

  return (
    <SortableTable
      columns={_columns}
      currentSort={sortOrder}
      onRequestedSort={onSortRequested}
    >
      {data !== undefined && data.length === 0 && (
        <MessageRow
          message="Žádné alergie na jídlo"
          colspan={_columns.length}
        />
      )}
      {data !== undefined &&
        sortedData.map(foodAllergy => (
          <SimpleRow
            key={foodAllergy.id}
            {...{
              data: formatFoodAllergyRow(
                foodAllergy,
                foodAllergy.id === deletingFoodAllergyId,
                deleteFoodAllergy
              ),
            }}
          />
        ))}
    </SortableTable>
  )
}

function formatFoodAllergyRow(
  foodAllergy: FoodAllergyComplete,
  isBeingDeleted: boolean,
  deleteFoodAllergy: (foodAllergyId: string) => void
) {
  return [
    { content: foodAllergy.name },
    {
      content: (
        <span key={foodAllergy.id} className="d-flex align-items-center gap-3">
          <Link
            key={foodAllergy.id}
            href={`/admin/lists/food-allergies/${foodAllergy.id}`}
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
                onClick={() => deleteFoodAllergy(foodAllergy.id)}
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
