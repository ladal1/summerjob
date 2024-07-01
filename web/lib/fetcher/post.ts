/* eslint-disable @typescript-eslint/no-explicit-any */

import { PostsAPIGetResponse } from 'pages/api/posts'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataPartialUpdate,
  useDataUpdate,
} from './fetcher'
import { PostCreateData, PostUpdateDataInput } from 'lib/types/post'

export function useAPIPostUpdate(postId: string, options?: any) {
  return useDataPartialUpdate<PostUpdateDataInput>(
    `/api/posts/${postId}`,
    options
  )
}

export function useApiPostParticipateChange(postId: string, options?: any) {
  return useDataUpdate<PostUpdateDataInput>(`/api/posts/${postId}`, options)
}

export function useAPIPosts(options?: any) {
  return useData<PostsAPIGetResponse>('/api/posts', options)
}

export function useAPIPostDelete(id: string, options?: any) {
  return useDataDelete(`/api/posts/${id}`, options)
}

export function useAPIPostCreate(options?: any) {
  return useDataCreate<PostCreateData>('/api/posts', options)
}
