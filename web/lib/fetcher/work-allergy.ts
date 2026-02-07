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
} from './fetcher'
import { WorkAllergyUpdateData } from 'lib/types/work-allergy'

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
