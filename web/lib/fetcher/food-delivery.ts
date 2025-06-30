/* eslint-disable @typescript-eslint/no-explicit-any */

import { useData, useDataCreate, useDataDelete } from './fetcher'
import type { 
  FoodDeliveryAPIGetResponse, 
  FoodDeliveryAPIPostData,
  FoodDeliveryAPIBulkPostData
} from 'pages/api/plans/[planId]/food-deliveries'
import type { CourierDeliveryDetailResponse } from 'pages/api/plans/[planId]/food-deliveries/[deliveryId]'

export function useFoodDeliveries(planId: string, options?: any) {
  return useData<FoodDeliveryAPIGetResponse>(`/api/plans/${planId}/food-deliveries`, options)
}

export function useFoodDeliveryDetail(planId: string, deliveryId: string, options?: any) {
  return useData<CourierDeliveryDetailResponse>(`/api/plans/${planId}/food-deliveries/${deliveryId}`, options)
}

export function useFoodDeliveryCreate(planId: string, options?: any) {
  return useDataCreate<FoodDeliveryAPIPostData>(`/api/plans/${planId}/food-deliveries`, options)
}

export function useFoodDeliveryBulkReplace(planId: string, options?: any) {
  return useDataCreate<FoodDeliveryAPIBulkPostData>(`/api/plans/${planId}/food-deliveries`, options)
}

export function useFoodDeliveryDelete(planId: string, deliveryId: string, options?: any) {
  return useDataDelete(`/api/plans/${planId}/food-deliveries/${deliveryId}`, options)
}
