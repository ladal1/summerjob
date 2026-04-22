/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  WorkAllergiesAPIGetResponse,
  WorkAllergiesAPIPostData,
} from 'pages/api/work-allergies'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataDeleteDynamic,
  useDataPartialUpdate,
  useDataPost,
} from './fetcher'
import { WorkAllergyUpdateData } from 'lib/types/work-allergy'
import { ReorderData } from 'lib/types/reorder'

export function useAPIWorkAllergies(options?: any) {
  return useData<WorkAllergiesAPIGetResponse>('/api/work-allergies', options)
}

export function useAPIWorkAllergyUpdate(workAllergyId: string, options?: any) {
  return useDataPartialUpdate<WorkAllergyUpdateData>(
    `/api/work-allergies/${workAllergyId}`,
    options
  )
}

export function useAPIWorkAllergyCreate(options?: any) {
  return useDataCreate<WorkAllergiesAPIPostData>('/api/work-allergies', options)
}

export function useAPIWorkAllergyDelete(id: string, options?: any) {
  return useDataDelete(`/api/work-allergies/${id}`, options)
}

export function useAPIWorkAllergyDeleteDynamic(
  workAllergyId: () => string | undefined,
  options?: any
) {
  const url = () => {
    const id = workAllergyId()
    if (!id) return undefined
    return `/api/work-allergies/${id}`
  }
  return useDataDeleteDynamic(url, options)
}

export function useAPIWorkAllergyReorder(options?: any) {
  return useDataPost<ReorderData>('/api/work-allergies/reorder', options)
}
