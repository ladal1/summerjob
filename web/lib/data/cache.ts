import { SummerJobEvent } from 'lib/prisma/client'
import { getActiveSummerJobEvent } from './summerjob-event'

let activeSummerjobEvent: SummerJobEvent

export async function cache_getActiveSummerJobEventId() {
  const event = await cache_getActiveSummerJobEvent()
  return event?.id
}

export async function cache_getActiveSummerJobEvent() {
  if (!activeSummerjobEvent) {
    const event = await getActiveSummerJobEvent()
    if (event) {
      cache_setActiveSummerJobEvent(event)
    }
    return event
  }
  return activeSummerjobEvent
}

export function cache_setActiveSummerJobEvent(event: SummerJobEvent) {
  activeSummerjobEvent = event
}
