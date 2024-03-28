/* eslint-disable @typescript-eslint/no-explicit-any */

import { Area } from 'lib/prisma/client'
import { AreasAPIPostData } from 'pages/api/summerjob-events/[eventId]/areas'
import { useDataCreate, useDataDelete, useDataPartialUpdate } from './fetcher'

export function useAPIAreaDelete(area: Area, options?: any) {
  return useDataDelete(
    `/api/summerjob-events/${area.summerJobEventId}/areas/${area.id}`,
    options
  )
}

export function useAPIAreaCreate(summerJobEventId: string, options?: any) {
  return useDataCreate<AreasAPIPostData>(
    `/api/summerjob-events/${summerJobEventId}/areas`,
    options
  )
}

export function useAPIAreaUpdate(area: Area, options?: any) {
  return useDataPartialUpdate(
    `/api/summerjob-events/${area.summerJobEventId}/areas/${area.id}`,
    options
  )
}
