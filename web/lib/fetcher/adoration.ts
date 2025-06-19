import type { AdorationSlotWithWorker } from 'lib/types/adoration'
import {
  useData,
  useDataCreate,
  useDataDelete,
} from './fetcher'

export function useAPIAdorationSlots(
  date: string,
  eventId: string,
  options?: Record<string, unknown>
) {
  const query = `/api/adoration?date=${date}&eventId=${eventId}`
  return useData<AdorationSlotWithWorker[]>(query, options)
}

export async function useAPIAdorationSignup(slotId: string) {
  const res = await fetch(`/api/adoration/${slotId}/signup`, {
    method: 'PATCH',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Chyba při přihlašování.')
  }

  return await res.json()
}


export function useAPIAdorationDelete(
  slotId: string,
  options?: Record<string, unknown>
) {
  return useDataDelete(`/api/adoration/${slotId}`, options)
}

export function useAPIAdorationCreateBulk(
  options?: Record<string, unknown>
) {
  return useDataCreate('/api/adoration/new', options)
}

export async function useAPIAdorationUpdateLocationBulk(
  slotIds: string[],
  location: string,
  options?: RequestInit
) {
  const res = await fetch('/api/adoration/location', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotIds, location }),
    ...options,
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Chyba při změně lokace.')
  }

  return await res.json()
}

