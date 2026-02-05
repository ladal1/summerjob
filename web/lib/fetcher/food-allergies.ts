/* eslint-disable @typescript-eslint/no-explicit-any */

import { FoodAllergiesAPIGetResponse } from 'pages/api/food-allergies'
import { useData } from './fetcher'

export function useAPIFoodAllergies(options?: any) {
  return useData<FoodAllergiesAPIGetResponse>('/api/food-allergies', options)
}
