import type { ApplicationsPaginatedResponse } from 'pages/api/applications'
import type { ApplicationAPIGetResponse } from 'pages/api/applications/[id]'
import type {
  ApplicationCreateDataInput,
  ApplicationUpdateDataInput,
} from 'lib/types/application'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataPartialUpdate,
} from './fetcher'

function convertToFormData(
  data: ApplicationCreateDataInput | ApplicationUpdateDataInput
) {
  const formData = new FormData()

  Object.keys(data).forEach(key => {
    const typedKey = key as keyof (
      | ApplicationCreateDataInput
      | ApplicationUpdateDataInput
    )
    const value = data[typedKey]

    if (value !== undefined && key !== 'photoFile') {
      formData.append(key, String(value))
    }
  })

  if (data.photoFile instanceof File) {
    formData.append('photoFile', data.photoFile)
  }

  return formData
}

export function useAPIApplicationUpdate(
  applicationId: string,
  options?: Record<string, unknown>
) {
  return async (data: ApplicationUpdateDataInput) => {
    const formData = convertToFormData(data)

    /* eslint-disable-next-line react-hooks/rules-of-hooks */
    return useDataPartialUpdate<FormData>(
      `/api/applications/${applicationId}`,
      {
        ...options,
        method: 'PATCH',
        body: formData,
      }
    )
  }
}

export function useAPIApplications(options?: Record<string, unknown>) {
  return useData<ApplicationsPaginatedResponse>('/api/applications', options)
}

export function useAPIApplication(id: string) {
  return useData<ApplicationAPIGetResponse>(`/api/applications/${id}`)
}

export function useAPIApplicationDelete(
  id: string,
  options?: Record<string, unknown>
) {
  return useDataDelete(`/api/applications/${id}`, options)
}

export function useAPIApplicationCreate(options?: Record<string, unknown>) {
  return useDataCreate<ApplicationCreateDataInput>(
    '/api/applications/new',
    options
  )
}
