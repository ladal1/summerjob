import {
  deserializeProposedJobAvailability,
  ProposedJobCreateData,
} from 'lib/types/proposed-job'
import type { ProposedJobsAPIGetResponse } from 'pages/api/proposed-jobs'
import { ProposedJobAPIPatchData } from 'pages/api/proposed-jobs/[id]'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataPartialUpdate,
  useDataPartialUpdateDynamic,
} from './fetcher'

export function useAPIProposedJobs(options?: any) {
  const res = useData<ProposedJobsAPIGetResponse>('/api/proposed-jobs', options)
  if (res.data) {
    return { ...res, data: res.data.map(deserializeProposedJobAvailability) }
  }
  return res
}

export function useAPIProposedJobsNotInPlan(planId: string) {
  return useData<ProposedJobsAPIGetResponse>(
    `/api/proposed-jobs?assignableToPlan=${planId}`
  )
}

export function useAPIProposedJobCreate(options?: any) {
  return useDataCreate<ProposedJobCreateData>('/api/proposed-jobs', options)
}

export function useAPIProposedJobUpdate(id: string, options?: any) {
  return useDataPartialUpdate<ProposedJobAPIPatchData>(
    `/api/proposed-jobs/${id}`,
    options
  )
}

export function useAPIProposedJobUpdateDynamic(
  jobId: () => string | undefined,
  options?: any
) {
  const url = () => {
    const id = jobId()
    if (!id) return undefined
    return `/api/proposed-jobs/${id}`
  }
  return useDataPartialUpdateDynamic<ProposedJobAPIPatchData>(url, options)
}

export function useAPIProposedJobDelete(id: string, options?: any) {
  return useDataDelete(`/api/proposed-jobs/${id}`, options)
}
