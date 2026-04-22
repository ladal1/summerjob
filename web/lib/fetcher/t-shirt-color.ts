/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  TShirtColorsAPIGetResponse,
  TShirtColorsAPIPostData,
} from 'pages/api/t-shirt-colors'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataDeleteDynamic,
  useDataPartialUpdate,
  useDataPost,
} from './fetcher'
import {
  TShirtColorReorderData,
  TShirtColorUpdateData,
} from 'lib/types/t-shirt-color'

export function useAPITShirtColors(options?: any) {
  return useData<TShirtColorsAPIGetResponse>('/api/t-shirt-colors', options)
}

export function useAPITShirtColorUpdate(id: string, options?: any) {
  return useDataPartialUpdate<TShirtColorUpdateData>(
    `/api/t-shirt-colors/${id}`,
    options
  )
}

export function useAPITShirtColorCreate(options?: any) {
  return useDataCreate<TShirtColorsAPIPostData>('/api/t-shirt-colors', options)
}

export function useAPITShirtColorDelete(id: string, options?: any) {
  return useDataDelete(`/api/t-shirt-colors/${id}`, options)
}

export function useAPITShirtColorDeleteDynamic(
  getId: () => string | undefined,
  options?: any
) {
  const url = () => {
    const id = getId()
    if (!id) return undefined
    return `/api/t-shirt-colors/${id}`
  }
  return useDataDeleteDynamic(url, options)
}

export function useAPITShirtColorReorder(options?: any) {
  return useDataPost<TShirtColorReorderData>(
    '/api/t-shirt-colors/reorder',
    options
  )
}
