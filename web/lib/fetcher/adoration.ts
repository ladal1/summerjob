import type { 
  FrontendAdorationSlot, 
  APIAdorationSlotAdmin, 
  APIAdorationSlotUser,
  APIAdorationWorker 
} from 'lib/types/adoration'
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
  const res = useData<APIAdorationSlotAdmin[]>(`/api/adoration/admin?date=${date}&eventId=${eventId}`)

  if (Array.isArray(res.data)) {
    const transformed: FrontendAdorationSlot[] = res.data.map((slot: APIAdorationSlotAdmin) => {
      const zonedDate = toZonedTime(slot.dateStart, 'Europe/Prague')
      return {
        id: slot.id,
        localDateStart: zonedDate,
        location: slot.location,
        capacity: slot.capacity,
        length: slot.length,
        workerCount: slot.workers.length,
        workers: slot.workers.map((w: APIAdorationWorker) => ({
          firstName: w.firstName,
          lastName: w.lastName,
          phone: w.phone,
        })),
      }
    })

    return { ...res, data: transformed }
  }

  return { ...res, data: [] }
}

  export function useAPIAdorationSlotsUser(date: string | null, eventId: string): {
    data: FrontendAdorationSlot[]
    isLoading: boolean
    error?: unknown
    mutate: () => void
  } {
    const dateParam = date ? `date=${date}&` : ''
    const res = useData<APIAdorationSlotUser[]>(`/api/adoration?${dateParam}eventId=${eventId}`)
  
    if (Array.isArray(res.data)) {
      const transformed: FrontendAdorationSlot[] = res.data.map((slot: APIAdorationSlotUser) => {
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

export async function apiAdorationAssignWorker(slotId: string, workerId: string) {
  const res = await fetch(`/api/adoration/${slotId}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workerId }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Chyba při přiřazování pracanta.')
  }

  return await res.json()
}

export async function apiAdorationUnassignWorker(slotId: string, workerId: string) {
  const res = await fetch(`/api/adoration/${slotId}/unassign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workerId }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Chyba při odebírání pracanta.')
  }

  return await res.json()
}

export async function apiGetNearestDateWithAdorationSlots(
  eventId: string,
  fromDate: string
): Promise<string | null> {
  const res = await fetch(`/api/adoration/nearest-date?eventId=${eventId}&fromDate=${fromDate}`)
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Chyba při hledání nejbližšího data s adoračními sloty.')
  }

  const data = await res.json()
  return data.nearestDate
}
