/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo } from 'react'
import { useData } from './fetcher'
import { LogsAPIGetResponse } from 'pages/api/logs'
import { deserializeLogsTime } from 'lib/types/logger'

export function useAPILogs(
  search: string,
  eventType: string,
  offset: number,
  limit: number,
  options?: any
) {
  const res = useData<LogsAPIGetResponse>(
    `/api/logs?search=${search}&eventType=${eventType}&offset=${offset}&limit=${limit}`,
    options
  )
  return useMemo(() => {
    return {
      isLoading: res.isLoading,
      error: res.error,
      mutate: res.mutate,
      data: res.data ? deserializeLogsTime(res.data) : res.data,
    }
  }, [res.mutate, res.data, res.isLoading, res.error])
}
