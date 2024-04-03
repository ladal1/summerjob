/* eslint-disable @typescript-eslint/no-explicit-any */

import { SummerJobEventsAPIPostData } from 'pages/api/summerjob-events'
import { useDataCreate, useDataDelete, useDataPartialUpdate } from './fetcher'

export function useAPISummerJobEventCreate(options?: any) {
  return useDataCreate<SummerJobEventsAPIPostData>(
    `/api/summerjob-events`,
    options
  )
}

export function useAPISummerJobEventSetActive(id: string, options?: any) {
  return useDataPartialUpdate<{ isActive: boolean }>(
    `/api/summerjob-events/${id}`,
    options
  )
}

export function useAPISummerJobEventDelete(id: string, options?: any) {
  return useDataDelete(`/api/summerjob-events/${id}`, options)
}
