/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ArrivalsAPIGetResponse } from 'pages/api/arrivals'
import { useData, useDataCreate, useDataDelete } from './fetcher'

export function useAPIArrivals(options?: any) {
  return useData<ArrivalsAPIGetResponse>('/api/arrivals', options)
}

export function useAPIMarkArrived(workerId: string, options?: any) {
  return useDataCreate<Record<string, never>>(
    `/api/arrivals/${workerId}/arrive`,
    options
  )
}

export function useAPIMarkNoShow(workerId: string, options?: any) {
  return useDataCreate<Record<string, never>>(
    `/api/arrivals/${workerId}/no-show`,
    options
  )
}

export function useAPIUnmarkNoShow(workerId: string, options?: any) {
  return useDataDelete(`/api/arrivals/${workerId}/no-show`, options)
}
