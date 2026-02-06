 

import {
  FoodAllergiesAPIGetResponse,
  FoodAllergiesAPIPostData,
} from 'pages/api/food-allergies'
import {
  useData,
  useDataCreate,
  useDataDeleteDynamic,
  useDataPartialUpdate,
} from './fetcher'
import { FoodAllergyUpdateData } from 'lib/types/food-allergy'

export function useAPIFoodAllergies(options?: any) {
  return useData<FoodAllergiesAPIGetResponse>('/api/food-allergies', options)
}

export function useAPIFoodAllergyUpdate(foodAllergyId: string, options?: any) {
  return useDataPartialUpdate<FoodAllergyUpdateData>(
    `/api/food-allergies/${foodAllergyId}`,
    options
  )
}

export function useAPIFoodAllergyCreate(options?: any) {
  return useDataCreate<FoodAllergiesAPIPostData>('/api/food-allergies', options)
}

export function useAPIFoodAllergyDeleteDynamic(
  foodAllergyId: () => string | undefined,
  options?: any
) {
  const url = () => {
    const id = foodAllergyId()
    if (!id) return undefined
    return `/api/food-allergies/${id}`
  }
  return useDataDeleteDynamic(url, options)
}
