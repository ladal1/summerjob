/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  TShirtSizesAPIGetResponse,
  TShirtSizesAPIPostData,
} from 'pages/api/t-shirt-sizes'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataDeleteDynamic,
  useDataPartialUpdate,
  useDataPost,
} from './fetcher'
import {
  TShirtSizeReorderData,
  TShirtSizeUpdateData,
} from 'lib/types/t-shirt-size'

export function useAPITShirtSizes(options?: any) {
  return useData<TShirtSizesAPIGetResponse>('/api/t-shirt-sizes', options)
}

export function useAPITShirtSizeUpdate(id: string, options?: any) {
  return useDataPartialUpdate<TShirtSizeUpdateData>(
    `/api/t-shirt-sizes/${id}`,
    options
  )
}

export function useAPITShirtSizeCreate(options?: any) {
  return useDataCreate<TShirtSizesAPIPostData>('/api/t-shirt-sizes', options)
}

export function useAPITShirtSizeDelete(id: string, options?: any) {
  return useDataDelete(`/api/t-shirt-sizes/${id}`, options)
}

export function useAPITShirtSizeDeleteDynamic(
  getId: () => string | undefined,
  options?: any
) {
  const url = () => {
    const id = getId()
    if (!id) return undefined
    return `/api/t-shirt-sizes/${id}`
  }
  return useDataDeleteDynamic(url, options)
}

export function useAPITShirtSizeReorder(options?: any) {
  return useDataPost<TShirtSizeReorderData>(
    '/api/t-shirt-sizes/reorder',
    options
  )
}
