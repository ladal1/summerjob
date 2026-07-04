/* eslint-disable @typescript-eslint/no-explicit-any */

import { useDataPartialUpdate } from './fetcher'

export function useAPINotificationUpdate(
  notificationId: string,
  options?: any
) {
  return useDataPartialUpdate(`/api/notification/${notificationId}`, options)
}
