/* eslint-disable @typescript-eslint/no-explicit-any */

import { ActiveJobNoPlan } from 'lib/types/active-job'
import { RideComplete } from 'lib/types/ride'
import { RidesAPIPostData } from 'pages/api/plans/[planId]/active-jobs/[jobId]/rides'
import {
  useDataCreate,
  useDataDelete,
  useDataPartialUpdateDynamic,
} from './fetcher'

export function useAPIRideCreate(job: ActiveJobNoPlan, options?: any) {
  return useDataCreate<RidesAPIPostData>(
    `/api/plans/${job.planId}/active-jobs/${job.id}/rides`,
    options
  )
}

export function useAPIRideUpdateDynamic(
  getRide: () => RideComplete | undefined,
  options?: any
) {
  const url = () => {
    const ride = getRide()
    if (!ride) return undefined
    return `/api/plans/${ride.job.planId}/active-jobs/${ride.jobId}/rides/${ride.id}`
  }
  return useDataPartialUpdateDynamic(url, options)
}

export function useAPIRideDelete(ride: RideComplete, options?: any) {
  return useDataDelete(
    `/api/plans/${ride.job.planId}/active-jobs/${ride.jobId}/rides/${ride.id}`,
    options
  )
}
