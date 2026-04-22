/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  JobTypesAPIGetResponse,
  JobTypesAPIPostData,
} from 'pages/api/job-types'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataDeleteDynamic,
  useDataPartialUpdate,
  useDataPost,
} from './fetcher'
import { JobTypeUpdateData } from 'lib/types/job-type'
import { ReorderData } from 'lib/types/reorder'

export function useAPIJobTypes(options?: any) {
  return useData<JobTypesAPIGetResponse>('/api/job-types', options)
}

export function useAPIJobTypeUpdate(jobTypeId: string, options?: any) {
  return useDataPartialUpdate<JobTypeUpdateData>(
    `/api/job-types/${jobTypeId}`,
    options
  )
}

export function useAPIJobTypeCreate(options?: any) {
  return useDataCreate<JobTypesAPIPostData>('/api/job-types', options)
}

export function useAPIJobTypeDelete(id: string, options?: any) {
  return useDataDelete(`/api/job-types/${id}`, options)
}

export function useAPIJobTypeDeleteDynamic(
  jobTypeId: () => string | undefined,
  options?: any
) {
  const url = () => {
    const id = jobTypeId()
    if (!id) return undefined
    return `/api/job-types/${id}`
  }
  return useDataDeleteDynamic(url, options)
}

export function useAPIJobTypeReorder(options?: any) {
  return useDataPost<ReorderData>('/api/job-types/reorder', options)
}
