/* eslint-disable @typescript-eslint/no-explicit-any */

import type { CarUpdateData } from 'lib/types/car'
import type { CarsAPIGetResponse, CarsAPIPostData } from 'pages/api/cars'
import {
  useData,
  useDataCreate,
  useDataDeleteDynamic,
  useDataPartialUpdate,
} from './fetcher'

export function useAPICars(options?: any) {
  return useData<CarsAPIGetResponse>('/api/cars', options)
}

export function useAPICarUpdate(carId: string, options?: any) {
  return useDataPartialUpdate<CarUpdateData>(`/api/cars/${carId}`, options)
}

export function useAPICarCreate(options?: any) {
  return useDataCreate<CarsAPIPostData>('/api/cars', options)
}

export function useAPICarDeleteDynamic(
  carId: () => string | undefined,
  options?: any
) {
  const url = () => {
    const id = carId()
    if (!id) return undefined
    return `/api/cars/${id}`
  }
  return useDataDeleteDynamic(url, options)
}
