/* eslint-disable @typescript-eslint/no-explicit-any */

import { UserComplete } from 'lib/types/user'
import { UserAPIPatchData } from 'pages/api/users/[id]'
import { useData, useDataPartialUpdate } from './fetcher'

export function useAPIUsers(options?: any) {
  return useData<UserComplete[]>('/api/users', options)
}

export function useAPIUserUpdate(id: string, options?: any) {
  return useDataPartialUpdate<UserAPIPatchData>(`/api/users/${id}`, options)
}
