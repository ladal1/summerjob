'use client'
import { Serialized } from 'lib/types/serialize'
import {
  deserializeFoodAllergies,
  FoodAllergyComplete,
} from 'lib/types/food-allergy'
import { useAPIFoodAllergies } from 'lib/fetcher/food-allergy'
import { FoodAllergiesTable } from './FoodAllergiesTable'

interface FoodAllergiesClientPageProps {
  initialData: Serialized
}

export default function FoodAllergiesClientPage({
  initialData,
}: FoodAllergiesClientPageProps) {
  const initialFoodAllergies = deserializeFoodAllergies(initialData)
  const { data, mutate } = useAPIFoodAllergies({
    fallbackData: initialFoodAllergies,
  })

  const requestReload = (expectedResult: FoodAllergyComplete[]) => {
    mutate(expectedResult)
  }

  return (
    <>
      <section>
        <div className="container-fluid">
          <h3>Alergie na jídlo</h3>
          <div className="row gx-3"></div>
          <div className="row gx-3">
            <div className="col-lg-10 pb-2">
              <FoodAllergiesTable data={data} reload={requestReload} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
