/* eslint-disable @typescript-eslint/no-explicit-any */

import { ActiveJobUpdateData } from 'lib/types/active-job'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataPartialUpdate,
  useDataPartialUpdateDynamic,
} from './fetcher'
import type { ActiveJobAPIGetResponse } from 'pages/api/plans/[planId]/active-jobs/[jobId]'
import { ActiveJobsAPIPostData } from 'pages/api/plans/[planId]/active-jobs'
import { ActiveJobsAPIGetResponse } from 'pages/api/plans/active-jobs'

export function useAPIActiveJobs(options?: any) {
  return useData<ActiveJobsAPIGetResponse>('/api/plans/active-jobs', options)
}

export function useAPIActiveJobCreate(planId: string, options?: any) {
  return useDataCreate<ActiveJobsAPIPostData>(
    `/api/plans/${planId}/active-jobs`,
    options
  )
}

export function useAPIActiveJobCreateMultiple(planId: string, options?: any) {
  return useDataCreate<ActiveJobsAPIPostData>(
    `/api/plans/${planId}/active-jobs`,
    options
  )
}

export function useAPIActiveJobUpdate(
  id: string,
  planId: string,
  options?: any
) {
  return useDataPartialUpdate<ActiveJobUpdateData>(
    `/api/plans/${planId}/active-jobs/${id}`,
    options
  )
}

export function useAPIActiveJobUpdateDynamic(
  id: () => string | undefined,
  planId: string,
  options?: any
) {
  const url = () => {
    const jobId = id()
    if (!jobId) return undefined
    return `/api/plans/${planId}/active-jobs/${jobId}`
  }
  return useDataPartialUpdateDynamic<ActiveJobUpdateData>(url, options)
}

export function useAPIActiveJob(id: string, planId: string) {
  const result = useData<ActiveJobAPIGetResponse>(
    `/api/plans/${planId}/active-jobs/${id}`
  )
  if (result.data) {
    result.data.plan.day = new Date(result.data.plan.day)
  }
  return result
}

export function useAPIActiveJobDelete(
  id: string,
  planId: string,
  options?: any
) {
  return useDataDelete(`/api/plans/${planId}/active-jobs/${id}`, options)
}
