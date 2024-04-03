/* eslint-disable @typescript-eslint/no-explicit-any */

import { deserializeWorkerAvailability } from 'lib/types/worker'
import type { PlansAPIGetResponse, PlansAPIPostData } from 'pages/api/plans'
import type { PlanAPIGetResponse } from 'pages/api/plans/[planId]'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataPartialUpdate,
} from './fetcher'

export function useAPIPlans(options?: any) {
  const properties = useData<PlansAPIGetResponse>('/api/plans', options)
  if (properties.data) {
    for (const plan of properties.data) {
      plan.day = new Date(plan.day)
    }
  }
  return properties
}

export function useAPIPlan(id: string, options?: any) {
  const opts = Object.assign({ refreshInterval: 1000 }, options)
  const properties = useData<PlanAPIGetResponse>(`/api/plans/${id}`, opts)
  if (properties.data) {
    properties.data.day = new Date(properties.data.day)
    for (let i = 0; i < properties.data.jobs.length; i++) {
      properties.data.jobs[i].workers = properties.data.jobs[i].workers.map(
        deserializeWorkerAvailability
      )
    }
  }
  return properties
}
export function useAPIPlanPublish(id: string, options?: any) {
  return useDataPartialUpdate(`/api/plans/${id}`, options)
}

export function useAPIPlanMoveWorker(id: string, options?: any) {
  return useDataPartialUpdate(`/api/plans/${id}`, options)
}

export function useAPIPlansCreate(options?: any) {
  return useDataCreate<PlansAPIPostData>(`/api/plans`, options)
}

export function useAPIPlanDelete(id: string, options?: any) {
  return useDataDelete(`/api/plans/${id}`, options)
}

export function useAPIPlanGenerate(options?: any) {
  return useDataCreate(`/api/planner`, options)
}
