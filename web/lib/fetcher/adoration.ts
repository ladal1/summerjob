import type { FrontendAdorationSlot } from 'lib/types/adoration'
import {
  useData,
  useDataCreate,
} from './fetcher'

import { toZonedTime } from 'date-fns-tz'

export async function apiAdorationSignup(slotId: string) {
  const res = await fetch(`/api/adoration/${slotId}/signup`, {
    method: 'PATCH',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Chyba při přihlašování.')
  }

  return await res.json()
}


export async function apiAdorationDeleteBulk(slotIds: string[]) {
  const res = await fetch('/api/adoration/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotIds }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Chyba při mazání slotů.')
  }

  return await res.json()
}

export function useAPIAdorationCreateBulk(
  options?: Record<string, unknown>
) {
  return useDataCreate('/api/adoration/new', options)
}

export async function apiAdorationUpdateLocationBulk(
  slotIds: string[],
  location: string,
  options?: RequestInit
) {
  const res = await fetch('/api/adoration/location', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slotIds, location }),
    ...options,
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Chyba při změně lokace.')
  }

  return await res.json()
}

export function useAPIAdorationSlotsAdmin(date: string, eventId: string): {
  data: FrontendAdorationSlot[]
  isLoading: boolean
  error?: unknown
  mutate: () => void
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = useData<any[]>(`/api/adoration/admin?date=${date}&eventId=${eventId}`)

  if (Array.isArray(res.data)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformed: FrontendAdorationSlot[] = res.data.map((slot: any) => {
      const zonedDate = toZonedTime(slot.dateStart, 'Europe/Prague')
      return {
        id: slot.id,
        localDateStart: zonedDate,
        location: slot.location,
        capacity: slot.capacity,
        length: slot.length,
        workerCount: slot.workers.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        workers: slot.workers.map((w: any) => ({
          firstName: w.firstName,
          lastName: w.lastName,
        })),
      }
    })

    return { ...res, data: transformed }
  }

  return { ...res, data: [] }
}

  export function useAPIAdorationSlotsUser(date: string, eventId: string): {
    data: FrontendAdorationSlot[]
    isLoading: boolean
    error?: unknown
    mutate: () => void
  } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = useData<any[]>(`/api/adoration?date=${date}&eventId=${eventId}`)
  
    if (Array.isArray(res.data)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformed: FrontendAdorationSlot[] = res.data.map((slot: any) => {
        const zonedDate = toZonedTime(slot.dateStart, 'Europe/Prague')
        return {
          id: slot.id,
          localDateStart: zonedDate,
          location: slot.location,
          capacity: slot.capacity,
          length: slot.length,
          workerCount: slot.workerCount,
          workers: [],
          isUserSignedUp: slot.isUserSignedUp,
        }
      })
  
      return { ...res, data: transformed }
    }
  
    return { ...res, data: [] }
  }

export async function apiAdorationLogout(slotId: string) {
  const res = await fetch(`/api/adoration/${slotId}/logout`, {
    method: 'PATCH',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Chyba při odhlašování.')
  }

  return await res.json()
}
